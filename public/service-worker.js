const CACHE_NAME = 'campuspulse-shell-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'CampusPulse update', body: event.data ? event.data.text() : '' };
  }

  const notificationTitle = data.title || 'CampusPulse update';
  event.waitUntil(Promise.all([
    self.registration.showNotification(notificationTitle, {
      body: data.body || 'A new campus notice is available.',
      icon: '/lnct_badge.jpg',
      badge: '/lnct_badge.jpg',
      data: { url: data.url || '/' },
      tag: data.tag || 'campuspulse-notice',
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200]
    }),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      clientList.forEach(client => client.postMessage({ type: 'push-received', title: notificationTitle }));
    })
  ]));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
    const existingClient = clientList.find(client => 'focus' in client);
    if (existingClient) {
      return existingClient.navigate(targetUrl).then(client => client.focus());
    }
    return self.clients.openWindow(targetUrl);
  }));
});