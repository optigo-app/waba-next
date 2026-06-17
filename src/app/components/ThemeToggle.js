'use client';

import { IconButton, Tooltip } from '@mui/material';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

/**
 * Simple icon button to toggle between light / dark.
 * Drop it anywhere in your UI (AppBar, Settings page, etc.).
 */
export default function ThemeToggle() {
  const resolvedMode = useThemeStore((s) => s.resolvedMode);
  const toggleMode = useThemeStore((s) => s.toggleMode);

  return (
    <Tooltip title={resolvedMode === 'dark' ? 'Switch to light' : 'Switch to dark'}>
      <IconButton onClick={toggleMode} color="inherit" aria-label="toggle theme">
        {resolvedMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </IconButton>
    </Tooltip>
  );
}
