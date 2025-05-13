// Nome do cache para armazenar arquivos offline
const CACHE_NAME = 'designauto-v1';

// Lista de recursos que devem ser armazenados em cache para uso offline
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.png',
  '/images/offline-placeholder.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Evento de instalação - pré-cache de recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  // Impede a finalização do evento até que a Promise seja resolvida
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pré-cacheando recursos estáticos');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Ativa o service worker imediatamente sem esperar por navegação
        console.log('[Service Worker] Ativando sem esperar');
        return self.skipWaiting();
      })
  );
});

// Evento de ativação - limpeza de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  // Limpa caches antigos
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
      // Assume o controle imediatamente para todos os clientes
      console.log('[Service Worker] Reivindicando clientes');
      return self.clients.claim();
    })
  );
});

// Evento de fetch - estratégia de cache com fallback para rede
self.addEventListener('fetch', (event) => {
  // Ignorar requisições de API e admin
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/admin') ||
      event.request.url.includes('/uploads/') ||
      event.request.url.includes('/auth')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna o recurso do cache
        if (response) {
          return response;
        }
        
        // Não encontrado no cache, busca da rede
        return fetch(event.request)
          .then((response) => {
            // Retorna a resposta original e salva uma cópia no cache
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Armazena em cache para uso futuro
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // Se falhar em buscar e é uma solicitação de uma página...
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Para imagens, retorna um placeholder
            if (event.request.destination === 'image') {
              return caches.match('/images/offline-placeholder.png');
            }
            
            // Para outros tipos de recursos, retorna uma resposta em branco
            return new Response('', {
              status: 408,
              statusText: 'Request timed out.'
            });
          });
      })
  );
});

// Evento de sincronização em background (para enviar dados quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    console.log('[Service Worker] Sincronizando requisições pendentes');
    event.waitUntil(syncPendingRequests());
  }
});

// Função para sincronizar requisições pendentes quando estiver online
async function syncPendingRequests() {
  // Implementação futura para sincronizar dados
  console.log('[Service Worker] Sincronização de dados pendentes ainda não implementada');
}

// Evento de notificações push
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Novidade do DesignAuto!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'DesignAuto', options)
  );
});

// Evento de clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then((clientList) => {
      // Se já tem uma janela aberta, navega para a URL
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não, abre uma nova janela/aba
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});