import { Router } from 'express';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db, withTransaction } from '../../db/pool';
import {
  retailSaleOrders,
  retailSaleOrderItems,
  customers,
} from '../../db/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { AppError } from '../../utils/AppError';
import { mapRetailOrderRow, mapRetailOrderItemRow } from '../../utils/mapRow';
import { nextSequenceCode } from '../../utils/codeGenerator';
import { recordAuditLog } from '../audit/audit.service';
import {
  validateAndCalculatePromotionInTx,
  releasePromotionUsageInTx,
} from '../promotions/promotions.service';
import { recalculateCustomerDebt } from '../customers/customers.service';
import {
  deductPartStockFIFOInTx,
  returnPartStockToBatchInTx,
} from '../inventory/inventory.service';
import { RetailSaleOrderItem } from '../../../shared/types/index';
import {
  parseBooleanFlag,
  parseNonNegativeAmount,
  parseNonNegativeInt,
  parsePositiveInt,
} from '../../utils/numbers';

export const salesRouter = Router();

export async function fetchRetailOrdersWithItems(orderId?: number) {
  const orderRows = orderId
    ? await db
        .select()
        .from(retailSaleOrders)
        .where(eq(retailSaleOrders.id, orderId))
        .orderBy(desc(retailSaleOrders.id))
    : await db.select().from(retailSaleOrders).orderBy(desc(retailSaleOrders.id));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => Number(o.id));
  const itemRows = await db
    .select()
    .from(retailSaleOrderItems)
    .where(inArray(retailSaleOrderItems.order_id, orderIds))
    .orderBy(asc(retailSaleOrderItems.id));

  const itemsByOrderId = new Map<number, RetailSaleOrderItem[]>();
  for (const r of itemRows) {
    const item = mapRetailOrderItemRow(r);
    const list = itemsByOrderId.get(Number(r.order_id)) || [];
    list.push(item);
    itemsByOrderId.set(Number(r.order_id), list);
  }

  return orderRows.map((o) => mapRetailOrderRow(o, itemsByOrderId.get(Number(o.id)) || []));
}

salesRouter.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist'),
  asyncHandler(async (_req, res) => {
    const orders = await fetchRetailOrdersWithItems();
    res.json(orders);
  })
);

