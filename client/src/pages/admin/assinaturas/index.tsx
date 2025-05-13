/**
 * Página de Assinaturas e Webhooks
 * Esta página redireciona para o painel unificado com a aba "subscriptions" ativa
 * (Para manter compatibilidade com rotas existentes)
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import UpdatedDashboard from '../UpdatedDashboard';

const AssinaturasPage: React.FC = () => {
  const [, setLocation] = useLocation();
  
  // Não redirecionamos mais, vamos exibir diretamente o dashboard com a aba correta
  useEffect(() => {
    // Efeito vazio - não redirecionamos mais
  }, []);
  
  return <UpdatedDashboard initialTab="subscriptions" />;
};

export default AssinaturasPage;