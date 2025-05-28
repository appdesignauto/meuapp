/**
 * Painel Administrativo de Assinaturas - Versão Moderna
 * 
 * Dashboard profissional com métricas completas de SaaS:
 * - Métricas principais (usuários, conversão, churn)
 * - Gestão de usuários e assinaturas
 * - Analytics e relatórios detalhados
 * - Dados reais do banco de dados PostgreSQL
 */

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import SubscriptionDashboard from '@/components/admin/SubscriptionDashboard';

export default function AssinaturasPage() {
  return (
    <AdminLayout>
      <SubscriptionDashboard />
    </AdminLayout>
  );
}