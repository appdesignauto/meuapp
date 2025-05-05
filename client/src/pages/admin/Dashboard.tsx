import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Video,
  Trash2,
  Pencil,
  MoreVertical,
  AlertCircle,
  AlertTriangle,
  Loader2,
  XCircle,
  CheckCircle2,
  Crown,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SimpleFormMultiDialog from "@/components/admin/SimpleFormMultiDialog";
import ArtsList from '@/components/admin/ArtsList';
import CategoriesList from '@/components/admin/CategoriesList';
import UserManagement from '@/components/admin/UserManagement';
import SiteSettings from '@/components/admin/SiteSettings';
import FormatsList from '@/components/admin/FormatsList';
import FileTypesList from '@/components/admin/FileTypesList';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from "@/lib/queryClient";

const AdminDashboard = () => {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('arts');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMultiFormOpen, setIsMultiFormOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  // Estados para módulos
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isConfirmDeleteModuleOpen, setIsConfirmDeleteModuleOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<any | null>(null);
  const [moduleForm, setModuleForm] = useState<any>({
    title: '',
    description: '',
    thumbnailUrl: '',
    level: 'iniciante',
    order: 0,
    isActive: true,
    isPremium: false
  });
  
  // Estados para aulas
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isConfirmDeleteLessonOpen, setIsConfirmDeleteLessonOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<any | null>(null);
  const [lessonForm, setLessonForm] = useState<any>({
    moduleId: 0,
    title: '',
    description: '',
    videoUrl: '',
    videoProvider: 'youtube',
    duration: 0,
    thumbnailUrl: '',
    order: 0,
    isPremium: false,
    showLessonNumber: true
  });
  
  // Consultas para obter módulos e aulas
  const { 
    data: modules = [], 
    isLoading: isLoadingModules,
    isError: isModulesError
  } = useQuery({
    queryKey: ['/api/courses/modules'],
    queryFn: async () => {
      const res = await fetch('/api/courses/modules');
      if (!res.ok) {
        console.error('Erro ao buscar módulos:', res.status, res.statusText);
        throw new Error('Falha ao carregar módulos');
      }
      return res.json();
    }
  });
  
  const { 
    data: lessons = [], 
    isLoading: isLoadingLessons,
    isError: isLessonsError
  } = useQuery({
    queryKey: ['/api/courses/lessons'],
    queryFn: async () => {
      const res = await fetch('/api/courses/lessons');
      if (!res.ok) {
        console.error('Erro ao buscar aulas:', res.status, res.statusText);
        throw new Error('Falha ao carregar aulas');
      }
      return res.json();
    }
  });
  
  // Handler para mudanças no formulário de módulo
  const handleModuleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setModuleForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handler para mudanças no formulário de aula
  const handleLessonFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLessonForm(prev => ({
      ...prev,
      [name]: typeof prev[name] === 'number' ? Number(value) : value
    }));
  };
  
  // Mutations para módulos
  const createModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/courses/modules', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/modules'] });
      setIsModuleDialogOpen(false);
      toast({
        title: 'Módulo criado com sucesso',
        description: 'O módulo foi adicionado à lista de cursos',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar módulo',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const updateModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/courses/modules/${data.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/modules'] });
      setIsModuleDialogOpen(false);
      toast({
        title: 'Módulo atualizado com sucesso',
        description: 'As alterações foram salvas',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar módulo',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/courses/modules/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/modules'] });
      setIsConfirmDeleteModuleOpen(false);
      toast({
        title: 'Módulo excluído com sucesso',
        description: 'O módulo foi removido permanentemente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir módulo',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutations para aulas
  const createLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/courses/lessons', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/lessons'] });
      setIsLessonDialogOpen(false);
      toast({
        title: 'Aula criada com sucesso',
        description: 'A aula foi adicionada ao módulo',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar aula',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const updateLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/courses/lessons/${data.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/lessons'] });
      setIsLessonDialogOpen(false);
      toast({
        title: 'Aula atualizada com sucesso',
        description: 'As alterações foram salvas',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar aula',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const deleteLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/courses/lessons/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/lessons'] });
      setIsConfirmDeleteLessonOpen(false);
      toast({
        title: 'Aula excluída com sucesso',
        description: 'A aula foi removida permanentemente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir aula',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handlers para submits
  const handleModuleSubmit = () => {
    if (!moduleForm.title || !moduleForm.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    if (currentModule) {
      updateModuleMutation.mutate(moduleForm);
    } else {
      createModuleMutation.mutate(moduleForm);
    }
  };
  
  const handleDeleteModule = () => {
    if (currentModule && currentModule.id) {
      deleteModuleMutation.mutate(currentModule.id);
    }
  };
  
  const handleLessonSubmit = () => {
    if (!lessonForm.title || !lessonForm.moduleId || !lessonForm.videoUrl) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    if (currentLesson) {
      updateLessonMutation.mutate(lessonForm);
    } else {
      createLessonMutation.mutate(lessonForm);
    }
  };
  
  const handleDeleteLesson = () => {
    if (currentLesson && currentLesson.id) {
      deleteLessonMutation.mutate(currentLesson.id);
    }
  };
  
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
                    onClick={() => {
                      setCurrentModule(null);
                      setModuleForm({
                        title: '',
                        description: '',
                        thumbnailUrl: '',
                        level: 'iniciante',
                        order: 0,
                        isActive: true,
                        isPremium: false
                      });
                      setIsModuleDialogOpen(true);
                    }}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Módulo
                  </Button>
                </div>
                
                <div className="flex justify-end mb-4">
                  <Select
                    value="recentes"
                    onValueChange={(value) => console.log(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recentes">Mais recentes</SelectItem>
                      <SelectItem value="antigos">Mais antigos</SelectItem>
                      <SelectItem value="ordem">Ordem de exibição</SelectItem>
                      <SelectItem value="alfabetica">Ordem alfabética</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {isLoadingModules ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg overflow-hidden animate-pulse">
                        <div className="aspect-video bg-gray-200"></div>
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isModulesError ? (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro!</AlertTitle>
                    <AlertDescription>
                      Não foi possível carregar os módulos. Por favor, tente novamente.
                    </AlertDescription>
                  </Alert>
                ) : modules.length === 0 ? (
                  <div className="text-center py-10 border rounded-lg">
                    <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum módulo encontrado</h3>
                    <p className="text-gray-500 mb-4">Comece criando seu primeiro módulo de curso.</p>
                    <Button 
                      onClick={() => {
                        setCurrentModule(null);
                        setModuleForm({
                          title: '',
                          description: '',
                          thumbnailUrl: '',
                          level: 'iniciante',
                          order: 0,
                          isActive: true,
                          isPremium: false
                        });
                        setIsModuleDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Módulo
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map(module => (
                      <div key={module.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="aspect-video bg-gray-100 relative">
                          <img 
                            src={module.thumbnailUrl || "https://via.placeholder.com/640x360?text=Sem+Imagem"} 
                            alt={module.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/640x360?text=Erro+ao+carregar";
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <div className="text-white font-medium">{module.title}</div>
                          </div>
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 text-white hover:bg-black/70">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setCurrentModule(module);
                                  setModuleForm({
                                    id: module.id,
                                    title: module.title,
                                    description: module.description,
                                    thumbnailUrl: module.thumbnailUrl,
                                    level: module.level,
                                    order: module.order,
                                    isActive: module.isActive,
                                    isPremium: module.isPremium
                                  });
                                  setIsModuleDialogOpen(true);
                                }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  <span>Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setCurrentModule(module);
                                  setIsConfirmDeleteModuleOpen(true);
                                }} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Excluir</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {module.isPremium && (
                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                              Premium
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="text-sm text-gray-500 mb-2">{module.description}</div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs mr-2 ${
                              module.level === 'iniciante' ? 'bg-blue-100 text-blue-800' :
                              module.level === 'intermediario' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {module.level === 'iniciante' ? 'Iniciante' :
                               module.level === 'intermediario' ? 'Intermediário' :
                               'Avançado'}
                            </span>
                            <span className="text-gray-500">{module.lessons?.length || 0} aulas</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Diálogo para adicionar/editar módulo */}
              <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {currentModule ? 'Editar Módulo' : 'Adicionar Módulo'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="moduleTitle">Título do módulo *</Label>
                        <Input
                          id="moduleTitle"
                          name="title"
                          value={moduleForm.title}
                          onChange={handleModuleFormChange}
                          placeholder="Ex: Introdução ao Design"
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="moduleDescription">Descrição *</Label>
                        <Textarea
                          id="moduleDescription"
                          name="description"
                          value={moduleForm.description}
                          onChange={handleModuleFormChange}
                          placeholder="Breve descrição sobre o módulo"
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="moduleThumbUrl">URL da miniatura *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="moduleThumbUrl"
                            name="thumbnailUrl"
                            value={moduleForm.thumbnailUrl}
                            onChange={handleModuleFormChange}
                            placeholder="URL da imagem de miniatura"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="moduleLevel">Nível *</Label>
                        <Select
                          name="level"
                          value={moduleForm.level}
                          onValueChange={value => 
                            setModuleForm({...moduleForm, level: value})
                          }
                        >
                          <SelectTrigger id="moduleLevel" className="h-10">
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iniciante">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-green-500" />
                                <span>Iniciante</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="intermediario">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                <span>Intermediário</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="avancado">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-red-500" />
                                <span>Avançado</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="moduleOrder">Ordem na sequência *</Label>
                        <Input
                          id="moduleOrder"
                          name="order"
                          type="number"
                          value={moduleForm.order}
                          onChange={handleModuleFormChange}
                          placeholder="Número da ordem"
                          min={1}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="moduleActive"
                          name="isActive"
                          checked={moduleForm.isActive}
                          onCheckedChange={checked => 
                            setModuleForm({...moduleForm, isActive: checked === true})
                          }
                        />
                        <Label htmlFor="moduleActive" className="text-sm">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Módulo ativo
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="modulePremium"
                          name="isPremium"
                          checked={moduleForm.isPremium}
                          onCheckedChange={checked => 
                            setModuleForm({...moduleForm, isPremium: checked === true})
                          }
                        />
                        <Label htmlFor="modulePremium" className="text-sm">
                          <span className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            Conteúdo premium
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="border-t pt-4 mt-4">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsModuleDialogOpen(false)}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleModuleSubmit}
                        disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                        className="gap-2"
                      >
                        {createModuleMutation.isPending || updateModuleMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : currentModule ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Atualizar módulo
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Criar módulo
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Diálogo de confirmação para excluir módulo */}
              <Dialog open={isConfirmDeleteModuleOpen} onOpenChange={setIsConfirmDeleteModuleOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Excluir Módulo
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="mb-4">
                      Tem certeza que deseja excluir o módulo <strong>{currentModule?.title}</strong>?
                    </p>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção</AlertTitle>
                      <AlertDescription>
                        A exclusão do módulo afetará a navegação dos usuários que estavam acompanhando este conteúdo.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter className="flex justify-between gap-3 border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsConfirmDeleteModuleOpen(false)}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteModule}
                      disabled={deleteModuleMutation.isPending}
                      className="gap-2"
                    >
                      {deleteModuleMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Excluir módulo
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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