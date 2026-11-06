import { Router } from 'express';
import { and, asc, desc, eq, like, or, sql, SQL } from 'drizzle-orm';
import { db, withTransaction } from '../../db/pool';
import {
  repairTickets,
  repairStatusHistories,
  repairDiagnostics,
  repairQuotes,
  repairQuoteItems,
  qcChecklists,
  repairPartUsages,
  payments,
  warranties,
  customers,
  customerDevices,
  storeSettings,
  parts,
  inventoryBatches,
} from '../../db/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { AppError } from '../../utils/AppError';
import {
  toPublicTicket,
  mapHistoryRow,
  mapDiagnosticRow,
  mapQuoteRow,
  mapQuoteItemRow,
  mapChecklistRow,
  mapPartUsageRow,
  mapPaymentRow,
  mapWarrantyRow,
} from '../../utils/mapRow';
import { encryptDevicePassword, decryptDevicePassword } from '../../utils/crypto';
import { nextSequenceCode } from '../../utils/codeGenerator';
import { parseNonNegativeAmount, parseNonNegativeInt, parsePositiveInt } from '../../utils/numbers';
import { STATUS_CONFIG } from '../../../shared/constants';
import { RepairStatus } from '../../../shared/types/index';
import { recordAuditLog } from '../audit/audit.service';
import { validateAndCalculatePromotionInTx } from '../promotions/promotions.service';
import { recalculateCustomerDebt } from '../customers/customers.service';
import {
  fetchQuotesWithItems,
  respondToQuoteInTx,
  transitionTicketStatusInTx,
} from './tickets.service';

export { recalculateCustomerDebt, fetchQuotesWithItems };

export const ticketsRouter = Router();
export const statusHistoriesRouter = Router();
export const diagnosticsRouter = Router();
export const quotesRouter = Router();
export const checklistsRouter = Router();

// ==================== TICKETS ====================
ticketsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status, q } = req.query;
    const conditions: SQL[] = [];

    if (status && typeof status === 'string' && status !== 'ALL') {
      conditions.push(eq(repairTickets.status, status));
    }
    if (q && typeof q === 'string' && q.trim()) {
      const term = `%${q.trim()}%`;
      const searchCond = or(
        like(repairTickets.ticket_code, term),
        like(repairTickets.customer_name, term),
        like(repairTickets.customer_phone, term),
        like(repairTickets.device_model, term)
      );
      if (searchCond) conditions.push(searchCond);
    }

    const rows = await db
      .select()
      .from(repairTickets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(repairTickets.id));
    res.json(rows.map(toPublicTicket));
  })
);

ticketsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = Number(req.params.id);
    const [row] = await db.select().from(repairTickets).where(eq(repairTickets.id, ticketId)).limit(1);
    if (!row) throw AppError.notFound('Không tìm thấy phiếu sửa chữa.');

    const canViewFinancials = req.user!.role !== 'technician';

    const [histories, diagnostics, quotes, checklistRows, partUsages, paymentRows, warrantyRows] = await Promise.all([
      db
        .select()
        .from(repairStatusHistories)
        .where(eq(repairStatusHistories.ticket_id, ticketId))
        .orderBy(desc(repairStatusHistories.id)),
      db
        .select()
        .from(repairDiagnostics)
        .where(eq(repairDiagnostics.ticket_id, ticketId))
        .orderBy(desc(repairDiagnostics.id)),
      fetchQuotesWithItems(ticketId),
      db.select().from(qcChecklists).where(eq(qcChecklists.ticket_id, ticketId)),
      db
        .select()
        .from(repairPartUsages)
        .where(eq(repairPartUsages.ticket_id, ticketId))
        .orderBy(desc(repairPartUsages.id)),
      canViewFinancials
        ? db.select().from(payments).where(eq(payments.ticket_id, ticketId)).orderBy(desc(payments.id))
        : Promise.resolve([]),
      db.select().from(warranties).where(eq(warranties.ticket_id, ticketId)).orderBy(desc(warranties.id)),
    ]);

    res.json({
      ...toPublicTicket(row),
      histories: histories.map(mapHistoryRow),
      diagnostics: diagnostics.map(mapDiagnosticRow),
      quotes,
      checklist: checklistRows[0] ? mapChecklistRow(checklistRows[0]) : null,
      part_usages: partUsages.map(mapPartUsageRow),
      payments: paymentRows.map(mapPaymentRow),
      warranties: warrantyRows.map(mapWarrantyRow),
    });
  })
);

