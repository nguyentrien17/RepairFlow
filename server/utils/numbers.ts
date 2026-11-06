import { AppError } from './AppError';

/**
 * Strict numeric parsing helpers for request bodies.
 * `Math.max(1, Number('abc'))` returns NaN, so every money/quantity field must go through these.
 */

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/** Positive integer (>= 1). Missing -> `fallback`. Invalid -> 400. */
export function parsePositiveInt(value: unknown, field: string, fallback = 1): number {
  if (isMissing(value)) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    throw AppError.badRequest(`Giá trị "${field}" phải là số nguyên lớn hơn hoặc bằng 1.`);
  }
  return n;
}

/** Non-negative integer (>= 0). Missing -> `fallback`. Invalid -> 400. */
export function parseNonNegativeInt(value: unknown, field: string, fallback = 0): number {
  if (isMissing(value)) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw AppError.badRequest(`Giá trị "${field}" phải là số nguyên không âm.`);
  }
  return n;
}

/** Non-negative finite amount (>= 0). Missing -> `fallback`. Invalid -> 400. */
export function parseNonNegativeAmount(value: unknown, field: string, fallback = 0): number {
  if (isMissing(value)) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw AppError.badRequest(`Số tiền "${field}" không hợp lệ (phải là số không âm).`);
  }
  return n;
}

/** Parses booleans sent as true/false, 1/0, "true"/"false", "1"/"0". Missing -> `fallback`. */
export function parseBooleanFlag(value: unknown, fallback: boolean): boolean {
  if (isMissing(value)) return fallback;
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  throw AppError.badRequest(`Giá trị boolean không hợp lệ: ${String(value)}`);
}
