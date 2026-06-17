'use client';

import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const auth = useAuthStore((s) => s.auth);
  const isAuthChecking = useAuthStore((s) => s.isAuthChecking);
  const isSyncing = useAuthStore((s) => s.isSyncing);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setIsSyncing = useAuthStore((s) => s.setIsSyncing);

  return { auth, isAuthChecking, isSyncing, login, logout, setIsSyncing };
}
