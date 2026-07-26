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
  // Resolve contra o scope (não a origem) pra funcionar tanto na raiz quanto
  // numa subpasta (ex: GitHub Pages), e pra permitir link direto tipo "#/jogos/velha".
  const targetUrl = new URL(data.url || '', self.registration.scope).href;

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: iconUrl,
      badge: iconUrl,
      vibrate: [80, 40, 80],
      data: { url: targetUrl }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(async (clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        // Navega a aba já aberta pra tela certa (ex: convite de jogo), se o navegador suportar.
        if ('navigate' in existing) {
          try {
            await existing.navigate(url);
          } catch (e) {
            /* navegador não suporta navigate(); só foca mesmo */
          }
        }
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
