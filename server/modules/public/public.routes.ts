import { Router } from 'express';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, withTransaction } from '../../db/pool';
import {
  repairTickets,
  repairStatusHistories,
  repairQuotes,
  repairQuoteItems,
  warranties,
  storeSettings,
} from '../../db/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { createRateLimiter } from '../../middleware/rateLimit';
import { AppError } from '../../utils/AppError';
import {
  mapHistoryRow,
  mapQuoteRow,
  mapQuoteItemRow,
  mapWarrantyRow,
  toPublicSettings,
} from '../../utils/mapRow';
import { respondToQuoteInTx } from '../tickets/tickets.service';
import { RepairQuoteItem } from '../../../shared/types/index';

export const publicRouter = Router();

// Per-IP rate limiter (15 req / min / IP) with automatic memory cleanup
const publicIpRateLimiter = createRateLimiter({
  namespace: 'public_ip',
  windowMs: 60_000,
  max: 15,
  message: 'Quá nhiều yêu cầu tra cứu từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
});

// Item G: Per-ticket-code FAILURE tracker (8 failed phone verifications / 5 min / ticket_code)
// Only increments when phone verification fails, so legitimate customers refreshing their tracking page are never locked out
const TICKET_FAILURE_WINDOW_MS = 5 * 60_000;
const TICKET_FAILURE_MAX = 8;
const ticketFailureBuckets = new Map<string, { count: number; resetAt: number }>();

function checkTicketFailureLimit(key: string): void {
  const normalizedKey = String(key || '').trim().toUpperCase();
  if (!normalizedKey) return;
  const now = Date.now();
  const entry = ticketFailureBuckets.get(normalizedKey);
  if (!entry) return;
  if (now > entry.resetAt) {
    ticketFailureBuckets.delete(normalizedKey);
    return;
  }
  if (entry.count >= TICKET_FAILURE_MAX) {
    throw new AppError(
      429,
      'RATE_LIMIT_EXCEEDED',
      'Mã phiếu này đã bị nhập sai số điện thoại xác thực quá nhiều lần. Vui lòng thử lại sau 5 phút.'
    );
  }
}

function recordTicketFailure(key: string): void {
  const normalizedKey = String(key || '').trim().toUpperCase();
  if (!normalizedKey) return;
  const now = Date.now();
  if (ticketFailureBuckets.size > 5_000) {
    for (const [k, v] of ticketFailureBuckets.entries()) {
      if (now > v.resetAt) ticketFailureBuckets.delete(k);
    }
  }
  const entry = ticketFailureBuckets.get(normalizedKey);
  if (!entry || now > entry.resetAt) {
    ticketFailureBuckets.set(normalizedKey, {
      count: 1,
      resetAt: now + TICKET_FAILURE_WINDOW_MS,
    });
  } else {
    entry.count += 1;
  }
}

function maskPhone(phone: string): string {
  const clean = String(phone || '').replace(/\D/g, '');
  if (clean.length <= 4) return clean;
  return `${'*'.repeat(clean.length - 4)}${clean.slice(-4)}`;
}