// Issue #12 & Webhook prefix: Authoritative customer & device lookup from DB + dynamic store_settings.ticket_prefix
ticketsRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist', 'technician'),
  asyncHandler(async (req, res) => {
    const {
      customer_id,
      device_id,
      primary_technician_id,
      primary_technician_name,
      priority,
      defect_description,
      initial_condition,
      cosmetic_condition,
      accessories_included,
      device_password_hint,
      estimated_completion,
      is_warranty_claim,
      parent_ticket_id,
    } = req.body || {};

    if (!customer_id || !device_id || !defect_description) {
      throw AppError.badRequest('Khách hàng, thiết bị và mô tả lỗi là bắt buộc.');
    }

    const createdTicket = await withTransaction(async (tx) => {
      // 1. Verify customer exists in DB (Issue #12)
      const [customer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, Number(customer_id)))
        .limit(1);
      if (!customer) {
        throw AppError.badRequest('Khách hàng không tồn tại trên hệ thống.');
      }

      // 2. Verify device exists AND belongs to this customer (Issue #12)
      const [device] = await tx
        .select()
        .from(customerDevices)
        .where(eq(customerDevices.id, Number(device_id)))
        .limit(1);
      if (!device) {
        throw AppError.badRequest('Thiết bị không tồn tại trên hệ thống.');
      }
      if (Number(device.customer_id) !== Number(customer.id)) {
        throw AppError.badRequest('Thiết bị được chọn không thuộc sở hữu của khách hàng này.');
      }

      // 3. Use configured ticket_prefix from store_settings
      const [settings] = await tx
        .select({ ticket_prefix: storeSettings.ticket_prefix })
        .from(storeSettings)
        .where(eq(storeSettings.id, 1))
        .limit(1);
      const prefix = (settings?.ticket_prefix || 'SC').trim().toUpperCase();

      const ticketCode = await nextSequenceCode(tx, prefix, 4, true);
      const encryptedPwd = device_password_hint ? encryptDevicePassword(String(device_password_hint)) : null;
      const now = new Date().toISOString();

      const [resInsert] = await tx.insert(repairTickets).values({
        ticket_code: ticketCode,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address || null,
        device_id: device.id,
        device_model: device.model_name,
        device_category: device.category_name || 'Khác',
        device_brand: device.brand_name || 'Khác',
        device_serial: device.serial_number || device.imei || null,
        device_color: device.color || null,
        created_by_id: req.user!.sub,
        created_by_name: req.user!.full_name,
        primary_technician_id: primary_technician_id ? Number(primary_technician_id) : null,
        primary_technician_name: primary_technician_name || null,
        status: 'Received',
        priority: priority || 'Normal',
        defect_description: String(defect_description).trim(),
        initial_condition: initial_condition || null,
        cosmetic_condition: cosmetic_condition || null,
        accessories_included: accessories_included || null,
        device_password_hint: encryptedPwd,
        estimated_completion: estimated_completion || null,
        subtotal_amount: 0,
        discount_amount: 0,
        promotion_code: null,
        promotion_id: null,
        final_amount: 0,
        paid_amount: 0,
        debt_amount: 0,
        is_warranty_claim: is_warranty_claim ? 1 : 0,
        parent_ticket_id: parent_ticket_id ? Number(parent_ticket_id) : null,
        cancellation_reason: null,
        created_at: now,
        updated_at: now,
      });

      const ticketId = Number(resInsert.insertId);

      await tx.insert(repairStatusHistories).values({
        ticket_id: ticketId,
        from_status: null,
        to_status: 'Received',
        changed_by_name: req.user!.full_name,
        notes: 'Tiếp nhận thiết bị mới',
        created_at: now,
      });

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'CREATE_TICKET',
        entityType: 'repair_tickets',
        entityId: ticketCode,
        details: `Tạo phiếu sửa chữa ${ticketCode} cho ${customer.name}`,
        ipAddress: req.ip,
      });

      const [row] = await tx.select().from(repairTickets).where(eq(repairTickets.id, ticketId)).limit(1);
      return toPublicTicket(row);
    });

    res.status(201).json(createdTicket);
  })
);

