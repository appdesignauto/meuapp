import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash, Tag, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { GerenciarCategorias } from './GerenciarCategorias';
import { GerenciarFerramentas } from './GerenciarFerramentas';

const FerramentasAdminPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ferramentas');

  return (
    <AdminLayout title="Gerenciamento de Ferramentas">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie ferramentas úteis e categorias para seus usuários.
            </p>
          </div>
        </div>

        <Tabs defaultValue="ferramentas" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ferramentas" className="flex items-center">
              <Wrench className="h-4 w-4 mr-2" />
              Ferramentas
            </TabsTrigger>
            <TabsTrigger value="categorias" className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Categorias
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ferramentas" className="space-y-6 pt-4">
            <GerenciarFerramentas />
          </TabsContent>
          
          <TabsContent value="categorias" className="space-y-6 pt-4">
            <GerenciarCategorias />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default FerramentasAdminPage;