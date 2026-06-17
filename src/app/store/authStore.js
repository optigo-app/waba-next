'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'auth-store';

const sessionStorageAdapter = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    const str = sessionStorage.getItem(name);
    return str ? JSON.parse(str) : null;
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      auth: null,
      isAuthChecking: true,
      isSyncing: false,

      login: (data) => {
        const payload = {
          token: data.token,
          userId: data.userId,
          id: data.id,
          username: data.username,
          ...data,
        };
        set({ auth: payload });
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('userData', JSON.stringify(payload));
        }
      },

      logout: () => {
        set({ auth: null });
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
        }
      },

      setIsSyncing: (val) => set({ isSyncing: val }),
      setIsAuthChecking: (val) => set({ isAuthChecking: val }),

      hydrateFromSession: () => {
        if (typeof window === 'undefined') {
          set({ isAuthChecking: false });
          return;
        }
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userDataRaw = sessionStorage.getItem('userData');
        if (isLoggedIn && userDataRaw) {
          try {
            const parsed = JSON.parse(userDataRaw);
            set({ auth: parsed });
          } catch {
            sessionStorage.clear();
          }
        }
        set({ isAuthChecking: false });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: sessionStorageAdapter,
      partialize: (state) => ({
        auth: state.auth,
        isAuthChecking: state.isAuthChecking,
      }),
    }
  )
);
