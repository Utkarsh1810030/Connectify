import { create } from 'zustand';
import { api } from '@/services/api';

interface WalletState {
  balance: number;
  setBalance: (balance: number) => void;
  fetchBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,

  setBalance: (balance) => set({ balance }),

  fetchBalance: async () => {
    try {
      const { data } = await api.get('/billing/wallet');
      set({ balance: Number(data.balance) });
    } catch {
      // silently fail — user might not be logged in yet
    }
  },
}));
