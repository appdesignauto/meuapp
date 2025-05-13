/**
 * Utilitários para Progressive Web App (PWA)
 * 
 * Este arquivo contém funções úteis para trabalhar com PWAs,
 * como verificar se o aplicativo está sendo executado como PWA,
 * registrar o service worker, etc.
 */

/**
 * Verifica se o aplicativo está sendo executado como PWA
 * 
 * Esta função usa várias heurísticas para determinar se o 
 * aplicativo está sendo executado como um PWA instalado:
 * 1. Verifica a propriedade display-mode do CSS
 * 2. Verifica o objeto navigator.standalone (iOS)
 * 3. Verifica a URL (ausência de barra de endereço)
 * 
 * @returns {boolean} Verdadeiro se o aplicativo estiver sendo executado como PWA instalado
 */
export function isRunningAsPWA(): boolean {
  // Método 1: Verifica o display-mode do CSS (mais confiável)
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.matchMedia('(display-mode: fullscreen)').matches || 
      window.matchMedia('(display-mode: minimal-ui)').matches) {
    console.log('PWA detectado via display-mode CSS');
    return true;
  }
  
  // Método 2: Verifica o navigator.standalone (específico para iOS)
  if ((window.navigator as any).standalone === true) {
    console.log('PWA detectado via navigator.standalone (iOS)');
    return true;
  }
  
  // Método 3: Verifica a URL (ausência de barra de endereço, específico para algumas implementações)
  if (window.location.href.includes('?source=pwa') || 
      window.location.href.includes('?homescreen=1')) {
    console.log('PWA detectado via parâmetros de URL');
    return true;
  }
  
  // Método 4: Verifica se é um ambiente de app (algumas implementações PWA)
  if (document.referrer.includes('android-app://') ||
      document.URL.startsWith('app://') ||
      document.URL.startsWith('file://')) {
    console.log('PWA detectado via URL de aplicativo');
    return true;
  }
  
  // Não é um PWA
  console.log('Não é um PWA: navegador normal');
  return false;
}

/**
 * Registra o service worker para funcionalidades PWA
 * 
 * Esta função tenta registrar o service worker localizado em /service-worker.js
 * e lida com erros de maneira adequada.
 * 
 * @returns {Promise<ServiceWorkerRegistration | null>} A instância de registro ou null em caso de erro
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registrado com sucesso:', registration);
      return registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return null;
    }
  } else {
    console.warn('Service Workers não são suportados neste navegador.');
    return null;
  }
}

/**
 * Verifica e atualiza o service worker se necessário
 * 
 * Esta função verifica se há uma nova versão do service worker
 * e solicita ao usuário que atualize a página se necessário.
 * 
 * @param registration A instância de registro do service worker
 */
export function checkForServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
  // Verifica por atualizações do service worker a cada hora
  setInterval(() => {
    registration.update();
  }, 1000 * 60 * 60);
  
  // Adiciona um evento para lidar com atualizações do service worker
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

/**
 * Registra um evento para mostrar o prompt de instalação do PWA
 * 
 * Esta função escuta o evento beforeinstallprompt e armazena o evento
 * para ser usado posteriormente quando o usuário quiser instalar o PWA.
 * 
 * @param callback Função de callback que é chamada quando o evento beforeinstallprompt é disparado
 * @returns {() => void} Função para remover o event listener
 */
export function listenForInstallPrompt(callback: (event: any) => void): () => void {
  const handleBeforeInstallPrompt = (event: Event) => {
    // Previne o comportamento padrão
    event.preventDefault();
    
    // Passa o evento para o callback
    callback(event);
  };
  
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
  // Retorna uma função para remover o event listener
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
}