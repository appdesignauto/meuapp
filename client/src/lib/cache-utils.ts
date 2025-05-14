/**
 * Utilitários para lidar com o cache de forma agressiva
 * Este arquivo contém funções para ajudar a prevenir problemas de cache
 * no frontend e garantir que dados atualizados sejam sempre exibidos.
 */

import { queryClient } from './queryClient';

/**
 * Adiciona um timestamp como parâmetro de URL para evitar caching no navegador
 * @param url URL base para adicionar o timestamp
 * @returns URL com timestamp
 */
export function addTimestampToUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}timestamp=${Date.now()}`;
}

/**
 * Invalida agressivamente o cache de uma consulta e todas as consultas relacionadas
 * @param primaryQueryKey Chave primária da consulta a ser invalidada
 * @param relatedQueryKeys Lista de chaves relacionadas que também devem ser invalidadas
 * @param options Opções de configuração
 */
export function aggressiveQueryInvalidation(
  primaryQueryKey: string | string[],
  relatedQueryKeys: (string | string[])[] = [],
  options: {
    removeFirst?: boolean;
    refetchAfterInvalidation?: boolean;
    delay?: number;
  } = {}
) {
  const { 
    removeFirst = true, 
    refetchAfterInvalidation = true,
    delay = 200
  } = options;
  
  // Converter para array se for uma string
  const mainKey = Array.isArray(primaryQueryKey) ? primaryQueryKey : [primaryQueryKey];
  
  // Limpar o cache da consulta principal primeiro
  if (removeFirst) {
    queryClient.removeQueries({ queryKey: mainKey });
  }
  
  // Invalidar a consulta principal e forçar refetch
  if (refetchAfterInvalidation) {
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: mainKey,
        refetchType: 'all'
      });
      
      // Também invalidar consultas relacionadas
      relatedQueryKeys.forEach(key => {
        const keyArray = Array.isArray(key) ? key : [key];
        queryClient.invalidateQueries({ 
          queryKey: keyArray,
          refetchType: 'all'
        });
      });
    }, delay);
  } else {
    // Invalidar sem refetch
    queryClient.invalidateQueries({ 
      queryKey: mainKey,
      refetchType: 'none'
    });
    
    relatedQueryKeys.forEach(key => {
      const keyArray = Array.isArray(key) ? key : [key];
      queryClient.invalidateQueries({ 
        queryKey: keyArray,
        refetchType: 'none'
      });
    });
  }
}

/**
 * Função para resetar o estado do cache de uma query completamente,
 * removendo todos os dados e recarregando do zero.
 * 
 * @param queryKey Chave da query para resetar
 */
export function resetAndRefetchQuery(queryKey: string | string[]) {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  // Remover completamente a query do cache
  queryClient.removeQueries({ queryKey: key });
  
  // Forçar refetch com um pequeno atraso para garantir que a remoção foi concluída
  setTimeout(() => {
    queryClient.refetchQueries({ queryKey: key, type: 'all' });
  }, 200);
}

/**
 * Aplicar estratégia de cache zero com todas as otimizações possíveis
 * para garantir dados sempre atualizados
 */
export function setupZeroCacheStrategy() {
  // Configurar queryClient para zero staleTime global
  queryClient.setDefaultOptions({
    queries: {
      staleTime: 0,
      gcTime: 1000, // Tempo mínimo de garbage collection
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 2
    }
  });
  
  // Adicionar timestamp a todas as requisições
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string') {
      input = addTimestampToUrl(input);
    } else if (input instanceof Request) {
      const url = addTimestampToUrl(input.url);
      input = new Request(url, input);
    }
    return originalFetch(input, init);
  };
  
  console.log('Estratégia de cache zero configurada com sucesso');
}