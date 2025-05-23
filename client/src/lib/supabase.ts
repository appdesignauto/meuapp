import { apiRequest } from "./queryClient";

export async function getSupabaseToken(): Promise<string | null> {
  try {
    console.log('[SUPABASE] Tentando obter token...');
    const response = await fetch("/api/auth/supabase/session", {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache"
      }
    });
    
    if (!response.ok) {
      console.error('[SUPABASE] Erro ao obter sessão:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('[SUPABASE] Resposta da API:', data);
    return data.session?.access_token || null;
  } catch (error) {
    console.error('[SUPABASE] Erro ao obter token:', error);
    return null;
  }
} 