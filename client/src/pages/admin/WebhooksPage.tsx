/**
 * Página de logs de webhooks
 * Esta página exibe o componente de logs de webhooks
 */

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import WebhookList from '@/components/admin/WebhookList';

export default function WebhooksPage() {
  return (
    <AdminLayout title="Logs de Webhooks" backLink="/admin">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Logs de Webhooks</h2>
            <p className="text-gray-500 mt-1">Monitore e gerencie webhooks recebidos de plataformas de pagamento</p>
          </div>
        </div>
      </div>
      <WebhookList />
    </AdminLayout>
  );
}