/**
 * Script para forçar atualização do favicon no navegador
 */

function forceFaviconUpdate() {
  const timestamp = Date.now();
  
  // Remove todos os favicons existentes
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(link => link.remove());
  
  // Adiciona novos favicons com timestamp
  const favicons = [
    { rel: 'icon', type: 'image/x-icon', href: `/favicon.ico?v=${timestamp}` },
    { rel: 'shortcut icon', type: 'image/x-icon', href: `/favicon.ico?v=${timestamp}` },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: `/favicons/favicon-16x16.png?v=${timestamp}` },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: `/favicons/favicon-32x32.png?v=${timestamp}` },
    { rel: 'apple-touch-icon', sizes: '180x180', href: `/favicons/favicon-180x180.png?v=${timestamp}` }
  ];
  
  favicons.forEach(favicon => {
    const link = document.createElement('link');
    Object.keys(favicon).forEach(key => {
      link.setAttribute(key, favicon[key]);
    });
    document.head.appendChild(link);
  });
  
  console.log('Favicon atualizado com timestamp:', timestamp);
}

// Executa imediatamente
forceFaviconUpdate();