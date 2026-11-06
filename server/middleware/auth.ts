import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { verifyJwt, JwtPayload } from '../utils/crypto';
import { AppError } from '../utils/AppError';
import { db } from '../db/pool';
import { users } from '../db/schema';
import { UserRole } from '../../shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { must_change_password?: boolean };
      rawBody?: string;
    }
  }
}

function parseCookieToken(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [k, ...v] = pair.trim().split('=');
    if (k === 'rf_token') {
      return decodeURIComponent(v.join('='));
    }
  }
  return null;
}

export function extractTokenFromRequest(req: Request): string | null {
  const cookieToken = parseCookieToken(req.headers.cookie);
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

const ALLOWED_WHEN_MUST_CHANGE_PASSWORD = new Set([
  '/api/auth/change-password',
  '/api/auth/logout',
  '/api/auth/me',
]);

/**
 * Middleware: Requires valid JWT authentication AND live DB verification of active status, role & must_change_password (Issue #7)
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) {
      return next(AppError.unauthorized('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'));
    }
    const payload = verifyJwt(token);
    if (!payload) {
      res.setHeader('Set-Cookie', 'rf_token=; Path=/; HttpOnly; Max-Age=0');
      return next(AppError.unauthorized('Token xác thực không hợp lệ hoặc đã hết hạn.'));
    }

    const [dbUser] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!dbUser || !dbUser.is_active) {
      res.setHeader('Set-Cookie', 'rf_token=; Path=/; HttpOnly; Max-Age=0');
      return next(AppError.unauthorized('Tài khoản đã bị khóa hoặc không còn tồn tại.'));
    }

    req.user = {
      ...payload,
      username: dbUser.username,
      full_name: dbUser.full_name,
      role: dbUser.role as UserRole,
      must_change_password: Boolean(dbUser.must_change_password),
    };

    const cleanPath = req.originalUrl.split('?')[0];
    if (dbUser.must_change_password && !ALLOWED_WHEN_MUST_CHANGE_PASSWORD.has(cleanPath)) {
      return next(
        new AppError(
          403,
          'MUST_CHANGE_PASSWORD',
          'Bạn đang sử dụng mật khẩu tạm thời. Vui lòng đổi mật khẩu mới trước khi tiếp tục thao tác!'
        )
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
