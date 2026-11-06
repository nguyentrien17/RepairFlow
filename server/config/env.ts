import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  ENABLE_DEV_TOOLS: boolean;
  PORT: number;
  APP_URL: string;
  DB_CLIENT: 'mysql';
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  JWT_SECRET: string;
  DEVICE_SECRET_KEY: string;
  /** Value passed to Express `trust proxy`: false (direct), hop count, or 'loopback' / IP / CIDR list */
  TRUST_PROXY: false | number | string;
}

/**
 * Parses TRUST_PROXY. Default is `false` (app is reached directly) so clients cannot spoof
 * X-Forwarded-For to bypass IP rate limits or forge audit-log IPs.
 * - "false" / "0" / empty   -> false
 * - "1", "2", ...           -> number of trusted reverse-proxy hops (e.g. 1 = Nginx in front)
 * - "loopback", "10.0.0.0/8, 172.16.0.5", "uniquelocal" -> trusted proxy addresses
 * - "true" is rejected: it trusts every hop, letting any client choose its own IP.
 */
export function parseTrustProxy(raw: string | undefined): false | number | string {
  const value = (raw ?? '').trim();
  if (!value || /^(false|0|no|off)$/i.test(value)) return false;
  if (/^true$/i.test(value)) {
    throw new Error(
      '[Config Error] TRUST_PROXY="true" tin mọi proxy và cho phép client giả mạo IP. Hãy dùng số hop (vd: "1") hoặc địa chỉ proxy (vd: "loopback", "10.0.0.0/8").'
    );
  }
  if (/^\d+$/.test(value)) return Number(value);
  if (!/^[\w.:/,\s-]+$/.test(value)) {
    throw new Error(`[Config Error] TRUST_PROXY không hợp lệ: "${value}"`);
  }
  return value;
}

const EXAMPLE_PLACEHOLDER_SECRETS = new Set([
  'CHANGE_ME_JWT_SECRET_MIN_32_CHARS',
  'CHANGE_ME_32_BYTES_AES256GCM_KEY!',
  'repairflow_jwt_super_secret_key_2026_production_ready',
  'repairflow_aes256gcm_device_key!',
]);

export function parseEnvConfig(rawEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  // Default to 'production' if NODE_ENV is omitted so production is safe by default (Issue #1)
  const rawNodeEnv = (rawEnv.NODE_ENV || 'production').trim().toLowerCase();
  const nodeEnv: EnvConfig['NODE_ENV'] =
    rawNodeEnv === 'development' || rawNodeEnv === 'test' ? rawNodeEnv : 'production';

  // Dev tools (role switcher, /api/reset, auto dev seed) require BOTH non-production AND explicit ENABLE_DEV_TOOLS=true
  const enableDevTools = nodeEnv !== 'production' && rawEnv.ENABLE_DEV_TOOLS === 'true';

  const jwtSecret = (rawEnv.JWT_SECRET || '').trim();
  if (!jwtSecret || jwtSecret.length < 16) {
    throw new Error('[Config Error] Thiếu biến môi trường JWT_SECRET hoặc độ dài < 16 ký tự trong .env');
  }
  if (EXAMPLE_PLACEHOLDER_SECRETS.has(jwtSecret)) {
    throw new Error(
      '[Config Error] JWT_SECRET đang trùng với giá trị mẫu trong .env.example. Vui lòng đặt khóa bí mật riêng!'
    );
  }

  const deviceSecretKey = (rawEnv.DEVICE_SECRET_KEY || '').trim();
  if (!deviceSecretKey || Buffer.byteLength(deviceSecretKey, 'utf8') < 32) {
    throw new Error(
      '[Config Error] DEVICE_SECRET_KEY trong .env bắt buộc phải có độ dài tối thiểu 32 bytes cho AES-256-GCM'
    );
  }
  if (EXAMPLE_PLACEHOLDER_SECRETS.has(deviceSecretKey)) {
    throw new Error(
      '[Config Error] DEVICE_SECRET_KEY đang trùng với giá trị mẫu trong .env.example. Vui lòng đặt khóa bí mật riêng!'
    );
  }

  const appUrl = rawEnv.APP_URL || 'http://192.168.48.228:5173';
  const dbHost = rawEnv.DB_HOST || '127.0.0.1';
  const dbName = rawEnv.DB_NAME || 'repairflow';

  if (!dbHost || !dbName) {
    throw new Error('[Config Error] Bắt buộc phải cấu hình DB_HOST và DB_NAME cho MySQL trong .env');
  }

  return {
    NODE_ENV: nodeEnv,
    ENABLE_DEV_TOOLS: enableDevTools,
    PORT: Number(rawEnv.PORT || 3000),
    APP_URL: appUrl,
    DB_CLIENT: 'mysql',
    DB_HOST: dbHost,
    DB_PORT: Number(rawEnv.DB_PORT || 3306),
    DB_USER: rawEnv.DB_USER || 'root',
    DB_PASSWORD: rawEnv.DB_PASSWORD || '',
    DB_NAME: dbName,
    JWT_SECRET: jwtSecret,
    DEVICE_SECRET_KEY: deviceSecretKey,
    TRUST_PROXY: parseTrustProxy(rawEnv.TRUST_PROXY),
  };
}

export const env = parseEnvConfig();
