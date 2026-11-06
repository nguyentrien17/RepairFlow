import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import { db, DbExecutor } from '../../db/pool';
import {
  repairTickets,
  repairStatusHistories,
  repairQuotes,
  repairQuoteItems,
  qcChecklists,
  repairPartUsages,
  payments,
  warranties,
  storeSettings,
} from '../../db/schema';
import { AppError } from '../../utils/AppError';
import {
  toPublicTicket,
  mapQuoteRow,
  mapQuoteItemRow,
  mapWarrantyRow,
} from '../../utils/mapRow';
import { nextSequenceCode } from '../../utils/codeGenerator';
import { isTransitionAllowedForRole } from '../../../shared/statusTransitions';
import { STATUS_CONFIG } from '../../../shared/constants';
import { RepairStatus, RepairQuoteItem, UserRole } from '../../../shared/types';
import { recordAuditLog } from '../audit/audit.service';
import { recalculateCustomerDebt } from '../customers/customers.service';
import {
  releasePromotionUsageInTx,
  validateAndCalculatePromotionInTx,
} from '../promotions/promotions.service';
import { returnPartStockToBatchInTx } from '../inventory/inventory.service';

const ALLOWED_PAYMENT_METHODS = new Set([
  'Cash',
  'Bank_Transfer',
  'POS_Card',
  'Transfer',
  'Card',
  'EWallet',
]);

export async function fetchQuotesWithItems(ticketId?: number) {
  const quoteRows = ticketId
    ? await db
        .select()
        .from(repairQuotes)
        .where(eq(repairQuotes.ticket_id, ticketId))
        .orderBy(desc(repairQuotes.id))
    : await db.select().from(repairQuotes).orderBy(desc(repairQuotes.id));

  if (quoteRows.length === 0) return [];

  const quoteIds = quoteRows.map((q) => Number(q.id));
  const itemRows = await db
    .select()
    .from(repairQuoteItems)
    .where(inArray(repairQuoteItems.quote_id, quoteIds))
    .orderBy(asc(repairQuoteItems.id));

  const itemsByQuoteId = new Map<number, RepairQuoteItem[]>();
  for (const r of itemRows) {
    const item = mapQuoteItemRow(r);
    const list = itemsByQuoteId.get(item.quote_id) || [];
    list.push(item);
    itemsByQuoteId.set(item.quote_id, list);
  }

  return quoteRows.map((q) => mapQuoteRow(q, itemsByQuoteId.get(Number(q.id)) || []));
}

/**
 * Cleans up part usages, refunds paid amounts, and releases promotion quota when a ticket is Cancelled (Issue #10, #11 & Item I)
 */