// P1-8 & Item G: Dedicated Public Lookup API via Drizzle ORM (requires ticket code + last 4 digits of phone or full phone)
publicRouter.get(
  '/tickets/:code',
  publicIpRateLimiter,
  asyncHandler(async (req, res) => {
    const code = String(req.params.code || '').trim().toUpperCase();
    const phoneParam = String(req.query.phone || '').replace(/\D/g, '');

    if (!code) {
      throw AppError.badRequest('Vui lòng nhập mã phiếu sửa chữa.');
    }
    if (!phoneParam || phoneParam.length < 4) {
      throw AppError.badRequest('Vui lòng nhập ít nhất 4 số cuối số điện thoại để xác thực.');
    }

    checkTicketFailureLimit(code);

    const [ticket] = await db
      .select()
      .from(repairTickets)
      .where(sql`UPPER(${repairTickets.ticket_code}) = ${code}`)
      .limit(1);
    if (!ticket) {
      recordTicketFailure(code);
      throw AppError.notFound('Mã phiếu hoặc số điện thoại xác thực không chính xác.');
    }

    const ticketPhoneDigits = String(ticket.customer_phone || '').replace(/\D/g, '');
    const isPhoneMatch = ticketPhoneDigits.endsWith(phoneParam) || ticketPhoneDigits === phoneParam;
    if (!isPhoneMatch) {
      recordTicketFailure(code);
      throw AppError.notFound('Mã phiếu hoặc số điện thoại xác thực không chính xác.');
    }

    const [histories, quoteRows, warrantyRows, settingsRows] = await Promise.all([
      db
        .select()
        .from(repairStatusHistories)
        .where(eq(repairStatusHistories.ticket_id, ticket.id))
        .orderBy(desc(repairStatusHistories.id)),
      db
        .select()
        .from(repairQuotes)
        .where(eq(repairQuotes.ticket_id, ticket.id))
        .orderBy(desc(repairQuotes.id)),
      db.select().from(warranties).where(eq(warranties.ticket_id, ticket.id)).orderBy(desc(warranties.id)),
      db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1),
    ]);

    const quoteIds = quoteRows.map((q) => Number(q.id));
    const quoteItemsRows =
      quoteIds.length > 0
        ? await db
            .select()
            .from(repairQuoteItems)
            .where(inArray(repairQuoteItems.quote_id, quoteIds))
            .orderBy(asc(repairQuoteItems.id))
        : [];

    const itemsByQuote = new Map<number, RepairQuoteItem[]>();
    for (const r of quoteItemsRows) {
      const item = mapQuoteItemRow(r);
      const list = itemsByQuote.get(item.quote_id) || [];
      list.push(item);
      itemsByQuote.set(item.quote_id, list);
    }

    const quotes = quoteRows.map((q) => mapQuoteRow(q, itemsByQuote.get(Number(q.id)) || []));
    const settings = settingsRows[0];

    res.json({
      ticket: {
        id: Number(ticket.id),
        ticket_code: ticket.ticket_code,
        customer_name: ticket.customer_name,
        customer_phone_masked: maskPhone(ticket.customer_phone || ''),
        device_brand: ticket.device_brand,
        device_model: ticket.device_model,
        device_category: ticket.device_category,
        status: ticket.status,
        priority: ticket.priority,
        defect_description: ticket.defect_description,
        initial_condition: ticket.initial_condition,
        cosmetic_condition: ticket.cosmetic_condition,
        accessories_included: ticket.accessories_included,
        estimated_completion: ticket.estimated_completion,
        subtotal_amount: Number(ticket.subtotal_amount || 0),
        discount_amount: Number(ticket.discount_amount || 0),
        final_amount: Number(ticket.final_amount || 0),
        paid_amount: Number(ticket.paid_amount || 0),
        debt_amount: Number(ticket.debt_amount || 0),
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
      },
      histories: histories.map(mapHistoryRow),
      quotes,
      warranty: warrantyRows[0] ? mapWarrantyRow(warrantyRows[0]) : null,
      store: settings ? toPublicSettings(settings) : null,
    });
  })
);

// P1-8, Issue #13 & Item G: Customer Online Quote Approval / Rejection using unified respondToQuoteInTx
publicRouter.post(
  '/quotes/:id/respond',
  publicIpRateLimiter,
  asyncHandler(async (req, res) => {
    const quoteId = Number(req.params.id);
    const { action, reason, phone } = req.body || {};
    const phoneParam = String(phone || '').replace(/\D/g, '');

    if (!['Approve', 'Reject'].includes(action)) {
      throw AppError.badRequest('Hành động phản hồi báo giá không hợp lệ.');
    }
    if (!phoneParam || phoneParam.length < 4) {
      throw AppError.badRequest('Cần xác thực số điện thoại để phản hồi báo giá.');
    }

    const failureKey = `QUOTE_${quoteId}`;
    checkTicketFailureLimit(failureKey);

    const targetStatus = action === 'Approve' ? 'Approved' : 'Rejected';

    try {
      const updatedQuote = await withTransaction(async (tx) =>
        respondToQuoteInTx(tx, {
          quoteId,
          status: targetStatus,
          confirmedBy: 'Khách hàng (Xác nhận trực tuyến qua Cổng tra cứu)',
          rejectionReason: action === 'Reject' ? reason || 'Khách từ chối sửa' : null,
          actorUserId: null,
          actorName: 'Khách hàng (Online)',
          ipAddress: req.ip,
          verifyCustomerPhoneLastDigits: phoneParam,
        })
      );

      res.json({ status: updatedQuote.status, quote: updatedQuote });
    } catch (err: any) {
      if (err instanceof AppError && err.status === 403) {
        recordTicketFailure(failureKey);
      }
      throw err;
    }
  })
);
