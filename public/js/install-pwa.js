/**
 * Script para gerenciar a instalação do PWA de forma padronizada
 * Este script segue as melhores práticas para instalação de PWAs
 */

let deferredPrompt;

// Detecta quando o navegador permite instalar o PWA
window.addEventListener('beforeinstallprompt', (e) => {
  // Previne o comportamento padrão para personalizar a experiência
  e.preventDefault();
  
  // Armazena o evento para uso posterior
  deferredPrompt = e;
  console.log('PWA instalável detectado! O evento beforeinstallprompt foi capturado.');

  // Mostra o botão personalizado apenas quando o PWA pode ser instalado
  const installBtn = document.querySelector('#pwa-install-btn');
  if (installBtn) {
    installBtn.style.display = 'inline-block';
  }
});

// Escuta o evento de quando o PWA é instalado
window.addEventListener('appinstalled', () => {
  console.log('PWA foi instalado com sucesso!');
  
  // Esconde o botão de instalação
  const installBtn = document.querySelector('#pwa-install-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
  
  // Limpa a referência ao prompt
  deferredPrompt = null;
});

// Função que será chamada quando o botão de instalação for clicado
function installPWA() {
  // Verifica se o deferredPrompt está disponível
  if (!deferredPrompt) {
    console.log('Não é possível instalar o PWA agora. Nenhum prompt disponível.');
    return;
  }
  
  // Desabilita o botão para evitar múltiplos cliques
  const installBtn = document.querySelector('#pwa-install-btn');
  if (installBtn) {
    installBtn.disabled = true;
  }
  
  // Mostra o prompt de instalação
  deferredPrompt.prompt();
  
  // Espera pela escolha do usuário
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('Usuário aceitou instalar o PWA');
    } else {
      console.log('Usuário recusou instalar o PWA');
      
      // Reabilita o botão se o usuário recusar
      if (installBtn) {
        installBtn.disabled = false;
      }
    }
    
    // Limpa a referência ao prompt, já que só pode ser usado uma vez
    deferredPrompt = null;
  });
}

// Inicializa o componente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se estamos rodando dentro de um PWA já instalado
  const isRunningAsPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.matchMedia('(display-mode: fullscreen)').matches || 
           window.matchMedia('(display-mode: minimal-ui)').matches ||
           (window.navigator && window.navigator.standalone === true);
  };
  
  // Se já estiver rodando como PWA, não mostra o botão
  if (isRunningAsPWA()) {
    console.log('Executando como PWA instalado. Não mostrando botão de instalação.');
    const installBtn = document.querySelector('#pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  } else {
    console.log('Executando no navegador normal. Botão de instalação poderá ser mostrado se PWA for instalável.');
    // O botão só será mostrado se o evento beforeinstallprompt for disparado
  }
});