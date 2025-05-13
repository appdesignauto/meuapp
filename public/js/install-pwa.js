/**
 * Script para gerenciar a instalação do PWA usando o padrão beforeinstallprompt
 * Este script segue as melhores práticas de instalação PWA conforme diretrizes do Google
 */

(function() {
  // Variável para armazenar o evento beforeinstallprompt
  let deferredPrompt;
  
  // Função que será chamada para mostrar o prompt de instalação
  window.installPWA = function() {
    if (!deferredPrompt) {
      console.log('Não há prompt de instalação disponível');
      return;
    }
    
    // Mostrar o prompt de instalação
    deferredPrompt.prompt();
    
    // Esperar pela resposta do usuário
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação do PWA');
        // Registrar evento de instalação (analytics)
        if (window.gtag) {
          window.gtag('event', 'pwa_install', {
            'event_category': 'pwa',
            'event_label': 'Instalação do PWA'
          });
        }
      } else {
        console.log('Usuário recusou a instalação do PWA');
      }
      
      // Limpar o prompt salvo para permitir que o evento aconteça novamente
      deferredPrompt = null;
      
      // Esconder o botão de instalação após a decisão
      hideInstallButton();
    });
  };
  
  // Função para mostrar o botão de instalação
  function showInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.style.display = 'flex';
    }
  }
  
  // Função para esconder o botão de instalação
  function hideInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }
  
  // Capturar o evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que o Chrome mostre automaticamente o diálogo de instalação
    e.preventDefault();
    
    // Armazenar o evento para poder disparar mais tarde
    deferredPrompt = e;
    
    // Mostrar o botão de instalação
    showInstallButton();
    
    // Registrar evento de disponibilidade de instalação (analytics)
    if (window.gtag) {
      window.gtag('event', 'pwa_installable', {
        'event_category': 'pwa',
        'event_label': 'PWA disponível para instalação'
      });
    }
  });
  
  // Detectar quando o PWA já está instalado
  window.addEventListener('appinstalled', (e) => {
    // Esconder o botão de instalação após a instalação
    hideInstallButton();
    
    // Registrar evento de instalação concluída (analytics)
    if (window.gtag) {
      window.gtag('event', 'pwa_installed', {
        'event_category': 'pwa',
        'event_label': 'PWA instalado com sucesso'
      });
    }
    
    console.log('PWA instalado com sucesso');
  });
})();