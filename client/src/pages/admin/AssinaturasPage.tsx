/**
 * Página de Assinaturas e Webhooks
 * Esta página redireciona para o painel unificado com a aba "subscriptions" ativa
 * (Para manter compatibilidade com rotas existentes)
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import UpdatedDashboard from './UpdatedDashboard';

export default function AssinaturasPage() {
  const [, setLocation] = useLocation();
  
  // Redirecionar para o painel unificado com a aba correta
  useEffect(() => {
    setLocation('/admin');
  }, [setLocation]);
  
  return <UpdatedDashboard initialTab="subscriptions" />;
}