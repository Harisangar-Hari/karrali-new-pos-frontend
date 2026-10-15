import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

export type AuthStatus =
  | 'idle'           // before first bootstrap attempt
  | 'loading'        // bootstrap in flight
  | 'authenticated'  // /auth/me succeeded
  | 'unauthenticated'; // no session

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  setUser: (user) => set({ user, status: 'authenticated' }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, status: 'unauthenticated' }),
}));

/**
 * Non-reactive read — safe to call outside React (e.g. in interceptors
 * or mutation callbacks).
 */
export const getAuthState = () => useAuthStore.getState();