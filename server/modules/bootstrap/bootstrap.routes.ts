import { Router } from 'express';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../../db/pool';
import {
  users,
  customers,
  deviceCategories,
  deviceBrands,
  customerDevices,
  repairTickets,
  repairStatusHistories,
  repairDiagnostics,
  repairQuotes,
  repairQuoteItems,
  parts,
  inventoryBatches,
  repairPartUsages,
  payments,
  warranties,
  qcChecklists,
  auditLogs,
  suppliers,
  retailSaleOrders,
  retailSaleOrderItems,
  promotions,
  storeSettings,
} from '../../db/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  toPublicUser,
  toPublicSettings,
  toPublicTicket,
  mapCustomerRow,
  mapCategoryRow,
  mapBrandRow,
  mapDeviceRow,
  mapHistoryRow,
  mapDiagnosticRow,
  mapQuoteRow,
  mapQuoteItemRow,
  mapPartRow,
  mapBatchRow,
  mapPartUsageRow,
  mapPaymentRow,
  mapWarrantyRow,
  mapChecklistRow,
  mapAuditLogRow,
  mapSupplierRow,
  mapRetailOrderRow,
  mapRetailOrderItemRow,
  mapPromotionRow,
} from '../../utils/mapRow';
import { RepairQuoteItem, RetailSaleOrderItem } from '../../../shared/types/index';

export const bootstrapRouter = Router();

/**
 * Role-scoped authenticated bootstrap snapshot for the staff dashboard.
 * - Strictly strips password hashes, gateway secrets, and encrypted device passwords (P0-1, P0-2, P0-3).
 * - Scopes sensitive financial/audit/user collections by role so technicians only receive operational repair data.
 */
bootstrapRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const role = req.user!.role;
    const isAdminOrManager = role === 'admin' || role === 'manager';
    const canViewFinancials = isAdminOrManager || role === 'receptionist';

    const [
      userRows,
      customerRows,
      categoryRows,
      brandRows,
      deviceRows,
      ticketRows,
      statusHistoryRows,
      diagnosticRows,
      quotesRaw,
      quoteItemsRaw,
      partRows,
      batchRows,
      partUsageRows,
      paymentRows,
      warrantyRows,
      checklistRows,
      auditLogRows,
      supplierRows,
      retailOrdersRaw,
      retailOrderItemsRaw,
      promotionRows,
      settingsRows,
    ] = await Promise.all([
      db.select().from(users).orderBy(asc(users.id)),
      db.select().from(customers).orderBy(desc(customers.id)),
      db.select().from(deviceCategories).orderBy(asc(deviceCategories.id)),
      db.select().from(deviceBrands).orderBy(asc(deviceBrands.id)),
      db.select().from(customerDevices).orderBy(desc(customerDevices.id)),
      db.select().from(repairTickets).orderBy(desc(repairTickets.id)),
      db.select().from(repairStatusHistories).orderBy(desc(repairStatusHistories.id)),
      db.select().from(repairDiagnostics).orderBy(desc(repairDiagnostics.id)),
      db.select().from(repairQuotes).orderBy(desc(repairQuotes.id)),
      db.select().from(repairQuoteItems).orderBy(asc(repairQuoteItems.id)),
      db.select().from(parts).orderBy(desc(parts.id)),
      db.select().from(inventoryBatches).orderBy(desc(inventoryBatches.id)),
      db.select().from(repairPartUsages).orderBy(desc(repairPartUsages.id)),
      canViewFinancials ? db.select().from(payments).orderBy(desc(payments.id)) : Promise.resolve([]),
      db.select().from(warranties).orderBy(desc(warranties.id)),
      db.select().from(qcChecklists).orderBy(desc(qcChecklists.id)),
      isAdminOrManager ? db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(300) : Promise.resolve([]),
      db.select().from(suppliers).orderBy(desc(suppliers.id)),
      canViewFinancials ? db.select().from(retailSaleOrders).orderBy(desc(retailSaleOrders.id)) : Promise.resolve([]),
      canViewFinancials
        ? db.select().from(retailSaleOrderItems).orderBy(asc(retailSaleOrderItems.id))
        : Promise.resolve([]),
      db.select().from(promotions).orderBy(desc(promotions.id)),
      db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1),
    ]);

    const itemsByQuoteId = new Map<number, RepairQuoteItem[]>();
    for (const r of quoteItemsRaw) {
      const item = mapQuoteItemRow(r);
      const list = itemsByQuoteId.get(item.quote_id) || [];
      list.push(item);
      itemsByQuoteId.set(item.quote_id, list);
    }

    const quotes = quotesRaw.map((q) => mapQuoteRow(q, itemsByQuoteId.get(Number(q.id)) || []));

    const itemsByOrderId = new Map<number, RetailSaleOrderItem[]>();
    for (const r of retailOrderItemsRaw) {
      const item = mapRetailOrderItemRow(r);
      const list = itemsByOrderId.get(Number(r.order_id)) || [];
      list.push(item);
      itemsByOrderId.set(Number(r.order_id), list);
    }

    const retailOrders = retailOrdersRaw.map((o) => mapRetailOrderRow(o, itemsByOrderId.get(Number(o.id)) || []));

    // Scope user list & customer debt for non-financial roles
    const mappedUsers = userRows.map((u) => {
      const pub = toPublicUser(u);
      if (!isAdminOrManager && pub.id !== req.user!.sub) {
        return {
          id: pub.id,
          username: pub.username,
          full_name: pub.full_name,
          email: '',
          phone: '',
          role: pub.role,
          is_active: pub.is_active,
          created_at: pub.created_at,
        };
      }
      return pub;
    });

    const mappedCustomers = customerRows.map((c) => {
      const cust = mapCustomerRow(c);
      if (!canViewFinancials) {
        return { ...cust, current_debt: 0 };
      }
      return cust;
    });

    res.json({
      settings: settingsRows[0] ? toPublicSettings(settingsRows[0]) : null,
      users: mappedUsers,
      customers: mappedCustomers,
      categories: categoryRows.map(mapCategoryRow),
      brands: brandRows.map(mapBrandRow),
      devices: deviceRows.map(mapDeviceRow),
      suppliers: supplierRows.map(mapSupplierRow),
      parts: partRows.map(mapPartRow),
      part_batches: batchRows.map(mapBatchRow),
      promotions: promotionRows.map(mapPromotionRow),
      tickets: ticketRows.map(toPublicTicket),
      histories: statusHistoryRows.map(mapHistoryRow),
      diagnostics: diagnosticRows.map(mapDiagnosticRow),
      quotes,
      checklists: checklistRows.map(mapChecklistRow),
      part_usages: partUsageRows.map(mapPartUsageRow),
      payments: paymentRows.map(mapPaymentRow),
      warranties: warrantyRows.map(mapWarrantyRow),
      retail_orders: retailOrders,
      audit_logs: auditLogRows.map(mapAuditLogRow),
    });
  })
);
