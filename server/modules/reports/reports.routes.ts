import { Router } from 'express';
import { eq, gt, lte, sql } from 'drizzle-orm';
import { db } from '../../db/pool';
import {
  repairTickets,
  payments,
  retailSaleOrders,
  repairPartUsages,
  parts,
  customers,
} from '../../db/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';

export const reportsRouter = Router();

// P2-6: Server-side SQL aggregation via Drizzle ORM for dashboard & reports
reportsRouter.get(
  '/summary',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const statusRows = await db
      .select({
        status: repairTickets.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(repairTickets)
      .groupBy(repairTickets.status);

    const revenueRows = await db
      .select({
        total_collected: sql<number>`COALESCE(SUM(CASE WHEN ${payments.amount} > 0 THEN ${payments.amount} ELSE 0 END), 0)`,
        total_refunded: sql<number>`COALESCE(SUM(CASE WHEN ${payments.amount} < 0 THEN ABS(${payments.amount}) ELSE 0 END), 0)`,
        net_payments: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments);

    const retailRows = await db
      .select({
        order_count: sql<number>`COUNT(*)`,
        net_retail_revenue: sql<number>`COALESCE(SUM(${retailSaleOrders.final_amount} - COALESCE(${retailSaleOrders.refund_amount}, 0)), 0)`,
      })
      .from(retailSaleOrders)
      .where(sql`COALESCE(${retailSaleOrders.order_status}, 'Completed') != 'Refunded'`);

    const partCostRows = await db
      .select({
        total_part_cost: sql<number>`COALESCE(SUM(${repairPartUsages.quantity} * ${repairPartUsages.cost_price}), 0)`,
      })
      .from(repairPartUsages)
      .where(eq(repairPartUsages.status, 'Used'));

    const lowStockRows = await db
      .select({
        low_stock_count: sql<number>`COUNT(*)`,
      })
      .from(parts)
      .where(lte(parts.stock_quantity, parts.min_stock_alert));

    const customerDebtRows = await db
      .select({
        total_customer_debt: sql<number>`COALESCE(SUM(${customers.current_debt}), 0)`,
      })
      .from(customers)
      .where(gt(customers.current_debt, 0));

    res.json({
      ticketsByStatus: statusRows.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      payments: {
        totalCollected: Number(revenueRows[0]?.total_collected || 0),
        totalRefunded: Number(revenueRows[0]?.total_refunded || 0),
        netPayments: Number(revenueRows[0]?.net_payments || 0),
      },
      retail: {
        orderCount: Number(retailRows[0]?.order_count || 0),
        netRetailRevenue: Number(retailRows[0]?.net_retail_revenue || 0),
      },
      totalPartCost: Number(partCostRows[0]?.total_part_cost || 0),
      lowStockCount: Number(lowStockRows[0]?.low_stock_count || 0),
      totalCustomerDebt: Number(customerDebtRows[0]?.total_customer_debt || 0),
    });
  })
);
