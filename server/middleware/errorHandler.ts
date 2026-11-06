import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { AppError } from '../utils/AppError';

/**
 * Central Error Handler (P0-5, P2-2)
 * Never leaks raw SQL errors or stack traces to the client.
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const requestId = crypto.randomUUID();

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  // Handle SQL UNIQUE constraint violations -> HTTP 409 Conflict (P2-2)
  const msg = String(err?.message || '');
  if (err?.code === 'ER_DUP_ENTRY' || msg.includes('UNIQUE constraint failed') || msg.includes('Duplicate entry')) {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'Dữ liệu bị trùng lặp (mã, SKU, tên đăng nhập hoặc email đã tồn tại trên hệ thống).',
        requestId,
      },
    });
  }

  // Log full error details only on the server (P0-5)
  console.error(`[Server Error - RequestId: ${requestId}]:`, err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Đã xảy ra lỗi hệ thống phía máy chủ. Vui lòng thử lại sau.',
      requestId,
    },
  });
}

