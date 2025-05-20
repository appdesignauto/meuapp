/**
 * Componente de guarda para restringir acesso com base no nível de acesso do usuário
 */

import React from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type NivelAcesso = 'visitante' | 'usuario' | 'premium' | 'designer' | 'designer_adm' | 'suporte' | 'admin';

// Mapa de níveis de acesso e seus respectivos níveis numéricos para comparação hierárquica
const accessLevelMap: Record<NivelAcesso, number> = {
  'visitante': 0,
  'usuario': 1,
  'premium': 2,
  'designer': 3,
  'designer_adm': 4,
  'suporte': 5,
  'admin': 6
};

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
  redirectTo = '/' 
}: UserPermissionGuardProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Mostrar loader enquanto carrega as informações do usuário
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não houver usuário autenticado, redirecionar para a página de login
  if (!user) {
    if (redirectTo) {
      return <Redirect to={redirectTo} />;
    }
    return null;
  }

  // Obter o nível de acesso do usuário, ou "visitante" se não estiver definido
  const userAccessLevel = (user.nivelacesso as NivelAcesso) || 'visitante';
  
  // Verificar se o usuário tem o nível de acesso necessário
  const hasRequiredAccess = accessLevelMap[userAccessLevel] >= accessLevelMap[requiredRole];

  if (!hasRequiredAccess) {
    // Se fallback for fornecido, mostrar o conteúdo alternativo
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Caso contrário, mostrar alerta de acesso negado
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. 
            Esta funcionalidade requer nível de acesso {requiredRole} ou superior.
          </AlertDescription>
        </Alert>
        <button
          onClick={() => setLocation('/')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Voltar à página inicial
        </button>
      </div>
    );
  }

  // Se tiver permissão, renderizar o conteúdo protegido
  return <>{children}</>;
}