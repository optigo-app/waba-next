'use client';

import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { setIsLoggedIn, setUserData, getIsLoggedIn, getUserData, storage } from '../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const login = useCallback((data) => {
    // Store complete raw login response — headers need yearcode, svid, cuver, etc.
    setAuth(data);
    setIsLoggedIn('true');
    setUserData(data);
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    storage.clear();
  }, []);

  useEffect(() => {
    const isLoggedIn = getIsLoggedIn();
    const userData = getUserData();
    if (isLoggedIn && userData) {
      setAuth(userData);
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
