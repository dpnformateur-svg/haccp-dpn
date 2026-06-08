// Service Worker – DPN Formation
// ⚠️ Changer le numéro de version à chaque mise à jour pour déclencher la notification
const CACHE_VERSION = 'v2';
const CACHE_NAME = `dpn-formation-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  './Suivi_Formation_HACCP.html',
  './Suivi_Formation_Incendie.html',
  './manifest.json'
];

// Installation : mise en cache — NE PAS appeler skipWaiting ici
// pour que l'app puisse proposer la mise à jour à l'utilisateur
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[SW] Cache ${CACHE_VERSION} — mise en cache des fichiers`);
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Ne PAS appeler self.skipWaiting() ici — on attend le signal de l'app
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Suppression ancien cache : ${name}`);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// Message de l'app : l'utilisateur a cliqué "Mettre à jour"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Mise à jour activée par l\'utilisateur');
    self.skipWaiting();
  }
});

// Interception des requêtes : réseau en priorité, cache en fallback
// (réseau prioritaire = on reçoit toujours la dernière version si connecté)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Mettre à jour le cache avec la version réseau
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => {
        // Pas de réseau → on utilise le cache (mode hors ligne)
        return caches.match(event.request)
          .then((cached) => cached || caches.match('./Suivi_Formation_HACCP.html'));
      })
  );
});
