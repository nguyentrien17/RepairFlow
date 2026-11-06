import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../shared/types';
import { AppError } from '../utils/AppError';

/**
 * Middleware: Role-Based Access Control (RBAC Matrix - P0-1)
 * Admin always has full access; other roles must be listed in allowedRoles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (req.user.role === 'admin') {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Vai trò [${req.user.role}] không có quyền thực hiện thao tác này. Yêu cầu: [${allowedRoles.join(', ')}]`
        )
      );
    }
    next();
  };
}

