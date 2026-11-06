import { Router } from 'express';
import crypto from 'crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { db, withTransaction } from '../../db/pool';
import { payments, repairTickets, storeSettings } from '../../db/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { AppError } from '../../utils/AppError';
import { mapPaymentRow, toPublicTicket } from '../../utils/mapRow';
import { nextSequenceCode } from '../../utils/codeGenerator';
import { verifyWebhookSignature } from '../../utils/crypto';
import { recordAuditLog } from '../audit/audit.service';
import { recalculateCustomerDebt } from '../customers/customers.service';
import { env } from '../../config/env';

export const paymentsRouter = Router();
export const webhooksRouter = Router();
export const devWebhookRouter = Router();

const ALLOWED_PAYMENT_METHODS = new Set([
  'Cash',
  'Bank_Transfer',
  'POS_Card',
  'Transfer',
  'Card',
  'EWallet',
]);

const ALLOWED_PAYMENT_TYPES = new Set(['Deposit', 'Installment', 'Final', 'FinalPayment', 'Refund']);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

paymentsRouter.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist'),
  asyncHandler(async (req, res) => {
    const ticketId = req.query.ticket_id ? Number(req.query.ticket_id) : null;
    const rows = ticketId
      ? await db.select().from(payments).where(eq(payments.ticket_id, ticketId)).orderBy(desc(payments.id))
      : await db.select().from(payments).orderBy(desc(payments.id));
    res.json(rows.map(mapPaymentRow));
  })
);

// P1-3, P1-4, Issue #9 & Item D: Server-side payment recording with row-level lock (FOR UPDATE) on repair_tickets
paymentsRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist'),
  asyncHandler(async (req, res) => {
    const {
      ticket_id,
      amount,
      payment_method,
      payment_type,
      transaction_ref,
      notes,
      note,
      card_brand,
    } = req.body || {};
    // Amount must always be a positive number from the client; the server decides the sign from payment_type
    const numAmount = Number(amount);
    if (!ticket_id || !Number.isFinite(numAmount) || numAmount <= 0) {
      throw AppError.badRequest('Phiếu sửa chữa và số tiền thanh toán hợp lệ (lớn hơn 0) là bắt buộc.');
    }

    const method = payment_method ? String(payment_method) : 'Cash';
    if (!ALLOWED_PAYMENT_METHODS.has(method)) {
      throw AppError.badRequest(
        'Phương thức thanh toán không hợp lệ (chỉ chấp nhận Cash, Bank_Transfer, POS_Card, Transfer, Card, EWallet).'
      );
    }

    const pType = payment_type ? String(payment_type) : 'Final';
    if (!ALLOWED_PAYMENT_TYPES.has(pType)) {
      throw AppError.badRequest('Loại thanh toán không hợp lệ (chỉ chấp nhận Deposit, Installment, Final, FinalPayment, Refund).');
    }
    const normalizedAmount = pType === 'Refund' ? -numAmount : numAmount;

    const payment = await withTransaction(async (tx) => {
      // Issue #9: Lock ticket row with FOR UPDATE so concurrent payments cannot compute stale paid_amount
      const [ticket] = await tx
        .select()
        .from(repairTickets)
        .where(eq(repairTickets.id, Number(ticket_id)))
        .for('update');
      if (!ticket) throw AppError.notFound('Không tìm thấy phiếu sửa chữa.');

      if (pType === 'Refund') {
        const currentPaid = Number(ticket.paid_amount || 0);
        if (Math.abs(normalizedAmount) > currentPaid) {
          throw AppError.badRequest('Số tiền hoàn trả không được vượt quá tổng số tiền đã thu.');
        }
      }

      const paymentCode = await nextSequenceCode(tx, 'PT', 4, true);
      const now = new Date().toISOString();

      // Item D.1 & D.2: Manual POST /payments NEVER sets is_auto_verified = 1 or gateway_provider
      const [resInsert] = await tx.insert(payments).values({
        payment_code: paymentCode,
        ticket_id: Number(ticket_id),
        ticket_code: ticket.ticket_code,
        customer_name: ticket.customer_name,
        amount: normalizedAmount,
        payment_method: method,
        payment_type: pType,
        transaction_ref: transaction_ref ? String(transaction_ref).trim() : null,
        cashier_name: req.user!.full_name,
        notes: notes || note || null,
        is_auto_verified: 0,
        gateway_provider: null,
        card_brand: card_brand || null,
        created_at: now,
      });

      const [sums] = await tx
        .select({
          total_paid: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        })
        .from(payments)
        .where(eq(payments.ticket_id, Number(ticket_id)));

      const totalPaid = Math.max(0, Number(sums?.total_paid || 0));
      const finalAmount = Number(ticket.final_amount || 0);
      const newDebt = ticket.status === 'Cancelled' ? 0 : Math.max(0, finalAmount - totalPaid);

      await tx
        .update(repairTickets)
        .set({
          paid_amount: totalPaid,
          debt_amount: newDebt,
          updated_at: now,
        })
        .where(eq(repairTickets.id, Number(ticket_id)));

      await recalculateCustomerDebt(tx, Number(ticket.customer_id));

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: pType === 'Refund' ? 'REFUND' : 'PAYMENT',
        entityType: 'payments',
        entityId: paymentCode,
        details: `${pType === 'Refund' ? 'Hoàn tiền' : 'Thu tiền'} phiếu ${ticket.ticket_code}: ${Math.abs(normalizedAmount).toLocaleString('vi-VN')} đ (${method})`,
        ipAddress: req.ip,
      });

      const [created] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, Number(resInsert.insertId)))
        .limit(1);
      return mapPaymentRow(created);
    });

    res.status(201).json(payment);
  })
);