export async function cancelTicketCleanupInTx(
  tx: DbExecutor,
  ticket: typeof repairTickets.$inferSelect,
  actorName: string,
  now: string,
  options?: {
    refundAmount?: number;
    refundMethod?: string;
    /**
     * When false (customer online rejection, technician cancellation), NO Refund payment is recorded:
     * the paid amount stays on the cancelled ticket until a cashier records the actual refund via POST /payments.
     */
    allowRefund?: boolean;
  }
): Promise<{ refundedAmount: number; retainedAmount: number; returnedPartsCount: number }> {
  const allowRefund = options?.allowRefund !== false;
  // 1. Return all 'Used' part usages back to batches & parts stock
  const usedParts = await tx
    .select()
    .from(repairPartUsages)
    .where(and(eq(repairPartUsages.ticket_id, ticket.id), eq(repairPartUsages.status, 'Used')))
    .for('update');

  let returnedPartsCount = 0;
  for (const u of usedParts) {
    await tx
      .update(repairPartUsages)
      .set({ status: 'Returned' })
      .where(eq(repairPartUsages.id, u.id));
    await returnPartStockToBatchInTx(tx, Number(u.part_id), Number(u.quantity), u.batch_id);
    returnedPartsCount += Number(u.quantity || 0);
  }

  // 2. If customer already paid a deposit/amount, record a Refund payment (supports partial refund / inspection fee retention per Item I)
  let refundedAmount = 0;
  const currentPaid = Number(ticket.paid_amount || 0);
  const hasRefundRequest =
    options?.refundAmount !== undefined && options.refundAmount !== null && Number(options.refundAmount) !== 0;

  if (!allowRefund) {
    if (hasRefundRequest) {
      throw AppError.forbidden(
        'Bạn không có quyền ghi nhận hoàn tiền khi hủy phiếu. Lễ tân / Quản lý sẽ hoàn tiền sau khi phiếu được hủy.'
      );
    }
  } else if (currentPaid > 0) {
    const requestedRefund =
      options?.refundAmount !== undefined && options.refundAmount !== null
        ? Number(options.refundAmount)
        : currentPaid;

    if (!Number.isFinite(requestedRefund) || requestedRefund < 0 || requestedRefund > currentPaid) {
      throw AppError.badRequest(
        `Số tiền hoàn trả khi hủy phiếu phải nằm trong khoảng từ 0 đến số tiền đã thu (${currentPaid.toLocaleString('vi-VN')} đ).`
      );
    }

    const refundMethod =
      options?.refundMethod && ALLOWED_PAYMENT_METHODS.has(options.refundMethod)
        ? options.refundMethod
        : 'Cash';

    refundedAmount = requestedRefund;
    if (refundedAmount > 0) {
      const paymentCode = await nextSequenceCode(tx, 'PT', 4, true);
      await tx.insert(payments).values({
        payment_code: paymentCode,
        ticket_id: ticket.id,
        ticket_code: ticket.ticket_code,
        customer_name: ticket.customer_name,
        amount: -refundedAmount,
        payment_method: refundMethod,
        payment_type: 'Refund',
        transaction_ref: null,
        cashier_name: actorName,
        notes: `Hoàn trả tiền đã thu do hủy phiếu ${ticket.ticket_code}`,
        is_auto_verified: 0,
        gateway_provider: null,
        card_brand: null,
        created_at: now,
      });
    }
  } else if (hasRefundRequest) {
    throw AppError.badRequest('Phiếu chưa thu tiền nên không thể hoàn tiền khi hủy.');
  }

  const retainedAmount = Math.max(0, currentPaid - refundedAmount);

  // 3. Release promotion usage count if a promotion was applied
  if (ticket.promotion_id) {
    await releasePromotionUsageInTx(tx, ticket.promotion_id);
  }

  return { refundedAmount, retainedAmount, returnedPartsCount };
}

/**
 * Unified Quote Approval / Rejection Service used by BOTH staff counter and public online lookup (Issue #3, #13 & Item E)
 */
