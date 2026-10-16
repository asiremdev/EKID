import { create } from 'zustand';
import { api, refreshSession, setUnauthorizedHandler, ApiError } from '../lib/api/client';
import { AuthResult, AuthUser } from '../lib/api/types';
import { authStorage, tokenStorage } from '../lib/storage';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  register: (input: { email: string; password: string; name: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

async function persistSession(result: AuthResult) {
  await tokenStorage.set(
    result.accessToken,
    result.refreshToken ?? (await tokenStorage.getRefresh()),
  );
  await authStorage.setUser(result.user);
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  hydrate: async () => {
    const access = await tokenStorage.getAccess();
    const refresh = await tokenStorage.getRefresh();

    if (!access && !refresh) {
      set({ status: 'guest', user: null });
      return;
    }

    try {
      const user = await api.get<AuthUser>('/auth/me');
      await authStorage.setUser(user);
      set({ status: 'authed', user });
      return;
    } catch (e) {
      // Offline or transient failure — keep the saved session.
      if (e instanceof ApiError && e.errorType === 'NetworkError') {
        const cachedUser = await authStorage.getUser();
        if (cachedUser) {
          set({ status: 'authed', user: cachedUser });
          return;
        }
      }

      // Access token expired — try refresh explicitly before logging out.
      if (refresh) {
        const refreshed = await refreshSession();
        if (refreshed) {
          try {
            const user = await api.get<AuthUser>('/auth/me');
            await authStorage.setUser(user);
            set({ status: 'authed', user });
            return;
          } catch (retryErr) {
            if (retryErr instanceof ApiError && retryErr.errorType === 'NetworkError') {
              const cachedUser = await authStorage.getUser();
              if (cachedUser) {
                set({ status: 'authed', user: cachedUser });
                return;
              }
            }
          }
        }
      }

      await tokenStorage.clear();
      await authStorage.setUser(null);
      set({ status: 'guest', user: null });
    }
  },

  register: async (input) => {
    const result = await api.post<AuthResult>('/auth/register', input, false);
    await persistSession(result);
    set({ status: 'authed', user: result.user });
  },

  login: async (input) => {
    const result = await api.post<AuthResult>('/auth/login', input, false);
    await persistSession(result);
    set({ status: 'authed', user: result.user });
  },

  logout: async () => {
    try {
      const refreshToken = await tokenStorage.getRefresh();
      await api.post('/auth/logout', { refreshToken }, false);
    } catch {
      // ignore — logout is best-effort
    }
    await tokenStorage.clear();
    await authStorage.setUser(null);
    set({ status: 'guest', user: null });
  },

  setUser: (user) => set({ user, status: user ? 'authed' : 'guest' }),
}));

// When the API client gives up refreshing, drop to guest state.
setUnauthorizedHandler(() => {
  void authStorage.setUser(null);
  useAuthStore.setState({ status: 'guest', user: null });
});
