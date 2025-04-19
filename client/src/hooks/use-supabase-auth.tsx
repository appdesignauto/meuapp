import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

type SupabaseAuthContextType = {
  session: SupabaseSession | null;
  isLoading: boolean;
  error: Error | null;
  loginWithSupabase: (email: string, password: string) => Promise<any>;
  registerWithSupabase: (email: string, password: string, name?: string, username?: string) => Promise<any>;
  resetPasswordWithSupabase: (email: string) => Promise<any>;
  logoutWithSupabase: () => Promise<any>;
  updatePasswordWithSupabase: (password: string) => Promise<any>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<SupabaseSession | null>(null);

  // Verificar se existe uma sessão do Supabase
  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ['/api/auth/supabase/session'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/supabase/session');
        if (!response.ok) {
          console.log("Sem sessão ativa do Supabase");
          return null;
        }
        const data = await response.json();
        return data.success && data.session ? data.session : null;
      } catch (error) {
        console.log("Erro ao verificar sessão do Supabase:", error);
        return null;
      }
    },
    retry: false
  });

  // Atualizar o estado da sessão quando os dados mudarem
  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
    }
  }, [sessionData]);

  // Login com Supabase
  const loginWithSupabase = async (email: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/supabase/login', { email, password });
      const data = await response.json();

      if (!data.success) {
        // Criando mensagem de erro específica baseada no tipo de erro
        let errorMessage = data.message || 'Falha ao fazer login';
        
        if (data.error?.code === 'invalid_credentials') {
          errorMessage = 'Email ou senha incorretos. Se você ainda não tem uma conta, faça o cadastro primeiro.';
        } else if (data.error?.code === 'user_not_found') {
          errorMessage = 'Usuário não encontrado. Por favor, registre-se primeiro.';
        }
        
        throw new Error(errorMessage);
      }

      // Armazenar a sessão
      if (data.session) {
        setSession(data.session);
      }

      // Atualizar os dados do usuário
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });

      toast({
        title: 'Login realizado com sucesso',
        description: 'Bem-vindo de volta!',
        variant: 'default',
      });

      return data;
    } catch (error: any) {
      console.error('Erro no login com Supabase:', error);
      
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Verifique suas credenciais e tente novamente',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  // Registro com Supabase
  const registerWithSupabase = async (email: string, password: string, name?: string, username?: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/supabase/register', { 
        email, 
        password, 
        name, 
        username 
      });
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Falha ao registrar usuário');
      }

      // Atualizar os dados do usuário
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });

      toast({
        title: 'Registro realizado com sucesso',
        description: 'Sua conta foi criada com sucesso',
        variant: 'default',
      });

      return data;
    } catch (error: any) {
      console.error('Erro no registro com Supabase:', error);
      
      toast({
        title: 'Erro ao registrar usuário',
        description: error.message || 'Verifique os dados informados e tente novamente',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  // Resetar senha
  const resetPasswordWithSupabase = async (email: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/supabase/reset-password', { email });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Falha ao enviar email de recuperação');
      }

      toast({
        title: 'Email enviado',
        description: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha',
        variant: 'default',
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao resetar senha com Supabase:', error);
      
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Não foi possível processar sua solicitação',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  // Logout
  const logoutWithSupabase = async () => {
    try {
      const response = await apiRequest('POST', '/api/auth/supabase/logout');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Falha ao fazer logout');
      }

      // Limpar a sessão
      setSession(null);

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });

      toast({
        title: 'Logout realizado',
        description: 'Você saiu da sua conta com sucesso',
        variant: 'default',
      });

      return data;
    } catch (error: any) {
      console.error('Erro no logout com Supabase:', error);
      
      toast({
        title: 'Erro ao fazer logout',
        description: error.message || 'Não foi possível completar o logout',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  // Atualizar senha
  const updatePasswordWithSupabase = async (password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/supabase/update-password', { password });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Falha ao atualizar senha');
      }

      toast({
        title: 'Senha atualizada',
        description: 'Sua senha foi atualizada com sucesso',
        variant: 'default',
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar senha com Supabase:', error);
      
      toast({
        title: 'Erro ao atualizar senha',
        description: error.message || 'Não foi possível atualizar sua senha',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        session,
        isLoading,
        error,
        loginWithSupabase,
        registerWithSupabase,
        resetPasswordWithSupabase,
        logoutWithSupabase,
        updatePasswordWithSupabase,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth deve ser usado dentro de um SupabaseAuthProvider');
  }
  return context;
}