async function processVerifiedWebhookPayload(params: {
  provider: string;
  rawPayload: string;
  signature: string;
  body: any;
  ipAddress?: string;
}) {
  const { provider, rawPayload, signature, body, ipAddress } = params;

  const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  if (!settings || !settings.auto_payment_enabled) {
    throw AppError.forbidden('Tính năng tự động xác nhận thanh toán qua Webhook hiện đang tắt.');
  }

  const webhookSecret = settings.gateway_webhook_secret || '';
  if (!verifyWebhookSignature(rawPayload, signature, webhookSecret)) {
    throw AppError.unauthorized('Chữ ký Webhook không hợp lệ.');
  }

  const { transaction_ref, transaction_id, amount, content, description, payment_method, card_brand } = body || {};
  const txRef = String(transaction_ref || transaction_id || body?.id || '').trim();
  const numAmount = Number(amount || 0);
  const memo = String(content || description || '').toUpperCase();

  if (!txRef || !Number.isFinite(numAmount) || numAmount <= 0) {
    throw AppError.badRequest('Thiếu transaction_ref hoặc số tiền hợp lệ.');
  }

  // Match dynamic ticket_prefix from store_settings (as well as default SC)
  const configuredPrefix = escapeRegex((settings.ticket_prefix || 'SC').trim().toUpperCase());
  const prefixPattern = configuredPrefix === 'SC' ? 'SC' : `(?:${configuredPrefix}|SC)`;
  const ticketRegex = new RegExp(`(${prefixPattern})[- ]?(\\d{8})[- ]?(\\d{4})`, 'i');
  // Money received that cannot be matched to a ticket must never disappear silently:
  // record it in the audit log so staff can reconcile it manually.
  const logUnmatched = async (reason: string) => {
    await recordAuditLog(null, {
      userId: null,
      userName: `Webhook (${provider.toUpperCase()})`,
      action: 'WEBHOOK_UNMATCHED',
      entityType: 'payments',
      entityId: txRef,
      details: `Giao dịch chưa đối soát (${reason}): ${numAmount.toLocaleString('vi-VN')} đ, Ref: ${txRef}, Nội dung: ${memo}`,
      ipAddress,
    });
  };

  const codeMatch = memo.match(ticketRegex);
  if (!codeMatch) {
    await logUnmatched('không có mã phiếu trong nội dung');
    return {
      processed: false,
      reason: 'Không tìm thấy mã phiếu sửa chữa trong nội dung chuyển khoản.',
    };
  }
  const normalizedTicketCode = `${codeMatch[1].toUpperCase()}-${codeMatch[2]}-${codeMatch[3]}`;

  const findExistingByRef = async () => {
    const [existing] = await db.select().from(payments).where(eq(payments.transaction_ref, txRef)).limit(1);
    return existing;
  };

  let result: {
    duplicate: boolean;
    matched: boolean;
    payment?: ReturnType<typeof mapPaymentRow>;
    ticket?: ReturnType<typeof toPublicTicket>;
  };
  try {
    result = await runWebhookTransaction();
  } catch (err: any) {
    // Two identical callbacks racing past the idempotency check: the UNIQUE(transaction_ref) index rejects
    // the second insert. Treat it as a duplicate instead of returning 500 (which would trigger more retries).
    const isDupEntry =
      err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062 || err?.cause?.code === 'ER_DUP_ENTRY' || err?.cause?.errno === 1062;
    const existing = isDupEntry ? await findExistingByRef() : undefined;
    if (!existing) throw err;
    result = { duplicate: true, matched: true, payment: mapPaymentRow(existing) };
  }

  if (!result.matched) {
    await logUnmatched(`không tìm thấy phiếu ${normalizedTicketCode}`);
  }

  return { processed: true, ...result };

  async function runWebhookTransaction() {
    return withTransaction(async (tx) => {
    // Idempotency check on UNIQUE(transaction_ref)
    const existingTx = await tx
      .select()
      .from(payments)
      .where(eq(payments.transaction_ref, txRef))
      .limit(1);
    if (existingTx.length > 0) {
      return { duplicate: true, matched: true, payment: mapPaymentRow(existingTx[0]) };
    }

    // Lock ticket row with FOR UPDATE (Issue #9)
    const [ticket] = await tx
      .select()
      .from(repairTickets)
      .where(sql`UPPER(${repairTickets.ticket_code}) = ${normalizedTicketCode}`)
      .for('update');
    if (!ticket) {
      return { duplicate: false, matched: false };
    }

    const paymentCode = await nextSequenceCode(tx, 'PT', 4, true);
    const now = new Date().toISOString();
    const method = payment_method && ALLOWED_PAYMENT_METHODS.has(payment_method) ? payment_method : 'Bank_Transfer';
    const pType = Number(ticket.debt_amount || 0) <= numAmount ? 'Final' : 'Installment';

    const [resInsert] = await tx.insert(payments).values({
      payment_code: paymentCode,
      ticket_id: ticket.id,
      ticket_code: ticket.ticket_code,
      customer_name: ticket.customer_name,
      amount: numAmount,
      payment_method: method,
      payment_type: pType,
      transaction_ref: txRef,
      cashier_name: `Auto Webhook (${provider.toUpperCase()})`,
      notes: `Tự động gạch nợ qua Webhook (${provider}): ${memo}`,
      is_auto_verified: 1,
      gateway_provider: provider,
      card_brand: card_brand || null,
      created_at: now,
    });

    const [sums] = await tx
      .select({
        total_paid: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(eq(payments.ticket_id, ticket.id));

    const totalPaid = Math.max(0, Number(sums?.total_paid || 0));
    const finalAmount = Number(ticket.final_amount || 0);
    const newDebt = ticket.status === 'Cancelled' ? 0 : Math.max(0, finalAmount - totalPaid);

    await tx
      .update(repairTickets)
      .set({
        paid_amount: totalPaid,
        debt_amount: newDebt,
        updated_at: now,
      })
      .where(eq(repairTickets.id, ticket.id));

    await recalculateCustomerDebt(tx, Number(ticket.customer_id));

    await recordAuditLog(tx, {
      userId: null,
      userName: `Webhook (${provider.toUpperCase()})`,
      action: 'AUTO_PAYMENT_WEBHOOK',
      entityType: 'payments',
      entityId: paymentCode,
      details: `Webhook (${provider}) gạch nợ tự động phiếu ${ticket.ticket_code}: ${numAmount.toLocaleString('vi-VN')} đ (Ref: ${txRef})`,
      ipAddress,
    });

    const [createdPayment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, Number(resInsert.insertId)))
      .limit(1);
    const [updatedTicket] = await tx
      .select()
      .from(repairTickets)
      .where(eq(repairTickets.id, ticket.id))
      .limit(1);

    return {
      duplicate: false,
      matched: true,
      payment: mapPaymentRow(createdPayment),
      ticket: toPublicTicket(updatedTicket),
    };
    });
  }
}

// P0-4 & Issue #5: Server-side Payment Gateway Webhook with Raw-Body HMAC Verification, auto_payment_enabled check & Dynamic ticket_prefix
webhooksRouter.post(
  '/payment/:provider',
  asyncHandler(async (req, res) => {
    const provider = String(req.params.provider || 'sepay').toLowerCase();
    const signature = String(
      req.headers['x-webhook-signature'] ||
        req.headers['x-casso-signature'] ||
        req.headers['x-sepay-signature'] ||
        req.headers['authorization'] ||
        req.headers['secure-token'] ||
        ''
    );

    const rawPayload = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body || {});
    const outcome = await processVerifiedWebhookPayload({
      provider,
      rawPayload,
      signature,
      body: req.body,
      ipAddress: req.ip,
    });

    res.status(200).json(outcome);
  })
);

