import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { performanceMonitor } from "./performanceMonitor";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      // Tentar analisar o corpo da resposta como JSON
      const text = await res.text();
      if (text) {
        try {
          const errorData = JSON.parse(text);
          // Extrair a mensagem de erro do objeto JSON se disponível
          if (errorData && typeof errorData === 'object') {
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error && errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          }
        } catch (e) {
          // Se não for JSON, usar o texto como está
          errorMessage = text;
        }
      }
    } catch (e) {
      // Em caso de erro ao processar a resposta
      console.error("Erro ao processar resposta de erro:", e);
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { isFormData?: boolean, skipContentType?: boolean }
): Promise<Response> {
  const startTime = performance.now();
  const timestamp = Date.now();
  const finalUrl = url.includes('?') 
    ? `${url}&_t=${timestamp}` 
    : `${url}?_t=${timestamp}`;
  
  // Configuração padrão para requisições com cabeçalhos anti-cache
  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Timestamp': timestamp.toString()
    }
  };

  // Se temos dados para enviar
  if (data) {
    // Se é FormData ou skipContentType é true, não definimos Content-Type
    if (data instanceof FormData || options?.isFormData) {
      fetchOptions.body = data instanceof FormData ? data : data as FormData;
    } else {
      // Para dados JSON normais
      if (!options?.skipContentType) {
        fetchOptions.headers = { 
          ...fetchOptions.headers,
          "Content-Type": "application/json" 
        };
      }
      // Adicionar timestamp aos dados para evitar cache
      const dataWithTimestamp = typeof data === 'object' && data !== null 
        ? { ...data as object, _timestamp: timestamp } 
        : data;
      
      fetchOptions.body = JSON.stringify(dataWithTimestamp);
    }
  }

  // Log de API apenas em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`[API] Fazendo requisição para ${finalUrl} com anti-cache`);
  }
  
  try {
    // Usar a URL com parâmetros anti-cache
    const res = await fetch(finalUrl, fetchOptions);
    const duration = performance.now() - startTime;
    performanceMonitor.recordRequestTime(`${method} ${url}`, duration);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.recordRequestTime(`${method} ${url}`, duration);
    performanceMonitor.recordError(error as Error, `Mutation: ${method} ${url}`);
    
    // Tratamento robusto de erros de conectividade
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`[API] Erro de conectividade para ${finalUrl}:`, error.message);
      throw new Error(`Falha na conexão. Verifique sua conexão com a internet e tente novamente.`);
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[API] Requisição cancelada para ${finalUrl}`);
      throw new Error(`Requisição cancelada. Tente novamente.`);
    }
    
    // Re-throw outros erros sem modificação
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Pegar a URL base e os parâmetros de consulta
    const endpoint = queryKey[0] as string;
    const params = queryKey[1] as Record<string, any> || {};
    const startTime = performance.now();
    
    try {
      // Construir URL com parâmetros de consulta
      const url = new URL(endpoint, window.location.origin);
      
      // Adicionar parâmetros à URL
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
      
      // Adicionar timestamp para evitar cache do navegador
      url.searchParams.append('_cache_buster', Date.now().toString());
      
      console.log("Fazendo requisição para:", url.toString(), "com parâmetros:", params);
      
      const res = await fetch(url.toString(), {
        credentials: "include",
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.recordRequestTime(endpoint, duration);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordRequestTime(endpoint, duration);
      performanceMonitor.recordError(error as Error, `Query: ${endpoint}`);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Refetch a cada 30 segundos (menos agressivo)
      refetchOnWindowFocus: true, 
      refetchOnMount: true, 
      refetchOnReconnect: true, 
      staleTime: 5000, // 5 segundos antes de considerar dados obsoletos
      retry: (failureCount, error) => {
        // Retry até 2 vezes para erros de rede
        if (failureCount < 2 && error instanceof TypeError) {
          return true;
        }
        return false;
      },
      gcTime: 5 * 60 * 1000, // 5 minutos de garbage collection
    },
    mutations: {
      retry: (failureCount, error) => {
        // Retry uma vez para erros de rede em mutations
        if (failureCount < 1 && error instanceof TypeError) {
          return true;
        }
        return false;
      },
    },
  },
});

// Cache de sincronização para comentários
// Este sistema permite que ações no painel admin sejam sincronizadas com o frontend
export interface CommentSyncEvent {
  type: 'delete' | 'hide' | 'show';
  commentId: number;
  lessonId: number;
  timestamp: number;
}

// Função para disparar um evento de sincronização
export const triggerCommentSyncEvent = (event: CommentSyncEvent) => {
  // Armazenar o evento no cache de sincronização
  const currentEvents = queryClient.getQueryData<CommentSyncEvent[]>(['commentSyncEvents']) || [];
  queryClient.setQueryData(['commentSyncEvents'], [...currentEvents, event]);
  
  // Invalidar a consulta específica da aula afetada
  queryClient.invalidateQueries({ queryKey: ['/api/video-comments', event.lessonId] });
};