export async function respondToQuoteInTx(
  tx: DbExecutor,
  params: {
    quoteId: number;
    status: 'Approved' | 'Rejected';
    confirmedBy: string;
    rejectionReason?: string | null;
    actorUserId: number | null;
    actorName: string;
    ipAddress?: string;
    verifyCustomerPhoneLastDigits?: string;
  }
) {
  const {
    quoteId,
    status,
    confirmedBy,
    rejectionReason,
    actorUserId,
    actorName,
    ipAddress,
    verifyCustomerPhoneLastDigits,
  } = params;

  if (status !== 'Approved' && status !== 'Rejected') {
    throw AppError.badRequest('Trạng thái phản hồi báo giá chỉ chấp nhận "Approved" hoặc "Rejected".');
  }

  const [quote] = await tx
    .select()
    .from(repairQuotes)
    .where(eq(repairQuotes.id, quoteId))
    .for('update');
  if (!quote) throw AppError.notFound('Không tìm thấy báo giá.');

  if (quote.status !== 'Sent') {
    throw AppError.conflict('Báo giá này đã được phản hồi trước đó hoặc đã bị thay thế bởi phiên bản mới hơn.');
  }

  const [ticket] = await tx
    .select()
    .from(repairTickets)
    .where(eq(repairTickets.id, quote.ticket_id))
    .for('update');
  if (!ticket) throw AppError.notFound('Không tìm thấy phiếu sửa chữa.');

  if (verifyCustomerPhoneLastDigits !== undefined) {
    const customerPhoneDigits = String(ticket.customer_phone || '').replace(/\D/g, '');
    if (
      !customerPhoneDigits.endsWith(verifyCustomerPhoneLastDigits) &&
      customerPhoneDigits !== verifyCustomerPhoneLastDigits
    ) {
      throw AppError.forbidden('Số điện thoại xác thực không khớp với chủ sở hữu phiếu.');
    }
  }

  const now = new Date().toISOString();

  if (status === 'Approved') {
    const subtotal = Number(quote.subtotal || 0);
    let discount = Number(quote.discount || 0);
    let promoCode: string | null = quote.promotion_code || null;
    let promoId: number | null = quote.promotion_id || null;

    // Item E.3: Consume promotion quota ONLY when the quote is Approved
    if (promoCode) {
      const promoRes = await validateAndCalculatePromotionInTx(
        tx,
        promoCode,
        subtotal,
        true,
        ticket.promotion_id
      );
      discount = Math.min(subtotal, Math.max(discount, promoRes.discountAmount));
      promoCode = promoRes.promotionCode || null;
      promoId = promoRes.promotionId || null;
    } else if (ticket.promotion_id) {
      await releasePromotionUsageInTx(tx, ticket.promotion_id);
    }

    const finalAmt = Math.max(0, subtotal - discount);
    const paidAmt = Number(ticket.paid_amount || 0);
    const debtAmt = Math.max(0, finalAmt - paidAmt);
    const nextTicketStatus = ticket.status === 'Waiting_Approval' ? 'In_Progress' : ticket.status;

    await tx
      .update(repairQuotes)
      .set({
        status: 'Approved',
        discount,
        promotion_code: promoCode,
        promotion_id: promoId,
        total_amount: finalAmt,
        confirmed_by: confirmedBy,
        rejection_reason: null,
        confirmed_at: now,
      })
      .where(eq(repairQuotes.id, quoteId));

    // Mark any other pending Sent quotes for this ticket as Superseded
    await tx
      .update(repairQuotes)
      .set({ status: 'Superseded' })
      .where(
        and(
          eq(repairQuotes.ticket_id, ticket.id),
          eq(repairQuotes.status, 'Sent'),
          ne(repairQuotes.id, quoteId)
        )
      );

    await tx
      .update(repairTickets)
      .set({
        status: nextTicketStatus,
        subtotal_amount: subtotal,
        discount_amount: discount,
        promotion_code: promoCode,
        promotion_id: promoId,
        final_amount: finalAmt,
        debt_amount: debtAmt,
        updated_at: now,
      })
      .where(eq(repairTickets.id, ticket.id));

    await recalculateCustomerDebt(tx, Number(ticket.customer_id));

    if (ticket.status !== nextTicketStatus) {
      await tx.insert(repairStatusHistories).values({
        ticket_id: ticket.id,
        from_status: ticket.status,
        to_status: nextTicketStatus,
        changed_by_name: actorName,
        notes: `Khách đồng ý báo giá ${quote.quote_code} -> Chuyển sang Đang sửa chữa`,
        created_at: now,
      });
    }
  } else {
    await tx
      .update(repairQuotes)
      .set({
        status: 'Rejected',
        confirmed_by: confirmedBy,
        rejection_reason: rejectionReason || 'Khách từ chối sửa',
        confirmed_at: now,
      })
      .where(eq(repairQuotes.id, quoteId));

    if (ticket.status === 'Waiting_Approval') {
      // Quote rejection (online or at the counter) never auto-records a refund: money is only
      // refunded when a cashier actually hands it back (POST /payments with payment_type=Refund).
      const { retainedAmount } = await cancelTicketCleanupInTx(tx, ticket, actorName, now, {
        allowRefund: false,
      });
      const cancelReason = rejectionReason || 'Khách hàng từ chối báo giá';

      await tx
        .update(repairTickets)
        .set({
          status: 'Cancelled',
          final_amount: retainedAmount,
          paid_amount: retainedAmount,
          debt_amount: 0,
          promotion_id: null,
          promotion_code: null,
          cancellation_reason: cancelReason,
          updated_at: now,
        })
        .where(eq(repairTickets.id, ticket.id));

      await recalculateCustomerDebt(tx, Number(ticket.customer_id));

      await tx.insert(repairStatusHistories).values({
        ticket_id: ticket.id,
        from_status: ticket.status,
        to_status: 'Cancelled',
        changed_by_name: actorName,
        notes: `Từ chối báo giá ${quote.quote_code}: ${cancelReason}`,
        created_at: now,
      });
    }
  }

  await recordAuditLog(tx, {
    userId: actorUserId,
    userName: actorName,
    action: status === 'Approved' ? 'APPROVE_QUOTE' : 'REJECT_QUOTE',
    entityType: 'repair_quotes',
    entityId: quote.quote_code,
    details: `Phản hồi báo giá ${quote.quote_code} (${ticket.ticket_code}): ${status}`,
    ipAddress,
  });

  const [qRow] = await tx.select().from(repairQuotes).where(eq(repairQuotes.id, quoteId)).limit(1);
  const qItems = await tx
    .select()
    .from(repairQuoteItems)
    .where(eq(repairQuoteItems.quote_id, quoteId))
    .orderBy(asc(repairQuoteItems.id));

  return mapQuoteRow(qRow, qItems.map(mapQuoteItemRow));
}

