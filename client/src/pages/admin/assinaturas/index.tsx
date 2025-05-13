import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';
import WebhookList from '@/components/admin/WebhookList';

const AssinaturasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('subscriptions');

  return (
    <AdminLayout title="Assinaturas e Webhooks" backLink="/admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Assinaturas e Webhooks</h2>
            <p className="text-muted-foreground">
              Gerencie assinaturas de usuários e visualize logs de webhooks da Hotmart.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6">
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscriptions" className="space-y-4">
            <SubscriptionManagement />
          </TabsContent>
          
          <TabsContent value="webhooks" className="space-y-4">
            <WebhookList />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AssinaturasPage;