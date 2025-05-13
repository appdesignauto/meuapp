/**
 * Página para forçar o redirecionamento para o painel unificado
 * Esta página garante que o usuário seja redirecionado para o painel correto
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

// Redirecionador que força o uso do UpdatedDashboard ao invés do AdminLayout antigo
const ForceAdminUnified: React.FC = () => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirecionar para o painel unificado com a aba de Assinaturas selecionada
    // usando URL absoluta para evitar problemas de redirecionamento relativo
    window.location.href = '/admin-assinaturas';
  }, []);

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

export default ForceAdminUnified;