// Issue #3: PUT /api/tickets/:id restricts discount/promotion changes to admin, manager, receptionist
ticketsRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = Number(req.params.id);

    const {
      primary_technician_id,
      primary_technician_name,
      priority,
      defect_description,
      initial_condition,
      cosmetic_condition,
      accessories_included,
      device_password_hint,
      estimated_completion,
      cancellation_reason,
      discount_amount,
      promotion_code,
    } = req.body || {};

    const canModifyDiscount =
      req.user!.role === 'admin' || req.user!.role === 'manager' || req.user!.role === 'receptionist';

    if (!canModifyDiscount && (discount_amount !== undefined || promotion_code !== undefined)) {
      throw AppError.forbidden('Kỹ thuật viên không có quyền trực tiếp điều chỉnh giảm giá trên phiếu.');
    }

    const updatedTicket = await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(repairTickets)
        .where(eq(repairTickets.id, ticketId))
        .for('update');
      if (!existing) throw AppError.notFound('Không tìm thấy phiếu sửa chữa.');

      let encryptedPwd = existing.device_password_hint;
      if (device_password_hint !== undefined) {
        encryptedPwd = device_password_hint ? encryptDevicePassword(String(device_password_hint)) : null;
      }

      const subtotal = Number(existing.subtotal_amount || 0);
      let newDiscount = Number(existing.discount_amount || 0);
      let newPromoCode = existing.promotion_code;
      let newPromoId = existing.promotion_id;

      if (canModifyDiscount) {
        if (discount_amount !== undefined && (req.user!.role === 'admin' || req.user!.role === 'manager')) {
          newDiscount = Math.max(0, Number(discount_amount));
        }
        if (promotion_code !== undefined && promotion_code !== existing.promotion_code) {
          const promoRes = await validateAndCalculatePromotionInTx(
            tx,
            promotion_code ? String(promotion_code) : null,
            subtotal,
            true,
            existing.promotion_id
          );
          newDiscount = promoRes.discountAmount;
          newPromoCode = promoRes.promotionCode || null;
          newPromoId = promoRes.promotionId || null;
        }
      }

      newDiscount = Math.min(subtotal, newDiscount);
      const finalAmt = Math.max(0, subtotal - newDiscount);
      const paidAmt = Number(existing.paid_amount || 0);
      const debtAmt = existing.status === 'Cancelled' ? 0 : Math.max(0, finalAmt - paidAmt);

      const now = new Date().toISOString();
      await tx
        .update(repairTickets)
        .set({
          primary_technician_id:
            primary_technician_id !== undefined
              ? primary_technician_id
                ? Number(primary_technician_id)
                : null
              : existing.primary_technician_id,
          primary_technician_name:
            primary_technician_name !== undefined ? primary_technician_name : existing.primary_technician_name,
          priority: priority || existing.priority,
          defect_description: defect_description || existing.defect_description,
          initial_condition: initial_condition !== undefined ? initial_condition : existing.initial_condition,
          cosmetic_condition: cosmetic_condition !== undefined ? cosmetic_condition : existing.cosmetic_condition,
          accessories_included:
            accessories_included !== undefined ? accessories_included : existing.accessories_included,
          device_password_hint: encryptedPwd,
          estimated_completion:
            estimated_completion !== undefined ? estimated_completion : existing.estimated_completion,
          cancellation_reason: cancellation_reason !== undefined ? cancellation_reason : existing.cancellation_reason,
          discount_amount: newDiscount,
          promotion_code: newPromoCode,
          promotion_id: newPromoId,
          final_amount: finalAmt,
          debt_amount: debtAmt,
          updated_at: now,
        })
        .where(eq(repairTickets.id, ticketId));

      await recalculateCustomerDebt(tx, Number(existing.customer_id));

      const [updated] = await tx.select().from(repairTickets).where(eq(repairTickets.id, ticketId)).limit(1);
      return toPublicTicket(updated);
    });

    res.json(updatedTicket);
  })
);

