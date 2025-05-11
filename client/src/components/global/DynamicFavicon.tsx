import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Componente que carrega e atualiza dinamicamente o favicon do site
 * com base nas configurações salvas no banco de dados, seguindo as
 * melhores práticas de grandes sites.
 */
function DynamicFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  
  // Carregar as configurações do site
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/site-settings'],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  useEffect(() => {
    // Função para atualizar os favicons para todos os formatos
    const updateFavicons = (url: string) => {
      setFaviconUrl(url);
      
      // Cache-busting para garantir que a nova imagem seja carregada
      const timestamp = Date.now();
      const cacheBuster = `?t=${timestamp}&r=${Math.random().toString(36).substring(2, 9)}`;
      
      // Determinar o tipo de arquivo
      let fileType = 'image/png'; // Tipo padrão
      let isIco = false;
      let isSvg = false;
      
      if (url.endsWith('.ico') || url.includes('.ico?')) {
        fileType = 'image/x-icon';
        isIco = true;
      } else if (url.endsWith('.svg') || url.includes('.svg?')) {
        fileType = 'image/svg+xml';
        isSvg = true;
      }
      
      // URL com cache-busting
      const urlWithCache = `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
      
      // Remover favicons antigos
      const existingFavicons = document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]');
      existingFavicons.forEach(favicon => favicon.remove());
      
      // Remover meta tags antigas relacionadas com a cor
      const existingMetaTags = document.querySelectorAll('meta[name="theme-color"], meta[name="msapplication-TileColor"], meta[name="msapplication-TileImage"]');
      existingMetaTags.forEach(meta => meta.remove());
      
      // Criar novos elementos para cada tipo de favicon
      
      // Favicon padrão
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = fileType;
      favicon.href = urlWithCache;
      document.head.appendChild(favicon);
      
      // Shortcut icon (para IE)
      const shortcutIcon = document.createElement('link');
      shortcutIcon.rel = 'shortcut icon';
      shortcutIcon.type = fileType;
      shortcutIcon.href = urlWithCache;
      document.head.appendChild(shortcutIcon);
      
      // Se não for SVG, adicionar também formatos para iOS/Android
      if (!isSvg) {
        // Apple Touch Icons (para iOS)
        const appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = urlWithCache;
        document.head.appendChild(appleIcon);
        
        // Apple Touch Icon com tamanho (para iOS)
        const appleSizedIcon = document.createElement('link');
        appleSizedIcon.rel = 'apple-touch-icon';
        appleSizedIcon.sizes = '180x180';
        appleSizedIcon.href = urlWithCache;
        document.head.appendChild(appleSizedIcon);
        
        // Ícones PNG para diferentes tamanhos
        const icon32 = document.createElement('link');
        icon32.rel = 'icon';
        icon32.type = 'image/png';
        icon32.sizes = '32x32';
        icon32.href = urlWithCache;
        document.head.appendChild(icon32);
        
        const icon16 = document.createElement('link');
        icon16.rel = 'icon';
        icon16.type = 'image/png';
        icon16.sizes = '16x16';
        icon16.href = urlWithCache;
        document.head.appendChild(icon16);
      }
      
      // Meta tags de cor
      if (settings?.primaryColor) {
        // Theme color para navegadores móveis
        const themeColor = document.createElement('meta');
        themeColor.name = 'theme-color';
        themeColor.content = settings.primaryColor;
        document.head.appendChild(themeColor);
        
        // MS Application Tile Color (para Windows)
        const msTileColor = document.createElement('meta');
        msTileColor.name = 'msapplication-TileColor';
        msTileColor.content = settings.primaryColor;
        document.head.appendChild(msTileColor);
        
        // MS Application Tile Image (para Windows)
        const msTileImage = document.createElement('meta');
        msTileImage.name = 'msapplication-TileImage';
        msTileImage.content = urlWithCache;
        document.head.appendChild(msTileImage);
      }
      
      console.log('Favicons atualizados:', urlWithCache);
    };

    // Se os dados estiverem carregados
    if (!isLoading) {
      if (settings?.faviconUrl) {
        // Usar a URL do favicon das configurações
        updateFavicons(settings.faviconUrl);
      } else {
        // Fallback para o favicon padrão se não houver um personalizado
        updateFavicons(`/favicon.ico`);
      }
    }
  }, [settings?.faviconUrl, settings?.primaryColor, isLoading]);

  // Este componente não renderiza nada visível
  return null;
}

export default DynamicFavicon;