/**
 * Transitions a ticket's status with full state-machine validation, Delivered preconditions + atomic warranty creation (Item C), and Cancelled cleanup (Issue #11 & Item I)
 */
export async function transitionTicketStatusInTx(
  tx: DbExecutor,
  params: {
    ticketId: number;
    targetStatus: RepairStatus;
    actor: { sub: number; full_name: string; role: UserRole };
    note?: string;
    cancellationReason?: string;
    isOverride?: boolean;
    warrantyDays?: number;
    refundAmount?: number;
    refundMethod?: string;
    ipAddress?: string;
  }
) {
  const {
    ticketId,
    targetStatus,
    actor,
    note,
    cancellationReason,
    isOverride,
    warrantyDays,
    refundAmount,
    refundMethod,
    ipAddress,
  } = params;

  const [ticket] = await tx
    .select()
    .from(repairTickets)
    .where(eq(repairTickets.id, ticketId))
    .for('update');
  if (!ticket) throw AppError.notFound('Không tìm thấy phiếu sửa chữa.');

  const fromStatus = ticket.status as RepairStatus;
  if (fromStatus === targetStatus) {
    return toPublicTicket(ticket);
  }

  const check = isTransitionAllowedForRole(fromStatus, targetStatus, actor.role, Boolean(isOverride));
  if (!check.allowed) {
    throw AppError.forbidden(check.reason || 'Không được phép chuyển trạng thái này.');
  }

  const isManagerOverride = Boolean(isOverride) && (actor.role === 'admin' || actor.role === 'manager');

  // A passing QC checklist is required before the device is moved to the pickup counter
  if (targetStatus === 'Ready_For_Pickup' && !isManagerOverride) {
    const [qc] = await tx.select().from(qcChecklists).where(eq(qcChecklists.ticket_id, ticketId)).limit(1);
    if (!qc || !qc.is_passed) {
      throw AppError.badRequest('Không thể chuyển sang Chờ khách nhận khi chưa có biên bản QC đạt chuẩn (Passed).');
    }
  }

  // Enforce preconditions before transitioning to Delivered (Issue #11)
  if (targetStatus === 'Delivered' && !isManagerOverride) {
    const quotes = await tx
      .select()
      .from(repairQuotes)
      .where(eq(repairQuotes.ticket_id, ticketId))
      .orderBy(desc(repairQuotes.id));

    if (quotes.length > 0 && !quotes.some((q) => q.status === 'Approved')) {
      throw AppError.badRequest('Không thể bàn giao máy khi báo giá chưa được duyệt (Approved).');
    }

    // A newer quote still waiting for the customer's answer blocks delivery (totals may change)
    if (quotes.length > 0 && quotes[0].status === 'Sent') {
      throw AppError.badRequest(
        `Báo giá mới nhất ${quotes[0].quote_code} (v${quotes[0].version}) đang chờ khách duyệt. Vui lòng chốt báo giá trước khi bàn giao.`
      );
    }

    const [checklist] = await tx
      .select()
      .from(qcChecklists)
      .where(eq(qcChecklists.ticket_id, ticketId))
      .limit(1);

    if (!checklist || !checklist.is_passed) {
      throw AppError.badRequest('Không thể bàn giao máy khi chưa hoàn tất nghiệm thu QC đạt chuẩn (Passed).');
    }

    if (Number(ticket.debt_amount || 0) > 0) {
      throw AppError.badRequest(
        `Không thể bàn giao máy khi phiếu còn công nợ chưa thanh toán (${Number(ticket.debt_amount).toLocaleString('vi-VN')} đ).`
      );
    }
  }

  const now = new Date().toISOString();
  let issuedWarranty: ReturnType<typeof mapWarrantyRow> | undefined;

  if (targetStatus === 'Cancelled') {
    // Technicians may cancel (unrepairable device) but cannot record cash refunds
    const { retainedAmount } = await cancelTicketCleanupInTx(tx, ticket, actor.full_name, now, {
      refundAmount,
      refundMethod,
      allowRefund: actor.role !== 'technician',
    });
    const cancelReason = cancellationReason || note || ticket.cancellation_reason || 'Hủy phiếu sửa chữa';

    await tx
      .update(repairTickets)
      .set({
        status: 'Cancelled',
        final_amount: retainedAmount,
        paid_amount: retainedAmount,
        debt_amount: 0,
        promotion_id: null,
        promotion_code: null,
        cancellation_reason: cancelReason,
        updated_at: now,
      })
      .where(eq(repairTickets.id, ticketId));

    await recalculateCustomerDebt(tx, Number(ticket.customer_id));
  } else {
    await tx
      .update(repairTickets)
      .set({
        status: targetStatus,
        updated_at: now,
      })
      .where(eq(repairTickets.id, ticketId));

    // Item C: Automatically create Active warranty inside the same transaction when transitioning to Delivered
    if (targetStatus === 'Delivered') {
      const existingActiveWarranties = await tx
        .select()
        .from(warranties)
        .where(and(eq(warranties.ticket_id, ticketId), eq(warranties.status, 'Active')))
        .for('update');

      if (existingActiveWarranties.length > 0) {
        issuedWarranty = mapWarrantyRow(existingActiveWarranties[0]);
      } else {
        let days = 90;
        if (warrantyDays !== undefined && warrantyDays !== null && Number.isFinite(Number(warrantyDays)) && Number(warrantyDays) > 0) {
          days = Math.floor(Number(warrantyDays));
        } else {
          const [settings] = await tx
            .select({ default_warranty_days: storeSettings.default_warranty_days })
            .from(storeSettings)
            .where(eq(storeSettings.id, 1))
            .limit(1);
          if (settings && Number(settings.default_warranty_days) > 0) {
            days = Number(settings.default_warranty_days);
          }
        }

        const startDate = now.slice(0, 10);
        const endDateObj = new Date(now);
        endDateObj.setDate(endDateObj.getDate() + days);
        const endDate = endDateObj.toISOString().slice(0, 10);
        const warrantyCode = await nextSequenceCode(tx, 'BH', 4, true);

        const [resWarranty] = await tx.insert(warranties).values({
          warranty_code: warrantyCode,
          ticket_id: ticket.id,
          ticket_code: ticket.ticket_code,
          device_summary: `${ticket.device_brand || ''} ${ticket.device_model || ''}`.trim() || ticket.device_model,
          customer_name: ticket.customer_name || 'Khách hàng',
          customer_phone: ticket.customer_phone || '',
          start_date: startDate,
          end_date: endDate,
          terms: `Bảo hành ${days} ngày theo quy định cửa hàng cho các hạng mục đã sửa chữa/thay thế.`,
          status: 'Active',
          created_at: now,
        });

        await recordAuditLog(tx, {
          userId: actor.sub,
          userName: actor.full_name,
          action: 'CREATE_WARRANTY',
          entityType: 'warranties',
          entityId: warrantyCode,
          details: `Tự động cấp phiếu bảo hành ${warrantyCode} (${days} ngày) khi bàn giao phiếu ${ticket.ticket_code}`,
          ipAddress,
        });

        const [createdWarranty] = await tx
          .select()
          .from(warranties)
          .where(eq(warranties.id, Number(resWarranty.insertId)))
          .limit(1);
        if (createdWarranty) {
          issuedWarranty = mapWarrantyRow(createdWarranty);
        }
      }
    }
  }

  const statusLabel = STATUS_CONFIG[targetStatus]?.label || targetStatus;
  const historyNote = note || `Chuyển trạng thái sang ${statusLabel}`;

  await tx.insert(repairStatusHistories).values({
    ticket_id: ticketId,
    from_status: fromStatus,
    to_status: targetStatus,
    changed_by_name: actor.full_name,
    notes: historyNote,
    created_at: now,
  });

  await recordAuditLog(tx, {
    userId: actor.sub,
    userName: actor.full_name,
    action: 'STATUS_CHANGE',
    entityType: 'repair_tickets',
    entityId: ticket.ticket_code,
    details: `Đổi trạng thái phiếu ${ticket.ticket_code}: ${fromStatus} -> ${targetStatus} (${historyNote})`,
    ipAddress,
  });

  const [updated] = await tx.select().from(repairTickets).where(eq(repairTickets.id, ticketId)).limit(1);
  const publicTicket = toPublicTicket(updated);
  return issuedWarranty ? { ...publicTicket, warranty: issuedWarranty } : publicTicket;
}