// P1-5, Issue #11, Item C & Item I: Dedicated state machine endpoint for ticket status transitions
ticketsRouter.post(
  '/:id/transition',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = Number(req.params.id);
    const {
      to_status,
      note,
      notes,
      is_override,
      cancellation_reason,
      warranty_days,
      refund_amount,
      refund_method,
    } = req.body || {};
    if (!to_status || !(to_status in STATUS_CONFIG)) {
      throw AppError.badRequest('Trạng thái chuyển đến không hợp lệ.');
    }

    const result = await withTransaction(async (tx) =>
      transitionTicketStatusInTx(tx, {
        ticketId,
        targetStatus: to_status as RepairStatus,
        actor: req.user!,
        note: note || notes,
        cancellationReason: cancellation_reason,
        isOverride: Boolean(is_override),
        warrantyDays: warranty_days !== undefined ? Number(warranty_days) : undefined,
        refundAmount: refund_amount !== undefined ? Number(refund_amount) : undefined,
        refundMethod: refund_method ? String(refund_method) : undefined,
        ipAddress: req.ip,
      })
    );

    res.json(result);
  })
);

// P0-3: Dedicated endpoint to view decrypted device password with RBAC + Audit Log
ticketsRouter.get(
  '/:id/device-password',
  requireAuth,
  requireRole('admin', 'manager', 'technician'),
  asyncHandler(async (req, res) => {
    const ticketId = Number(req.params.id);
    const [ticket] = await db
      .select({
        id: repairTickets.id,
        ticket_code: repairTickets.ticket_code,
        device_password_hint: repairTickets.device_password_hint,
      })
      .from(repairTickets)
      .where(eq(repairTickets.id, ticketId))
      .limit(1);
    if (!ticket) throw AppError.notFound('Không tìm thấy phiếu sửa chữa.');

    const decrypted = decryptDevicePassword(ticket.device_password_hint);

    await recordAuditLog(null, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'VIEW_DEVICE_PASSWORD',
      entityType: 'repair_tickets',
      entityId: ticket.ticket_code,
      details: `Xem mật khẩu thiết bị của phiếu ${ticket.ticket_code}`,
      ipAddress: req.ip,
    });

    res.json({ password: decrypted });
  })
);

// ==================== STATUS HISTORIES ====================
statusHistoriesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = req.query.ticket_id ? Number(req.query.ticket_id) : null;
    const rows = ticketId
      ? await db
          .select()
          .from(repairStatusHistories)
          .where(eq(repairStatusHistories.ticket_id, ticketId))
          .orderBy(desc(repairStatusHistories.id))
      : await db.select().from(repairStatusHistories).orderBy(desc(repairStatusHistories.id));
    res.json(rows.map(mapHistoryRow));
  })
);

// ==================== DIAGNOSTICS ====================
diagnosticsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = req.query.ticket_id ? Number(req.query.ticket_id) : null;
    const rows = ticketId
      ? await db
          .select()
          .from(repairDiagnostics)
          .where(eq(repairDiagnostics.ticket_id, ticketId))
          .orderBy(desc(repairDiagnostics.id))
      : await db.select().from(repairDiagnostics).orderBy(desc(repairDiagnostics.id));
    res.json(rows.map(mapDiagnosticRow));
  })
);

const createDiagnosticHandler = asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.id || req.body?.ticket_id);
  const { root_cause, proposed_solution, estimated_cost, estimated_hours, notes } = req.body || {};

  if (!ticketId || !root_cause || !proposed_solution) {
    throw AppError.badRequest('Nguyên nhân gốc và giải pháp đề xuất là bắt buộc.');
  }

  const diag = await withTransaction(async (tx) => {
    const now = new Date().toISOString();
    const [resInsert] = await tx.insert(repairDiagnostics).values({
      ticket_id: ticketId,
      technician_id: req.user!.sub,
      technician_name: req.user!.full_name,
      root_cause: String(root_cause).trim(),
      proposed_solution: String(proposed_solution).trim(),
      estimated_cost: Number(estimated_cost || 0),
      estimated_hours: estimated_hours !== undefined ? Number(estimated_hours) : null,
      notes: notes || null,
      created_at: now,
    });

    await recordAuditLog(tx, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'CREATE_DIAGNOSTIC',
      entityType: 'repair_diagnostics',
      entityId: String(ticketId),
      details: `Ghi nhận kết quả chẩn đoán kỹ thuật cho phiếu #${ticketId}`,
      ipAddress: req.ip,
    });

    const [created] = await tx
      .select()
      .from(repairDiagnostics)
      .where(eq(repairDiagnostics.id, Number(resInsert.insertId)))
      .limit(1);
    return mapDiagnosticRow(created);
  });

  res.status(201).json(diag);
});

