// service-worker.js
const CACHE_NAME = 'designauto-cache-v6'; // Incrementado para forçar atualização
const STATIC_CACHE = 'designauto-static-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/index.html'
];

// Lista de caminhos que sempre devem ser buscados da rede primeiro
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/uploads/',
];

// Lista de extensões estáticas que podem ser cacheadas com cache-first
const CACHEABLE_EXTENSIONS = [
  '.js',
  '.css',
  '.woff2',
  '.woff',
  '.ttf',
  '.eot',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico'
];

// Instalação do service worker e caching de recursos essenciais
self.addEventListener('install', event => {
  console.log('[SW] Service Worker instalado');
  
  // Pré-cache de recursos essenciais
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cache estático aberto');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  
  // Forçar ativação imediata
  self.skipWaiting();
});

// Atualização do service worker
self.addEventListener('activate', event => {
  console.log('[SW] Service Worker ativado');
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Tomar controle de clientes não controlados
      return self.clients.claim();
    })
  );
});

// Função para verificar se uma URL deve usar network-first
function shouldUseNetworkFirst(url) {
  const pathname = new URL(url).pathname;
  
  // Verificar se é uma rota de API ou upload
  for (const route of NETWORK_FIRST_ROUTES) {
    if (pathname.startsWith(route)) {
      return true;
    }
  }
  
  // Para requisições POST, PUT, DELETE sempre usar network-first
  return false;
}

// Função para verificar se um recurso é estático baseado na extensão
function isStaticResource(url) {
  const pathname = new URL(url).pathname;
  
  return CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

// Interceptação de requisições
self.addEventListener('fetch', event => {
  // Ignorar requisições não GET para APIs
  if (event.request.method !== 'GET' && event.request.url.includes('/api/')) {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // Para ícones, screenshots e manifest.json: sempre buscar da rede primeiro
  if (url.pathname.includes('/icons/') || 
      url.pathname.includes('/screenshots/') || 
      url.pathname === '/manifest.json') {
    
    console.log('[SW] Ícone/PWA - Network First:', url.pathname);
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Não cachear respostas com erro
          if (!response.ok) return response;
          
          const responseToCache = response.clone();
          
          caches.open(STATIC_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para APIs e conteúdo dinâmico: network-first
  if (shouldUseNetworkFirst(event.request.url)) {
    console.log('[SW] API/Dinâmico - Network First:', url.pathname);
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Não cachear respostas com erro 
          if (!response.ok) return response;
          
          // Verificar se há cabeçalhos anti-cache específicos do app
          const hasNoCacheHeader = response.headers.get('X-No-Cache') === 'true';
          const isPostDeleted = response.headers.get('X-Post-Deleted') === 'true';
          
          if (hasNoCacheHeader || isPostDeleted) {
            console.log('[SW] Pulando cache para conteúdo marcado como no-cache');
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              // Adicionar timestamp como query param no cache para garantir diferenciação
              const urlWithTimestamp = new URL(event.request.url);
              urlWithTimestamp.searchParams.set('_ts', Date.now());
              
              // Modificar o request com timestamp para cache
              const requestToCache = new Request(urlWithTimestamp.toString(), {
                method: event.request.method,
                headers: event.request.headers,
                mode: event.request.mode,
                credentials: event.request.credentials,
                redirect: event.request.redirect
              });
              
              cache.put(requestToCache, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // Verificar no cache em caso de falha na rede
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log('[SW] Fornecendo resposta do cache:', url.pathname);
                return cachedResponse;
              }
              
              // Para navegação de páginas, fornecer página offline
              if (event.request.mode === 'navigate') {
                return caches.match('/offline.html');
              }
              
              // Para outros recursos, retornar resposta de erro
              return new Response('Recurso não disponível offline', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
    return;
  }
  
  // Para recursos estáticos: cache-first
  if (isStaticResource(event.request.url)) {
    console.log('[SW] Recurso estático - Cache First:', url.pathname);
    
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(networkResponse => {
              // Não cachear respostas com erro
              if (!networkResponse.ok) return networkResponse;
              
              const responseToCache = networkResponse.clone();
              
              caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return networkResponse;
            });
        })
    );
    return;
  }
  
  // Para outros recursos: network-first como padrão mais seguro
  console.log('[SW] Outro recurso - Network First por padrão:', url.pathname);
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone a resposta para o cache
        const responseToCache = response.clone();
        
        // Só armazenar no cache se a resposta for bem-sucedida
        if (response.ok) {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Em caso de falha na rede, tentar usar o cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Para navegação de páginas, fornecer página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Para outros recursos, retornar uma resposta de erro
            return new Response('Recurso não disponível offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});