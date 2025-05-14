// service-worker.js
const CACHE_NAME = 'designauto-cache-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json'
];

// Instalação do service worker e caching de recursos essenciais
self.addEventListener('install', event => {
  console.log('Service Worker instalado');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Atualização do service worker
self.addEventListener('activate', event => {
  console.log('Service Worker ativado');

  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Para APIs e dados dinâmicos: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para recursos estáticos: cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(networkResponse => {
            // Cache apenas recursos estáticos
            if (networkResponse.status === 200 && 
                (url.pathname.startsWith('/images/') || 
                 url.pathname.startsWith('/js/') ||
                 url.pathname.startsWith('/icons/'))) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});