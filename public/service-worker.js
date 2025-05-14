// service-worker.js
const CACHE_NAME = 'designauto-cache-v5'; // Incrementado para forçar atualização
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json'
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
  const url = new URL(event.request.url);
  
  // Para ícones, screenshots e manifest.json: sempre buscar da rede primeiro
  if (url.pathname.includes('/icons/') || 
      url.pathname.includes('/screenshots/') || 
      url.pathname === '/manifest.json') {
    console.log('Buscar da rede primeiro para:', url.pathname);
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              // Atualizar cache com a nova versão
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // Se falhar, tentar usar o cache
          return caches.match(event.request);
        })
    );
  } else {
    // Para outros recursos, estratégia de cache-first
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(networkResponse => {
              const responseToCache = networkResponse.clone();
              
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return networkResponse;
            })
            .catch(() => {
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
  }
});