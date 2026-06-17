'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { disconnectSocket } from '../socket';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasRunRef = useRef(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const isPublic =
      pathname === '/login' || pathname === '/session-check' || pathname === '/test';
    if (isPublic) {
      setChecking(false);
      return;
    }

    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userDataRaw = sessionStorage.getItem('userData');
    const hasExistingSocket = sessionStorage.getItem('hasSocketId');
    const userData = userDataRaw ? JSON.parse(userDataRaw) : {};

    if (!isLoggedIn) {
      if (hasExistingSocket) {
        router.replace('/session-check');
      } else if (userData?.id) {
        router.replace('/');
      } else {
        disconnectSocket(true);
        router.replace('/login');
      }
    }

    setChecking(false);
  }, [pathname, router]);

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
