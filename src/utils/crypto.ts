/**
 * P0-3 Security Upgrade:
 * Device password encryption/decryption is now strictly handled on the backend
 * via AES-256-GCM (server/utils/crypto.ts) using DEVICE_SECRET_KEY in .env.
 * No secret key or XOR cipher is shipped in the client JavaScript bundle.
 */

export function encryptPassword(plain: string): string {
  // Pass plaintext over HTTPS to the backend; server encrypts with AES-256-GCM before storing.
  return plain ? plain.trim() : '';
}

export function decryptPassword(cipher: string): string {
  if (!cipher) return '';
  // Server never returns raw encrypted ciphertext to standard endpoints;
  // only decrypted value from GET /api/tickets/:id/device-password is shown to authorized roles.
  if (cipher.startsWith('AES256GCM:') || cipher.startsWith('RF_ENC::')) {
    return '•••••••• (Nhấn để tải từ máy chủ bảo mật)';
  }
  return cipher;
}

export function sanitizeLogDetails(details: string): string {
  return details.replace(/(?:mật khẩu|pass|pin|password)[^,.\n]*/gi, '[BẢO MẬT]');
}
