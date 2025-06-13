import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import UserManagement from '@/components/admin/UserManagement';
import SimpleFormMultiDialog from '@/components/admin/SimpleFormMultiDialog';
import SaasDashboard from '@/components/admin/SaasDashboard';
import PlatformMetrics from '@/components/admin/PlatformMetrics';
import {
  Users,
  Image,
  MessageSquare,
  CreditCard,
  Video,
  LayoutGrid,
  FileType,
  Crown,
  TrendingUp,
  Clock,
  Download,
  Star,
  Plus
} from 'lucide-react';

const AdminDashboard = () => {
  const [isMultiFormOpen, setIsMultiFormOpen] = useState(false);

  return (
    <AdminLayout title="Painel Administrativo">
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="arts">Artes</TabsTrigger>
            <TabsTrigger value="community">Comunidade</TabsTrigger>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Dashboard Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Visão geral da plataforma</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue="30dias">
                    <SelectTrigger className="w-[140px] border-gray-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="7dias">7 dias</SelectItem>
                      <SelectItem value="30dias">30 dias</SelectItem>
                      <SelectItem value="90dias">90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Card Usuários */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">1,245</div>
                    <div className="text-xs text-green-600 font-medium">+12% este mês</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">Usuários Totais</div>
                  <div className="text-xs text-gray-500">327 premium ativos</div>
                </div>
              </div>

              {/* Card Artes */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Image className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">2,847</div>
                    <div className="text-xs text-green-600 font-medium">+8% este mês</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">Total de Artes</div>
                  <div className="text-xs text-gray-500">156 adicionadas esta semana</div>
                </div>
              </div>

              {/* Card Comunidade */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">489</div>
                    <div className="text-xs text-green-600 font-medium">+15% este mês</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">Posts Comunidade</div>
                  <div className="text-xs text-gray-500">73 interações hoje</div>
                </div>
              </div>

              {/* Card Receita */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">R$ 18.2k</div>
                    <div className="text-xs text-green-600 font-medium">+23% este mês</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">Receita Mensal</div>
                  <div className="text-xs text-gray-500">R$ 1.8k esta semana</div>
                </div>
              </div>
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Estatísticas Detalhadas</h3>
                <p className="text-sm text-gray-500 mt-1">Métricas de performance da plataforma</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <Video className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">Vídeo-aulas</span>
                    </div>
                    <div className="text-sm font-medium">84</div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <LayoutGrid className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="text-sm">Categorias</span>
                    </div>
                    <div className="text-sm font-medium">15</div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center text-gray-600">
                      <FileType className="w-4 h-4 mr-2 text-emerald-500" />
                      <span className="text-sm">Formatos</span>
                    </div>
                    <div className="text-sm font-medium">8</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <Crown className="w-4 h-4 mr-2 text-amber-500" />
                      <span className="text-sm">Taxa Premium</span>
                    </div>
                    <div className="text-sm font-medium">26.3%</div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-sm">Crescimento</span>
                    </div>
                    <div className="text-sm font-medium">+18.2%</div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                      <span className="text-sm">Tempo Médio</span>
                    </div>
                    <div className="text-sm font-medium">42min</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <Download className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">Downloads</span>
                    </div>
                    <div className="text-sm font-medium">12.8k</div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <MessageSquare className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="text-sm">Comentários</span>
                    </div>
                    <div className="text-sm font-medium">1.2k</div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center text-gray-600">
                      <Star className="w-4 h-4 mr-2 text-amber-500" />
                      <span className="text-sm">Avaliação</span>
                    </div>
                    <div className="text-sm font-medium">4.8★</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="arts">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Gerenciar Artes</h2>
                  <p className="text-sm text-gray-500 mt-1">Administre todas as artes da plataforma</p>
                </div>
                <Button 
                  onClick={() => setIsMultiFormOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Arte
                </Button>
              </div>
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Funcionalidade de gerenciamento de artes em desenvolvimento.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="community">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Gerenciar Comunidade</h2>
                <p className="text-sm text-gray-500 mt-1">Modere posts e interações da comunidade</p>
              </div>
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Funcionalidade de gerenciamento da comunidade em desenvolvimento.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Gerenciar Cursos</h2>
                <p className="text-sm text-gray-500 mt-1">Administre cursos e vídeo-aulas</p>
              </div>
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Funcionalidade de gerenciamento de cursos em desenvolvimento.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financeiro">
            <SaasDashboard />
          </TabsContent>

          <TabsContent value="stats">
            <PlatformMetrics />
          </TabsContent>
        </Tabs>
        
        {/* Diálogo de criação de arte multi-formato */}
        <SimpleFormMultiDialog 
          isOpen={isMultiFormOpen} 
          onClose={() => setIsMultiFormOpen(false)}
          editingArt={null}
          isEditing={false}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;