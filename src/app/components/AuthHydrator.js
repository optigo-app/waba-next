'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTabAuthSync } from '../hooks/useTabAuthSync';

export default function AuthHydrator({ children }) {
  useEffect(() => {
    useAuthStore.getState().hydrateFromSession();
  }, []);

  useTabAuthSync();

  return children;
}
