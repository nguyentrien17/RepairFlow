import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db, withTransaction } from '../../db/pool';
import { parts, inventoryBatches, suppliers, repairPartUsages } from '../../db/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { AppError } from '../../utils/AppError';
import { mapPartRow, mapBatchRow, mapSupplierRow, mapPartUsageRow } from '../../utils/mapRow';
import { nextSequenceCode, getVietnamIsoDate } from '../../utils/codeGenerator';
import { recordAuditLog } from '../audit/audit.service';
import {
  deductPartStockFIFOInTx,
  returnPartStockToBatchInTx,
  syncPartStockFromBatchesInTx,
} from './inventory.service';

export const partsRouter = Router();
export const batchesRouter = Router();
export const suppliersRouter = Router();
export const partUsagesRouter = Router();

// ==================== PARTS ====================
partsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(parts).orderBy(desc(parts.id));
    res.json(rows.map(mapPartRow));
  })
);

partsRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'technician'),
  asyncHandler(async (req, res) => {
    const {
      sku,
      name,
      category_id,
      category_name,
      supplier_id,
      supplier_name,
      compatible_models,
      cost_price,
      selling_price,
      stock_quantity,
      min_stock_alert,
      location,
    } = req.body || {};

    if (!sku || !name) {
      throw AppError.badRequest('SKU và tên linh kiện là bắt buộc.');
    }

    const part = await withTransaction(async (tx) => {
      const initialStock = Math.max(0, Number(stock_quantity || 0));
      const now = new Date().toISOString();
      const [resInsert] = await tx.insert(parts).values({
        sku: String(sku).trim(),
        name: String(name).trim(),
        category_id: Number(category_id || 1),
        category_name: category_name || 'Linh kiện chung',
        supplier_id: supplier_id ? Number(supplier_id) : null,
        supplier_name: supplier_name || null,
        compatible_models: compatible_models || null,
        cost_price: Number(cost_price || 0),
        selling_price: Number(selling_price || 0),
        stock_quantity: initialStock,
        min_stock_alert: Number(min_stock_alert ?? 3),
        location: location || null,
        created_at: now,
      });

      const partId = Number(resInsert.insertId);

      // If initial stock > 0, create an initial inventory batch so stock_quantity is ALWAYS the sum of batches (Issue #6)
      if (initialStock > 0) {
        const batchCode = await nextSequenceCode(tx, 'LOT', 3, true);
        await tx.insert(inventoryBatches).values({
          batch_code: batchCode,
          part_id: partId,
          part_name: String(name).trim(),
          sku: String(sku).trim(),
          supplier_id: supplier_id ? Number(supplier_id) : null,
          supplier_name: supplier_name || null,
          import_quantity: initialStock,
          remaining_quantity: initialStock,
          cost_price: Number(cost_price || 0),
          selling_price: Number(selling_price || 0),
          import_date: getVietnamIsoDate(),
          expiry_date: null,
          created_by_name: req.user!.full_name,
          notes: 'Tồn kho khởi tạo khi thêm linh kiện mới',
          created_at: now,
        });
      }

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'CREATE_PART',
        entityType: 'parts',
        entityId: String(sku).trim(),
        details: `Thêm linh kiện mới: ${name} (${sku})`,
        ipAddress: req.ip,
      });

      const [created] = await tx.select().from(parts).where(eq(parts.id, partId)).limit(1);
      return mapPartRow(created);
    });

    res.status(201).json(part);
  })
);

partsRouter.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager', 'technician'),
  asyncHandler(async (req, res) => {
    const partId = Number(req.params.id);
    const [existing] = await db.select().from(parts).where(eq(parts.id, partId)).limit(1);
    if (!existing) throw AppError.notFound('Không tìm thấy linh kiện.');

    const {
      sku,
      name,
      category_id,
      category_name,
      supplier_id,
      supplier_name,
      compatible_models,
      cost_price,
      selling_price,
      min_stock_alert,
      location,
    } = req.body || {};

    // Only admin & manager can change cost_price / selling_price
    const canEditPrice = req.user!.role === 'admin' || req.user!.role === 'manager';

    await db
      .update(parts)
      .set({
        sku: sku ? String(sku).trim() : existing.sku,
        name: name ? String(name).trim() : existing.name,
        category_id: category_id !== undefined ? Number(category_id) : existing.category_id,
        category_name: category_name || existing.category_name,
        supplier_id: supplier_id !== undefined ? (supplier_id ? Number(supplier_id) : null) : existing.supplier_id,
        supplier_name: supplier_name !== undefined ? supplier_name : existing.supplier_name,
        compatible_models: compatible_models !== undefined ? compatible_models : existing.compatible_models,
        cost_price: canEditPrice && cost_price !== undefined ? Number(cost_price) : existing.cost_price,
        selling_price: canEditPrice && selling_price !== undefined ? Number(selling_price) : existing.selling_price,
        min_stock_alert: min_stock_alert !== undefined ? Number(min_stock_alert) : existing.min_stock_alert,
        location: location !== undefined ? location : existing.location,
      })
      .where(eq(parts.id, partId));

    const [updated] = await db.select().from(parts).where(eq(parts.id, partId)).limit(1);
    res.json(mapPartRow(updated));
  })
);

