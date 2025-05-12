/**
 * Utilitários para Progressive Web App (PWA)
 * 
 * Este arquivo contém funções para registro de service worker e outras
 * funcionalidades relacionadas ao PWA.
 */

/**
 * Registra o service worker se o navegador suportar
 */
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration.scope);
        })
        .catch(error => {
          console.log('Registro do Service Worker falhou:', error);
        });
    });
  } else {
    console.log('Service Worker não é suportado neste navegador');
  }
};

/**
 * Verifica se o aplicativo pode ser instalado como PWA
 * @param callback Função a ser chamada quando o evento beforeinstallprompt for disparado
 */
export const checkInstallable = (callback: (event: Event) => void) => {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevenir que o navegador mostre o prompt automaticamente
    event.preventDefault();
    
    // Armazenar o evento para usar posteriormente
    callback(event);
  });
};

/**
 * Instala o PWA usando o evento beforeinstallprompt armazenado
 * @param deferredPrompt Evento beforeinstallprompt armazenado
 * @returns Promise que resolve quando o usuário responde ao prompt de instalação
 */
export const installPWA = (deferredPrompt: any): Promise<boolean> => {
  return new Promise((resolve) => {
    // Mostrar o prompt de instalação
    deferredPrompt.prompt();
    
    // Esperar pela escolha do usuário
    deferredPrompt.userChoice.then((choiceResult: {outcome: string}) => {
      // Se o usuário aceitou instalar o app
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA');
        resolve(true);
      } else {
        console.log('Usuário recusou instalar o PWA');
        resolve(false);
      }
    });
  });
};

/**
 * Verifica se o aplicativo está sendo executado no modo standalone (instalado como PWA)
 * @returns true se estiver em modo standalone, false caso contrário
 */
export const isRunningAsPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};