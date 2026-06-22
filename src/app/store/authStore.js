'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSessionStorageAdapter, setIsLoggedIn, setUserData, setToken, removeToken, getIsLoggedIn, getUserData, storage } from '../utils/storage';

const STORAGE_KEY = 'auth-store';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      auth: null,
      isAuthChecking: true,
      isSyncing: false,

      login: (data) => {
        set({ auth: data });
        setIsLoggedIn('true');
        setUserData(data);
        setToken(data);
      },

      logout: () => {
        set({ auth: null });
        storage.clear();
        removeToken();
        // Broadcast logout to other tabs
        try {
          const bc = new BroadcastChannel('waba_auth_sync');
          bc.postMessage({ type: 'LOGOUT' });
          bc.close();
        } catch {
          // Fallback for Safari: use localStorage event
          try {
            localStorage.setItem('_waba_logout_', JSON.stringify({ ts: Date.now() }));
            setTimeout(() => localStorage.removeItem('_waba_logout_'), 1000);
          } catch {
            // ignore
          }
        }
      },

      setIsSyncing: (val) => set({ isSyncing: val }),
      setIsAuthChecking: (val) => set({ isAuthChecking: val }),

      hydrateFromSession: () => {
        if (typeof window === 'undefined') {
          set({ isAuthChecking: false });
          return;
        }
        const isLoggedIn = getIsLoggedIn();
        const userData = getUserData();
        if (isLoggedIn && userData) {
          set({ auth: userData });
        }
        set({ isAuthChecking: false });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createSessionStorageAdapter(),
      partialize: (state) => ({
        auth: state.auth,
        isAuthChecking: state.isAuthChecking,
      }),
    }
  )
);
