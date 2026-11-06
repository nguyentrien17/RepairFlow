import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired rate-limit entries every 60s so Map never leaks memory
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (now > entry.resetAt) {
      buckets.delete(key);
    }
  }
}, 60_000);
cleanupTimer.unref?.();

export interface RateLimitOptions {
  namespace: string;
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    namespace,
    windowMs,
    max,
    keyGenerator = (req) => req.ip || req.socket.remoteAddress || 'unknown',
    message = 'Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
  } = options;

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${namespace}:${keyGenerator(req)}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > max) {
      next(new AppError(429, 'TOO_MANY_REQUESTS', message));
      return;
    }

    next();
  };
}

