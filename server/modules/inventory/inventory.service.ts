import { and, asc, desc, eq, gt, gte, sql } from 'drizzle-orm';
import { DbExecutor } from '../../db/pool';
import { inventoryBatches, parts } from '../../db/schema';
import { AppError } from '../../utils/AppError';

export interface BatchAllocation {
  batchId: number;
  batchCode: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
}

/**
 * Recomputes parts.stock_quantity strictly from SUM(inventory_batches.remaining_quantity) (Issue #6)
 */
export async function syncPartStockFromBatchesInTx(tx: DbExecutor, partId: number): Promise<number> {
  const [sumRow] = await tx
    .select({
      total_stock: sql<number>`COALESCE(SUM(${inventoryBatches.remaining_quantity}), 0)`,
    })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.part_id, partId));

  const totalStock = Math.max(0, Number(sumRow?.total_stock || 0));
  await tx
    .update(parts)
    .set({ stock_quantity: totalStock })
    .where(eq(parts.id, partId));

  return totalStock;
}

/**
 * Deducts stock strictly from inventory_batches (either a specific batch or FIFO order by import_date ASC, id ASC)
 * and synchronizes parts.stock_quantity = SUM(inventory_batches.remaining_quantity) (Issue #6).
 */
export async function deductPartStockFIFOInTx(
  tx: DbExecutor,
  partId: number,
  quantity: number,
  preferredBatchId?: number | null
): Promise<{ part: typeof parts.$inferSelect; allocations: BatchAllocation[] }> {
  const qtyNeeded = Math.max(1, Number(quantity || 0));

  const [part] = await tx
    .select()
    .from(parts)
    .where(eq(parts.id, partId))
    .for('update');
  if (!part) {
    throw AppError.notFound(`Không tìm thấy linh kiện #${partId}.`);
  }

  // Case 1: Specific batch requested
  if (preferredBatchId) {
    const [batch] = await tx
      .select()
      .from(inventoryBatches)
      .where(eq(inventoryBatches.id, Number(preferredBatchId)))
      .for('update');

    if (!batch || Number(batch.part_id) !== partId) {
      throw AppError.badRequest('Lô hàng không hợp lệ cho linh kiện này.');
    }

    const [ded] = await tx
      .update(inventoryBatches)
      .set({
        remaining_quantity: sql`${inventoryBatches.remaining_quantity} - ${qtyNeeded}`,
      })
      .where(and(eq(inventoryBatches.id, batch.id), gte(inventoryBatches.remaining_quantity, qtyNeeded)));

    if (ded.affectedRows === 0) {
      throw AppError.conflict(`Lô ${batch.batch_code} không đủ tồn kho (còn ${batch.remaining_quantity}).`);
    }

    await syncPartStockFromBatchesInTx(tx, partId);

    return {
      part,
      allocations: [
        {
          batchId: batch.id,
          batchCode: batch.batch_code,
          quantity: qtyNeeded,
          costPrice: Number(batch.cost_price || part.cost_price || 0),
          sellingPrice: Number(batch.selling_price || part.selling_price || 0),
        },
      ],
    };
  }

  // Case 2: FIFO deduction across batches ordered by import_date ASC, id ASC
  const availableBatches = await tx
    .select()
    .from(inventoryBatches)
    .where(and(eq(inventoryBatches.part_id, partId), gt(inventoryBatches.remaining_quantity, 0)))
    .orderBy(asc(inventoryBatches.import_date), asc(inventoryBatches.id))
    .for('update');

  const totalAvailable = availableBatches.reduce((sum, b) => sum + Number(b.remaining_quantity || 0), 0);
  if (totalAvailable < qtyNeeded) {
    throw AppError.conflict(
      `Linh kiện "${part.name}" không đủ tồn kho trong các lô hàng (cần ${qtyNeeded}, còn ${totalAvailable}).`
    );
  }

  let remainingToDeduct = qtyNeeded;
  const allocations: BatchAllocation[] = [];

  for (const batch of availableBatches) {
    if (remainingToDeduct <= 0) break;
    const take = Math.min(remainingToDeduct, Number(batch.remaining_quantity));
    if (take <= 0) continue;

    const [ded] = await tx
      .update(inventoryBatches)
      .set({
        remaining_quantity: sql`${inventoryBatches.remaining_quantity} - ${take}`,
      })
      .where(and(eq(inventoryBatches.id, batch.id), gte(inventoryBatches.remaining_quantity, take)));

    if (ded.affectedRows === 0) {
      throw AppError.conflict(`Lô ${batch.batch_code} vừa thay đổi tồn kho. Vui lòng thử lại.`);
    }

    allocations.push({
      batchId: batch.id,
      batchCode: batch.batch_code,
      quantity: take,
      costPrice: Number(batch.cost_price || part.cost_price || 0),
      sellingPrice: Number(batch.selling_price || part.selling_price || 0),
    });
    remainingToDeduct -= take;
  }

  await syncPartStockFromBatchesInTx(tx, partId);

  return { part, allocations };
}

/**
 * Returns stock back to a specific batch (or latest batch of the part if batchId is missing)
 * and recalculates parts.stock_quantity from batches (Issue #6).
 */
export async function returnPartStockToBatchInTx(
  tx: DbExecutor,
  partId: number,
  quantity: number,
  batchId?: number | null
): Promise<void> {
  const qty = Math.max(0, Number(quantity || 0));
  if (!partId || qty <= 0) return;

  let targetBatchId = batchId ? Number(batchId) : null;
  if (!targetBatchId) {
    const [latestBatch] = await tx
      .select({ id: inventoryBatches.id })
      .from(inventoryBatches)
      .where(eq(inventoryBatches.part_id, partId))
      .orderBy(desc(inventoryBatches.id))
      .limit(1);
    targetBatchId = latestBatch?.id || null;
  }

  if (targetBatchId) {
    await tx
      .update(inventoryBatches)
      .set({
        remaining_quantity: sql`${inventoryBatches.remaining_quantity} + ${qty}`,
      })
      .where(eq(inventoryBatches.id, targetBatchId));
  }

  await syncPartStockFromBatchesInTx(tx, partId);
}

