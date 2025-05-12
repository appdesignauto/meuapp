import { useState, useEffect } from 'react';

interface UseOptimizedImageOptions {
  quality?: number;      // Qualidade da imagem (1-100)
  priority?: boolean;    // Se a imagem tem prioridade alta
  placeholder?: boolean; // Se deve mostrar placeholder durante carregamento
}

/**
 * Hook para otimizar carregamento e exibição de imagens
 * 
 * Características:
 * - Pré-carregamento de imagens
 * - Carregamento progressivo
 * - Tratamento de erros
 * - Suporte a prioridade
 */
export function useOptimizedImage(
  src: string, 
  options: UseOptimizedImageOptions = {}
) {
  const {
    quality = 90,
    priority = false,
    placeholder = true
  } = options;
  
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Gera URL otimizada se houver parâmetros de qualidade
  const optimizedSrc = src.includes('?') 
    ? src 
    : `${src}${quality < 100 ? `?quality=${quality}` : ''}`;
  
  // Pré-carrega a imagem para garantir que esteja em cache
  useEffect(() => {
    if (!src || !window.requestIdleCallback) return;
    
    // Baixa prioridade: carrega durante tempo ocioso
    if (!priority) {
      const id = window.requestIdleCallback(() => {
        preloadImage(optimizedSrc);
      }, { timeout: 2000 });
      
      return () => window.cancelIdleCallback(id);
    }
    
    // Alta prioridade: carrega imediatamente
    preloadImage(optimizedSrc);
  }, [optimizedSrc, priority]);
  
  // Função para pré-carregar imagem
  const preloadImage = (url: string) => {
    const img = new Image();
    
    img.onload = () => {
      setLoaded(true);
    };
    
    img.onerror = (e) => {
      console.error(`Erro ao carregar imagem: ${url}`, e);
      setError(new Error(`Falha ao carregar imagem: ${url}`));
    };
    
    // Adiciona atributos para melhorar carregamento
    if (priority) {
      // img.fetchPriority = 'high'; // Propriedade não disponível em todos os navegadores
    }
    
    img.decoding = 'async';
    img.src = url;
  };
  
  return {
    src: optimizedSrc,
    loaded,
    error,
    // Atributos HTML otimizados para a tag img
    imgAttributes: {
      src: optimizedSrc,
      loading: priority ? 'eager' : 'lazy',
      decoding: 'async' as const,
      // fetchPriority: priority ? 'high' : 'auto', // Propriedade não disponível em todos os navegadores
    }
  };
}

// Tipagens adicionais para requestIdleCallback
declare global {
  interface Window {
    requestIdleCallback: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
    cancelIdleCallback: (handle: number) => void;
  }
}

export default useOptimizedImage;