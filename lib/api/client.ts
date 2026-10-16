import { API_URL } from '../config';
import { tokenStorage } from '../storage';

export class ApiError extends Error {
  statusCode: number;
  errorType: string;
  constructor(statusCode: number, message: string, errorType = 'Error') {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
};

let refreshPromise: Promise<boolean> | null = null;
let onUnauthorized: (() => void) | null = null;

/** Allows the auth store to react when the session is irrecoverably lost. */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  let url = `${API_URL}${path}`;
  if (query) {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
    if (parts.length) url += `?${parts.join('&')}`;
  }
  return url;
}

/** Extract the refresh_token value from a Set-Cookie header (web only — RN cannot read this). */
function extractRefreshCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = /refresh_token=([^;]+)/.exec(setCookie);
  return match ? decodeURIComponent(match[1]) : null;
}

type TokenPayload = { accessToken?: string; refreshToken?: string };

async function persistTokensFromPayload(payload: TokenPayload | null | undefined) {
  if (!payload) return;
  const access = payload.accessToken;
  const refresh = payload.refreshToken;
  if (!access && !refresh) return;

  await tokenStorage.set(
    access ?? (await tokenStorage.getAccess()),
    refresh ?? (await tokenStorage.getRefresh()),
  );
}

async function rawRequest(path: string, options: RequestOptions, accessToken: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const method = options.method ?? 'GET';
  const url = buildUrl(path, options.query);
  console.log(`[API →] ${method} ${url}`);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    console.log(`[API ←] ${method} ${url} → ${res.status}`);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    console.warn(`[API ✗] ${method} ${url} — ${message}`);
    throw new ApiError(
      0,
      `Cannot reach the server at ${API_URL}. Is the backend running and reachable from this device? (${message})`,
      'NetworkError',
    );
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  const payload = json && 'data' in json ? json.data : json;

  // React Native cannot read Set-Cookie — persist tokens from JSON body when present.
  if (res.ok && payload && typeof payload === 'object') {
    await persistTokensFromPayload(payload as TokenPayload);
  }

  // Web fallback: capture rotated refresh token from Set-Cookie.
  const cookieRefresh = extractRefreshCookie(res.headers.get('set-cookie'));
  if (cookieRefresh) {
    await tokenStorage.set(await tokenStorage.getAccess(), cookieRefresh);
  }

  if (!res.ok) {
    const message = json?.message ?? res.statusText;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message, json?.error);
  }

  return payload as T;
}

/** Exchange stored refresh token for a new access token pair. */
export async function refreshSession(): Promise<boolean> {
  return tryRefresh();
}

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshToken = await tokenStorage.getRefresh();
      if (!refreshToken) return false;
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      const payload = (json?.data ?? json) as TokenPayload | null;
      const newAccess = payload?.accessToken;
      const newRefresh = payload?.refreshToken ?? extractRefreshCookie(res.headers.get('set-cookie'));
      if (!newAccess) return false;
      await tokenStorage.set(newAccess, newRefresh ?? refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const accessToken = await tokenStorage.getAccess();
  let res = await rawRequest(path, options, accessToken);

  if (res.status === 401 && options.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawRequest(path, options, await tokenStorage.getAccess());
    } else {
      await tokenStorage.clear();
      onUnauthorized?.();
      throw new ApiError(401, 'Session expired', 'Unauthorized');
    }
  }

  return parse<T>(res);
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], auth = true) =>
    apiRequest<T>(path, { method: 'GET', query, auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PATCH', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PUT', body, auth }),
  del: <T>(path: string, auth = true) => apiRequest<T>(path, { method: 'DELETE', auth }),
};
