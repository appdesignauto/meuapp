import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook que faz com que a página role para o topo sempre que a rota muda
 * 
 * Exemplo de uso:
 * ```
 * function MyComponent() {
 *   useScrollTop();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useScrollTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant' // Comportamento instantâneo para evitar animação
    });
  }, [location]);
}

/**
 * Componente que faz com que a página role para o topo sempre que a rota muda
 * 
 * Exemplo de uso:
 * ```
 * <ScrollToTop />
 * ```
 */
export function ScrollToTop() {
  useScrollTop();
  return null;
}

export default useScrollTop;