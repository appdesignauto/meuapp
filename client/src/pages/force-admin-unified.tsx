/**
 * Página para forçar o redirecionamento ao painel unificado com a aba de assinaturas aberta
 * Esta é uma solução temporária para acessar a aba de assinaturas
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import UpdatedDashboard from './admin/UpdatedDashboard';

const ForceAdminUnified: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium">Carregando dados do usuário...</h2>
          <p className="text-gray-500 mt-2">Por favor, aguarde um momento.</p>
        </div>
      </div>
    );
  }
  
  if (!user || (user.role !== 'admin' && user.role !== 'designer_adm')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-lg">
          <h2 className="text-xl font-medium text-red-800">Acesso restrito</h2>
          <p className="text-gray-700 mt-2">
            Esta página é reservada para administradores. Se você acredita que deveria ter acesso,
            entre em contato com o suporte.
          </p>
          <a 
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar para a página inicial
          </a>
        </div>
      </div>
    );
  }
  
  // Se o usuário é admin, forçar o carregamento do dashboard com a aba de assinaturas
  return <UpdatedDashboard initialTab="subscriptions" />;
};

export default ForceAdminUnified;