/**
 * Página de redirecionamento para o painel de administração
 * Direciona automaticamente para o painel admin com a aba selecionada
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

const AdminRedirect: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // Redirecionar para o login se não estiver autenticado
    if (!isLoading && !user) {
      setLocation('/auth');
      return;
    }
    
    // Verificar se o usuário é admin antes de redirecionar
    if (user && (user.role === 'admin' || user.role === 'designer_adm')) {
      // Direcionar para o UpdatedDashboard que contém as abas de assinaturas e webhooks
      setLocation('/admin-unified');
    } else {
      // Redirecionar para home se não tiver permissão
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-medium">Redirecionando para o painel administrativo...</h2>
        <p className="text-gray-500 mt-2">Por favor, aguarde um momento.</p>
      </div>
    </div>
  );
};

export default AdminRedirect;