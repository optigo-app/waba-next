'use client';

import { createContext, useState, useEffect, useCallback, useMemo } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const login = useCallback((data) => {
    const payload = {
      token: data.token,
      userId: data.userId,
      id: data.id,
      username: data.username,
      ...data,
    };
    setAuth(payload);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userData', JSON.stringify(payload));
    }
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsAuthChecking(false);
      return;
    }
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userDataRaw = sessionStorage.getItem('userData');
    if (isLoggedIn && userDataRaw) {
      try {
        const parsed = JSON.parse(userDataRaw);
        setAuth(parsed);
      } catch {
        sessionStorage.clear();
      }
    }
    setIsAuthChecking(false);
  }, []);

  const value = useMemo(
    () => ({
      auth,
      isAuthChecking,
      isSyncing,
      setIsSyncing,
      login,
      logout,
    }),
    [auth, isAuthChecking, isSyncing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
