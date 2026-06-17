import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: any;

precacheAndRoute(self.__WB_MANIFEST);

// Firebase Messaging background handler
self.addEventListener('push', (event: any) => {
  if (!event.data) {
    return;
  }

  const payload = event.data.json() as {
    notification?: { title?: string; body?: string; icon?: string };
  };

  const title = payload.notification?.title ?? 'Portal Escolar';
  const options: NotificationOptions = {
    body: payload.notification?.body ?? '',
    icon: payload.notification?.icon ?? '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'portal-escolar-notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/agenda'),
  );
});

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50 }),
    ],
  }),
);
