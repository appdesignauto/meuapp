
/**
 * Configuração otimizada de cache para React Query
 * Evita requisições excessivas e melhora performance
 */

export const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutos
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchInterval: false,
  retry: 1,
  retryDelay: 1000,
  networkMode: 'offlineFirst'
};

export const authQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 1000 * 60 * 30, // 30 minutos para dados de usuário
};

export const siteSettingsQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 1000 * 60 * 60, // 1 hora para configurações do site
};
