import { Router, Request, Response } from 'express';
import { and, asc, eq, or, sql } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createRateLimiter } from '../../middleware/rateLimit';
import { db } from '../../db/pool';
import { users } from '../../db/schema';
import { verifyPassword, hashPassword, signJwt } from '../../utils/crypto';
import { toPublicUser } from '../../utils/mapRow';
import { AppError } from '../../utils/AppError';
import { recordAuditLog } from '../audit/audit.service';
import { env } from '../../config/env';

export const authRouter = Router();

// Precomputed dummy scrypt hash to prevent timing attacks when username does not exist
const DUMMY_PASSWORD_HASH = hashPassword('dummy_timing_protection_password_2026');

const loginRateLimiter = createRateLimiter({
  namespace: 'auth_login',
  windowMs: 5 * 60_000,
  max: 15,
  keyGenerator: (req) => `${req.ip || 'unknown'}:${String(req.body?.username || '').trim().toLowerCase()}`,
  message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 5 phút.',
});

/**
 * POST /api/auth/login (P0-1, P0-2)
 * Verifies hashed password BEFORE checking active status to prevent account enumeration,
 * issues JWT in httpOnly cookie.
 */
authRouter.post(
  '/login',
  loginRateLimiter,
  validateBody({
    username: { type: 'string', required: true, min: 2, max: 120 },
    password: { type: 'string', required: true, min: 1, max: 120 },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const cleanInput = String(req.body.username).trim().toLowerCase();
    const password = String(req.body.password);

    const rows = await db
      .select()
      .from(users)
      .where(
        or(
          sql`LOWER(${users.username}) = ${cleanInput}`,
          sql`LOWER(${users.email}) = ${cleanInput}`
        )
      )
      .limit(1);

    const userRow = rows[0];
    if (!userRow) {
      verifyPassword(password, DUMMY_PASSWORD_HASH);
      throw AppError.unauthorized('Tài khoản hoặc mật khẩu không chính xác!');
    }

    // Verify password FIRST before checking is_active so locked status is not leaked to unauthenticated callers
    const isValid = verifyPassword(password, userRow.password_hash);
    if (!isValid) {
      throw AppError.unauthorized('Tài khoản hoặc mật khẩu không chính xác!');
    }

    if (!userRow.is_active) {
      throw AppError.forbidden('Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Quản trị viên!');
    }

    const now = new Date().toISOString();
    await db.update(users).set({ last_login_at: now }).where(eq(users.id, userRow.id));
    userRow.last_login_at = now;

    const publicUser = toPublicUser(userRow);
    const token = signJwt({
      id: publicUser.id,
      username: publicUser.username,
      full_name: publicUser.full_name,
      role: publicUser.role,
    });

    await recordAuditLog(null, {
      userId: publicUser.id,
      userName: publicUser.full_name,
      action: 'LOGIN',
      entityType: 'users',
      entityId: publicUser.username,
      details: `Người dùng ${publicUser.full_name} (${publicUser.role}) đăng nhập thành công`,
      ipAddress: req.ip,
    });

    const secureFlag = env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `rf_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secureFlag}`
    );

    res.json({
      user: publicUser,
    });
  })
);

/**
 * GET /api/auth/me
 */
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.sub))
      .limit(1);
    if (rows.length === 0 || !rows[0].is_active) {
      throw AppError.unauthorized('Tài khoản không tồn tại hoặc đã bị khóa');
    }
    res.json({ user: toPublicUser(rows[0]) });
  })
);

/**
 * POST /api/auth/logout
 */
authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await recordAuditLog(null, {
      userId: req.user!.sub,
      userName: req.user!.full_name,
      action: 'LOGOUT',
      entityType: 'users',
      entityId: req.user!.username,
      details: `Người dùng ${req.user!.full_name} đã đăng xuất`,
      ipAddress: req.ip,
    });
    res.setHeader('Set-Cookie', 'rf_token=; Path=/; HttpOnly; Max-Age=0');
    res.json({ ok: true });
  })
);

