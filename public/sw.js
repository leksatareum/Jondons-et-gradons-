// Service worker minimal — une seule tâche : réveiller l'appareil sur une
// notification push, et ouvrir (ou reprendre) l'appli au clic dessus. Pas de
// cache, pas de mode hors-ligne : ce n'est pas ce qu'on demande ici.

self.addEventListener('push', (event) => {
  let donnees = { title: 'Jondons et gradons', body: '' };
  try {
    if (event.data) donnees = { ...donnees, ...event.data.json() };
  } catch {
    // Corps non-JSON ou absent : on garde le titre par défaut plutôt que
    // de faire échouer toute la notification pour un format inattendu.
  }
  event.waitUntil(
    self.registration.showNotification(donnees.title || 'Jondons et gradons', {
      body: donnees.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const dejaOuverte = fenetres.find((fenetre) => 'focus' in fenetre);
      if (dejaOuverte) {
        await dejaOuverte.focus();
        return;
      }
      await self.clients.openWindow('/');
    })(),
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
