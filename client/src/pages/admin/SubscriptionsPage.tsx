/**
 * Página de gerenciamento de assinaturas
 * Esta página exibe o componente de gerenciamento de assinaturas
 */

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';

export default function SubscriptionsPage() {
  return (
    <AdminLayout title="Gerenciamento de Assinaturas" backLink="/admin">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Assinaturas</h2>
            <p className="text-gray-500 mt-1">Visualize e gerencie assinaturas de usuários da plataforma</p>
          </div>
        </div>
      </div>
      <SubscriptionManagement />
    </AdminLayout>
  );
}