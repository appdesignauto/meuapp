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
            <Collapsible 
              className="bg-gray-50 rounded-lg py-1 mb-1"
              defaultOpen={['courses', 'modules', 'lessons', 'coursesConfig'].includes(activeTab)}
            >
              <CollapsibleTrigger className="flex items-center w-full px-4 py-2 text-gray-700 font-medium">
                <BookOpen className="w-5 h-5 mr-3" />
                <span>Cursos</span>
                <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200 ui-open:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 pt-1 pb-2">
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'courses' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('modules')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'modules' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mr-3" />
                  <span>Módulos</span>
                </button>
                <button
                  onClick={() => setActiveTab('lessons')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'lessons' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Video className="w-4 h-4 mr-3" />
                  <span>Aulas</span>
                </button>
                <button
                  onClick={() => setActiveTab('coursesConfig')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'coursesConfig' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  <span>Configurações</span>
                </button>
              </CollapsibleContent>
            </Collapsible>
            
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
                {activeTab === 'courses' && 'Dashboard de Cursos'}
                {activeTab === 'modules' && 'Módulos dos Cursos'}
                {activeTab === 'lessons' && 'Aulas dos Cursos'}
                {activeTab === 'coursesConfig' && 'Configurações de Cursos'}
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
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Dashboard de Cursos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-blue-800">Módulos</h3>
                          <p className="text-2xl font-bold mt-2">3</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-blue-500" />
                      </div>
                      <button 
                        onClick={() => setActiveTab('modules')}
                        className="mt-4 text-blue-600 text-sm hover:text-blue-800 flex items-center"
                      >
                        Ver detalhes
                        <ChevronDown className="w-4 h-4 ml-1 rotate-[270deg]" />
                      </button>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-indigo-800">Aulas</h3>
                          <p className="text-2xl font-bold mt-2">12</p>
                        </div>
                        <Video className="w-8 h-8 text-indigo-500" />
                      </div>
                      <button 
                        onClick={() => setActiveTab('lessons')}
                        className="mt-4 text-indigo-600 text-sm hover:text-indigo-800 flex items-center"
                      >
                        Ver detalhes
                        <ChevronDown className="w-4 h-4 ml-1 rotate-[270deg]" />
                      </button>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-emerald-800">Configurações</h3>
                          <p className="text-sm mt-2">Página de cursos</p>
                        </div>
                        <Settings className="w-8 h-8 text-emerald-500" />
                      </div>
                      <button 
                        onClick={() => setActiveTab('coursesConfig')}
                        className="mt-4 text-emerald-600 text-sm hover:text-emerald-800 flex items-center"
                      >
                        Configurar
                        <ChevronDown className="w-4 h-4 ml-1 rotate-[270deg]" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4 mt-6">
                  <h3 className="font-semibold mb-4">Acesso rápido</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => window.location.href = '/admin/gerenciar-cursos'}
                      variant="outline" 
                      className="flex items-center justify-center h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Gerenciador de Cursos Completo
                    </Button>
                    
                    <Button 
                      onClick={() => window.location.href = '/videoaulas'}
                      variant="outline" 
                      className="flex items-center justify-center h-12 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Visualizar Página de Vídeo-aulas
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="modules" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Módulos dos Cursos</h2>
                  <Button 
                    onClick={() => window.location.href = '/admin/gerenciar-cursos'}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Módulo
                  </Button>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-blue-600">Para gerenciar módulos com todas as funcionalidades, acesse o gerenciador completo. Aqui você tem uma visão rápida dos módulos existentes.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 relative">
                      <img 
                        src="https://images.unsplash.com/photo-1612825173281-9a193378527e?q=80&w=1499&auto=format&fit=crop" 
                        alt="Configurações Iniciais" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="text-white font-medium">Configurações Iniciais</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm text-gray-500 mb-2">Estratégias para Redes Sociais Automotivas</div>
                      <div className="flex items-center text-sm">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs mr-2">Iniciante</span>
                        <span className="text-gray-500">2 aulas</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 relative">
                      <img 
                        src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=1470&auto=format&fit=crop" 
                        alt="Design para Automotivo" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="text-white font-medium">Design para Automotivo</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm text-gray-500 mb-2">Criando artes impactantes</div>
                      <div className="flex items-center text-sm">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs mr-2">Intermediário</span>
                        <span className="text-gray-500">5 aulas</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 relative">
                      <img 
                        src="https://dcodfuzoxmddmpvowhap.supabase.co/storage/v1/object/public/designauto-images/designer_1/lessonthumbnails/1746472059081_e1617750-5a94-4a6c-b664-9e2974cd9efa.webp" 
                        alt="Edição Avançada" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="text-white font-medium">Edição Avançada</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm text-gray-500 mb-2">Técnicas profissionais de edição</div>
                      <div className="flex items-center text-sm">
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs mr-2">Avançado</span>
                        <span className="text-gray-500">5 aulas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="lessons" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Aulas dos Cursos</h2>
                  <Button 
                    onClick={() => window.location.href = '/admin/gerenciar-cursos?tab=aulas'}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Aula
                  </Button>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-blue-600">Para gerenciar aulas com todas as funcionalidades, acesse o gerenciador completo. Aqui você tem uma visão rápida das aulas existentes.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Título</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Módulo</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Duração</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Status</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-600 border-b text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b">
                          <div className="flex items-center">
                            <Video className="w-5 h-5 text-blue-500 mr-3" />
                            <span>Boas Vindas</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b">Configurações Iniciais</td>
                        <td className="py-3 px-4 border-b">10:45</td>
                        <td className="py-3 px-4 border-b">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Publicado</span>
                        </td>
                        <td className="py-3 px-4 border-b text-right">
                          <Button variant="ghost" size="sm">Editar</Button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b">
                          <div className="flex items-center">
                            <Video className="w-5 h-5 text-blue-500 mr-3" />
                            <span>Baixando o App KDGPRO</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b">Configurações Iniciais</td>
                        <td className="py-3 px-4 border-b">5:30</td>
                        <td className="py-3 px-4 border-b">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Publicado</span>
                        </td>
                        <td className="py-3 px-4 border-b text-right">
                          <Button variant="ghost" size="sm">Editar</Button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b">
                          <div className="flex items-center">
                            <Video className="w-5 h-5 text-blue-500 mr-3" />
                            <span>Como editar no Canva</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b">Edição Avançada</td>
                        <td className="py-3 px-4 border-b">15:00</td>
                        <td className="py-3 px-4 border-b">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Publicado</span>
                        </td>
                        <td className="py-3 px-4 border-b text-right">
                          <Button variant="ghost" size="sm">Editar</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="coursesConfig" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Configurações da Página de Cursos</h2>
                  <Button 
                    onClick={() => window.location.href = '/admin/gerenciar-cursos?tab=config'}
                    className="flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gerenciador Completo
                  </Button>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-blue-600">Para configurar completamente a página de cursos, acesse o gerenciador completo. Aqui você pode alterar as configurações básicas.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Banner Principal</h3>
                    <div className="aspect-[3/1] bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=1469&auto=format&fit=crop" 
                        alt="Banner de cursos" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => window.location.href = '/admin/gerenciar-cursos?tab=config'}
                      >
                        Trocar imagem
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Textos da Página</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Título do Banner</div>
                        <div className="p-2 bg-gray-50 rounded border">Aprenda a criar artes incríveis para sua loja</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Subtítulo do Banner</div>
                        <div className="p-2 bg-gray-50 rounded border">Mais de 30 aulas exclusivas para impulsionar seu negócio</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.href = '/admin/gerenciar-cursos?tab=config'}
                      >
                        Editar textos
                      </Button>
                    </div>
                  </div>
                </div>
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