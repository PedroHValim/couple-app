import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Recebe o push mandado pela Supabase Edge Function (supabase/functions/send-push)
self.addEventListener('push', (event) => {
  let data = { title: 'Nossa Órbita', body: 'Você tem uma nova mensagem 💛' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    /* payload não era JSON, usa o padrão */
  }

  const iconUrl = new URL('icons/icon-192.png', self.registration.scope).href;

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: iconUrl,
      badge: iconUrl,
      vibrate: [80, 40, 80],
      data: { url: data.url || self.registration.scope }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
