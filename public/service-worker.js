// service-worker.js
const CACHE_NAME = 'designauto-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/js/install-pwa.js'
];

// Instalação do service worker e caching de recursos essenciais
self.addEventListener('install', event => {
  console.log('Service Worker instalado');
  
  // Pré-cache de recursos essenciais
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
  event.respondWith(
    // Tenta buscar o recurso na rede
    fetch(event.request)
      .catch(() => {
        // Se falhar, verifica se o recurso está no cache
        return caches.match(event.request)
          .then(response => {
            // Se estiver no cache, retorna o recurso do cache
            if (response) {
              return response;
            }
            
            // Para requisições HTML, fornecer a página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Para outros tipos de recursos, retornar uma resposta vazia
            return new Response('', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});