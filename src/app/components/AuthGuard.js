'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { disconnectSocket } from '../socket';
import { getIsLoggedIn, getUserData, getHasSocketId } from '../utils/storage';
import { useAuthStore } from '../store/authStore';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasRunRef = useRef(false);
  const [checking, setChecking] = useState(true);
  const storeAuth = useAuthStore((s) => s.auth);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const isPublic =
      pathname === '/login' || pathname === '/session-check' || pathname === '/test';
    if (isPublic) {
      setChecking(false);
      return;
    }

    const checkAuth = () => {
      const isLoggedIn = getIsLoggedIn();
      const userData = getUserData() || {};
      const storeToken = useAuthStore.getState().auth?.token;
      return Boolean(isLoggedIn) || Boolean(userData?.token) || Boolean(storeToken);
    };

    if (checkAuth()) {
      setChecking(false);
      return;
    }

    const hasExistingSocket = getHasSocketId();
    const userData = getUserData() || {};

    let pollInterval = null;
    let maxTimeout = null;

    // Poll every 200ms for auth to arrive from another tab
    pollInterval = setInterval(() => {
      if (checkAuth()) {
        clearInterval(pollInterval);
        clearTimeout(maxTimeout);
        setChecking(false);
      }
    }, 200);

    // Give up after 3 seconds and redirect
    maxTimeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (!checkAuth()) {
        if (hasExistingSocket) {
          router.replace('/session-check');
        } else if (userData?.id) {
          window.location.replace(`${window.location.origin}/`);
        } else {
          disconnectSocket(true);
          window.location.replace(`${window.location.origin}/`);
        }
      }
      setChecking(false);
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(maxTimeout);
    };
  }, [pathname, router]);

  // Also react when auth arrives via zustand store update
  useEffect(() => {
    if (storeAuth?.token && checking) {
      setChecking(false);
    }
  }, [storeAuth, checking]);

  if (checking) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.9)',
          zIndex: 9999,
        }}
      >
        Checking session...
      </Box>
    );
  }

  return children;
}
