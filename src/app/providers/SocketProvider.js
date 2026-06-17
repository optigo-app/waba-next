'use client';

import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  initializeSocket,
  disconnectSocket,
  isSocketConnected,
  addSessionLogoutHandler,
} from '../socket';
import { useAuth } from '../hooks/useAuth';

const SocketStatusContext = createContext({ isConnected: false, socketStatus: 'disconnected' });

export function useSocketStatus() {
  return useContext(SocketStatusContext);
}

export default function SocketProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const intervalRef = useRef(null);

  const isPublicRoute =
    pathname === '/login' || pathname === '/session-check' || pathname === '/test';

  useEffect(() => {
    if (isPublicRoute) return;

    let mounted = true;

    const start = async () => {
      let token = auth?.token;
      let userId = auth?.userId;

      if (!token || !userId) {
        if (typeof window !== 'undefined') {
          const userDataRaw = sessionStorage.getItem('userData');
          if (userDataRaw) {
            try {
              const parsed = JSON.parse(userDataRaw);
              token = parsed.token;
              userId = parsed.userId;
            } catch {
              // ignore
            }
          }
        }
      }

      if (!token || !userId) return;

      const socket = initializeSocket(token);
      if (!socket) return;

      socket.on('connect', () => {
        if (!mounted) return;
        setIsConnected(true);
        setSocketStatus('connected');
      });

      socket.on('disconnect', (reason) => {
        if (!mounted) return;
        setIsConnected(false);
        setSocketStatus('disconnected');
      });

      socket.on('connect_error', () => {
        if (!mounted) return;
        setIsConnected(false);
        setSocketStatus('error');
      });

      intervalRef.current = setInterval(() => {
        if (!mounted) return;
        const connected = isSocketConnected();
        setIsConnected(connected);
        setSocketStatus(connected ? 'connected' : 'disconnected');
      }, 5000);
    };

    start();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [auth?.token, isPublicRoute]);

  useEffect(() => {
    if (isPublicRoute) return;

    const removeHandler = addSessionLogoutHandler(() => {
      disconnectSocket(true);
      if (typeof window !== 'undefined') sessionStorage.clear();
      router.push('/login');
      toast.error('Your session has been logged out from another device', {
        duration: 3000,
      });
    });

    return () => removeHandler();
  }, [isPublicRoute, router]);

  return (
    <SocketStatusContext.Provider value={{ isConnected, socketStatus }}>
      {children}
    </SocketStatusContext.Provider>
  );
}
