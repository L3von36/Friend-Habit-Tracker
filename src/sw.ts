/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope & {
    __WB_MANIFEST: Array<any>;
};

// 1. Precaching
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 2. Core SW Behavior
self.skipWaiting();
clientsClaim();

// 3. Push Notifications Listener
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title ?? 'Friendship Insight';
    const options = {
        body: data.body ?? 'Gemma has a new weekly focus for your friendships!',
        icon: '/icons/icon-192x192.png',
        badge: '/favicon.ico',
        tag: data.tag ?? 'friendship-insight',
        data: data.url ?? '/',
        vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 4. Notification Click Listener
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.openWindow(event.notification.data)
    );
});

// 5. Background Synchronization
self.addEventListener('sync', (event: any) => {
    if (event.tag === 'sync-gdrive') {
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SYNC_GDRIVE',
                        timestamp: new Date().toISOString()
                    });
                });
            })
        );
    } else if (event.tag === 'sync-intelligence') {
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SYNC_INTELLIGENCE',
                        timestamp: new Date().toISOString()
                    });
                });
            })
        );
    }
});