ticketsRouter.post('/:id/diagnostics', requireAuth, requireRole('admin', 'manager', 'technician'), createDiagnosticHandler);
diagnosticsRouter.post('/', requireAuth, requireRole('admin', 'manager', 'technician'), createDiagnosticHandler);

// ==================== QUOTES (P1-3, Issue #3, #10, #13) ====================
quotesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = req.query.ticket_id ? Number(req.query.ticket_id) : undefined;
    const quotes = await fetchQuotesWithItems(ticketId);
    res.json(quotes);
  })
);

const createQuoteHandler = asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.id || req.body?.ticket_id);
  const { items, discount, discount_amount, promotion_code } = req.body || {};

  if (!ticketId || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Phiếu sửa chữa và danh sách hạng mục báo giá là bắt buộc.');
  }

  const createdQuote = await withTransaction(async (tx) => {
    const [ticket] = await tx
      .select()
      .from(repairTickets)
      .where(eq(repairTickets.id, ticketId))
      .for('update');
    if (!ticket) throw AppError.notFound('Không tìm thấy phiếu sửa chữa.');

    // Item E.4: Block creating quotes for Delivered or Cancelled tickets
    if (ticket.status === 'Delivered' || ticket.status === 'Cancelled') {
      throw AppError.badRequest('Không thể tạo báo giá cho phiếu đã bàn giao (Delivered) hoặc đã hủy (Cancelled).');
    }

    // Item E.5: Auto-increment quote version on the server, ignoring client version
    const [verRow] = await tx
      .select({ maxVersion: sql<number>`COALESCE(MAX(${repairQuotes.version}), 0)` })
      .from(repairQuotes)
      .where(eq(repairQuotes.ticket_id, ticketId));
    const nextVersion = Number(verRow?.maxVersion || 0) + 1;

    // Fetch latest existing quote (if any) to inherit promo code when promotion_code is omitted
    const [latestQuote] = await tx
      .select()
      .from(repairQuotes)
      .where(eq(repairQuotes.ticket_id, ticketId))
      .orderBy(desc(repairQuotes.id))
      .limit(1);

    // Item E.4: Mark existing 'Sent' quotes for this ticket as 'Superseded'
    await tx
      .update(repairQuotes)
      .set({ status: 'Superseded' })
      .where(and(eq(repairQuotes.ticket_id, ticketId), eq(repairQuotes.status, 'Sent')));

    const quoteCode = await nextSequenceCode(tx, 'BG', 4, true);

    let subtotal = 0;
    const normalizedItems: Array<{
      item_type: 'labor' | 'part';
      part_id: number | null;
      batch_id: number | null;
      batch_code: string | null;
      name: string;
      quantity: number;
      unit_price: number;
      labor_fee: number;
      subtotal: number;
      warranty_months: number;
    }> = [];

    for (const raw of items) {
      const itemType = raw.item_type === 'labor' || raw.type === 'labor' ? 'labor' : 'part';
      const qty = parsePositiveInt(raw.quantity ?? raw.qty, 'quantity', 1);
      const partId = raw.part_id ? parsePositiveInt(raw.part_id, 'part_id') : null;
      const batchId = raw.batch_id ? parsePositiveInt(raw.batch_id, 'batch_id') : null;

      // Authoritative part/batch price lookup from DB when part_id is referenced
      let unitPrice = parseNonNegativeAmount(raw.unit_price ?? raw.price, 'unit_price', 0);
      let batchCode = raw.batch_code || null;
      let itemName = String(raw.name || raw.description || '').trim();

      if (itemType === 'part' && partId) {
        const [pRow] = await tx.select().from(parts).where(eq(parts.id, partId)).limit(1);
        if (pRow) {
          unitPrice = Number(pRow.selling_price || unitPrice);
          if (!itemName) itemName = pRow.name;
        }
        if (batchId) {
          const [bRow] = await tx
            .select()
            .from(inventoryBatches)
            .where(eq(inventoryBatches.id, batchId))
            .limit(1);
          if (bRow && Number(bRow.part_id) === partId) {
            unitPrice = Number(bRow.selling_price || unitPrice);
            batchCode = bRow.batch_code;
          }
        }
      }

      const laborFee = parseNonNegativeAmount(raw.labor_fee, 'labor_fee', 0);
      const itemSubtotal = qty * unitPrice + laborFee;
      subtotal += itemSubtotal;

      normalizedItems.push({
        item_type: itemType,
        part_id: partId,
        batch_id: batchId,
        batch_code: batchCode,
        name: itemName || 'Hạng mục sửa chữa',
        quantity: qty,
        unit_price: unitPrice,
        labor_fee: laborFee,
        subtotal: itemSubtotal,
        warranty_months: parseNonNegativeInt(raw.warranty_months ?? raw.warranty, 'warranty_months', 0),
      });
    }

    // Manual discount only allowed for admin/manager; promotion_code allowed for all staff
    const canManualDiscount = req.user!.role === 'admin' || req.user!.role === 'manager';
    let finalDiscount = canManualDiscount
      ? parseNonNegativeAmount(discount ?? discount_amount, 'discount', 0)
      : 0;
    let promoId: number | null = null;
    let promoCode: string | null = null;

    // Item E.2 & E.3: Validate promotion against new subtotal WITHOUT consuming quota yet (consumeQuota = false)
    const effectivePromoCodeInput =
      promotion_code !== undefined
        ? promotion_code
          ? String(promotion_code)
          : null
        : ticket.promotion_code || latestQuote?.promotion_code || null;

    if (effectivePromoCodeInput) {
      const promoResult = await validateAndCalculatePromotionInTx(
        tx,
        effectivePromoCodeInput,
        subtotal,
        false,
        ticket.promotion_id
      );
      finalDiscount = Math.max(finalDiscount, promoResult.discountAmount);
      promoCode = promoResult.promotionCode || null;
      promoId = promoResult.promotionId || null;
    }

    finalDiscount = Math.min(subtotal, finalDiscount);
    const totalAmount = Math.max(0, subtotal - finalDiscount);
    const now = new Date().toISOString();

    // Issue #3 & Item E: Quotes created via POST /quotes ALWAYS start as 'Sent'
    const quoteStatus = 'Sent';

    const [resQuote] = await tx.insert(repairQuotes).values({
      ticket_id: ticketId,
      quote_code: quoteCode,
      version: nextVersion,
      subtotal,
      discount: finalDiscount,
      promotion_code: promoCode,
      promotion_id: promoId,
      total_amount: totalAmount,
      status: quoteStatus,
      rejection_reason: null,
      confirmed_by: null,
      confirmed_at: null,
      created_by_name: req.user!.full_name,
      created_at: now,
    });

    const quoteId = Number(resQuote.insertId);
    for (const item of normalizedItems) {
      await tx.insert(repairQuoteItems).values({
        quote_id: quoteId,
        item_type: item.item_type,
        part_id: item.part_id,
        batch_id: item.batch_id,
        batch_code: item.batch_code,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        labor_fee: item.labor_fee,
        subtotal: item.subtotal,
        warranty_months: item.warranty_months,
      });
    }

    // Item E.1: Do NOT overwrite ticket financial totals (subtotal_amount, discount_amount, final_amount, debt_amount)
    // before the quote is Approved! Only transition ticket status to Waiting_Approval if it was Received or Diagnosing.
    if (ticket.status === 'Received' || ticket.status === 'Diagnosing') {
      await tx
        .update(repairTickets)
        .set({
          status: 'Waiting_Approval',
          updated_at: now,
        })
        .where(eq(repairTickets.id, ticketId));

      await tx.insert(repairStatusHistories).values({
        ticket_id: ticketId,
        from_status: ticket.status,
        to_status: 'Waiting_Approval',
        changed_by_name: req.user!.full_name,
        notes: `Gửi báo giá ${quoteCode} (v${nextVersion}) chờ khách hàng duyệt`,
        created_at: now,
      });
    }

    await recordAuditLog(tx, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'CREATE_QUOTE',
      entityType: 'repair_quotes',
      entityId: quoteCode,
      details: `Tạo báo giá ${quoteCode} v${nextVersion} (${totalAmount.toLocaleString('vi-VN')} đ) cho phiếu ${ticket.ticket_code}`,
      ipAddress: req.ip,
    });

    const [qRow] = await tx.select().from(repairQuotes).where(eq(repairQuotes.id, quoteId)).limit(1);
    const qItems = await tx
      .select()
      .from(repairQuoteItems)
      .where(eq(repairQuoteItems.quote_id, quoteId))
      .orderBy(asc(repairQuoteItems.id));
    return mapQuoteRow(qRow, qItems.map(mapQuoteItemRow));
  });

  res.status(201).json(createdQuote);
});

