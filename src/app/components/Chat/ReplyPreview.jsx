'use client';

import { IconButton, Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { X } from 'lucide-react';

export default function ReplyPreview({ message, onCancel }) {
  const theme = useTheme();

  const sender = message?.sender ?? 'Customer';
  const rawText = message?.text ?? message?.Message ?? message?.content ?? '';
  const previewText = rawText.length > 60 ? `${rawText.substring(0, 60)}...` : rawText;

  return (
    <Box
      sx={{
        px: 2,
        py: 1.1,
        mb: 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.92),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        borderRadius: 2,
        animation: 'slideDown 0.2s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 4,
          height: 34,
          background: theme.palette.primary.main,
          borderRadius: 1,
          flexShrink: 0,
        }}
      />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.secondary,
            lineHeight: 1.2,
          }}
        >
          Replying to{' '}
          <Box component="span" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {sender}
          </Box>
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: alpha(theme.palette.text.primary, 0.72),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}
        >
          {previewText || ' '}
        </Typography>
      </Box>

      <IconButton
        size="small"
        onClick={onCancel}
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          color: alpha(theme.palette.text.primary, 0.7),
          backgroundColor: alpha(theme.palette.text.primary, 0.04),
          '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.08),
            color: theme.palette.text.primary,
          },
        }}
      >
        <X size={18} strokeWidth={2.2} />
      </IconButton>
    </Box>
  );
}
