import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layout/AdminLayout';
import GerenciarCategorias from './GerenciarCategorias';
import GerenciarFerramentas from './GerenciarFerramentas';

const FerramentasAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('ferramentas');
  const [, setLocation] = useLocation();

  return (
    <AdminLayout title="Gerenciar Ferramentas" backLink="/admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ferramentas</h2>
            <p className="text-muted-foreground">
              Gerencie as ferramentas e categorias disponíveis no site.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6">
            <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ferramentas" className="space-y-4">
            <GerenciarFerramentas />
          </TabsContent>
          
          <TabsContent value="categorias" className="space-y-4">
            <GerenciarCategorias />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default FerramentasAdminPage;