// ==================== INVENTORY BATCHES ====================
batchesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(inventoryBatches).orderBy(desc(inventoryBatches.id));
    res.json(rows.map(mapBatchRow));
  })
);

batchesRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'technician'),
  asyncHandler(async (req, res) => {
    const {
      part_id,
      part_name,
      sku,
      supplier_id,
      supplier_name,
      import_quantity,
      cost_price,
      selling_price,
      import_date,
      expiry_date,
      notes,
    } = req.body || {};
    const qty = Number(import_quantity || 0);
    if (!part_id || qty <= 0) {
      throw AppError.badRequest('Linh kiện và số lượng nhập (> 0) là bắt buộc.');
    }

    const batch = await withTransaction(async (tx) => {
      const [part] = await tx.select().from(parts).where(eq(parts.id, Number(part_id))).for('update');
      if (!part) throw AppError.notFound('Không tìm thấy linh kiện.');

      const batchCode = await nextSequenceCode(tx, 'LOT', 3, true);
      const now = new Date().toISOString();
      const cPrice = cost_price !== undefined ? Number(cost_price) : Number(part.cost_price);
      const sPrice = selling_price !== undefined ? Number(selling_price) : Number(part.selling_price);

      const [resInsert] = await tx.insert(inventoryBatches).values({
        batch_code: batchCode,
        part_id: Number(part_id),
        part_name: part_name || part.name,
        sku: sku || part.sku,
        supplier_id: supplier_id ? Number(supplier_id) : null,
        supplier_name: supplier_name || null,
        import_quantity: qty,
        remaining_quantity: qty,
        cost_price: cPrice,
        selling_price: sPrice,
        import_date: import_date || getVietnamIsoDate(),
        expiry_date: expiry_date || null,
        created_by_name: req.user!.full_name,
        notes: notes || null,
        created_at: now,
      });

      const totalStock = await syncPartStockFromBatchesInTx(tx, Number(part_id));
      await tx
        .update(parts)
        .set({
          stock_quantity: totalStock,
          cost_price: cPrice,
          selling_price: sPrice,
          supplier_id: supplier_id ? Number(supplier_id) : part.supplier_id,
          supplier_name: supplier_name || part.supplier_name,
        })
        .where(eq(parts.id, Number(part_id)));

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'IMPORT_BATCH',
        entityType: 'inventory_batches',
        entityId: batchCode,
        details: `Nhập kho đợt ${batchCode}: +${qty}x ${part.name}`,
        ipAddress: req.ip,
      });

      const [created] = await tx
        .select()
        .from(inventoryBatches)
        .where(eq(inventoryBatches.id, Number(resInsert.insertId)))
        .limit(1);
      return mapBatchRow(created);
    });

    res.status(201).json(batch);
  })
);

