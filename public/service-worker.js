// service-worker.js
const CACHE_NAME = 'designauto-cache-v4'; // Versão incrementada para forçar atualização do cache e incluir as novas screenshots
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json'
];

// As imagens dos ícones agora são dinâmicas e não devem ser cacheadas aqui

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
  
  // Para ícones, screenshots e manifest.json: sempre buscar da rede (network-first)
  // Isso garante que os ícones e manifest sempre estejam atualizados
  if (url.pathname.includes('/icons/') || 
      url.pathname.includes('/screenshots/') || 
      url.pathname === '/manifest.json') {
    console.log('Buscar da rede primeiro para:', url.pathname);
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clonar a resposta para armazenar no cache e retornar
          const responseToCache = response.clone();
          
          // Atualizar o cache com a nova versão 
          caches.open(CACHE_NAME)
            .then(cache => {
              // Remover versões antigas do mesmo recurso (útil para ícones e screenshots)
              if (url.pathname.includes('/icons/')) {
                const iconType = url.pathname.includes('icon-192') ? 'icon-192' : 'icon-512';
                cache.keys().then(keys => {
                  keys.forEach(key => {
                    const keyUrl = new URL(key.url);
                    if (keyUrl.pathname.includes('/icons/') && keyUrl.pathname.includes(iconType)) {
                      console.log('Removendo ícone antigo do cache:', keyUrl.pathname);
                      cache.delete(key);
                    }
                  });
                });
              }
              
              // Limpar screenshots antigas do cache
              if (url.pathname.includes('/screenshots/')) {
                const screenshotType = url.pathname.includes('mobile') ? 'mobile' : 'home';
                cache.keys().then(keys => {
                  keys.forEach(key => {
                    const keyUrl = new URL(key.url);
                    if (keyUrl.pathname.includes('/screenshots/') && keyUrl.pathname.includes(screenshotType)) {
                      console.log('Removendo screenshot antiga do cache:', keyUrl.pathname);
                      cache.delete(key);
                    }
                  });
                });
              }
              
              // Adicionar a nova versão ao cache
              cache.put(event.request, responseToCache);
              console.log('Atualizado no cache:', url.pathname);
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
      // Tenta buscar o recurso no cache primeiro
      caches.match(event.request)
        .then(response => {
          // Se estiver no cache, retorna o recurso do cache
          if (response) {
            return response;
          }
          
          // Se não estiver no cache, buscar da rede
          return fetch(event.request)
            .then(networkResponse => {
              // Clonar a resposta para armazenar no cache e retornar
              const responseToCache = networkResponse.clone();
              
              // Armazenar no cache apenas se for uma resposta válida
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