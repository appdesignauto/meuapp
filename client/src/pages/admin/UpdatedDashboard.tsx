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
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-none lg:inline-flex bg-gray-50 p-1 h-auto rounded-lg">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 py-2.5 font-medium">Dashboard</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 py-2.5 font-medium">Usuários</TabsTrigger>
              <TabsTrigger value="arts" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 py-2.5 font-medium">Artes</TabsTrigger>
              <TabsTrigger value="community" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 py-2.5 font-medium">Comunidade</TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 py-2.5 font-medium">Cursos</TabsTrigger>
              <TabsTrigger value="financeiro" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 py-2.5 font-medium">Financeiro</TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4 py-2.5 font-medium">Estatísticas</TabsTrigger>
            </TabsList>
          </div>

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
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">1,245</div>
                    <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">+12% este mês</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">Usuários Totais</div>
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg inline-block">327 premium ativos</div>
                </div>
              </div>

              {/* Card Artes */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">2,847</div>
                    <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">+8% este mês</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">Total de Artes</div>
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg inline-block">156 adicionadas esta semana</div>
                </div>
              </div>

              {/* Card Comunidade */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">489</div>
                    <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">+15% este mês</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">Posts Comunidade</div>
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg inline-block">73 interações hoje</div>
                </div>
              </div>

              {/* Card Receita */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">R$ 18.2k</div>
                    <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">+23% este mês</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">Receita Mensal</div>
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg inline-block">R$ 1.8k esta semana</div>
                </div>
              </div>
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="bg-white rounded-xl border border-gray-100 p-8 mb-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900">Estatísticas Detalhadas</h3>
                <p className="text-sm text-gray-500 mt-2">Métricas de performance da plataforma em tempo real</p>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gerenciar Artes</h2>
                  <p className="text-sm text-gray-500 mt-2">Administre todas as artes da plataforma DesignAuto</p>
                </div>
                <Button 
                  onClick={() => setIsMultiFormOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md transition-all duration-200 px-6 py-2.5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Arte
                </Button>
              </div>
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Image className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Artes</h3>
                <p className="text-gray-500 max-w-md mx-auto">Funcionalidade de gerenciamento completo de artes em desenvolvimento para oferecer melhor experiência.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="community">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-200">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900">Gerenciar Comunidade</h2>
                <p className="text-sm text-gray-500 mt-2">Modere posts e interações da comunidade DesignAuto</p>
              </div>
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Comunidade</h3>
                <p className="text-gray-500 max-w-md mx-auto">Funcionalidade de moderação e gerenciamento da comunidade em desenvolvimento para melhor experiência.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-200">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900">Gerenciar Cursos</h2>
                <p className="text-sm text-gray-500 mt-2">Administre cursos e vídeo-aulas da plataforma</p>
              </div>
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Video className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Cursos</h3>
                <p className="text-gray-500 max-w-md mx-auto">Funcionalidade de gerenciamento completo de cursos e vídeo-aulas em desenvolvimento.</p>
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