// P1-3, P1-4, Issue #3, #6: Atomic POS Retail Order Creation with RBAC, Server Pricing & FIFO Batch Deduction
salesRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist'),
  asyncHandler(async (req, res) => {
    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_address,
      discount_amount,
      promotion_code,
      paid_amount,
      payment_method,
      transaction_ref,
      notes,
      warranty_months,
      return_days,
      items,
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      throw AppError.badRequest('Đơn hàng bán lẻ phải có ít nhất 1 sản phẩm.');
    }

    // Validate order-level numbers up front (no NaN can reach the DB)
    const orderWarrantyMonths = parseNonNegativeInt(warranty_months, 'warranty_months', 6);
    const orderReturnDays = parseNonNegativeInt(return_days, 'return_days', 15);
    const requestedDiscount = parseNonNegativeAmount(discount_amount, 'discount_amount', 0);
    const requestedPaid =
      paid_amount === undefined || paid_amount === null || paid_amount === ''
        ? null
        : parseNonNegativeAmount(paid_amount, 'paid_amount');

    const createdOrderId = await withTransaction(async (tx) => {
      const orderCode = await nextSequenceCode(tx, 'HD', 4, true);
      const now = new Date().toISOString();

      // Lookup customer from DB if customer_id is provided
      let resolvedCustomerName = customer_name || 'Khách lẻ';
      let resolvedCustomerPhone = customer_phone || '';
      let resolvedCustomerAddress = customer_address || null;
      const custId = Number(customer_id || 1);

      if (custId > 0) {
        const [cust] = await tx.select().from(customers).where(eq(customers.id, custId)).limit(1);
        if (cust) {
          resolvedCustomerName = cust.name;
          resolvedCustomerPhone = cust.phone;
          resolvedCustomerAddress = cust.address || resolvedCustomerAddress;
        }
      }

      let subtotal = 0;
      const preparedItems: Array<{
        item_type: string;
        part_id: number | null;
        batch_id: number | null;
        batch_code: string | null;
        product_name: string;
        sku: string | null;
        serial_number: string | null;
        quantity: number;
        cost_price: number;
        unit_price: number;
        subtotal: number;
        warranty_months: number;
        return_days: number;
      }> = [];

      const customAuditLogs: Array<{ productName: string; qty: number; unitPrice: number }> = [];

      // Item B & Item H: Separate custom items from inventory-tracked items, and sort inventory items by part_id ASC to prevent deadlocks
      const rawItemsWithIndex = items.map((raw: any, idx: number) => ({ raw, idx }));
      const customItems = rawItemsWithIndex.filter(
        ({ raw }) => raw.item_type === 'custom' || !raw.part_id
      );
      const inventoryItems = rawItemsWithIndex
        .filter(({ raw }) => raw.item_type !== 'custom' && Boolean(raw.part_id))
        .sort((a, b) => {
          const pDiff = Number(a.raw.part_id) - Number(b.raw.part_id);
          if (pDiff !== 0) return pDiff;
          return Number(a.raw.batch_id || 0) - Number(b.raw.batch_id || 0);
        });

      // Process custom items first (restricted to admin & manager)
      for (const { raw } of customItems) {
        if (req.user!.role !== 'admin' && req.user!.role !== 'manager') {
          throw AppError.forbidden(
            'Chỉ Quản trị viên hoặc Quản lý mới được phép bán mặt hàng tự nhập ngoài danh mục (custom).'
          );
        }
        const productName = String(raw.product_name || '').trim();
        const unitPrice = parseNonNegativeAmount(raw.unit_price, 'unit_price', 0);
        const costPrice = parseNonNegativeAmount(raw.cost_price, 'cost_price', 0);
        const qty = parsePositiveInt(raw.quantity, 'quantity', 1);

        if (!productName) {
          throw AppError.badRequest('Sản phẩm tự nhập phải có tên sản phẩm (product_name).');
        }
        if (unitPrice <= 0) {
          throw AppError.badRequest('Sản phẩm tự nhập phải có đơn giá bán (unit_price) lớn hơn 0.');
        }

        const itemSubtotal = qty * unitPrice;
        subtotal += itemSubtotal;

        preparedItems.push({
          item_type: 'custom',
          part_id: null,
          batch_id: null,
          batch_code: null,
          product_name: productName,
          sku: raw.sku ? String(raw.sku).trim() : 'CUSTOM',
          serial_number: raw.serial_number || null,
          quantity: qty,
          cost_price: costPrice,
          unit_price: unitPrice,
          subtotal: itemSubtotal,
          warranty_months: parseNonNegativeInt(raw.warranty_months, 'warranty_months', orderWarrantyMonths),
          return_days: parseNonNegativeInt(raw.return_days, 'return_days', orderReturnDays),
        });

        customAuditLogs.push({ productName, qty, unitPrice });
      }

      // Process inventory items in ascending part_id order to prevent lock ordering deadlocks
      for (const { raw } of inventoryItems) {
        const partId = Number(raw.part_id);
        const preferredBatchId = raw.batch_id ? parsePositiveInt(raw.batch_id, 'batch_id') : null;
        const qty = parsePositiveInt(raw.quantity, 'quantity', 1);
        const itemWarrantyMonths = parseNonNegativeInt(raw.warranty_months, 'warranty_months', orderWarrantyMonths);
        const itemReturnDays = parseNonNegativeInt(raw.return_days, 'return_days', orderReturnDays);

        // Deduct stock strictly from batches via FIFO (or specified batch) and use DB selling_price (Issue #3 & #6)
        const { part, allocations } = await deductPartStockFIFOInTx(tx, partId, qty, preferredBatchId);

        for (const alloc of allocations) {
          // Issue #3: unit_price is strictly taken from DB batch/part selling_price, never from client!
          const unitPrice = Number(alloc.sellingPrice);
          const costPrice = Number(alloc.costPrice);
          const itemSubtotal = alloc.quantity * unitPrice;
          subtotal += itemSubtotal;

          preparedItems.push({
            item_type: raw.item_type || 'part',
            part_id: partId,
            batch_id: alloc.batchId,
            batch_code: alloc.batchCode,
            product_name: part.name,
            sku: part.sku,
            serial_number: raw.serial_number || null,
            quantity: alloc.quantity,
            cost_price: costPrice,
            unit_price: unitPrice,
            subtotal: itemSubtotal,
            warranty_months: itemWarrantyMonths,
            return_days: itemReturnDays,
          });
        }
      }

      // Issue #3: Manual discount without promotion code is restricted to admin & manager
      const canManualDiscount = req.user!.role === 'admin' || req.user!.role === 'manager';
      let finalDiscount = canManualDiscount ? requestedDiscount : 0;
      let promoCode: string | null = null;
      let promoId: number | null = null;

      if (promotion_code) {
        const promoRes = await validateAndCalculatePromotionInTx(tx, String(promotion_code), subtotal, true);
        finalDiscount = Math.max(finalDiscount, promoRes.discountAmount);
        promoCode = promoRes.promotionCode || null;
        promoId = promoRes.promotionId || null;
      }
      finalDiscount = Math.min(subtotal, finalDiscount);

      const finalAmount = Math.max(0, subtotal - finalDiscount);
      const actualPaid = requestedPaid !== null ? Math.min(finalAmount, requestedPaid) : finalAmount;
      const debtAmount = Math.max(0, finalAmount - actualPaid);
      const paymentStatus = debtAmount === 0 ? 'Paid' : actualPaid > 0 ? 'Partial' : 'Unpaid';

      const [resOrder] = await tx.insert(retailSaleOrders).values({
        order_code: orderCode,
        customer_id: custId,
        customer_name: resolvedCustomerName,
        customer_phone: resolvedCustomerPhone,
        customer_address: resolvedCustomerAddress,
        created_by_id: req.user!.sub,
        created_by_name: req.user!.full_name,
        subtotal_amount: subtotal,
        discount_amount: finalDiscount,
        promotion_code: promoCode,
        promotion_id: promoId,
        final_amount: finalAmount,
        paid_amount: actualPaid,
        debt_amount: debtAmount,
        payment_method: payment_method || 'Cash',
        payment_status: paymentStatus,
        order_status: 'Completed',
        transaction_ref: transaction_ref || null,
        notes: notes || null,
        warranty_months: orderWarrantyMonths,
        return_days: orderReturnDays,
        created_at: now,
      });

      const orderId = Number(resOrder.insertId);
      for (const item of preparedItems) {
        await tx.insert(retailSaleOrderItems).values({
          order_id: orderId,
          item_type: item.item_type,
          part_id: item.part_id,
          batch_id: item.batch_id,
          batch_code: item.batch_code,
          product_name: item.product_name,
          sku: item.sku,
          serial_number: item.serial_number,
          quantity: item.quantity,
          cost_price: item.cost_price,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          warranty_months: item.warranty_months,
          return_days: item.return_days,
        });
      }

      if (custId) {
        await recalculateCustomerDebt(tx, custId);
      }

      for (const cLog of customAuditLogs) {
        await recordAuditLog(tx, {
          userId: req.user!.sub,
          userName: req.user!.full_name,
          action: 'CUSTOM_SALE_ITEM',
          entityType: 'retail_sale_order_items',
          entityId: orderCode,
          details: `Bán mặt hàng tự nhập ngoài danh mục [${cLog.productName}] x${cLog.qty} đơn giá ${cLog.unitPrice.toLocaleString('vi-VN')} đ trong đơn ${orderCode}`,
          ipAddress: req.ip,
        });
      }

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'CREATE_RETAIL_ORDER',
        entityType: 'retail_sale_orders',
        entityId: orderCode,
        details: `Tạo đơn bán lẻ ${orderCode}: ${finalAmount.toLocaleString('vi-VN')} đ`,
        ipAddress: req.ip,
      });

      return orderId;
    });

    const [fullOrder] = await fetchRetailOrdersWithItems(createdOrderId);
    res.status(201).json(fullOrder);
  })
);

