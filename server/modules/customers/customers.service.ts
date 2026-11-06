import { and, eq, ne, sql } from 'drizzle-orm';
import { DbExecutor } from '../../db/pool';
import { customers, repairTickets, retailSaleOrders } from '../../db/schema';

/**
 * Recalculates a customer's total current_debt from all active repair tickets + non-refunded retail orders
 * inside a Drizzle transaction.
 */
export async function recalculateCustomerDebt(tx: DbExecutor, customerId: number): Promise<void> {
  if (!customerId) return;

  const [ticketDebt] = await tx
    .select({
      debt: sql<number>`COALESCE(SUM(${repairTickets.debt_amount}), 0)`,
    })
    .from(repairTickets)
    .where(and(eq(repairTickets.customer_id, customerId), ne(repairTickets.status, 'Cancelled')));

  const [retailDebt] = await tx
    .select({
      debt: sql<number>`COALESCE(SUM(${retailSaleOrders.debt_amount}), 0)`,
    })
    .from(retailSaleOrders)
    .where(
      and(
        eq(retailSaleOrders.customer_id, customerId),
        sql`COALESCE(${retailSaleOrders.order_status}, 'Completed') != 'Refunded'`
      )
    );

  const totalDebt = Math.max(0, Number(ticketDebt?.debt || 0) + Number(retailDebt?.debt || 0));
  await tx.update(customers).set({ current_debt: totalDebt }).where(eq(customers.id, customerId));
}

