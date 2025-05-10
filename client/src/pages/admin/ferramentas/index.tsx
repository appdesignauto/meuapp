import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/hooks/use-auth';
import GerenciarCategorias from './GerenciarCategorias';
import GerenciarFerramentas from './GerenciarFerramentas';

const AdminFerramentasPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('categorias');

  // Somente administradores podem acessar esta página
  if (!user || user.nivelacesso !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
            <p className="text-gray-600">
              Você não tem permissão para acessar esta página. Apenas administradores têm acesso ao gerenciamento
              de ferramentas.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Gerenciar Ferramentas | Admin | Design Auto</title>
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Ferramentas Úteis</h1>
        <p className="text-gray-600 mb-6">
          Gerencie as categorias e ferramentas disponíveis para os usuários.
        </p>

        <Tabs defaultValue="categorias" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
          </TabsList>
          
          <Separator className="mb-6" />

          <TabsContent value="categorias" className="space-y-6">
            <GerenciarCategorias />
          </TabsContent>
          
          <TabsContent value="ferramentas" className="space-y-6">
            <GerenciarFerramentas />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminFerramentasPage;