'use client';

import { useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from '../styles/theme';
import { useThemeStore, subscribeToSystemTheme } from '../store/themeStore';

export default function ThemeRegistry({ children }) {
  const resolvedMode = useThemeStore((s) => s.resolvedMode);
  const syncResolvedMode = useThemeStore((s) => s.syncResolvedMode);

  useEffect(() => {
    syncResolvedMode();
  }, [syncResolvedMode]);

  useEffect(() => {
    return subscribeToSystemTheme(useThemeStore);
  }, []);

  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
