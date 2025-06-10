import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Hook para garantir que a página inicie no topo ao navegar para uma nova rota
export default function useScrollTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}

// Componente para uso em App.tsx para rolar para o topo em mudanças de rota
export function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Scroll para o topo sempre que a localização mudar
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}