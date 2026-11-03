/**
 * Utility for secure password handling and obfuscation/encryption.
 * Ensures passwords are not stored in plaintext and never leaked into logs or public views.
 */

const CIPHER_PREFIX = 'RF_ENC::';
const SECRET_SALT = 'RepairFlow_SecretSalt_2026';

export function encryptPassword(plain: string): string {
  if (!plain || !plain.trim()) return '';
  try {
    // Reversible base64 + XOR with salt for safe client-side obfuscation
    const textToChars = (text: string) => text.split('').map((c) => c.charCodeAt(0));
    const byteHex = (n: number) => ('0' + Number(n).toString(16)).substr(-2);
    const applySaltToChar = (code: number, idx: number) =>
      code ^ SECRET_SALT.charCodeAt(idx % SECRET_SALT.length);

    const encrypted = plain
      .split('')
      .map(textToChars)
      .map((item, idx) => applySaltToChar(item[0], idx))
      .map(byteHex)
      .join('');

    return `${CIPHER_PREFIX}${encrypted}`;
  } catch {
    return `${CIPHER_PREFIX}${btoa(encodeURIComponent(plain))}`;
  }
}

export function decryptPassword(cipher: string): string {
  if (!cipher) return '';
  if (!cipher.startsWith(CIPHER_PREFIX)) return cipher; // Backward compatibility with legacy plain data

  try {
    const rawCipher = cipher.slice(CIPHER_PREFIX.length);
    const textToChars = (text: string) => text.split('').map((c) => c.charCodeAt(0));
    const applySaltToChar = (code: number, idx: number) =>
      code ^ SECRET_SALT.charCodeAt(idx % SECRET_SALT.length);

    const matches = rawCipher.match(/.{1,2}/g);
    if (!matches) return '';

    const decrypted = matches
      .map((hex) => parseInt(hex, 16))
      .map((code, idx) => applySaltToChar(code, idx))
      .map((charCode) => String.fromCharCode(charCode))
      .join('');

    return decrypted;
  } catch {
    try {
      return decodeURIComponent(atob(cipher.slice(CIPHER_PREFIX.length)));
    } catch {
      return '***';
    }
  }
}

export function sanitizeLogDetails(details: string): string {
  // Strip any accidental password references from log messages
  return details.replace(/(?:mật khẩu|pass|pin|password)[^,.\n]*/gi, '[BẢO MẬT]');
}
