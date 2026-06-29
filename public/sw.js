/* ── WABA Next Service Worker ──
   Required for reliable browser notifications when the tab is inactive.
   Socket.io events trigger notifications via reg.showNotification() from the page.
*/

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus an existing window if available
        for (const client of windowClients) {
          if (client.focus) {
            client.focus();
            // Notify the client to select the conversation if data exists
            if (event.notification.data?.conversationId) {
              client.postMessage({
                type: 'SELECT_CONVERSATION',
                conversationId: event.notification.data.conversationId,
              });
            }
            return;
          }
        }
        // No open window — open the app root
        return clients.openWindow('/');
      })
      .catch(() => {
        return clients.openWindow('/');
      })
  );
});

self.addEventListener('message', (event) => {
  // Listen for pings or manual notification triggers from the page if needed
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
