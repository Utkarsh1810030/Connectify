import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { socketService } from '@/services/socket';

interface AuthState {
  token: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isHydrated: false,

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) await socketService.connect();
    set({ token, isHydrated: true });
  },

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    await socketService.connect();
    set({ token: access });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    socketService.disconnect();
    set({ token: null });
  },
}));
