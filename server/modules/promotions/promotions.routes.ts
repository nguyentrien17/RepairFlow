import { Router, Request, Response } from 'express';
import { desc, eq } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { validateBody } from '../../middleware/validate';
import { db, withTransaction } from '../../db/pool';
import { promotions } from '../../db/schema';
import { mapPromotionRow } from '../../utils/mapRow';
import { AppError } from '../../utils/AppError';
import { recordAuditLog } from '../audit/audit.service';
import { validateAndCalculatePromotionInTx } from './promotions.service';

export const promotionsRouter = Router();

promotionsRouter.use(requireAuth);

promotionsRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.select().from(promotions).orderBy(desc(promotions.id));
    res.json(rows.map(mapPromotionRow));
  })
);

promotionsRouter.post(
  '/validate',
  validateBody({
    code: { type: 'string', required: true, min: 1, max: 50 },
    subtotal: { type: 'number', required: true, min: 0 },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { code, subtotal } = req.body;
    const result = await withTransaction((tx) => validateAndCalculatePromotionInTx(tx, code, subtotal, false));
    res.json({
      valid: true,
      promotion: result.promotion,
      discountAmount: result.discountAmount,
    });
  })
);

promotionsRouter.post(
  '/',
  requireRole('admin', 'manager'),
  validateBody({
    code: { type: 'string', required: true, min: 2, max: 50 },
    name: { type: 'string', required: true, min: 2, max: 200 },
    description: { type: 'string', max: 2000, nullable: true },
    discount_type: { type: 'string', required: true, enumValues: ['percentage', 'fixed'] },
    discount_value: { type: 'number', required: true, min: 1 },
    max_discount_amount: { type: 'number', min: 0, nullable: true },
    min_order_amount: { type: 'number', min: 0, nullable: true },
    applicable_to: { type: 'string', enumValues: ['all', 'labor', 'part'] },
    start_date: { type: 'string', max: 20, nullable: true },
    end_date: { type: 'string', max: 20, nullable: true },
    usage_limit: { type: 'number', min: 1, nullable: true },
    is_active: { type: 'boolean' },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const pr = req.body;
    const cleanCode = pr.code.trim().toUpperCase();
    const now = new Date().toISOString();

    const created = await withTransaction(async (tx) => {
      const [insertRes] = await tx.insert(promotions).values({
        code: cleanCode,
        name: pr.name,
        description: pr.description || null,
        discount_type: pr.discount_type,
        discount_value: pr.discount_value,
        max_discount_amount: pr.max_discount_amount || null,
        min_order_amount: pr.min_order_amount || null,
        applicable_to: pr.applicable_to || 'all',
        start_date: pr.start_date || null,
        end_date: pr.end_date || null,
        usage_limit: pr.usage_limit || null,
        usage_count: 0,
        is_active: pr.is_active !== false ? 1 : 0,
        created_at: now,
      });

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'CREATE_PROMO',
        entityType: 'promotions',
        entityId: cleanCode,
        details: `Tạo mã ưu đãi mới: ${cleanCode} - ${pr.name}`,
        ipAddress: req.ip,
      });

      const rows = await tx
        .select()
        .from(promotions)
        .where(eq(promotions.id, Number(insertRes.insertId)))
        .limit(1);
      return mapPromotionRow(rows[0]);
    });

    res.status(201).json({ ok: true, promotion: created });
  })
);

promotionsRouter.put(
  '/:id',
  requireRole('admin', 'manager'),
  validateBody(
    {
      code: { type: 'string', min: 2, max: 50 },
      name: { type: 'string', min: 2, max: 200 },
      description: { type: 'string', max: 2000, nullable: true },
      discount_type: { type: 'string', enumValues: ['percentage', 'fixed'] },
      discount_value: { type: 'number', min: 1 },
      max_discount_amount: { type: 'number', min: 0, nullable: true },
      min_order_amount: { type: 'number', min: 0, nullable: true },
      applicable_to: { type: 'string', enumValues: ['all', 'labor', 'part'] },
      start_date: { type: 'string', max: 20, nullable: true },
      end_date: { type: 'string', max: 20, nullable: true },
      usage_limit: { type: 'number', min: 1, nullable: true },
      is_active: { type: 'boolean' },
    },
    true
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
    if (rows.length === 0) throw AppError.notFound('Không tìm thấy chương trình ưu đãi');

    const current = rows[0];
    const merged = { ...current, ...req.body };
    const cleanCode = String(merged.code).trim().toUpperCase();

    await withTransaction(async (tx) => {
      await tx
        .update(promotions)
        .set({
          code: cleanCode,
          name: merged.name,
          description: merged.description || null,
          discount_type: merged.discount_type,
          discount_value: Number(merged.discount_value || 0),
          max_discount_amount: merged.max_discount_amount || null,
          min_order_amount: merged.min_order_amount || null,
          applicable_to: merged.applicable_to || 'all',
          start_date: merged.start_date || null,
          end_date: merged.end_date || null,
          usage_limit: merged.usage_limit || null,
          is_active: merged.is_active ? 1 : 0,
        })
        .where(eq(promotions.id, id));

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'UPDATE_PROMO',
        entityType: 'promotions',
        entityId: cleanCode,
        details: `Cập nhật chương trình ưu đãi ${cleanCode}`,
        ipAddress: req.ip,
      });
    });

    const updatedRows = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
    res.json({ ok: true, promotion: mapPromotionRow(updatedRows[0]) });
  })
);

promotionsRouter.delete(
  '/:id',
  requireRole('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
    if (rows.length === 0) throw AppError.notFound('Không tìm thấy chương trình ưu đãi');

    await withTransaction(async (tx) => {
      await tx.delete(promotions).where(eq(promotions.id, id));
      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'DELETE_PROMO',
        entityType: 'promotions',
        entityId: rows[0].code,
        details: `Xóa mã ưu đãi: ${rows[0].code}`,
        ipAddress: req.ip,
      });
    });

    res.json({ ok: true });
  })
);
