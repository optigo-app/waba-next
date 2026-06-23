import { io } from 'socket.io-client';
import { getSocketState, setSocketState, removeSocketState } from './utils/storage';
import { getSocketURL } from './api/Config';

// Socket state
let socketInstance = null;
let isAuthenticated = false;
let messageHandlers = new Set();
let messageHandlersFromAssigningUser = new Set();
let messageReactionHandlers = new Set();
let statusHandlers = new Set();
let sessionLogout = new Set();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Restore connection state if available
const restoreConnection = () => {
    if (typeof window === 'undefined') return;
    const savedState = getSocketState();
    if (savedState) {
        try {
            const { token } = savedState;
            if (token) {
                initializeSocket(token);
            }
        } catch (e) {
            console.error('Error restoring socket state:', e);
            removeSocketState();
        }
    }
};

/**
 * Initialize socket connection with token
 * @param {string} token - Authentication token
 * @returns {object} Socket instance
 */
export const initializeSocket = (token) => {
    if (token) {
        setSocketState({ token });
    }

    // If we already have a working connection, return it
    if (socketInstance?.connected && isAuthenticated) {
        return socketInstance;
    }

    // Clean up existing connection if any
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        isAuthenticated = false;
    }

    const socketURL = getSocketURL();

    socketInstance = io(socketURL, {
        auth: { token },
        reconnection: true,
    });

    socketInstance.on('connect', () => {
        isAuthenticated = true;
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection

        // Clear any existing listeners to prevent duplicates
        // socketInstance.removeAllListeners('newMessage');
        // socketInstance.removeAllListeners('changeStatus');

        // Re-attach all message handlers
        messageHandlers.forEach(handler => {
            socketInstance.on('newMessage', handler);
        });

        // session logout
        sessionLogout.forEach(handler => {
            socketInstance.on('sessionLogout', handler);
        });

        // Re-attach all message handlers from assigning users
        messageHandlersFromAssigningUser.forEach(handler => {
            socketInstance.on('sendMessage', handler);
        });

        // Re-attach all message handlers from assigning users
        messageReactionHandlers.forEach(handler => {
            socketInstance.on('sendReaction', handler);
        });

        // Re-attach all status handlers
        statusHandlers.forEach(handler => {
            socketInstance.on('changeStatus', handler);
        });
    });

    socketInstance.on('disconnect', (reason) => {
        isAuthenticated = false;
    });

    socketInstance.on('connect_error', (err) => {
        isAuthenticated = false;
    });

    socketInstance.on('reconnect', (attemptNumber) => {
        isAuthenticated = true;
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
    });

    // Remove existing event listeners to prevent duplicates
    // socketInstance.removeAllListeners('newMessage');
    // socketInstance.removeAllListeners('changeStatus');

    // Handle new messages
    socketInstance.on('newMessage', (data) => {
        messageHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                // console.error('❌ Error in message handler:', error);
            }
        });
    });

    // session logout
    socketInstance.on('sessionLogout', (data) => {
        sessionLogout.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                // console.error('❌ Error in message handler:', error);
            }
        });
    });

    // Handle new messages from assigning users
    socketInstance.on('sendMessage', (data) => {
        messageHandlersFromAssigningUser.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error('❌ Error in message handler from assigning user:', error);
            }
        });
    });

    // Handle message reactions
    socketInstance.on('sendReaction', (data) => {
        messageReactionHandlers.forEach((handler) => {
            try {
                handler(data);
            } catch (error) {
                console.error('❌ Error in reaction handler:', error);
            }
        });
    });

    // Handle status changes
    socketInstance.on('changeStatus', (data) => {
        statusHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error('❌ Error in status handler:', error);
            }
        });
    });
    return socketInstance;
};

/**
 * Get the current socket instance
 */
export const getSocket = () => {
    // console.log("📡 getSocket called. Current instance:", socketInstance);
    return socketInstance;
};

/**
 * Check if socket is connected and authenticated
 */
export const isSocketConnected = () => {
    const state = socketInstance?.connected && isAuthenticated;

    // If not connected but we have a token, try to reconnect
    if (!state && !socketInstance && typeof window !== 'undefined') {
        const savedState = getSocketState();
        if (savedState) {
            try {
                const { token } = savedState;
                if (token && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    initializeSocket(token);
                }
            } catch (e) {
                console.error('Error during reconnection attempt:', e);
            }
        }
    }

    return state;
};

/**
 * Check if user is authenticated
 */
export const isSocketAuthenticated = () => {
    // console.log("🔑 isSocketAuthenticated ->", isAuthenticated);
    return isAuthenticated;
};

/**
 * Add a handler for new messages
 */
export const addMessageHandler = (handler) => {
    messageHandlers.add(handler);
    return () => {
        messageHandlers.delete(handler);
    };
};

/**
 * Add a handler for session logout
 */
export const addSessionLogoutHandler = (handler) => {
    sessionLogout.add(handler);
    return () => {
        sessionLogout.delete(handler);
    };
};

/**
 * Add a handler for new messages coming from assigning users
 */
export const addMessageHandlerFromAssigningUser = (handler) => {
    messageHandlersFromAssigningUser.add(handler);
    return () => {
        messageHandlersFromAssigningUser.delete(handler);
    };
};

/**
 * Emit a reaction to the server via socket
 */
export const emitReaction = (data) => {
    if (socketInstance && isAuthenticated) {
        socketInstance.emit('sendReaction', data);
    }
};

/**
 * Add reaction message handler
 */
export const addMessageReactionHandler = (handler) => {
    if (typeof handler === 'function') {
        messageReactionHandlers.add(handler);
        return () => messageReactionHandlers.delete(handler);
    }
};


/**
 * Add a handler for status changes
 */
export const addStatusHandler = (handler) => {
    statusHandlers.add(handler);
    return () => {
        statusHandlers.delete(handler);
    };
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (permanent = false) => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        isAuthenticated = false;
        messageHandlers.clear();
        sessionLogout.clear();
        messageHandlersFromAssigningUser.clear();
        messageReactionHandlers.clear();
        statusHandlers.clear();

        if (permanent) {
            removeSocketState();
        }
    } else {
        if (permanent) {
            removeSocketState();
        }
    }
};
