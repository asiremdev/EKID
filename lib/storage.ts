import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './config';
import type { AuthUser } from './api/types';

export const tokenStorage = {
  async getAccess(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.accessToken);
  },
  async getRefresh(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
  },
  async set(access: string | null, refresh: string | null): Promise<void> {
    const ops: Promise<void>[] = [];
    ops.push(
      access
        ? AsyncStorage.setItem(STORAGE_KEYS.accessToken, access)
        : AsyncStorage.removeItem(STORAGE_KEYS.accessToken),
    );
    ops.push(
      refresh
        ? AsyncStorage.setItem(STORAGE_KEYS.refreshToken, refresh)
        : AsyncStorage.removeItem(STORAGE_KEYS.refreshToken),
    );
    await Promise.all(ops);
  },
  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.accessToken,
      STORAGE_KEYS.refreshToken,
      STORAGE_KEYS.authUser,
    ]);
  },
};

export const authStorage = {
  async getUser(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.authUser);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  async setUser(user: AuthUser | null): Promise<void> {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.authUser);
    }
  },
};

export const prefStorage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
};
