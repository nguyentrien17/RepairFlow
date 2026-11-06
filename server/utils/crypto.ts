import crypto from 'node:crypto';
import { env } from '../config/env';
import { UserRole } from '../../shared/types';

// =============================================================================
// 1. PASSWORD HASHING (SCRYPT + TIMING-SAFE COMPARE - P0-2)
// =============================================================================
const SCRYPT_PREFIX = 'scrypt$';

export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${SCRYPT_PREFIX}${salt}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;
  if (!storedHash.startsWith(SCRYPT_PREFIX)) {
    // Reject unhashed plaintext passwords (P0-2)
    return false;
  }
  const parts = storedHash.slice(SCRYPT_PREFIX.length).split('$');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64, { N: 16384, r: 8, p: 1 });
  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

export function generateTemporaryPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

// =============================================================================
// 2. AES-256-GCM DEVICE PASSWORD ENCRYPTION (P0-3)
// =============================================================================
const AES_PREFIX = 'AES256GCM:';

function getAes256Key(): Buffer {
  return crypto.createHash('sha256').update(env.DEVICE_SECRET_KEY, 'utf8').digest();
}

export function encryptDevicePassword(plain: string | undefined | null): string | null {
  if (!plain || !plain.trim()) return null;
  const trimmed = plain.trim();
  // If already encrypted with AES-256-GCM, keep as is
  if (trimmed.startsWith(AES_PREFIX)) return trimmed;

  const key = getAes256Key();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${AES_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptDevicePassword(cipherText: string | undefined | null): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith(AES_PREFIX)) {
    return '';
  }
  const payload = cipherText.slice(AES_PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 3) return '';
  const [ivHex, tagHex, encHex] = parts;

  const key = getAes256Key();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

// =============================================================================
// 3. JWT TOKEN SIGNING & VERIFICATION (HMAC-SHA256 - P0-1)
// =============================================================================
/** Session lifetime for the auth JWT and its cookie (7 days) */
export const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface JwtPayload {
  sub: number;
  username: string;
  full_name: string;
  role: UserRole;
  /** users.token_version at issue time; a mismatch means the session was revoked */
  tv: number;
  iat: number;
  exp: number;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

export function signJwt(
  user: { id: number; username: string; full_name: string; role: UserRole; token_version: number },
  expiresInSeconds = AUTH_TOKEN_TTL_SECONDS
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    tv: Number(user.token_version || 0),
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(signingInput)
    .digest();
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSig] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', env.JWT_SECRET).update(signingInput).digest()
    );
    const sigBuf = Buffer.from(encodedSig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    if (header?.alg !== 'HS256') return null;
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    // exp, sub and tv are mandatory: tokens without them (or issued before token_version existed) are rejected
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    if (typeof payload.sub !== 'number' || typeof payload.tv !== 'number') return null;
    return payload;
  } catch {
    return null;
  }
}

// =============================================================================
// 4. WEBHOOK HMAC VERIFICATION & LOG SANITIZATION (P0-3, P0-4)
// =============================================================================
export function verifyWebhookSignature(rawPayload: string, signatureHeader: string | undefined, secret: string): boolean {
  if (!secret) return false;
  if (!signatureHeader) return false;
  const cleanSig = signatureHeader.replace(/^sha256=/i, '').replace(/^Apikey\s+/i, '').trim();

  // Support both HMAC-SHA256 hex digest and direct secret token comparison (SePay Apikey header)
  const hmacHex = crypto.createHmac('sha256', secret).update(rawPayload, 'utf8').digest('hex');
  const sigBuf = Buffer.from(cleanSig);
  const hmacBuf = Buffer.from(hmacHex);
  if (sigBuf.length === hmacBuf.length && crypto.timingSafeEqual(sigBuf, hmacBuf)) {
    return true;
  }
  const secretBuf = Buffer.from(secret);
  if (sigBuf.length === secretBuf.length && crypto.timingSafeEqual(sigBuf, secretBuf)) {
    return true;
  }
  return false;
}

export function sanitizeLogDetails(details: string): string {
  if (!details) return '';
  return details.replace(/(?:mật khẩu|pass|pin|password)[^,.\n]*/gi, '[BẢO MẬT]');
}

