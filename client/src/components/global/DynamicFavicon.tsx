import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Componente que carrega e atualiza dinamicamente o favicon do site
 * com base nas configurações salvas no banco de dados.
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
    // Função para atualizar o favicon
    const updateFavicon = (url: string) => {
      setFaviconUrl(url);
      
      // Encontrar links de favicon existentes e removê-los
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());
      
      // Criar um novo elemento link para o favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = url;
      
      // Determinar o tipo com base na extensão
      if (url.endsWith('.ico') || url.includes('.ico?')) {
        link.type = 'image/x-icon';
      } else if (url.endsWith('.png') || url.includes('.png?')) {
        link.type = 'image/png';
      } else if (url.endsWith('.svg') || url.includes('.svg?')) {
        link.type = 'image/svg+xml';
      } else {
        link.type = 'image/png'; // Tipo padrão
      }
      
      // Adicionar o link ao head
      document.head.appendChild(link);
      
      console.log('Favicon atualizado:', url);
    };

    // Se os dados estiverem carregados
    if (!isLoading) {
      if (settings?.faviconUrl) {
        // Adicionar timestamp para evitar cache
        const url = `${settings.faviconUrl}?t=${Date.now()}`;
        updateFavicon(url);
      } else {
        // Fallback para o favicon padrão se não houver um personalizado
        updateFavicon(`/favicon.ico?t=${Date.now()}`);
      }
    }
  }, [settings?.faviconUrl, isLoading]);

  // Este componente não renderiza nada visível
  return null;
}

export default DynamicFavicon;