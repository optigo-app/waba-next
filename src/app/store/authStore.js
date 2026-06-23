'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSessionStorageAdapter, setIsLoggedIn, setUserData, setToken, removeToken, getIsLoggedIn, getUserData, getUserPermissions, setUserPermissions, getUserPermissionsLocal, setUserPermissionsLocal, removeUserPermissionsLocal, storage } from '../utils/storage';

const STORAGE_KEY = 'auth-store';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      auth: null,
      permissions: null,
      permissionSet: new Set(),
      isAuthChecking: true,
      isSyncing: false,

      login: (data, permissions) => {
        set({ auth: data });
        setIsLoggedIn('true');
        setUserData(data);
        setToken(data);
        if (permissions?.length) {
          get().setPermissions(permissions);
        }
      },

      setPermissions: (permissions) => {
        const permSet = new Set((permissions || []).map((p) => p.Id));
        set({ permissions, permissionSet: permSet });
        if (permissions) {
          setUserPermissions(permissions);
        }
      },

      can: (permId) => {
        return get().permissionSet.has(permId);
      },

      logout: () => {
        set({ auth: null, permissions: null, permissionSet: new Set() });
        storage.clear();
        removeToken();
        storage.remove('userPermissions');
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
        let perms = getUserPermissions();
        if (!perms) {
          // New tab: localStorage bridge fallback
          const localPerms = getUserPermissionsLocal();
          if (localPerms?.length) {
            perms = localPerms;
            setUserPermissions(perms);
            removeUserPermissionsLocal();
          }
        }
        if (perms) {
          const permSet = new Set((perms || []).map((p) => p.Id));
          set({ permissions: perms, permissionSet: permSet });
        } else {
          // Sync from Zustand persist back to raw sessionStorage if raw key is missing
          const storePerms = get().permissions;
          if (storePerms?.length) {
            setUserPermissions(storePerms);
          }
        }
        set({ isAuthChecking: false });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createSessionStorageAdapter(),
      partialize: (state) => ({
        auth: state.auth,
        permissions: state.permissions,
        permissionSet: state.permissionSet,
        isAuthChecking: state.isAuthChecking,
      }),
    }
  )
);
