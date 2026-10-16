import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_TOKEN_KEY = 'wlidi.deviceToken';
const DEVICE_CHILD_KEY = 'wlidi.deviceChild';

export interface StoredDeviceChild {
  id: string;
  name: string;
  ageGroup: string;
  stars: number;
}

export const deviceStorage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
  },

  async getChild(): Promise<StoredDeviceChild | null> {
    const raw = await AsyncStorage.getItem(DEVICE_CHILD_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredDeviceChild;
    } catch {
      return null;
    }
  },

  async setChild(child: StoredDeviceChild): Promise<void> {
    await AsyncStorage.setItem(DEVICE_CHILD_KEY, JSON.stringify(child));
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([DEVICE_TOKEN_KEY, DEVICE_CHILD_KEY]);
  },
};
