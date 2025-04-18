import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import {
  LayoutGrid,
  Image,
  Users,
  ListChecks,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Search,
  Home,
  LogOut,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ArtsList from '@/components/admin/ArtsList';
import CategoriesList from '@/components/admin/CategoriesList';
import UserManagement from '@/components/admin/UserManagement';
import SiteSettings from '@/components/admin/SiteSettings';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('arts');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Verifica se o usuário é admin ou designer_adm
  const isAuthorized = user?.role === 'admin' || user?.role === 'designer_adm';

  if (!isAuthorized) {
    // Redireciona para home se não for autorizado
    toast({
      title: "Acesso negado",
      description: "Você não tem permissão para acessar o painel administrativo",
      variant: "destructive",
    });
    setLocation('/');
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">DesignAuto Admin</h1>
        </div>
        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="font-medium">{user?.name || 'Admin'}</p>
              <p className="text-sm text-gray-500">{user?.role}</p>
            </div>
          </div>
          <nav className="mt-6">
            <button
              onClick={() => setActiveTab('arts')}
              className={`flex items-center w-full px-4 py-2.5 mb-2 rounded-lg ${
                activeTab === 'arts' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Image className="w-5 h-5 mr-3" />
              <span>Artes</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center w-full px-4 py-2.5 mb-2 rounded-lg ${
                activeTab === 'categories' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-5 h-5 mr-3" />
              <span>Categorias</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center w-full px-4 py-2.5 mb-2 rounded-lg ${
                activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              <span>Usuários</span>
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`flex items-center w-full px-4 py-2.5 mb-2 rounded-lg ${
                activeTab === 'collections' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ListChecks className="w-5 h-5 mr-3" />
              <span>Coleções</span>
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center w-full px-4 py-2.5 mb-2 rounded-lg ${
                activeTab === 'community' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              <span>Comunidade</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center w-full px-4 py-2.5 mb-2 rounded-lg ${
                activeTab === 'stats' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              <span>Estatísticas</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center w-full px-4 py-2.5 mb-2 rounded-lg ${
                activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5 mr-3" />
              <span>Configurações</span>
            </button>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-gray-600 mb-2">
              <Home className="w-5 h-5 mr-3" />
              Voltar ao site
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              {activeTab === 'arts' && 'Gerenciar Artes'}
              {activeTab === 'categories' && 'Gerenciar Categorias'}
              {activeTab === 'users' && 'Gerenciar Usuários'}
              {activeTab === 'collections' && 'Gerenciar Coleções'}
              {activeTab === 'community' && 'Gerenciar Comunidade'}
              {activeTab === 'stats' && 'Estatísticas'}
              {activeTab === 'settings' && 'Configurações'}
            </h1>
            <div className="flex items-center">
              <div className="relative mr-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9 w-64"
                />
              </div>
              {(activeTab === 'arts' || activeTab === 'categories' || activeTab === 'collections') && (
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar {activeTab === 'arts' ? 'Arte' : activeTab === 'categories' ? 'Categoria' : 'Coleção'}
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="arts" className="mt-0">
              <ArtsList />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-0">
              <CategoriesList />
            </TabsContent>
            
            <TabsContent value="users" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <UserManagement />
              </div>
            </TabsContent>
            
            <TabsContent value="collections" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Coleções</h2>
                <p className="text-gray-500">Gerenciamento de coleções em desenvolvimento.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="community" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Comunidade</h2>
                <p className="text-gray-500">Moderação de comunidade em desenvolvimento.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Estatísticas</h2>
                <p className="text-gray-500">Painel de estatísticas em desenvolvimento.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Tabs defaultValue="site">
                  <TabsList>
                    <TabsTrigger value="site">Configurações do Site</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="site" className="mt-6">
                    <SiteSettings />
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="mt-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Configurações Avançadas</h3>
                      <p className="text-gray-500">Configurações avançadas do sistema em desenvolvimento.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;