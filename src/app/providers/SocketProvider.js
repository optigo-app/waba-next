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
import { getUserData, storage } from '../utils/storage';
import { savePlayerId } from '../api/chat/conversationApi';

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
        const userData = getUserData();
        if (userData) {
          token = userData.token;
          userId = userData.userId;
        }
      }

      if (!token || !userId) return;

      const socket = initializeSocket(token);
      if (!socket) return;

      socket.on('connect', async () => {
        if (!mounted) return;
        setIsConnected(true);
        setSocketStatus('connected');

        // Register socket ID with backend
        try {
          const userData = getUserData();
          const socketId = socket?.id;
          const uid = auth?.userId || userData?.userId;
          const id = auth?.id || userData?.id;
          if (socketId && uid && id) {
            const result = await savePlayerId(socketId, uid, id);
            if (result) {
              console.log('Socket ID registered successfully:', result);
            } else {
              console.warn('Socket ID registration returned empty response');
            }
          }
        } catch (err) {
          console.error('Failed to register socket ID:', err);
        }
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
      storage.clear();
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