batchesRouter.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const batchId = Number(req.params.id);
    const {
      supplier_id,
      supplier_name,
      import_quantity,
      cost_price,
      selling_price,
      import_date,
      expiry_date,
      notes,
    } = req.body || {};

    const updated = await withTransaction(async (tx) => {
      const [oldBatch] = await tx
        .select()
        .from(inventoryBatches)
        .where(eq(inventoryBatches.id, batchId))
        .for('update');
      if (!oldBatch) throw AppError.notFound('Không tìm thấy đợt nhập kho.');

      // Issue #2 & #6: Never accept raw remaining_quantity from client!
      // Instead compute remaining_quantity from (newImportQty - alreadyExportedFromThisBatch)
      // and enforce 0 <= remaining_quantity <= import_quantity.
      const alreadyExported = Math.max(0, Number(oldBatch.import_quantity) - Number(oldBatch.remaining_quantity));
      const newImportQty =
        import_quantity !== undefined ? Number(import_quantity) : Number(oldBatch.import_quantity);

      if (newImportQty < 1 || newImportQty < alreadyExported) {
        throw AppError.badRequest(
          `Số lượng nhập (${newImportQty}) không được nhỏ hơn số lượng đã xuất khỏi lô (${alreadyExported}).`
        );
      }

      const newRemaining = newImportQty - alreadyExported;
      const cPrice = cost_price !== undefined ? Math.max(0, Number(cost_price)) : Number(oldBatch.cost_price);
      const sPrice = selling_price !== undefined ? Math.max(0, Number(selling_price)) : Number(oldBatch.selling_price);

      await tx
        .update(inventoryBatches)
        .set({
          supplier_id: supplier_id !== undefined ? (supplier_id ? Number(supplier_id) : null) : oldBatch.supplier_id,
          supplier_name: supplier_name !== undefined ? supplier_name : oldBatch.supplier_name,
          import_quantity: newImportQty,
          remaining_quantity: newRemaining,
          cost_price: cPrice,
          selling_price: sPrice,
          import_date: import_date || oldBatch.import_date,
          expiry_date: expiry_date !== undefined ? expiry_date : oldBatch.expiry_date,
          notes: notes !== undefined ? notes : oldBatch.notes,
        })
        .where(eq(inventoryBatches.id, batchId));

      const totalStock = await syncPartStockFromBatchesInTx(tx, oldBatch.part_id);
      await tx
        .update(parts)
        .set({
          stock_quantity: totalStock,
          cost_price: cPrice,
          selling_price: sPrice,
        })
        .where(eq(parts.id, oldBatch.part_id));

      const [row] = await tx.select().from(inventoryBatches).where(eq(inventoryBatches.id, batchId)).limit(1);
      return mapBatchRow(row);
    });

    res.json(updated);
  })
);

batchesRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const batchId = Number(req.params.id);
    await withTransaction(async (tx) => {
      const [oldBatch] = await tx
        .select()
        .from(inventoryBatches)
        .where(eq(inventoryBatches.id, batchId))
        .for('update');
      if (!oldBatch) throw AppError.notFound('Không tìm thấy đợt nhập kho.');

      const usedCount = Number(oldBatch.import_quantity) - Number(oldBatch.remaining_quantity);
      if (usedCount > 0) {
        throw AppError.conflict('Không thể xóa đợt nhập kho đã xuất linh kiện.');
      }

      await tx.delete(inventoryBatches).where(eq(inventoryBatches.id, batchId));
      await syncPartStockFromBatchesInTx(tx, oldBatch.part_id);
    });

    res.json({ ok: true });
  })
);

// ==================== SUPPLIERS ====================
suppliersRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(suppliers).orderBy(desc(suppliers.id));
    res.json(rows.map(mapSupplierRow));
  })
);

suppliersRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { name, phone, email, address, is_active } = req.body || {};
    if (!name || !phone) throw AppError.badRequest('Tên và số điện thoại nhà cung cấp là bắt buộc.');

    const supplier = await withTransaction(async (tx) => {
      const code = await nextSequenceCode(tx, 'NCC', 3, false);
      const [resInsert] = await tx.insert(suppliers).values({
        code,
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: email || null,
        address: address || null,
        is_active: is_active !== false ? 1 : 0,
      });

      const [created] = await tx
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, Number(resInsert.insertId)))
        .limit(1);
      return mapSupplierRow(created);
    });

    res.status(201).json(supplier);
  })
);

suppliersRouter.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    if (!existing) throw AppError.notFound('Không tìm thấy nhà cung cấp.');

    const { name, phone, email, address, is_active } = req.body || {};

    await db
      .update(suppliers)
      .set({
        name: name ? String(name).trim() : existing.name,
        phone: phone ? String(phone).trim() : existing.phone,
        email: email !== undefined ? email : existing.email,
        address: address !== undefined ? address : existing.address,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      })
      .where(eq(suppliers.id, id));

    const [updated] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    res.json(mapSupplierRow(updated));
  })
);

suppliersRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await db.delete(suppliers).where(eq(suppliers.id, id));
    res.json({ ok: true });
  })
);

