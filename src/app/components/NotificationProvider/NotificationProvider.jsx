'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [permissionStatus, setPermissionStatus] = useState(
        typeof window !== 'undefined' && 'Notification' in window
            ? Notification.permission
            : 'default'
    );
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        setPermissionStatus(Notification.permission);

        // Listen for permission changes via Permissions API
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions
                .query({ name: 'notifications' })
                .then((status) => {
                    status.onchange = () => {
                        setPermissionStatus(status.state);
                        if (status.state === 'granted') {
                            setShowGuide(false);
                            toast.success('Notifications enabled!');
                        }
                    };
                })
                .catch(() => {});
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';

        if (Notification.permission === 'default') {
            setShowGuide(true);
            return 'default';
        }

        if (Notification.permission === 'denied') {
            setShowGuide(true);
            return 'denied';
        }

        return 'granted';
    }, []);

    const executeNativeRequest = useCallback(async (fromModal = false) => {
        if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';

        try {
            const status = await Notification.requestPermission();
            setPermissionStatus(status);
            if (!fromModal) setShowGuide(false);

            if (status === 'granted') {
                setShowGuide(false);
                toast.success('Notifications enabled!');
            } else if (status === 'denied') {
                if (!fromModal) {
                    toast(
                        'Notifications blocked. You can enable them in your browser settings.',
                        { icon: '⚠️' }
                    );
                }
            }
            return status;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            setShowGuide(false);
            return 'error';
        }
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                permissionStatus,
                showGuide,
                setShowGuide,
                requestPermission,
                executeNativeRequest,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationManager = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationManager must be used within a NotificationProvider');
    }
    return context;
};
