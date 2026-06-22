'use client';

import { useAuthStore } from '../store/authStore';

export function useAuthToken() {
  const auth = useAuthStore((s) => s.auth);
  return { userToken: auth };
}