// ==================== PART USAGES (Issue #6: Always deducts via FIFO batches) ====================
partUsagesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = req.query.ticket_id ? Number(req.query.ticket_id) : null;
    const rows = ticketId
      ? await db
          .select()
          .from(repairPartUsages)
          .where(eq(repairPartUsages.ticket_id, ticketId))
          .orderBy(desc(repairPartUsages.id))
      : await db.select().from(repairPartUsages).orderBy(desc(repairPartUsages.id));
    res.json(rows.map(mapPartUsageRow));
  })
);

partUsagesRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager', 'technician'),
  asyncHandler(async (req, res) => {
    const { ticket_id, part_id, batch_id, quantity, technician_name } = req.body || {};
    const qty = Number(quantity || 0);
    if (!ticket_id || !part_id || qty <= 0) {
      throw AppError.badRequest('Phiếu sửa chữa, linh kiện và số lượng (> 0) là bắt buộc.');
    }

    const usage = await withTransaction(async (tx) => {
      // Deduct stock strictly from batches (specific batch or FIFO) and keep parts.stock_quantity synchronized
      const { part, allocations } = await deductPartStockFIFOInTx(
        tx,
        Number(part_id),
        qty,
        batch_id ? Number(batch_id) : null
      );

      const now = new Date().toISOString();
      let lastInsertedId = 0;

      for (const alloc of allocations) {
        const [resInsert] = await tx.insert(repairPartUsages).values({
          ticket_id: Number(ticket_id),
          part_id: Number(part_id),
          batch_id: alloc.batchId,
          batch_code: alloc.batchCode,
          part_name: part.name,
          sku: part.sku,
          quantity: alloc.quantity,
          cost_price: alloc.costPrice,
          selling_price: alloc.sellingPrice,
          status: 'Used',
          technician_name: technician_name || req.user!.full_name,
          created_at: now,
        });
        lastInsertedId = Number(resInsert.insertId);
      }

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'EXPORT_PART_TO_TICKET',
        entityType: 'repair_part_usages',
        entityId: String(ticket_id),
        details: `Xuất ${qty}x ${part.name} cho phiếu #${ticket_id} (Lô: ${allocations.map((a) => a.batchCode).join(', ')})`,
        ipAddress: req.ip,
      });

      const [created] = await tx
        .select()
        .from(repairPartUsages)
        .where(eq(repairPartUsages.id, lastInsertedId))
        .limit(1);
      return mapPartUsageRow(created);
    });

    res.status(201).json(usage);
  })
);

const returnPartUsageHandler = asyncHandler(async (req, res) => {
  const usageId = Number(req.params.id);

  const updated = await withTransaction(async (tx) => {
    const [usage] = await tx
      .select()
      .from(repairPartUsages)
      .where(eq(repairPartUsages.id, usageId))
      .for('update');
    if (!usage) throw AppError.notFound('Không tìm thấy lịch sử xuất linh kiện.');
    if (usage.status === 'Returned') {
      throw AppError.conflict('Linh kiện này đã được hoàn kho trước đó.');
    }

    const [upd] = await tx
      .update(repairPartUsages)
      .set({ status: 'Returned' })
      .where(and(eq(repairPartUsages.id, usageId), eq(repairPartUsages.status, 'Used')));

    if (upd.affectedRows === 0) {
      throw AppError.conflict('Linh kiện đã được hoàn kho.');
    }

    await returnPartStockToBatchInTx(tx, Number(usage.part_id), Number(usage.quantity), usage.batch_id);

    await recordAuditLog(tx, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'RETURN_PART_TO_STOCK',
      entityType: 'repair_part_usages',
      entityId: String(usage.ticket_id),
      details: `Hoàn trả kho ${usage.quantity}x ${usage.part_name} từ phiếu #${usage.ticket_id}`,
      ipAddress: req.ip,
    });

    const [row] = await tx.select().from(repairPartUsages).where(eq(repairPartUsages.id, usageId)).limit(1);
    return mapPartUsageRow(row);
  });

  res.json(updated);
});

partUsagesRouter.post('/:id/return', requireAuth, requireRole('admin', 'manager', 'technician'), returnPartUsageHandler);
partUsagesRouter.put('/:id/return', requireAuth, requireRole('admin', 'manager', 'technician'), returnPartUsageHandler);
