// service-worker.js
const CACHE_NAME = 'designauto-cache-v8'; // Incrementado para forçar atualização geral
const STATIC_CACHE = 'designauto-static-v8';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/index.html'
];

// Lista extremamente abrangente de caminhos que NUNCA devem ser cacheados
const NEVER_CACHE_ROUTES = [
  '/api/',
  '/api/artes',
  '/api/arts',
  '/api/admin',
  '/uploads/',
  '/api/community',
  '/api/categories',
  '/api/formats',
  '/api/fileTypes',
  '/api/user',
  '/api/favorites',
  '/api/course',
  '/dashboard',
  '/admin',
  '/artes',
  '/comunidade',
  '/cursos',
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

// Função para verificar se uma URL NUNCA deve ser cacheada
function shouldNeverCache(url) {
  const pathname = new URL(url).pathname;
  
  // Verificar se é uma rota de API ou upload
  for (const route of NEVER_CACHE_ROUTES) {
    if (pathname.startsWith(route)) {
      return true;
    }
  }
  
  // Verificar parâmetros especiais na URL (timestamp, nocache, etc)
  const params = new URL(url).searchParams;
  if (params.has('_nocache') || params.has('_ts')) {
    return true;
  }
  
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
  
  // Para APIs e conteúdo dinâmico: NUNCA cachear, sempre buscar da rede com parâmetros anti-cache
  if (shouldNeverCache(event.request.url)) {
    console.log('[SW] API/Dinâmico - Network Only com anti-cache:', url.pathname);
    
    // Criar uma nova requisição com parâmetros para evitar cache
    const timestamp = Date.now();
    const antiCacheUrl = new URL(event.request.url);
    antiCacheUrl.searchParams.set('_sw_nocache', timestamp);
    
    const antiCacheRequest = new Request(antiCacheUrl, {
      method: event.request.method,
      headers: event.request.headers,
      mode: event.request.mode,
      credentials: event.request.credentials,
      redirect: event.request.redirect
    });
    
    event.respondWith(
      fetch(antiCacheRequest)
        .then(response => {
          console.log('[SW] Resposta obtida da rede para:', url.pathname);
          // Não manipular ou cachear respostas de API de nenhuma forma
          return response;
        })
        .catch((error) => {
          console.error('[SW] Erro ao buscar da rede:', url.pathname, error);
          
          // Em caso de falha na rede para endpoints de API, retornar um erro apropriado
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          // Para outros recursos, retornar resposta de erro com cabeçalhos anti-cache
          return new Response(JSON.stringify({
            error: 'Falha na conexão de rede',
            offline: true,
            timestamp: timestamp,
            path: url.pathname
          }), {
            status: 503,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
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