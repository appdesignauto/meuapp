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
  verifyEmailMutation: UseMutationResult<any, Error, VerifyEmailData>;
  resendVerificationMutation: UseMutationResult<any, Error, void>;
};

type LoginData = {
  username: string;
  password: string;
  rememberMe?: boolean;
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
      console.log("Enviando credenciais de login:", credentials);
      const res = await apiRequest('POST', '/api/login', credentials);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Erro na resposta de login:", res.status, errorData);
        throw new Error(errorData.message || "Falha na autenticação. Verifique suas credenciais.");
      }
      
      const userData = await res.json();
      console.log("Login bem-sucedido:", userData);
      return userData;
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
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao registrar usuário");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/user'], user);
      toast({
        title: "Registro realizado com sucesso",
        description: `Bem-vindo, ${user.name || user.username}!`,
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
      await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
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
        registerMutation,
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
  return context;
}