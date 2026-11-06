import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export type FieldRule = {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  enumValues?: readonly string[];
  nullable?: boolean;
};

export type ObjectSchema = Record<string, FieldRule>;

export function parseStrictBoolean(rawVal: unknown): { valid: boolean; value?: boolean } {
  if (typeof rawVal === 'boolean') return { valid: true, value: rawVal };
  if (rawVal === 1 || rawVal === '1' || rawVal === 'true') return { valid: true, value: true };
  if (rawVal === 0 || rawVal === '0' || rawVal === 'false') return { valid: true, value: false };
  return { valid: false };
}

/**
 * Whitelist validator & sanitizer for request body (P2-3)
 * Rejects invalid types and strips unknown fields not in the schema whitelist.
 */
export function validateBody(schema: ObjectSchema, allowPartial = false) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return next(AppError.badRequest('Dữ liệu gửi lên (body) phải là một đối tượng JSON hợp lệ.'));
    }

    const sanitized: Record<string, any> = {};
    const errors: string[] = [];

    for (const [key, rule] of Object.entries(schema)) {
      const rawVal = req.body[key];

      if (rawVal === undefined || rawVal === null || rawVal === '') {
        if (rule.required && !allowPartial) {
          errors.push(`Trường "${key}" là bắt buộc`);
        } else if (rawVal === null && rule.nullable) {
          sanitized[key] = null;
        } else if (rawVal !== undefined && rule.type === 'string') {
          sanitized[key] = '';
        }
        continue;
      }

      if (rule.type === 'string') {
        if (typeof rawVal !== 'string') {
          errors.push(`Trường "${key}" phải là chuỗi ký tự`);
          continue;
        }
        const trimmed = rawVal.trim();
        if (rule.min !== undefined && trimmed.length < rule.min) {
          errors.push(`Trường "${key}" phải có ít nhất ${rule.min} ký tự`);
        }
        if (rule.max !== undefined && trimmed.length > rule.max) {
          errors.push(`Trường "${key}" không được vượt quá ${rule.max} ký tự`);
        }
        if (rule.enumValues && !rule.enumValues.includes(trimmed)) {
          errors.push(`Trường "${key}" chỉ chấp nhận một trong các giá trị: ${rule.enumValues.join(', ')}`);
        }
        sanitized[key] = trimmed;
      } else if (rule.type === 'number') {
        if (typeof rawVal === 'boolean') {
          errors.push(`Trường "${key}" phải là số hợp lệ`);
          continue;
        }
        const num = Number(rawVal);
        if (Number.isNaN(num) || !Number.isFinite(num)) {
          errors.push(`Trường "${key}" phải là số hợp lệ`);
          continue;
        }
        if (rule.min !== undefined && num < rule.min) {
          errors.push(`Trường "${key}" phải >= ${rule.min}`);
        }
        if (rule.max !== undefined && num > rule.max) {
          errors.push(`Trường "${key}" phải <= ${rule.max}`);
        }
        sanitized[key] = num;
      } else if (rule.type === 'boolean') {
        const parsed = parseStrictBoolean(rawVal);
        if (!parsed.valid) {
          errors.push(`Trường "${key}" phải là kiểu boolean (true/false)`);
          continue;
        }
        sanitized[key] = parsed.value;
      } else if (rule.type === 'array') {
        if (!Array.isArray(rawVal)) {
          errors.push(`Trường "${key}" phải là danh sách (mảng)`);
          continue;
        }
        if (rule.min !== undefined && rawVal.length < rule.min) {
          errors.push(`Danh sách "${key}" phải có ít nhất ${rule.min} phần tử`);
        }
        sanitized[key] = rawVal;
      } else if (rule.type === 'object') {
        if (typeof rawVal !== 'object') {
          errors.push(`Trường "${key}" phải là object`);
          continue;
        }
        sanitized[key] = rawVal;
      }
    }

    if (errors.length > 0) {
      return next(AppError.badRequest(errors.join('; '), 'VALIDATION_ERROR', errors));
    }

    req.body = sanitized;
    next();
  };
}
