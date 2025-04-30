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
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