ticketsRouter.post('/:id/quotes', requireAuth, createQuoteHandler);
quotesRouter.post('/', requireAuth, createQuoteHandler);

// Issue #3 & #13: PUT /api/quotes/:id/status requires admin/manager/receptionist and uses unified respondToQuoteInTx
quotesRouter.put(
  '/:id/status',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist'),
  asyncHandler(async (req, res) => {
    const quoteId = Number(req.params.id);
    const { status, confirmed_by, rejection_reason } = req.body || {};

    if (status !== 'Approved' && status !== 'Rejected') {
      throw AppError.badRequest('Trạng thái báo giá chỉ chấp nhận "Approved" hoặc "Rejected".');
    }

    const updatedQuote = await withTransaction(async (tx) =>
      respondToQuoteInTx(tx, {
        quoteId,
        status,
        confirmedBy: confirmed_by || req.user!.full_name,
        rejectionReason: rejection_reason || null,
        actorUserId: req.user!.sub,
        actorName: req.user!.full_name,
        ipAddress: req.ip,
      })
    );

    res.json(updatedQuote);
  })
);

// ==================== CHECKLISTS (Issue #3: Server computes is_passed from items) ====================
checklistsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = req.query.ticket_id ? Number(req.query.ticket_id) : null;
    const rows = ticketId
      ? await db.select().from(qcChecklists).where(eq(qcChecklists.ticket_id, ticketId))
      : await db.select().from(qcChecklists).orderBy(desc(qcChecklists.id));
    res.json(rows.map(mapChecklistRow));
  })
);

