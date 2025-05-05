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
  Sliders,
  Database,
  HardDrive,
  FileType,
  CreditCard,
  BookOpen,
  LayoutDashboard,
  ChevronDown,
  ImagePlus,
  FolderPlus,
  Layers,
  PanelRight,
  PanelLeft,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SimpleFormMultiDialog from "@/components/admin/SimpleFormMultiDialog";
import ArtsList from '@/components/admin/ArtsList';
import CategoriesList from '@/components/admin/CategoriesList';
import UserManagement from '@/components/admin/UserManagement';
import SiteSettings from '@/components/admin/SiteSettings';
import FormatsList from '@/components/admin/FormatsList';
import FileTypesList from '@/components/admin/FileTypesList';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('arts');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMultiFormOpen, setIsMultiFormOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="flex h-screen bg-gray-100 relative">
      {/* Overlay - aparece apenas em telas pequenas quando a sidebar está aberta */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 sm:hidden" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar - visível em telas maiores ou quando sidebarOpen=true em telas menores */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 absolute sm:relative z-20 h-full w-64 bg-white shadow-md transition-transform duration-300 ease-in-out`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">DesignAuto Admin</h1>
          <button 
            className="sm:hidden text-gray-500 hover:text-gray-700" 
            onClick={() => setSidebarOpen(false)}
          >
            <PanelLeft className="w-5 h-5" />
          </button>
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
          <nav className="mt-6 space-y-2">
            {/* Dashboard principal */}
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center w-full px-4 py-2.5 rounded-lg ${
                activeTab === 'stats' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              <span>Visão Geral</span>
            </button>
            
            {/* Usuários e Comunidade */}
            <Collapsible 
              className="bg-gray-50 rounded-lg py-1 mb-1"
              defaultOpen={['users', 'community'].includes(activeTab)}
            >
              <CollapsibleTrigger className="flex items-center w-full px-4 py-2 text-gray-700 font-medium">
                <Users className="w-5 h-5 mr-3" />
                <span>Usuários</span>
                <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200 ui-open:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 pt-1 pb-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4 mr-3" />
                  <span>Gerenciar Usuários</span>
                </button>
                <button
                  onClick={() => setActiveTab('community')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'community' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-3" />
                  <span>Comunidade</span>
                </button>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Gerenciamento de Conteúdo */}
            <Collapsible 
              className="bg-gray-50 rounded-lg py-1 mb-1"
              defaultOpen={['arts', 'categories', 'formats', 'fileTypes'].includes(activeTab)}
            >
              <CollapsibleTrigger className="flex items-center w-full px-4 py-2 text-gray-700 font-medium">
                <Layers className="w-5 h-5 mr-3" />
                <span>Conteúdo</span>
                <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200 ui-open:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 pt-1 pb-2">
                <button
                  onClick={() => setActiveTab('arts')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'arts' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Image className="w-4 h-4 mr-3" />
                  <span>Artes</span>
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'categories' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 mr-3" />
                  <span>Categorias</span>
                </button>
                <button
                  onClick={() => setActiveTab('formats')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'formats' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mr-3" />
                  <span>Formatos</span>
                </button>
                <button
                  onClick={() => setActiveTab('fileTypes')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'fileTypes' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileType className="w-4 h-4 mr-3" />
                  <span>Tipos de Arquivo</span>
                </button>

              </CollapsibleContent>
            </Collapsible>
            
            {/* Cursos e Vídeo-aulas */}
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center w-full px-4 py-2.5 rounded-lg ${
                activeTab === 'courses' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              <span>Cursos e Vídeos</span>
            </button>
            
            {/* Configurações */}
            <Collapsible 
              className="bg-gray-50 rounded-lg py-1 mb-1"
              defaultOpen={['settings', 'collections'].includes(activeTab)}
            >
              <CollapsibleTrigger className="flex items-center w-full px-4 py-2 text-gray-700 font-medium">
                <Settings className="w-5 h-5 mr-3" />
                <span>Configurações</span>
                <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200 ui-open:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 pt-1 pb-2">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  <span>Configurações do Site</span>
                </button>
                <button
                  onClick={() => setActiveTab('collections')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'collections' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ListChecks className="w-4 h-4 mr-3" />
                  <span>Coleções</span>
                </button>
                {user?.role === 'admin' && (
                  <>
                    <Link href="/admin/logo-upload">
                      <Button variant="ghost" className="w-full justify-start text-gray-600 py-2 h-auto">
                        <Image className="w-4 h-4 mr-3" />
                        <span>Gerenciar Logo</span>
                      </Button>
                    </Link>
                    <Link href="/admin/storage-test">
                      <Button variant="ghost" className="w-full justify-start text-gray-600 py-2 h-auto">
                        <HardDrive className="w-4 h-4 mr-3" />
                        <span>Testar Armazenamento</span>
                      </Button>
                    </Link>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>
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
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center mb-3 sm:mb-0">
              {/* Botão de alternância do menu (visível apenas em telas menores) */}
              <button 
                className="sm:hidden mr-3 text-gray-600 hover:text-blue-600"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu lateral"
              >
                <PanelRight className="w-5 h-5" />
              </button>
              
              <h1 className="text-xl font-semibold">
                {activeTab === 'arts' && 'Artes e Designs'}
                {activeTab === 'categories' && 'Categorias'}
                {activeTab === 'formats' && 'Formatos'}
                {activeTab === 'fileTypes' && 'Tipos de Arquivo'}
                {activeTab === 'users' && 'Usuários'}
                {activeTab === 'collections' && 'Coleções'}
                {activeTab === 'community' && 'Comunidade'}
                {activeTab === 'stats' && 'Visão Geral'}
                {activeTab === 'settings' && 'Configurações'}
                {activeTab === 'courses' && 'Cursos e Vídeo-aulas'}
              </h1>
            </div>
            
            <div className="flex items-center flex-wrap gap-2">
              <div className="relative mr-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              
              {(activeTab === 'arts' || activeTab === 'categories' || activeTab === 'collections' || activeTab === 'formats' || activeTab === 'fileTypes') && (
                <div className="flex gap-2 flex-wrap">
                  {activeTab === 'arts' && (
                    <Button 
                      variant="default" 
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                      onClick={() => setIsMultiFormOpen(true)}
                    >
                      <ImagePlus className="w-4 h-4 mr-2" />
                      Arte Multi-Formato
                    </Button>
                  )}
                  <Button className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar {
                      activeTab === 'arts' ? 'Arte' : 
                      activeTab === 'categories' ? 'Categoria' : 
                      activeTab === 'collections' ? 'Coleção' :
                      activeTab === 'formats' ? 'Formato' :
                      'Tipo de Arquivo'
                    }
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="arts" className="mt-0">
              <ArtsList />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-0">
              <CategoriesList />
            </TabsContent>

            <TabsContent value="formats" className="mt-0">
              <FormatsList />
            </TabsContent>
            
            <TabsContent value="fileTypes" className="mt-0">
              <FileTypesList />
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
            
            <TabsContent value="courses" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Tabs defaultValue="modulos">
                  <TabsList className="mb-6">
                    <TabsTrigger value="modulos" className="text-sm">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Módulos
                    </TabsTrigger>
                    <TabsTrigger value="aulas" className="text-sm">
                      <Video className="w-4 h-4 mr-2" />
                      Aulas
                    </TabsTrigger>
                    <TabsTrigger value="config" className="text-sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações da Página
                    </TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="modulos" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Módulos dos Cursos</h2>
                      <Button onClick={() => window.location.href = '/admin/gerenciar-cursos'}>
                        Ver Gerenciador Completo
                      </Button>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <p className="text-blue-600">O gerenciamento de cursos foi integrado ao painel principal. Para acessar todas as funcionalidades, utilize o botão "Ver Gerenciador Completo".</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="aulas" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Aulas dos Cursos</h2>
                      <Button onClick={() => window.location.href = '/admin/gerenciar-cursos?tab=aulas'}>
                        Ver Gerenciador Completo
                      </Button>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <p className="text-blue-600">O gerenciamento de aulas foi integrado ao painel principal. Para acessar todas as funcionalidades, utilize o botão "Ver Gerenciador Completo".</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="config" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Configurações da Página</h2>
                      <Button onClick={() => window.location.href = '/admin/gerenciar-cursos?tab=config'}>
                        Ver Gerenciador Completo
                      </Button>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <p className="text-blue-600">As configurações da página de cursos foram integradas ao painel principal. Para acessar todas as funcionalidades, utilize o botão "Ver Gerenciador Completo".</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      {/* Diálogo para adicionar arte multi-formato */}
      <SimpleFormMultiDialog 
        isOpen={isMultiFormOpen} 
        onClose={() => setIsMultiFormOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;