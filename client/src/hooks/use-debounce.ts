import { useState, useEffect } from 'react';

/**
 * Hook personalizado para aplicar um debounce em um valor.
 * Útil para evitar atualizações frequentes em situações como pesquisa em tempo real.
 * 
 * @param value O valor a ser "debounced"
 * @param delay O tempo de atraso em milissegundos
 * @returns O valor após o período de debounce
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura um timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timer se o valor ou delay mudarem antes do timeout
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;