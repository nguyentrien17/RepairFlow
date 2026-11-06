import { Router, Request, Response } from 'express';
import { asc, desc, eq, like, or } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { validateBody } from '../../middleware/validate';
import { db, withTransaction } from '../../db/pool';
import { customers, customerDevices, deviceCategories, deviceBrands } from '../../db/schema';
import { nextSequenceCode } from '../../utils/codeGenerator';
import { mapCustomerRow, mapDeviceRow, mapCategoryRow, mapBrandRow } from '../../utils/mapRow';
import { AppError } from '../../utils/AppError';
import { recordAuditLog } from '../audit/audit.service';

export const customersRouter = Router();

customersRouter.use(requireAuth);

/**
 * GET /api/customers (Queries only customers table via Drizzle ORM - P2-7)
 */
customersRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q) {
      const pattern = `%${q}%`;
      const rows = await db
        .select()
        .from(customers)
        .where(
          or(
            like(customers.name, pattern),
            like(customers.phone, pattern),
            like(customers.code, pattern)
          )
        )
        .orderBy(desc(customers.id));
      return res.json(rows.map(mapCustomerRow));
    }
    const rows = await db.select().from(customers).orderBy(desc(customers.id));
    res.json(rows.map(mapCustomerRow));
  })
);

/**
 * POST /api/customers (Generates KH-XXXXXX on server via code_sequences - P1-2)
 */
customersRouter.post(
  '/',
  requireRole('admin', 'manager', 'receptionist'),
  validateBody({
    name: { type: 'string', required: true, min: 2, max: 200 },
    phone: { type: 'string', required: true, min: 6, max: 30 },
    email: { type: 'string', max: 120, nullable: true },
    address: { type: 'string', max: 500, nullable: true },
    customer_type: { type: 'string', enumValues: ['individual', 'company'] },
    tax_number: { type: 'string', max: 50, nullable: true },
    notes: { type: 'string', max: 2000, nullable: true },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, email, address, customer_type, tax_number, notes } = req.body;
    const now = new Date().toISOString();

    const created = await withTransaction(async (tx) => {
      const code = await nextSequenceCode(tx, 'KH', 6, false);
      const [insertRes] = await tx.insert(customers).values({
        code,
        name,
        phone,
        email: email || null,
        address: address || null,
        customer_type: customer_type || 'individual',
        tax_number: tax_number || null,
        current_debt: 0,
        notes: notes || null,
        created_at: now,
      });

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'CREATE_CUSTOMER',
        entityType: 'customers',
        entityId: code,
        details: `Thêm khách hàng mới: ${name} (${phone})`,
        ipAddress: req.ip,
      });

      const rows = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, Number(insertRes.insertId)))
        .limit(1);
      return mapCustomerRow(rows[0]);
    });

    res.status(201).json({ ok: true, customer: created });
  })
);

/**
 * PUT /api/customers/:id (Whitelist fields; current_debt is computed by server payments/orders - P1-3, P2-3)
 */
customersRouter.put(
  '/:id',
  requireRole('admin', 'manager', 'receptionist'),
  validateBody(
    {
      name: { type: 'string', min: 2, max: 200 },
      phone: { type: 'string', min: 6, max: 30 },
      email: { type: 'string', max: 120, nullable: true },
      address: { type: 'string', max: 500, nullable: true },
      customer_type: { type: 'string', enumValues: ['individual', 'company'] },
      tax_number: { type: 'string', max: 50, nullable: true },
      notes: { type: 'string', max: 2000, nullable: true },
    },
    true
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (rows.length === 0) throw AppError.notFound('Không tìm thấy khách hàng');

    const current = rows[0];
    const merged = { ...current, ...req.body };

    await withTransaction(async (tx) => {
      await tx
        .update(customers)
        .set({
          name: merged.name,
          phone: merged.phone,
          email: merged.email || null,
          address: merged.address || null,
          customer_type: merged.customer_type || 'individual',
          tax_number: merged.tax_number || null,
          notes: merged.notes || null,
        })
        .where(eq(customers.id, id));
    });

    const updatedRows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    res.json({ ok: true, customer: mapCustomerRow(updatedRows[0]) });
  })
);

// =============================================================================
// DEVICES, CATEGORIES & BRANDS ROUTES
// =============================================================================
export const devicesRouter = Router();
devicesRouter.use(requireAuth);

devicesRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.select().from(customerDevices).orderBy(desc(customerDevices.id));
    res.json(rows.map(mapDeviceRow));
  })
);

devicesRouter.post(
  '/',
  requireRole('admin', 'manager', 'receptionist', 'technician'),
  validateBody({
    customer_id: { type: 'number', required: true, min: 1 },
    customer_name: { type: 'string', max: 200, nullable: true },
    customer_phone: { type: 'string', max: 30, nullable: true },
    category_id: { type: 'number', required: true, min: 1 },
    category_name: { type: 'string', max: 120, nullable: true },
    brand_id: { type: 'number', required: true, min: 1 },
    brand_name: { type: 'string', max: 100, nullable: true },
    model_name: { type: 'string', required: true, min: 1, max: 255 },
    serial_number: { type: 'string', max: 100, nullable: true },
    imei: { type: 'string', max: 100, nullable: true },
    color: { type: 'string', max: 100, nullable: true },
    notes: { type: 'string', max: 2000, nullable: true },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const d = req.body;
    const now = new Date().toISOString();

    const created = await withTransaction(async (tx) => {
      const [insertRes] = await tx.insert(customerDevices).values({
        customer_id: d.customer_id,
        customer_name: d.customer_name || null,
        customer_phone: d.customer_phone || null,
        category_id: d.category_id,
        category_name: d.category_name || null,
        brand_id: d.brand_id,
        brand_name: d.brand_name || null,
        model_name: d.model_name,
        serial_number: d.serial_number || null,
        imei: d.imei || null,
        color: d.color || null,
        notes: d.notes || null,
        created_at: now,
      });

      const rows = await tx
        .select()
        .from(customerDevices)
        .where(eq(customerDevices.id, Number(insertRes.insertId)))
        .limit(1);
      return mapDeviceRow(rows[0]);
    });

    res.status(201).json({ ok: true, device: created });
  })
);

export const catalogRouter = Router();
catalogRouter.use(requireAuth);

catalogRouter.get(
  '/categories',
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.select().from(deviceCategories).orderBy(asc(deviceCategories.id));
    res.json(rows.map(mapCategoryRow));
  })
);

catalogRouter.get(
  '/brands',
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.select().from(deviceBrands).orderBy(asc(deviceBrands.id));
    res.json(rows.map(mapBrandRow));
  })
);
