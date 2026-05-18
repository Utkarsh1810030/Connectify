import { create } from 'zustand';
import type { Session } from '@connectify/types';

interface SessionState {
  activeSession: Session | null;
  lastSession: Session | null;
  startSession: (session: Session) => void;
  endSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  lastSession: null,

  startSession: (session) => set({ activeSession: session }),

  endSession: () =>
    set((state) => ({
      activeSession: null,
      lastSession: state.activeSession,
    })),
}));
