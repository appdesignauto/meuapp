/**
 * Componente de guarda para restringir acesso com base no nível de acesso do usuário
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'wouter';

type NivelAcesso = 'visitante' | 'usuario' | 'premium' | 'designer' | 'designer_adm' | 'suporte' | 'admin';

interface UserPermissionGuardProps {
  children: React.ReactNode;
  requiredRole: NivelAcesso;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function UserPermissionGuard({ 
  children, 
  requiredRole, 
  fallback,
  redirectTo = '/auth'
}: UserPermissionGuardProps) {
  const [_, navigate] = useNavigate();
  
  // Buscar informações do usuário logado
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user');
        return await res.json();
      } catch (error) {
        // Se o usuário não estiver autenticado, redirecionar para página de login
        if (redirectTo) {
          navigate(redirectTo);
        }
        throw error;
      }
    }
  });
  
  // Verificar nível de acesso do usuário
  const hasPermission = () => {
    if (!user) return false;
    
    // Usuários admin sempre têm acesso
    if (user.nivelacesso === 'admin') return true;
    
    // Designer adm pode acessar áreas de designer e abaixo
    if (user.nivelacesso === 'designer_adm' && 
        ['designer', 'premium', 'usuario', 'visitante'].includes(requiredRole)) {
      return true;
    }
    
    // Suporte pode acessar áreas de suporte e abaixo
    if (user.nivelacesso === 'suporte' && 
        ['premium', 'usuario', 'visitante'].includes(requiredRole)) {
      return true;
    }
    
    // Designer pode acessar áreas de designer e abaixo
    if (user.nivelacesso === 'designer' && 
        ['premium', 'usuario', 'visitante'].includes(requiredRole)) {
      return true;
    }
    
    // Premium pode acessar áreas de premium e abaixo
    if (user.nivelacesso === 'premium' && 
        ['usuario', 'visitante'].includes(requiredRole)) {
      return true;
    }
    
    // Usuário pode acessar áreas de usuário e abaixo
    if (user.nivelacesso === 'usuario' && requiredRole === 'visitante') {
      return true;
    }
    
    // Visitante só pode acessar áreas de visitante
    if (user.nivelacesso === 'visitante' && requiredRole === 'visitante') {
      return true;
    }
    
    return user.nivelacesso === requiredRole;
  };
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (error || !user) {
    // Redirecionar para a página de login
    if (redirectTo) {
      navigate(redirectTo);
    }
    
    return fallback || (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso negado</AlertTitle>
        <AlertDescription>
          Você precisa estar autenticado para acessar esta página.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!hasPermission()) {
    return fallback || (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso restrito</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar esta página. Esta área requer nível de acesso "{requiredRole}".
        </AlertDescription>
      </Alert>
    );
  }
  
  return <>{children}</>;
}