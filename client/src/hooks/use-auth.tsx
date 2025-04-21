import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "../types";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username?: string;
  email: string;
  password: string;
  name: string;
  nivelacesso?: "usuario" | "premium" | "designer" | "designer_adm" | "suporte" | "admin";
  role?: "usuario" | "premium" | "designer" | "designer_adm" | "suporte" | "admin";
  plan?: "free" | "premium" | "enterprise";
  periodType?: "mensal" | "anual" | "vitalicio";
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user');
        if (res.status === 401) {
          return null;
        }
        return await res.json();
      } catch (error) {
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha na autenticação. Verifique suas credenciais.");
      }
      
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/user'], user);
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest('POST', '/api/register', credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha no registro. Tente novamente.");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Após o registro, definimos o usuário automaticamente como verificado
      queryClient.setQueryData(['/api/user'], data);
      
      toast({
        title: "Cadastro realizado",
        description: "Sua conta foi criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout');
      if (!res.ok) {
        throw new Error("Falha ao fazer logout");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      
      // Redirecionar para a página inicial após logout
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  // Função auxiliar para facilitar o login
  const login = async (username: string, password: string) => {
    return await context.loginMutation.mutateAsync({ 
      username, 
      password
    });
  };

  // Função auxiliar para facilitar o logout
  const logout = async () => {
    return await context.logoutMutation.mutateAsync();
  };

  return {
    ...context,
    login,
    logout
  };
}