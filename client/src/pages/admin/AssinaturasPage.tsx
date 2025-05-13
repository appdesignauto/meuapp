/**
 * Página de Assinaturas e Webhooks
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/layout/AdminLayout';
import WebhookList from '@/components/admin/WebhookList';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';

export default function AssinaturasPage() {
  const [activeTab, setActiveTab] = useState<string>('subscriptions');

  return (
    <AdminLayout title="Assinaturas e Webhooks" backLink="/admin">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="subscriptions">Gerenciar Assinaturas</TabsTrigger>
          <TabsTrigger value="webhooks">Logs de Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <div className="mb-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Assinaturas</h2>
                <p className="text-gray-500 mt-1">Visualize e gerencie assinaturas de usuários da plataforma</p>
              </div>
            </div>
          </div>
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="webhooks">
          <div className="mb-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Logs de Webhooks</h2>
                <p className="text-gray-500 mt-1">Monitore e gerencie webhooks recebidos de plataformas de pagamento</p>
              </div>
            </div>
          </div>
          <WebhookList />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}