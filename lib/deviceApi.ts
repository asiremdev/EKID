import { API_URL } from './config';
import { deviceStorage } from './deviceStorage';

export class DeviceApiError extends Error {
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
};

function buildUrl(path: string): string {
  return `${API_URL}${path}`;
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  const payload = json && 'data' in json ? json.data : json;

  if (!res.ok) {
    const message = json?.message ?? res.statusText;
    throw new DeviceApiError(
      res.status,
      Array.isArray(message) ? message.join(', ') : message,
      json?.error,
    );
  }

  return payload as T;
}

async function rawRequest(path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const method = options.method ?? 'GET';
  const url = buildUrl(path);
  console.log(`[DeviceAPI →] ${method} ${url}`);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    console.log(`[DeviceAPI ←] ${method} ${url} → ${res.status}`);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new DeviceApiError(
      0,
      `Cannot reach the server at ${API_URL}. (${message})`,
      'NetworkError',
    );
  }
}

async function deviceRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await deviceStorage.getToken();
  const res = await rawRequest(path, options, token);
  return parse<T>(res);
}

export interface PairClaimResult {
  deviceToken: string;
  device: { id: string; name: string };
  child: { id: string; name: string; ageGroup: string; stars: number };
  sync: import('./api/protection-types').SyncBundle;
}

export type GameId = 'COLOR_GARDEN' | 'NUMBER_QUEST' | 'WORD_LAB';

export interface GameStateResponse {
  child: { id: string; name: string; ageGroup: string; stars: number };
  game: {
    gameId: GameId;
    title: string;
    subtitle: string;
    worlds?: { id: number; title: string; mechanic: string; blurb: string }[];
    levels: {
      level: number;
      world?: number;
      slot?: number;
      unlocked: boolean;
      completed: boolean;
      starsReward: number;
    }[];
  };
}

export interface GameCompleteResult {
  alreadyCompleted: boolean;
  starsEarned: number;
  starsRemaining: number;
}

export const deviceApi = {
  get: <T>(path: string, auth = true) => deviceRequest<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    deviceRequest<T>(path, { method: 'POST', body, auth }),

  claimPairing(code: string, deviceName?: string) {
    return deviceRequest<PairClaimResult>('/pairing/claim', {
      method: 'POST',
      body: { code, deviceName },
      auth: false,
    });
  },

  sync() {
    return deviceApi.get<import('./api/protection-types').SyncBundle>('/device/sync');
  },

  getGameState() {
    return deviceApi.get<GameStateResponse>('/device/games');
  },

  completeGame(body: { gameId: GameId; level: number; score: number }) {
    return deviceApi.post<GameCompleteResult>('/device/games/complete', body);
  },

  autoUnlock(packageName: string, appLabel?: string) {
    return deviceApi.post<{
      session: { minutesGranted: number; packageName: string; remainingSeconds: number };
      starsRemaining: number;
    }>('/device/protection/auto-unlock', { packageName, appLabel });
  },

  reportInstalledApps(apps: { packageName: string; appLabel?: string }[]) {
    return deviceApi.post<{ count: number }>('/device/apps/report', { apps });
  },
};
