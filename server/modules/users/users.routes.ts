import { Router, Request, Response } from 'express';
import { asc, eq } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { validateBody } from '../../middleware/validate';
import { db } from '../../db/pool';
import { users } from '../../db/schema';
import { hashPassword, generateTemporaryPassword } from '../../utils/crypto';
import { toPublicUser } from '../../utils/mapRow';
import { AppError } from '../../utils/AppError';
import { recordAuditLog } from '../audit/audit.service';

export const usersRouter = Router();

usersRouter.use(requireAuth);

/**
 * GET /api/users (Admin & Manager view full staff list; others get basic public staff profiles - P0-1)
 */
usersRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.select().from(users).orderBy(asc(users.id));
    res.json(rows.map(toPublicUser));
  })
);

/**
 * POST /api/users (Admin only - P0-1, P0-2)
 */
usersRouter.post(
  '/',
  requireRole('admin'),
  validateBody({
    username: { type: 'string', required: true, min: 3, max: 50 },
    full_name: { type: 'string', required: true, min: 2, max: 120 },
    email: { type: 'string', required: true, min: 3, max: 120 },
    phone: { type: 'string', max: 30 },
    role: { type: 'string', required: true, enumValues: ['admin', 'manager', 'receptionist', 'technician'] },
    password: { type: 'string', min: 6, max: 120 },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, full_name, email, phone, role, password } = req.body;
    const cleanUsername = username.toLowerCase();
    const cleanEmail = email.toLowerCase();
    const initialPlainPassword = password || generateTemporaryPassword(10);
    const passwordHash = hashPassword(initialPlainPassword);
    const now = new Date().toISOString();

    const [insertRes] = await db.insert(users).values({
      username: cleanUsername,
      email: cleanEmail,
      full_name,
      phone: phone || '',
      role,
      password_hash: passwordHash,
      must_change_password: 1,
      is_active: 1,
      created_at: now,
    });

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(insertRes.insertId)))
      .limit(1);
    const createdUser = toPublicUser(rows[0]);

    await recordAuditLog(null, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'CREATE_USER',
      entityType: 'users',
      entityId: createdUser.username,
      details: `Tạo tài khoản nhân viên mới: ${createdUser.full_name} (${createdUser.role})`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      user: createdUser,
      temporaryPassword: password ? undefined : initialPlainPassword,
    });
  })
);

/**
 * PUT /api/users/:id (Admin only - protects root admin id=1 and prevents self-demotion/self-lock)
 */
usersRouter.put(
  '/:id',
  requireRole('admin'),
  validateBody(
    {
      full_name: { type: 'string', min: 2, max: 120 },
      email: { type: 'string', min: 3, max: 120 },
      phone: { type: 'string', max: 30 },
      role: { type: 'string', enumValues: ['admin', 'manager', 'receptionist', 'technician'] },
      is_active: { type: 'boolean' },
    },
    true
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (rows.length === 0) throw AppError.notFound('Không tìm thấy nhân viên');

    const current = rows[0];
    const isRootAdmin = current.id === 1 || current.username === 'admin';

    if (isRootAdmin && req.body.is_active === false) {
      throw AppError.badRequest('Không thể khóa tài khoản Quản trị viên gốc!');
    }
    if (isRootAdmin && req.body.role && req.body.role !== 'admin') {
      throw AppError.badRequest('Không thể hạ quyền của tài khoản Quản trị viên gốc!');
    }
    if (current.id === req.user!.sub && req.body.is_active === false) {
      throw AppError.badRequest('Bạn không thể tự khóa tài khoản của chính mình!');
    }
    if (current.id === req.user!.sub && req.body.role && req.body.role !== current.role) {
      throw AppError.badRequest('Bạn không thể tự hạ quyền của chính mình!');
    }

    const nextFullName = req.body.full_name ?? current.full_name;
    const nextEmail = req.body.email ?? current.email;
    const nextPhone = req.body.phone ?? current.phone;
    const nextRole = req.body.role ?? current.role;
    const nextActive = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : current.is_active;

    await db
      .update(users)
      .set({
        full_name: nextFullName,
        email: nextEmail,
        phone: nextPhone,
        role: nextRole,
        is_active: nextActive,
      })
      .where(eq(users.id, id));

    const updatedRows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const updatedUser = toPublicUser(updatedRows[0]);

    await recordAuditLog(null, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'UPDATE_USER',
      entityType: 'users',
      entityId: updatedUser.username,
      details: `Cập nhật tài khoản ${updatedUser.full_name} (Role: ${updatedUser.role}, Active: ${updatedUser.is_active})`,
      ipAddress: req.ip,
    });

    res.json({ user: updatedUser });
  })
);

/**
 * POST /api/users/:id/reset-password (Admin only - server generates temporary password, P0-2)
 */
usersRouter.post(
  '/:id/reset-password',
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (rows.length === 0) throw AppError.notFound('Không tìm thấy nhân viên');

    const target = rows[0];
    const tempPassword = generateTemporaryPassword(10);
    const passwordHash = hashPassword(tempPassword);

    await db
      .update(users)
      .set({ password_hash: passwordHash, must_change_password: 1 })
      .where(eq(users.id, id));

    await recordAuditLog(null, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'RESET_USER_PASSWORD',
      entityType: 'users',
      entityId: target.username,
      details: `Đặt lại mật khẩu tạm thời cho nhân viên ${target.full_name}`,
      ipAddress: req.ip,
    });

    res.json({
      ok: true,
      temporaryPassword: tempPassword,
      message: `Đã cấp mật khẩu tạm thời mới cho ${target.full_name}`,
    });
  })
);
