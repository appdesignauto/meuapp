import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Função para atualizar o estado com base no media query
    const updateMatches = () => setMatches(mediaQuery.matches);
    
    // Definir o estado inicial
    updateMatches();
    
    // Adicionar listener para mudanças
    mediaQuery.addEventListener('change', updateMatches);
    
    // Limpeza
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);

  return matches;
}