// Issue #3, #4, #10: Retail Order Refund with RBAC, strict paid_amount ceiling, partial vs full refund handling
const refundRetailOrderHandler = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const {
    refundAmount,
    refund_amount,
    refundReason,
    refund_reason,
    reason,
    returnStockToInventory,
    return_to_stock,
  } = req.body || {};

  const amount = parseNonNegativeAmount(refundAmount ?? refund_amount, 'refund_amount', 0);
  const actualReason = String(refundReason || refund_reason || reason || 'Hoàn trả hóa đơn').trim();
  // Boolean("false") === true, so parse the flag strictly
  const shouldReturnStock = parseBooleanFlag(returnStockToInventory ?? return_to_stock, true);

  if (amount <= 0) {
    throw AppError.badRequest('Số tiền hoàn (> 0) là bắt buộc.');
  }

  await withTransaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(retailSaleOrders)
      .where(eq(retailSaleOrders.id, orderId))
      .for('update');
    if (!order) throw AppError.notFound('Không tìm thấy đơn hàng bán lẻ.');
    if (order.order_status === 'Refunded') {
      throw AppError.conflict('Đơn hàng này đã được hoàn tiền toàn bộ.');
    }

    // Issue #4: Strictly use paid_amount (never fallback to final_amount when paid_amount = 0!)
    const paidSoFar = Math.max(0, Number(order.paid_amount || 0));
    const alreadyRefunded = Math.max(0, Number(order.refund_amount || 0));
    const maxRefundable = Math.max(0, paidSoFar - alreadyRefunded);

    if (paidSoFar <= 0 || maxRefundable <= 0) {
      throw AppError.badRequest('Đơn hàng này chưa thu tiền hoặc đã hoàn hết số tiền đã thu.');
    }
    if (amount > maxRefundable) {
      throw AppError.badRequest(
        `Số tiền hoàn (${amount.toLocaleString('vi-VN')} đ) vượt quá số tiền đã thu còn lại có thể hoàn (${maxRefundable.toLocaleString('vi-VN')} đ).`
      );
    }

    const totalRefunded = alreadyRefunded + amount;
    const isFullRefund = totalRefunded >= Number(order.final_amount || 0) || (shouldReturnStock && totalRefunded >= paidSoFar);

    const now = new Date().toISOString();
    const nextOrderStatus = isFullRefund ? 'Refunded' : 'Completed';
    const nextPaymentStatus = isFullRefund ? 'Refunded' : order.payment_status;
    const nextDebtAmount = isFullRefund ? 0 : Math.max(0, Number(order.debt_amount || 0));
    const willReturnStockNow = isFullRefund && shouldReturnStock && order.return_to_stock !== 1;

    await tx
      .update(retailSaleOrders)
      .set({
        order_status: nextOrderStatus,
        payment_status: nextPaymentStatus,
        debt_amount: nextDebtAmount,
        refund_amount: totalRefunded,
        refund_reason: actualReason,
        refunded_at: now,
        refunded_by_name: req.user!.full_name,
        return_to_stock: willReturnStockNow ? 1 : order.return_to_stock ?? 0,
      })
      .where(eq(retailSaleOrders.id, orderId));

    if (willReturnStockNow) {
      const items = await tx
        .select()
        .from(retailSaleOrderItems)
        .where(eq(retailSaleOrderItems.order_id, orderId));
      for (const item of items) {
        if (item.part_id) {
          await returnPartStockToBatchInTx(tx, Number(item.part_id), Number(item.quantity), item.batch_id);
        }
      }
    }

    if (isFullRefund && order.promotion_id) {
      await releasePromotionUsageInTx(tx, order.promotion_id);
    }

    if (order.customer_id) {
      await recalculateCustomerDebt(tx, Number(order.customer_id));
    }

    await recordAuditLog(tx, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'REFUND_RETAIL_ORDER',
      entityType: 'retail_sale_orders',
      entityId: order.order_code,
      details: `${isFullRefund ? 'Hoàn trả toàn bộ' : 'Hoàn tiền một phần'} đơn bán lẻ ${order.order_code}: ${amount.toLocaleString('vi-VN')} đ. Lý do: ${actualReason}`,
      ipAddress: req.ip,
    });
  });

  const [updated] = await fetchRetailOrdersWithItems(orderId);
  res.json(updated);
});

salesRouter.post(
  '/:id/refund',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist'),
  refundRetailOrderHandler
);
salesRouter.put(
  '/:id/refund',
  requireAuth,
  requireRole('admin', 'manager', 'receptionist'),
  refundRetailOrderHandler
);
