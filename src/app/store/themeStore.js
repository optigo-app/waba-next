import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand store for theme mode.
 * - Persists to localStorage
 * - Defaults to system preference if no saved value
 * - Exposes a toggle helper
 */

const STORAGE_KEY = 'theme-mode';

function getSystemMode() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      /* state */
      mode: 'system', // 'light' | 'dark' | 'system'

      /* computed: resolved actual mode */
      resolvedMode: 'light',

      /* actions */
      setMode: (mode) => {
        set({ mode });
        get().syncResolvedMode();
      },

      toggleMode: () => {
        const current = get().resolvedMode;
        const next = current === 'light' ? 'dark' : 'light';
        set({ mode: next });
        get().syncResolvedMode();
      },

      syncResolvedMode: () => {
        const { mode } = get();
        const resolved = mode === 'system' ? getSystemMode() : mode;
        set({ resolvedMode: resolved });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

/**
 * Subscribe to system preference changes so "system" mode reacts live.
 * Call this once inside a client-side useEffect (ThemeRegistry does this).
 */
export function subscribeToSystemTheme(store) {
  if (typeof window === 'undefined') return () => {};

  const mql = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = () => {
    const { mode, syncResolvedMode } = store.getState();
    if (mode === 'system') {
      syncResolvedMode();
    }
  };

  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
