import { useState, useEffect } from 'react';

/**
 * Hook personalizado para aplicar debounce em um valor
 * 
 * @param value Valor a ser aplicado o debounce
 * @param delay Tempo de espera em milissegundos (padrão: 500ms)
 * @returns Valor após o debounce
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar o temporizador para atualizar o valor com atraso
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar o temporizador se o valor mudar antes do tempo de debounce
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;