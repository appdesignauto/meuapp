import React from 'react';

import AdminLayout from '@/components/layout/AdminLayout';
import SimpleSubscriptionDashboard from '@/components/admin/SimpleSubscriptionDashboard';

const FinanceiroPage = () => {
  return (
    <AdminLayout title="Financeiro" backLink="/admin">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Painel Financeiro</h2>
            <p className="text-gray-600">
              Acompanhe métricas financeiras, receitas e dados de assinaturas em tempo real.
            </p>
          </div>

          <SimpleSubscriptionDashboard />
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinanceiroPage;