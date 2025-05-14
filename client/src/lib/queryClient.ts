import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  // Configuração padrão para requisições
  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {}
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
      fetchOptions.body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, fetchOptions);
  await throwIfResNotOk(res);
  return res;
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
    
    // Construir URL com parâmetros de consulta
    const url = new URL(endpoint, window.location.origin);
    
    // Adicionar parâmetros à URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
    
    console.log("Fazendo requisição para:", url.toString(), "com parâmetros:", params);
    
    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Atualizado para true para melhorar sincronização
      staleTime: 0, // Modificado para 0 (zero) para prevenir problemas de cache
      retry: false,
      gcTime: 1000 * 60 * 5, // 5 minutos de cache máximo
    },
    mutations: {
      retry: false,
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
