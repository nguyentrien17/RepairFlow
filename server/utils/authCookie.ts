import { Response } from 'express';
import { env } from '../config/env';
import { AUTH_TOKEN_TTL_SECONDS } from './crypto';

export const AUTH_COOKIE_NAME = 'rf_token';

/**
 * Single source of truth for the auth cookie attributes so every issue/clear uses
 * HttpOnly + SameSite=Lax (+ Secure when COOKIE_SECURE) and the same lifetime.
 */
function cookieAttributes(maxAgeSeconds: number): string {
  const parts = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  if (env.COOKIE_SECURE) parts.push('Secure');
  return parts.join('; ');
}

export function setAuthCookie(res: Response, token: string): void {
  res.setHeader('Set-Cookie', `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes(AUTH_TOKEN_TTL_SECONDS)}`);
}

export function clearAuthCookie(res: Response): void {
  res.setHeader('Set-Cookie', `${AUTH_COOKIE_NAME}=; ${cookieAttributes(0)}`);
}
