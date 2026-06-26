'use client';

import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Bell, X } from 'lucide-react';
import { useNotificationManager } from '../NotificationProvider/NotificationProvider';

const DISMISS_KEY = 'optigo_notification_banner_dismissed';

export default function NotificationBanner() {
    const { permissionStatus, executeNativeRequest } = useNotificationManager();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const isDismissed = localStorage.getItem(DISMISS_KEY) === 'true';
        setDismissed(isDismissed);
    }, []);

    useEffect(() => {
        // Show banner only when permission is "default" (not yet asked)
        // and user hasn't manually dismissed it
        setVisible(permissionStatus === 'default' && !dismissed);
    }, [permissionStatus, dismissed]);

    const handleEnable = async () => {
        await executeNativeRequest(true);
    };

    const handleDismiss = () => {
        setVisible(false);
        setDismissed(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem(DISMISS_KEY, 'true');
        }
    };

    if (!visible) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 9999,
                width: { xs: 'calc(100% - 32px)', sm: 380 },
                background: 'linear-gradient(135deg, #1daa61 0%, #25d366 100%)',
                borderRadius: '16px',
                boxShadow: '0 12px 32px rgba(29,170,97,0.25)',
                p: 2.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                animation: 'slideInRight 0.4s ease-out',
                '@keyframes slideInRight': {
                    from: { opacity: 0, transform: 'translateX(40px)' },
                    to: { opacity: 1, transform: 'translateX(0)' },
                },
            }}
        >
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Bell size={20} color="#fff" />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: '#fff',
                        mb: 0.5,
                    }}
                >
                    Enable Notifications
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: 1.5,
                        mb: 1.5,
                    }}
                >
                    Get real-time alerts for new messages and conversation updates.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        onClick={handleEnable}
                        sx={{
                            background: '#fff',
                            color: '#1daa61',
                            textTransform: 'none',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            borderRadius: '10px',
                            px: 2,
                            py: 0.6,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': { background: 'rgba(255,255,255,0.95)' },
                        }}
                    >
                        Enable
                    </Button>
                    <Button
                        onClick={handleDismiss}
                        sx={{
                            color: 'rgba(255,255,255,0.85)',
                            textTransform: 'none',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            borderRadius: '10px',
                            px: 1.5,
                            py: 0.6,
                            '&:hover': { background: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        Not now
                    </Button>
                </Box>
            </Box>

            <IconButton
                onClick={handleDismiss}
                sx={{
                    p: 0.5,
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.15)' },
                }}
            >
                <X size={16} />
            </IconButton>
        </Box>
    );
}
