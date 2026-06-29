'use client';

import toast from 'react-hot-toast';
import { playNotificationSound } from './notificationSound';

// Cache the service worker registration so we can use it synchronously
// (awaiting inside a click handler consumes the user gesture in some browsers)
let cachedSwReg = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
        cachedSwReg = reg;
        console.log('[Notification] Cached SW registration:', reg.scope);
    }).catch(() => {});
}

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
 * Dispatch an in-page notification card (bottom-right toast UI).
 */
const showInPageNotification = ({ title, body, tag, group = 'OTHER' }) => {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(
            new CustomEvent('waba:inPageNotification', {
                detail: { title, body, tag, group },
            })
        );
    } catch (_) {
        // ignore
    }
};

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
        toast(body, { icon: 'ðŸ””' });
        return;
    }

    const isTabVisible = typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus();
    console.log('[Notification] showBrowserNotification called:', { title, body, isTabVisible, permission: Notification.permission });

    // Always show the in-page notification card (bottom-right)
    showInPageNotification({ title, body, tag, group: data?.group || 'OTHER' });

    // Permission not granted
    if (Notification.permission !== 'granted') {
        console.log('[Notification] Permission not granted:', Notification.permission);
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

    const showViaNative = (opts) => {
        console.log('[Notification] Using new Notification()', opts);
        try {
            const notification = new Notification(title, opts);
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
            console.log('[Notification] Native notification shown');
        } catch (e) {
            console.error('[Notification] Native notification failed:', e);
        }
    };

    // Show browser notification only when tab is hidden (user on another tab or minimized)
    if (!isTabVisible) {
        console.log('[Notification] Showing browser notification (hidden tab)');
        playNotificationSound();

        // Use cached Service Worker registration synchronously
        if ('serviceWorker' in navigator && cachedSwReg && cachedSwReg.active) {
            console.log('[Notification] Using cached SW registration synchronously');
            try {
                cachedSwReg.showNotification(title, options);
                console.log('[Notification] Service Worker notification shown (sync)');
            } catch (swErr) {
                console.warn('[Notification] SW showNotification failed (sync):', swErr?.name, swErr?.message);
                showViaNative({ body });
            }
            return;
        }

        // Fallback async path for socket-driven notifications
        console.log('[Notification] No cached SW reg — trying async path');
        if ('serviceWorker' in navigator) {
            try {
                const reg = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 2000)),
                ]);
                console.log('[Notification] Service Worker ready:', reg?.scope, 'active=', !!reg?.active);
                if (reg && reg.active) {
                    cachedSwReg = reg; // cache for next time
                    try {
                        await reg.showNotification(title, options);
                        console.log('[Notification] Service Worker notification shown');
                    } catch (swErr) {
                        console.warn('[Notification] SW showNotification failed:', swErr?.name, swErr?.message);
                        const minimalOpts = { body };
                        console.log('[Notification] Retrying with minimal options:', minimalOpts);
                        try {
                            await reg.showNotification(title, minimalOpts);
                            console.log('[Notification] Service Worker notification shown (minimal)');
                        } catch (swErr2) {
                            console.warn('[Notification] SW minimal also failed:', swErr2?.name, swErr2?.message);
                            showViaNative(minimalOpts);
                        }
                    }
                } else {
                    throw new Error('No active service worker');
                }
            } catch (e) {
                console.warn('[Notification] Service Worker path failed:', e?.name, e?.message);
                showViaNative({ body });
            }
        } else {
            console.log('[Notification] Service Worker not supported');
            showViaNative({ body });
        }
    } else {
        console.log('[Notification] Tab visible — only playing sound');
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
        let emoji = 'ðŸ‘';
        try {
            const reactions =
                typeof data?.ReactionEmojis === 'string'
                    ? JSON.parse(data.ReactionEmojis)
                    : data?.ReactionEmojis;
            if (Array.isArray(reactions) && reactions.length > 0) {
                emoji = reactions[reactions.length - 1].Reaction || 'ðŸ‘';
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
        title: 'ðŸ‘¤ Conversation Assigned',
        body: `A conversation with ${capitalizeWords(
            data?.CustomerName || data?.customerName || 'a customer'
        )} has been assigned to you.`,
        icon: APP_ICON,
        badge: APP_ICON,
    }),

    // Session logged out from another device
    SESSION_LOGOUT: () => ({
        title: 'ðŸ”’ Session Logged Out',
        body: 'Your account was logged in from another device.',
        icon: APP_ICON,
        badge: APP_ICON,
    }),
};

export const notify = (data, templateId) => {
    console.log('[Notification] notify() called:', { templateId, data });
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
