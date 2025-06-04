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
    // Check if user is already logged in with faster timeout
    async function checkAuth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const res = await fetch('/api/user', { 
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Auth check failed:', error);
        }
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
    // Clear user state immediately for responsive UI
    setUser(null);
    setIsLoading(true);
    
    try {
      // Set a timeout for the logout request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      clearTimeout(timeoutId);
      
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado.",
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Logout failed:', error);
        toast({
          title: "Falha no logout",
          description: "Você foi desconectado localmente.",
        });
      } else {
        // Even if logout times out, user is already cleared locally
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado.",
        });
      }
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
