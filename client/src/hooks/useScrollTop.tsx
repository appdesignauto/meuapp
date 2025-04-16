import { useEffect } from 'react';

// Hook para garantir que a página inicie no topo ao navegar para uma nova rota
export default function useScrollTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}

// Componente para uso em App.tsx para rolar para o topo em mudanças de rota
export function ScrollToTop() {
  useEffect(() => {
    // Função para rolar para o topo quando o componente é montado
    window.scrollTo(0, 0);
    
    // Opcional: Adicionar um event listener para mudanças na rota
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };
    
    // Listener para mudanças de URL (simplificado)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return null;
}