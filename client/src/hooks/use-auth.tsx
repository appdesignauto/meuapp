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

type VerifyEmailData = {
  code: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
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
    retry: 1,
    retryDelay: 500,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos - gcTime substitui cacheTime na v5
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: 'always',
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Enviando credenciais de login:", credentials);
      try {
        // O apiRequest já lançará erro com a mensagem extraída do JSON
        const res = await apiRequest('POST', '/api/login', credentials);
        const userData = await res.json();
        console.log("Login bem-sucedido:", userData);
        return userData;
      } catch (error) {
        console.error("Erro de login:", error);
        throw error; // Preserva o erro original para que seja usado no formato correto
      }
    },
    onSuccess: (user: User) => {
      // Atualizar imediatamente o cache do usuário
      queryClient.setQueryData(['/api/user'], user);
      
      // Invalidar outras queries relacionadas para refresh rápido
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      
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
      try {
        // O apiRequest já lançará erro com a mensagem extraída do JSON
        const res = await apiRequest('POST', '/api/register', credentials);
        const userData = await res.json();
        console.log("Registro bem-sucedido:", userData);
        return userData;
      } catch (error) {
        console.error("Erro de registro:", error);
        throw error; // Preserva o erro original para que seja usado no formato correto
      }
    },
    onSuccess: (response) => {
      if (response.success) {
        // Se tiver um usuário na resposta, atualize o estado
        if (response.user) {
          queryClient.setQueryData(['/api/user'], response.user);
        }
        
        // Verifica se foi enviado um email para verificação
        if (response.verificationSent) {
          toast({
            title: "Registro realizado com sucesso",
            description: "Enviamos um código de verificação para seu e-mail. Por favor, verifique sua caixa de entrada.",
          });
        } else {
          toast({
            title: "Registro realizado com sucesso",
            description: `Bem-vindo, ${response.user?.name || response.user?.username || 'novo usuário'}!`,
          });
        }
      } else {
        toast({
          title: "Registro realizado, mas com problemas",
          description: response.message || "Registro parcialmente concluído. Entre em contato com o suporte.",
          variant: "destructive",
        });
      }
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
  
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailData) => {
      try {
        // O apiRequest já lançará erro com a mensagem extraída do JSON
        const res = await apiRequest('POST', '/api/email-verification/verify', data);
        const responseData = await res.json();
        console.log("Verificação de e-mail bem-sucedida:", responseData);
        return responseData;
      } catch (error) {
        console.error("Erro na verificação de e-mail:", error);
        throw error; // Preserva o erro original para que seja usado no formato correto
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "E-mail verificado com sucesso",
        description: "Sua conta foi ativada e você já pode acessar todos os recursos.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha na verificação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      try {
        // O apiRequest já lançará erro com a mensagem extraída do JSON
        const res = await apiRequest('POST', '/api/email-verification/send');
        const responseData = await res.json();
        console.log("Reenvio de código bem-sucedido:", responseData);
        return responseData;
      } catch (error) {
        console.error("Erro ao reenviar código:", error);
        throw error; // Preserva o erro original para que seja usado no formato correto
      }
    },
    onSuccess: () => {
      toast({
        title: "Código reenviado",
        description: "Um novo código de verificação foi enviado para seu e-mail.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao reenviar código",
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
        verifyEmailMutation,
        resendVerificationMutation
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