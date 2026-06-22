'use client';

import { useEffect } from 'react';
import {
  getToken,
  getUserData,
  setUserData,
  getIsLoggedIn,
  setIsLoggedIn,
  setToken,
  removeToken,
  storage,
} from '../utils/storage';
import { useAuthStore } from '../store/authStore';

const CHANNEL_NAME = 'waba_auth_sync';
const LS_SYNC_KEY = '_waba_auth_sync_';
const LS_LOGOUT_KEY = '_waba_logout_';

function readAllAuth() {
  // getToken() has the FULL login response (yearcode, svid, cuver, etc.)
  // getUserData() may be a trimmed subset — prefer token
  const fullToken = getToken() || getUserData();
  return {
    authData: fullToken,
    isLoggedIn: getIsLoggedIn(),
    zustandState: storage.getJSON('auth-store'),
  };
}

function writeAllAuth(authPayload, zustandState) {
  setIsLoggedIn('true');
  setUserData(authPayload);
  setToken(authPayload); // write FULL response so getHeaders() works
  if (zustandState) {
    storage.setJSON('auth-store', zustandState);
  }
  useAuthStore.setState({ auth: authPayload, isAuthChecking: false });
}

function clearAllAuth() {
  storage.clear();
  removeToken();
  useAuthStore.setState({ auth: null });
}

export function useTabAuthSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existing = readAllAuth();
    const hasLocalAuth = Boolean(existing.isLoggedIn) && Boolean(existing.authData);

    let channel = null;
    if (!hasLocalAuth) {
      try {
        const raw = localStorage.getItem(LS_SYNC_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.auth && Date.now() - parsed.ts < 8000) {
            writeAllAuth(parsed.auth, parsed.zustandState);
            localStorage.removeItem(LS_SYNC_KEY);
          }
        }
      } catch {
        // ignore
      }
    }

    // ── 2. BroadcastChannel handler ──
    const handleMessage = (event) => {
      const { type, auth, zustandState } = event.data || {};

      if (type === 'REQUEST_AUTH' && hasLocalAuth) {
        const allAuth = readAllAuth();
        if (allAuth.authData) {
          // Write to localStorage as a synchronous bridge for new tabs
          try {
            localStorage.setItem(
              LS_SYNC_KEY,
              JSON.stringify({ auth: allAuth.authData, zustandState: allAuth.zustandState, ts: Date.now() })
            );
          } catch {
            // ignore
          }
          channel?.postMessage({ type: 'AUTH_RESPONSE', auth: allAuth.authData, zustandState: allAuth.zustandState });
        }
      }

      if (type === 'AUTH_RESPONSE' && auth) {
        if (!getIsLoggedIn()) {
          writeAllAuth(auth, zustandState);
        }
      }

      if (type === 'LOGOUT') {
        clearAllAuth();
      }
    };

    // ── 3. localStorage event fallback (Safari / older browsers) ──
    const handleStorage = (e) => {
      if (e.key === LS_SYNC_KEY && e.newValue) {
        if (!getIsLoggedIn()) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed.auth && Date.now() - parsed.ts < 8000) {
              writeAllAuth(parsed.auth, parsed.zustandState);
            }
          } catch {
            // ignore
          }
        }
      }
      if (e.key === LS_LOGOUT_KEY) {
        clearAllAuth();
      }
    };

    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = handleMessage;
    } catch {
      channel = null;
    }

    // ── 4. Request auth from other tabs ──
    if (!hasLocalAuth) {
      if (channel) {
        channel.postMessage({ type: 'REQUEST_AUTH' });
      }
      // Also trigger localStorage event for Safari
      try {
        localStorage.setItem('_waba_auth_ping_', JSON.stringify({ ts: Date.now() }));
        localStorage.removeItem('_waba_auth_ping_');
      } catch {
        // ignore
      }
    }

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
}
