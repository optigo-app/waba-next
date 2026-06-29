'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Bell, X, MessageCircle, User, Lock, Heart } from 'lucide-react';

const MAX_TOASTS = 4;
const DISMISS_DELAY = 6000;

const ICON_MAP = {
  MESSAGE: MessageCircle,
  REACTION: Heart,
  ASSIGNMENT: User,
  AUTH: Lock,
  OTHER: Bell,
  TEST: Bell,
};

const THEME = {
  MESSAGE:  { color: '#1daa61', iconBg: '#d1f5e0', cardBg: '#f0fdf6', bar: '#1daa61', glow: 'rgba(29,170,97,0.14)' },
  REACTION: { color: '#db2777', iconBg: '#fce7f3', cardBg: '#fdf2f8', bar: '#ec4899', glow: 'rgba(236,72,153,0.14)' },
  ASSIGNMENT:{ color: '#2563eb', iconBg: '#dbeafe', cardBg: '#eff6ff', bar: '#3b82f6', glow: 'rgba(59,130,246,0.14)' },
  AUTH:     { color: '#dc2626', iconBg: '#fee2e2', cardBg: '#fef2f2', bar: '#ef4444', glow: 'rgba(239,68,68,0.14)' },
  OTHER:    { color: '#4b5563', iconBg: '#f3f4f6', cardBg: '#f9fafb', bar: '#6b7280', glow: 'rgba(107,114,128,0.14)' },
  TEST:     { color: '#1daa61', iconBg: '#d1f5e0', cardBg: '#f0fdf6', bar: '#1daa61', glow: 'rgba(29,170,97,0.14)' },
};

function ToastItem({ toast, onRemove }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);  
  const rafRef = useRef(null);
  const startRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const theme = THEME[toast.typeGroup] || THEME.OTHER;

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      if (isPaused) { rafRef.current = requestAnimationFrame(tick); return; }
      const total = elapsedRef.current + (Date.now() - startRef.current);
      const pct = Math.max(0, 100 - (total / DISMISS_DELAY) * 100);
      setProgress(pct);
      if (pct <= 0) { setIsExiting(true); setTimeout(() => onRemove(toast.id), 400); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPaused, onRemove, toast.id]);

  const handlePause = () => { if (!isPaused) { elapsedRef.current += Date.now() - startRef.current; setIsPaused(true); } };
  const handleResume = () => { if (isPaused) { startRef.current = Date.now(); setIsPaused(false); } };
  const handleClose = () => { setIsExiting(true); setTimeout(() => onRemove(toast.id), 400); };

  const Icon = toast.icon;

  return (
    <Box
      onMouseEnter={() => { setIsHovered(true); handlePause(); }}
      onMouseLeave={() => { setIsHovered(false); handleResume(); }}
      sx={{
        pointerEvents: 'auto',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        p: '16px 20px',
        borderRadius: '16px',
        background: theme.cardBg,
        border: `1.5px solid ${theme.color}18`,
        boxShadow: isHovered
          ? `0 20px 40px ${theme.glow}, 0 6px 12px rgba(15,23,42,0.06)`
          : `0 10px 24px ${theme.glow}, 0 2px 4px rgba(15,23,42,0.04)`,
        animation: isExiting
          ? 'toastOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          : 'toastIn 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
        transformOrigin: 'bottom center',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        overflow: 'hidden',
        '@keyframes toastIn': {
          '0%':  { opacity: 0, transform: 'translateY(20px) scale(0.96)' },
          '60%': { opacity: 1, transform: 'translateY(-2px) scale(1.01)' },
          '100%':{ opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        '@keyframes toastOut': {
          '0%':  { opacity: 1, transform: 'translateY(0) scale(1)' },
          '100%':{ opacity: 0, transform: 'translateY(10px) scale(0.97)' },
        },
      }}
    >
      {/* Background effect: soft radial glow on the right */}
      <Box
        sx={{
          position: 'absolute',
          top: '-40%',
          right: '-10%',
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.color}12 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Background effect: diagonal gradient stripe */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, transparent 60%, ${theme.color}08 100%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Left accent bar */}
      <Box sx={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: '4px', borderRadius: '0 4px 4px 0', background: theme.bar, zIndex: 1 }} />

      {/* Icon */}
      <Box sx={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '12px',
          background: theme.iconBg,
          border: `1px solid ${theme.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={theme.color} strokeWidth={2} />
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.1, zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
          <Typography sx={{
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            fontWeight: 600, fontSize: '0.88rem', color: '#0f172a',
            lineHeight: 1.35, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
          }}>
            {toast.title}
          </Typography>

          <Typography sx={{
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            fontWeight: 500, fontSize: '0.65rem', color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            flexShrink: 0, ml: 'auto',
          }}>
            {toast.timeLabel}
          </Typography>
        </Box>

        <Typography sx={{
          fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          fontWeight: 400, fontSize: '0.8rem', color: '#475569',
          lineHeight: 1.45, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {toast.body}
        </Typography>
      </Box>

      {/* Close */}
      <IconButton
        onClick={handleClose}
        size="small"
        sx={{
          p: 0.45, color: '#94a3b8', flexShrink: 0, mt: -0.3, mr: -0.5,
          opacity: isHovered ? 1 : 0.55,
          transition: 'all 0.2s ease',
          zIndex: 1,
          '&:hover': { color: theme.color, background: `${theme.color}10` },
        }}
      >
        <X size={14} strokeWidth={2.5} />
      </IconButton>

      {/* Progress line */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `${theme.color}15`, borderRadius: '0 0 16px 16px', overflow: 'hidden', zIndex: 1 }} >
        <Box sx={{
          height: '100%', width: `${progress}%`,
          background: `linear-gradient(90deg, ${theme.color}70, ${theme.color})`,
          borderRadius: '0 3px 3px 0',
          transition: isPaused ? 'none' : 'width 0.1s linear',
        }} />
      </Box>
    </Box>
  );
}

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleEvent = (e) => {
      const detail = e.detail || {};
      const id = `${detail.tag || Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const typeGroup = detail.group || 'OTHER';
      const Icon = ICON_MAP[typeGroup] || Bell;
      const theme = THEME[typeGroup] || THEME.OTHER;
      setToasts((prev) => {
        const next = [{
          id, title: detail.title || 'Notification', body: detail.body || '',
          icon: Icon, accentColor: theme.color, typeGroup, timeLabel: 'Now',
        }, ...prev];
        return next.slice(0, MAX_TOASTS);
      });
    };
    window.addEventListener('waba:inPageNotification', handleEvent);
    return () => window.removeEventListener('waba:inPageNotification', handleEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <Box sx={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 1.2,
      maxWidth: 400, width: '100%', pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </Box>
  );
}
