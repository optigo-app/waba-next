'use client';

import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';
import styles from './ProcessOverlay.module.scss';

const clampProgress = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const ProcessOverlay = ({
  open = false,
  title = 'Processing',
  message = 'Please wait...',
  progress = null,
}) => {
  if (!open) return null;

  const safeProgress = clampProgress(progress);

  return (
    <Box className={styles.overlay}>
      <Box className={styles.card}>
        <CircularProgress size={30} thickness={4.4} />
        <Typography className={styles.title}>{title}</Typography>
        <Typography className={styles.message}>{message}</Typography>

        {safeProgress !== null && (
          <>
            <Box className={styles.progressTrack}>
              <Box className={styles.progressBar} sx={{ width: `${safeProgress}%` }} />
            </Box>
            <Typography className={styles.progressText}>{safeProgress}% completed</Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ProcessOverlay;