/**
 * POST /api/auth/change-password (P0-2)
 */
authRouter.post(
  '/change-password',
  requireAuth,
  validateBody({
    oldPassword: { type: 'string', required: true, min: 1, max: 120 },
    newPassword: { type: 'string', required: true, min: 6, max: 120 },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.sub))
      .limit(1);
    if (rows.length === 0) {
      throw AppError.notFound('Không tìm thấy tài khoản');
    }
    const userRow = rows[0];
    if (!verifyPassword(oldPassword, userRow.password_hash)) {
      throw AppError.badRequest('Mật khẩu hiện tại không đúng!');
    }

    const newHash = hashPassword(newPassword);
    await db
      .update(users)
      .set({ password_hash: newHash, must_change_password: 0 })
      .where(eq(users.id, userRow.id));

    await recordAuditLog(null, {
      userId: userRow.id,
      userName: userRow.full_name,
      action: 'CHANGE_PASSWORD',
      entityType: 'users',
      entityId: userRow.username,
      details: 'Đổi mật khẩu tài khoản thành công',
      ipAddress: req.ip,
    });

    res.json({ ok: true, message: 'Đổi mật khẩu thành công!' });
  })
);

/**
 * PUT /api/auth/profile (Self profile update whitelist - cannot escalate role)
 */
authRouter.put(
  '/profile',
  requireAuth,
  validateBody(
    {
      full_name: { type: 'string', min: 2, max: 120 },
      phone: { type: 'string', max: 30 },
      email: { type: 'string', min: 3, max: 120 },
      avatar_url: { type: 'string', max: 500, nullable: true },
    },
    true
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.sub))
      .limit(1);
    if (rows.length === 0) throw AppError.notFound('Không tìm thấy người dùng');

    const current = rows[0];
    const nextFullName = req.body.full_name ?? current.full_name;
    const nextPhone = req.body.phone ?? current.phone;
    const nextEmail = req.body.email ?? current.email;
    const nextAvatar = req.body.avatar_url !== undefined ? req.body.avatar_url : current.avatar_url;

    await db
      .update(users)
      .set({
        full_name: nextFullName,
        phone: nextPhone,
        email: nextEmail,
        avatar_url: nextAvatar,
      })
      .where(eq(users.id, current.id));

    const updatedRows = await db
      .select()
      .from(users)
      .where(eq(users.id, current.id))
      .limit(1);
    const publicUser = toPublicUser(updatedRows[0]);

    await recordAuditLog(null, {
      userId: publicUser.id,
      userName: publicUser.full_name,
      action: 'UPDATE_PROFILE',
      entityType: 'users',
      entityId: publicUser.username,
      details: `Cập nhật thông tin cá nhân: ${publicUser.full_name}`,
      ipAddress: req.ip,
    });

    res.json({ user: publicUser });
  })
);

/**
 * POST /api/auth/dev-switch-role
 * Strictly gated behind BOTH authenticated session AND env.ENABLE_DEV_TOOLS === true (Issue #1)
 */
authRouter.post(
  '/dev-switch-role',
  requireAuth,
  validateBody({
    role: { type: 'string', required: true, enumValues: ['admin', 'manager', 'receptionist', 'technician'] },
  }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!env.ENABLE_DEV_TOOLS) {
      throw AppError.forbidden('Chức năng chuyển nhanh vai trò kiểm thử đã bị vô hiệu hóa.');
    }
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.role, req.body.role), eq(users.is_active, 1)))
      .orderBy(asc(users.id))
      .limit(1);
    if (rows.length === 0) {
      throw AppError.notFound('Không tìm thấy tài khoản mẫu cho vai trò này');
    }
    const publicUser = toPublicUser(rows[0]);
    const token = signJwt({
      id: publicUser.id,
      username: publicUser.username,
      full_name: publicUser.full_name,
      role: publicUser.role,
    });
    res.setHeader('Set-Cookie', `rf_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`);
    res.json({ user: publicUser });
  })
);
