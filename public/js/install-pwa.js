// Variável para armazenar o evento beforeinstallprompt
let deferredPrompt;

// Registrar o service worker apenas se API estiver disponível no navegador
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => console.log('PWA ativo'))
      .catch(err => console.error('Erro ao registrar SW', err));
  });
}

// Capturar o evento beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Impedir que o mini-infobanner apareça no mobile
  e.preventDefault();
  // Armazenar o evento para uso posterior
  deferredPrompt = e;
  // Mostrar o botão de instalação apenas quando o evento for detectado
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  if (pwaInstallBtn) {
    pwaInstallBtn.style.display = 'block';
  }
});

// Função para instalar o PWA quando o botão for clicado
function installPWA() {
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  
  // Verificar se o evento foi armazenado
  if (!deferredPrompt) {
    // Se não tiver o evento, o app já está instalado ou não é instalável
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'none';
    }
    return;
  }
  
  // Exibir o prompt de instalação
  deferredPrompt.prompt();
  
  // Esperar pela escolha do usuário
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('Usuário aceitou a instalação do PWA');
    } else {
      console.log('Usuário recusou a instalação do PWA');
    }
    // Limpar a variável, pois o prompt só pode ser usado uma vez
    deferredPrompt = null;
    
    // Esconder o botão após a decisão
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'none';
    }
  });
}

// Quando PWA já estiver instalado, esconder o botão
window.addEventListener('appinstalled', () => {
  // Limpar o evento
  deferredPrompt = null;
  
  // Esconder o botão
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  if (pwaInstallBtn) {
    pwaInstallBtn.style.display = 'none';
  }
});