// Item D.3: Dev-only endpoint to simulate signed Webhook callback (only active when ENABLE_DEV_TOOLS=true)
devWebhookRouter.post(
  '/simulate-webhook',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist'),
  asyncHandler(async (req, res) => {
    if (!env.ENABLE_DEV_TOOLS) {
      throw AppError.forbidden('Chức năng giả lập Webhook chỉ được bật khi ENABLE_DEV_TOOLS=true trên môi trường Dev.');
    }

    const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
    const provider = String(req.body?.gateway_provider || req.body?.provider || settings?.payment_gateway_provider || 'sepay').toLowerCase();
    const payloadObj = {
      transaction_ref: req.body?.transaction_ref || `SIM-${Date.now()}`,
      amount: Number(req.body?.amount || 0),
      content: req.body?.content || req.body?.description || '',
      payment_method: req.body?.payment_method || 'Bank_Transfer',
      card_brand: req.body?.card_brand || null,
    };
    const rawPayload = JSON.stringify(payloadObj);
    const webhookSecret = settings?.gateway_webhook_secret || '';
    const signature = webhookSecret
      ? crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex')
      : '';

    const outcome = await processVerifiedWebhookPayload({
      provider,
      rawPayload,
      signature,
      body: payloadObj,
      ipAddress: req.ip,
    });

    res.status(200).json(outcome);
  })
);
