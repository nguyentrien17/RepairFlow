export interface SqlBackendStatus {
  connected: boolean;
  engine: 'mysql' | 'offline';
  isMySQL: boolean;
  host?: string;
  port?: number;
  database?: string;
  lastError?: string | null;
}

export class ApiError extends Error {
  status: number;
  code: string;
  requestId?: string;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

const API_BASE = '/api';
const LEGACY_TOKEN_STORAGE_KEY = 'repairflow_auth_token';

// Clean up any legacy JWT tokens stored in web storage so authentication relies strictly on httpOnly cookies
if (typeof window !== 'undefined') {
  try {
    sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
}

let currentStatus: SqlBackendStatus = {
  connected: false,
  engine: 'offline',
  isMySQL: false,
};

export const ApiClient = {
  getStatus(): SqlBackendStatus {
    return currentStatus;
  },

  /**
   * Strict request that throws ApiError on HTTP 4xx/5xx.
   * Authentication is handled via httpOnly cookie (credentials: 'include').
   */
  async requestStrict<T = any>(path: string, options?: RequestInit): Promise<T> {
    const { headers: customHeaders, ...restOptions } = options || {};

    const res = await fetch(`${API_BASE}${path}`, {
      ...restOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(customHeaders || {}),
      },
    });

    if (!res.ok) {
      let errPayload: any = null;
      try {
        errPayload = await res.json();
      } catch {
        // Ignore JSON parse error
      }

      const code = errPayload?.error?.code || `HTTP_${res.status}`;
      const message =
        errPayload?.error?.message ||
        errPayload?.message ||
        `Yêu cầu thất bại (HTTP ${res.status})`;
      const requestId = errPayload?.error?.requestId;

      if (res.status === 401 && !path.startsWith('/auth/login')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('repairflow_unauthorized'));
        }
      } else if (res.status === 403 && code === 'MUST_CHANGE_PASSWORD') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('repairflow_must_change_password', { detail: { message } }));
        }
      }

      throw new ApiError(res.status, code, message, requestId);
    }

    currentStatus = {
      ...currentStatus,
      connected: true,
      engine: 'mysql',
      isMySQL: true,
    };

    return (await res.json()) as T;
  },

  /**
   * Request wrapper that logs and dispatches toast event on error
   */
  async request<T = any>(path: string, options?: RequestInit): Promise<T | null> {
    if (typeof window === 'undefined') return null;
    try {
      return await this.requestStrict<T>(path, options);
    } catch (err: any) {
      if (err instanceof ApiError) {
        console.warn(`[ApiClient] HTTP ${err.status} (${err.code}) on ${path}: ${err.message}`);
        if (err.status >= 400 && err.status !== 401 && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('repairflow_api_error', {
              detail: { status: err.status, code: err.code, message: err.message, path },
            })
          );
        }
      } else {
        console.warn(`[ApiClient] Network error on ${path}:`, err);
      }
      return null;
    }
  },

  post<T = any>(path: string, body: any): Promise<T | null> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put<T = any>(path: string, body: any): Promise<T | null> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete<T = any>(path: string): Promise<T | null> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  },

  async reconnectMySQL(): Promise<SqlBackendStatus> {
    const res = await this.post<any>('/health/reconnect-mysql', {});
    if (res) {
      this.setStatus(res);
    }
    return this.getStatus();
  },

  setStatus(dbStatus: any) {
    if (dbStatus) {
      currentStatus = {
        connected: Boolean(dbStatus.connected ?? true),
        engine: 'mysql',
        isMySQL: true,
        host: dbStatus.host,
        port: dbStatus.port,
        database: dbStatus.database,
        lastError: dbStatus.lastError,
      };
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('repairflow_db_status', { detail: currentStatus }));
      }
    }
  },
};
