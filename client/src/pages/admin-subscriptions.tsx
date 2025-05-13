/**
 * Página de redirecionamento para o painel de assinaturas
 * Direciona automaticamente para o painel admin com a aba assinaturas selecionada
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CreditCard } from 'lucide-react';
import UpdatedDashboard from './admin/UpdatedDashboard';

const AdminSubscriptionsRedirect: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // Redirecionar para o login se não estiver autenticado
    if (!isLoading && !user) {
      setLocation('/auth');
      return;
    }
    
    // Verificar se o usuário é admin antes de redirecionar
    if (!(user && (user.role === 'admin' || user.role === 'designer_adm'))) {
      // Redirecionar para home se não tiver permissão
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium">Verificando permissões...</h2>
          <p className="text-gray-500 mt-2">Por favor, aguarde um momento.</p>
        </div>
      </div>
    );
  }

  // Se o usuário é admin, mostrar o dashboard com a aba de assinaturas selecionada
  if (user && (user.role === 'admin' || user.role === 'designer_adm')) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg mb-4 flex items-center">
        <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
        <div>
          <h3 className="font-medium">Página de Assinaturas</h3>
          <p className="text-sm text-gray-600">
            Esta área permite gerenciar assinaturas de usuários e visualizar logs de webhooks.
          </p>
        </div>
        <UpdatedDashboard initialTab="subscriptions" />
      </div>
    );
  }

  return null;
};

export default AdminSubscriptionsRedirect;