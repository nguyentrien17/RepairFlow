import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { validateBody } from '../../middleware/validate';
import { db } from '../../db/pool';
import { storeSettings } from '../../db/schema';
import { toPublicSettings } from '../../utils/mapRow';
import { recordAuditLog } from '../audit/audit.service';

export const settingsRouter = Router();

/**
 * GET /api/settings (Queries only store_settings table via Drizzle ORM, strips secret keys - P0-1, P2-7)
 */
settingsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
    res.json(toPublicSettings(rows[0]));
  })
);

/**
 * PUT /api/settings (Admin & Manager only - P0-1, P2-3)
 */
settingsRouter.put(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  validateBody(
    {
      store_name: { type: 'string', required: true, min: 2, max: 255 },
      store_slogan: { type: 'string', max: 255 },
      phone: { type: 'string', required: true, min: 3, max: 100 },
      email: { type: 'string', max: 150 },
      address: { type: 'string', required: true, min: 3, max: 500 },
      tax_number: { type: 'string', max: 50 },
      bank_name: { type: 'string', max: 150 },
      bank_account_no: { type: 'string', max: 50 },
      bank_account_name: { type: 'string', max: 150 },
      ticket_prefix: { type: 'string', min: 1, max: 10 },
      default_warranty_days: { type: 'number', min: 0, max: 1825 },
      default_return_days: { type: 'number', min: 0, max: 365 },
      terms_intake: { type: 'string', max: 5000 },
      terms_warranty: { type: 'string', max: 5000 },
      auto_payment_enabled: { type: 'boolean' },
      payment_gateway_provider: {
        type: 'string',
        enumValues: ['sepay', 'payos', 'casso', 'vnpay_pos', 'direct_bank'],
      },
      gateway_api_key: { type: 'string', max: 255 },
      gateway_webhook_secret: { type: 'string', max: 255 },
      pos_terminal_id: { type: 'string', max: 100 },
      pos_ip_address: { type: 'string', max: 100 },
    },
    true
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const currentRows = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
    const current = currentRows[0] || ({} as any);
    const s = { ...current, ...req.body };

    await db
      .update(storeSettings)
      .set({
        store_name: s.store_name,
        store_slogan: s.store_slogan || '',
        phone: s.phone,
        email: s.email || '',
        address: s.address,
        tax_number: s.tax_number || '',
        bank_name: s.bank_name || '',
        bank_account_no: s.bank_account_no || '',
        bank_account_name: s.bank_account_name || '',
        ticket_prefix: (s.ticket_prefix || 'SC').toUpperCase(),
        default_warranty_days: Number(s.default_warranty_days ?? 90),
        default_return_days: Number(s.default_return_days ?? 15),
        terms_intake: s.terms_intake || '',
        terms_warranty: s.terms_warranty || '',
        auto_payment_enabled: s.auto_payment_enabled ? 1 : 0,
        payment_gateway_provider: s.payment_gateway_provider || 'sepay',
        gateway_api_key: s.gateway_api_key || current.gateway_api_key || '',
        gateway_webhook_secret: s.gateway_webhook_secret || current.gateway_webhook_secret || '',
        pos_terminal_id: s.pos_terminal_id || '',
        pos_ip_address: s.pos_ip_address || '',
      })
      .where(eq(storeSettings.id, 1));

    await recordAuditLog(null, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'UPDATE_SETTINGS',
      entityType: 'store_settings',
      entityId: '1',
      details: `Cập nhật cấu hình cửa hàng: ${s.store_name}`,
      ipAddress: req.ip,
    });

    const updated = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
    res.json({ ok: true, settings: toPublicSettings(updated[0]) });
  })
);
