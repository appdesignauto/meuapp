import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layout/AdminLayout';
import { SaasDashboard } from '@/components/admin/SaasDashboard';
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

          <Tabs defaultValue="saas" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="saas">Dashboard SaaS</TabsTrigger>
              <TabsTrigger value="subscriptions">Dashboard Assinaturas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="saas" className="space-y-6 mt-6">
              <SaasDashboard />
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6 mt-6">
              <SimpleSubscriptionDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinanceiroPage;