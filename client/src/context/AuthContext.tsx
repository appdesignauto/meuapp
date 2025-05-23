import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string, name?: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  userRole: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    async function checkAuth() {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/login', { username, password });
      const userData = await res.json();
      setUser(userData);
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao DesignAuto App!",
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Falha no login",
        description: "Usuário ou senha incorretos.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string, email: string, name?: string, phone?: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/register', { 
        username, 
        password, 
        email,
        name,
        phone,
        role: 'free', // Default role for new users
        origemassinatura: 'Auto Cadastro', // Indicando que o usuário se cadastrou pelo site
        nivelacesso: 'usuario', // Nível de acesso padrão
        isActive: true
      });
      const userData = await res.json();
      setUser(userData);
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso! Enviamos um email de boas-vindas.",
        variant: "success",
      });
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: "Falha no registro",
        description: "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/logout', {});
      setUser(null);
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado.",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Falha no logout",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userRole: (user?.role || 'visitor') as UserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