const saveChecklistHandler = asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.id || req.body?.ticket_id);
  const { items, notes } = req.body || {};
  if (!ticketId || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Phiếu sửa chữa và danh sách mục kiểm tra QC là bắt buộc.');
  }

  // Server computes is_passed strictly from checklist items (Issue #3)
  const sanitizedItems = items.map((item: any, idx: number) => ({
    id: String(item.id || `qc-${idx + 1}`),
    title: String(item.title || item.label || `Hạng mục #${idx + 1}`).trim(),
    passed: Boolean(item.passed === true || item.passed === 1 || item.passed === 'true'),
    note: item.note ? String(item.note).trim() : undefined,
  }));

  const serverComputedPassed = sanitizedItems.length > 0 && sanitizedItems.every((i) => i.passed);
  const passedFlag = serverComputedPassed ? 1 : 0;

  const now = new Date().toISOString();
  const itemsJson = JSON.stringify(sanitizedItems);

  const saved = await withTransaction(async (tx) => {
    const [existing] = await tx.select().from(qcChecklists).where(eq(qcChecklists.ticket_id, ticketId)).limit(1);
    if (existing) {
      await tx
        .update(qcChecklists)
        .set({
          checked_by_name: req.user!.full_name,
          items_json: itemsJson,
          notes: notes || null,
          is_passed: passedFlag,
          created_at: now,
        })
        .where(eq(qcChecklists.id, existing.id));

      const [row] = await tx.select().from(qcChecklists).where(eq(qcChecklists.id, existing.id)).limit(1);
      return mapChecklistRow(row);
    } else {
      const [resInsert] = await tx.insert(qcChecklists).values({
        ticket_id: ticketId,
        checked_by_name: req.user!.full_name,
        items_json: itemsJson,
        notes: notes || null,
        is_passed: passedFlag,
        created_at: now,
      });

      const [row] = await tx
        .select()
        .from(qcChecklists)
        .where(eq(qcChecklists.id, Number(resInsert.insertId)))
        .limit(1);
      return mapChecklistRow(row);
    }
  });

  res.json(saved);
});

ticketsRouter.post(
  '/:id/checklist',
  requireAuth,
  requireRole('admin', 'manager', 'technician'),
  saveChecklistHandler
);
checklistsRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'technician'),
  saveChecklistHandler
);
