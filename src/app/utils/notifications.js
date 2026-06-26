'use client';

import toast from 'react-hot-toast';
import { playNotificationSound } from './notificationSound';

// Inline chat-bubble SVG as data URL (green)
const APP_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzI1ZDM2NiI+PHBhdGggZD0iTTIwIDJINGMtMS4xIDAtMiAuOS0yIDJ2MThsNC00aDE0YzEuMSAwIDItLjkgMi0yVjRjMC0xLjEtLjktMi0yLTJ6Ii8+PC9zdmc+';

const capitalizeWords = (str) =>
    str
        ? str
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : '';

/**
 * Show a browser notification or fallback to in-app toast
 */
export const showBrowserNotification = async ({
    title,
    body,
    icon = APP_ICON,
    badge = APP_ICON,
    data,
    tag,
}) => {
    // Not in browser or API not supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
        playNotificationSound();
        toast(body, { icon: '🔔' });
        return;
    }

    const isFocused = typeof document !== 'undefined' && document.hasFocus();

    // Permission not granted
    if (Notification.permission !== 'granted') {
        playNotificationSound();
        return;
    }

    const options = {
        body,
        icon,
        badge,
        data,
        tag: tag || `msg-${data?.conversationId || data?.ConversationId || Date.now()}`,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        renotify: true,
        silent: true, // We play our own sound for consistency
    };

    // Only show browser notification if tab is not focused
    if (!isFocused) {
        playNotificationSound();

        // Use Service Worker if available (more reliable on mobile/PWA)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                const reg = await navigator.serviceWorker.ready;
                reg.showNotification(title, options);
            } catch (e) {
                // Fallback to standard Notification
                const notification = new Notification(title, options);
                notification.onclick = (e) => {
                    e.preventDefault();
                    window.focus();
                    const conversationId = data?.conversationId || data?.ConversationId;
                    if (conversationId) {
                        window.dispatchEvent(
                            new CustomEvent('SELECT_CONVERSATION', {
                                detail: { conversationId },
                            })
                        );
                    }
                    notification.close();
                };
            }
        } else {
            const notification = new Notification(title, options);
            notification.onclick = (e) => {
                e.preventDefault();
                window.focus();
                const conversationId = data?.conversationId || data?.ConversationId;
                if (conversationId) {
                    window.dispatchEvent(
                        new CustomEvent('SELECT_CONVERSATION', {
                            detail: { conversationId },
                        })
                    );
                }
                notification.close();
            };
        }
    } else {
        // Tab is focused — just play sound, no visual notification
        playNotificationSound();
    }
};

export const NOTIFICATION_TEMPLATES = {
    // New incoming message
    NEW_MESSAGE: (data) => {
        const name = capitalizeWords(
            data?.senderName || data?.CustomerName || data?.customerName || 'New Message'
        );
        const body = data?.message || data?.Message || data?.text || 'You have a new message.';
        return {
            title: name,
            body,
            icon: APP_ICON,
            badge: APP_ICON,
            tag: `msg-${data?.conversationId || data?.ConversationId || data?.customerId || data?.CustomerId}`,
        };
    },

    // Message reaction
    MESSAGE_REACTION: (data) => {
        let emoji = '👍';
        try {
            const reactions =
                typeof data?.ReactionEmojis === 'string'
                    ? JSON.parse(data.ReactionEmojis)
                    : data?.ReactionEmojis;
            if (Array.isArray(reactions) && reactions.length > 0) {
                emoji = reactions[reactions.length - 1].Reaction || '👍';
            }
        } catch (e) {
            /* ignore */
        }
        const name = capitalizeWords(data?.senderName || data?.sender || 'User');
        return {
            title: `${name} reacted`,
            body: `${emoji} ${data?.messagePreview || 'Reacted to your message'}`,
            icon: APP_ICON,
            badge: APP_ICON,
        };
    },

    // Conversation assigned to user
    CONVERSATION_ASSIGNED: (data) => ({
        title: '👤 Conversation Assigned',
        body: `A conversation with ${capitalizeWords(
            data?.CustomerName || data?.customerName || 'a customer'
        )} has been assigned to you.`,
        icon: APP_ICON,
        badge: APP_ICON,
    }),

    // Session logged out from another device
    SESSION_LOGOUT: () => ({
        title: '🔒 Session Logged Out',
        body: 'Your account was logged in from another device.',
        icon: APP_ICON,
        badge: APP_ICON,
    }),
};

export const notify = (data, templateId) => {
    const templateFn = NOTIFICATION_TEMPLATES[templateId];
    if (!templateFn) {
        console.warn(`Notification template "${templateId}" not found`);
        return;
    }

    const notificationOptions = templateFn(data);

    let typeGroup = 'OTHER';
    if (templateId === 'NEW_MESSAGE') typeGroup = 'MESSAGE';
    if (templateId === 'MESSAGE_REACTION') typeGroup = 'REACTION';
    if (templateId === 'CONVERSATION_ASSIGNED') typeGroup = 'ASSIGNMENT';
    if (templateId === 'SESSION_LOGOUT') typeGroup = 'AUTH';

    showBrowserNotification({
        ...notificationOptions,
        data: {
            ...data,
            type: templateId,
            group: typeGroup,
        },
    });
};
