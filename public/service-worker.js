/**
 * Service Worker para o DesignAuto PWA
 * Gerencia cache e fornece experiência offline
 */

const CACHE_NAME = 'designauto-cache-v1';

// Arquivos a serem cacheados
const urlsToCache = [
  '/',
  '/offline.html',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/js/install-pwa.js',
  '/images/logos/logo_1719266664669.png',
  '/src/index.css'
];

// Instala o service worker e adiciona recursos ao cache
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando recursos estáticos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Instalação concluída');
        return self.skipWaiting();
      })
  );
});

// Limpa caches antigos quando uma nova versão do service worker é ativada
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Agora está gerenciando requisições');
      return self.clients.claim();
    })
  );
});

// Intercepta requisições e usa a estratégia de cache-primeiro para arquivos estáticos
// e rede-primeiro para conteúdo dinâmico
self.addEventListener('fetch', (event) => {
  // Ignora requisições sem URL (ex: chrome-extension://)
  if (!event.request.url.startsWith('http')) return;
  
  // Obtém o modo de requisição (cors, no-cors, etc)
  const requestMode = event.request.mode;
  
  // Não intercepta requisições de API ou de outros domínios
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('analytics') ||
      event.request.url.includes('hotjar') ||
      !event.request.url.includes(self.location.origin)) {
    return;
  }
  
  // Estratégia de cache-primeiro para arquivos estáticos
  if (isStaticResource(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Retorna do cache se encontrado
        if (response) {
          return response;
        }
        
        // Se não estiver no cache, busca da rede
        return fetch(event.request).then((response) => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clona a resposta pois o cache consume o corpo da resposta
          const responseToCache = response.clone();
          
          // Adiciona ao cache para uso futuro
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch(() => {
          // Caso falhe a requisição de um arquivo estático, retorna resposta offline genérica
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
          
          return new Response('Recurso não disponível offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
    );
  } else {
    // Estratégia de rede-primeiro para conteúdo dinâmico (HTML)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clona resposta para o cache
          const responseToCache = response.clone();
          
          // Armazena no cache a versão mais recente da página
          if (event.request.destination === 'document') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Se offline, tenta retornar do cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              // Se estiver no cache, retorna
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Se não estiver no cache, retorna página offline
              if (event.request.destination === 'document') {
                return caches.match('/offline.html');
              }
              
              // Retorna uma resposta de erro para outros tipos de conteúdo
              return new Response('Você está offline. Verifique sua conexão.', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  }
});

// Verifica se uma URL é de recurso estático
function isStaticResource(url) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.webp', 
    '.svg', '.woff', '.woff2', '.ttf', '.eot', '.ico'
  ];
  
  return staticExtensions.some(ext => url.endsWith(ext)) || 
         url.includes('/icons/') || 
         url.includes('/images/');
}

// Escuta mensagens enviadas ao service worker (por exemplo, para forçar atualizações)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});