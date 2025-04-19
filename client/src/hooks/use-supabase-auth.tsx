import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  email: string;
  name: string | null;
  profileimageurl: string | null;
  nivelacesso: string;
  role: string;
  [key: string]: any;
};

type RegisterUserData = {
  username: string;
  name: string;
  role?: string;
  nivelacesso?: string;
  origemassinatura?: string;
  [key: string]: any;
};

type SupabaseAuthContextType = {
  user: User | null;
  isLoading: boolean;
  loginError: string | null;
  registerError: string | null;
  resetPasswordError: string | null;
  clearErrors: () => void;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  registerWithEmailPassword: (email: string, password: string, userData: RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  getSession: () => Promise<any>;
  confirmEmail: (userId: string) => Promise<void>;
};

// Contexto para autenticação do Supabase
export const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

// Provider para autenticação do Supabase
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para erros específicos
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  
  // Limpar todos os erros
  const clearErrors = useCallback(() => {
    setLoginError(null);
    setRegisterError(null);
    setResetPasswordError(null);
  }, []);
  
  // Buscar dados do usuário atual
  const {
    data: user,
    isLoading: isUserLoading,
    error,
    refetch: refetchUser
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user");
        if (res.status === 401) {
          return null;
        }
        return await res.json();
      } catch (err) {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Login com email e senha via Supabase
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      clearErrors();
      const res = await apiRequest("POST", "/api/auth/supabase/login", { email, password });
      
      if (!res.ok) {
        const errorData = await res.json();
        // Tratamento específico para email não confirmado
        if (errorData.error?.code === 'email_not_confirmed') {
          throw new Error("Email não verificado.");
        }
        throw new Error(errorData.message || "Erro ao fazer login");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Login realizado com sucesso!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      setLoginError(error.message);
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Registro com email e senha via Supabase
  const registerMutation = useMutation({
    mutationFn: async ({ email, password, userData }: { email: string; password: string; userData: RegisterUserData }) => {
      clearErrors();
      const res = await apiRequest("POST", "/api/auth/supabase/register", {
        email,
        password,
        ...userData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao registrar usuário");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registro realizado com sucesso!",
        description: "Verifique seu email para confirmar sua conta.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      setRegisterError(error.message);
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Logout via Supabase
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/supabase/logout");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao fazer logout");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout realizado com sucesso!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Recuperação de senha via Supabase
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      clearErrors();
      const res = await apiRequest("POST", "/api/auth/supabase/reset-password", { email });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao enviar email de recuperação");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email de recuperação enviado!",
        description: "Verifique sua caixa de entrada.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      setResetPasswordError(error.message);
      toast({
        title: "Falha ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Atualização de senha via Supabase
  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const res = await apiRequest("POST", "/api/auth/supabase/update-password", { password: newPassword });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao atualizar senha");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada com sucesso!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Confirmação de email (para testes) via Supabase
  const confirmEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", "/api/auth/supabase/confirm-email", { userId });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao confirmar email");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email confirmado com sucesso!",
        description: "Agora você pode fazer login.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao confirmar email",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Obter sessão atual do Supabase
  const getSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/auth/supabase/session");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao obter sessão");
      }
      
      return await res.json();
    },
  });
  
  // Funções wrapper para expor na API do hook
  const loginWithEmailPassword = useCallback(async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);
  
  const registerWithEmailPassword = useCallback(async (email: string, password: string, userData: RegisterUserData) => {
    await registerMutation.mutateAsync({ email, password, userData });
  }, [registerMutation]);
  
  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);
  
  const resetPassword = useCallback(async (email: string) => {
    await resetPasswordMutation.mutateAsync(email);
  }, [resetPasswordMutation]);
  
  const updatePassword = useCallback(async (newPassword: string) => {
    await updatePasswordMutation.mutateAsync(newPassword);
  }, [updatePasswordMutation]);
  
  const getSession = useCallback(async () => {
    return await getSessionMutation.mutateAsync();
  }, [getSessionMutation]);
  
  const confirmEmail = useCallback(async (userId: string) => {
    await confirmEmailMutation.mutateAsync(userId);
  }, [confirmEmailMutation]);
  
  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        isLoading: isUserLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
        loginError,
        registerError,
        resetPasswordError,
        clearErrors,
        loginWithEmailPassword,
        registerWithEmailPassword,
        logout,
        resetPassword,
        updatePassword,
        getSession,
        confirmEmail,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// Hook para usar a autenticação do Supabase
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth deve ser usado dentro de um SupabaseAuthProvider");
  }
  return context;
}