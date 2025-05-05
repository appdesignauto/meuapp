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
  Award,
  FileVideo
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

  // Estados para cursos
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isConfirmDeleteCourseOpen, setIsConfirmDeleteCourseOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<any | null>(null);
  const [courseForm, setCourseForm] = useState<any>({
    title: '',
    description: '',
    thumbnailUrl: '',
    featuredImage: '',
    level: 'iniciante',
    status: 'active',
    isPublished: true,
    isPremium: false
  });
  
  // Estados para módulos
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isConfirmDeleteModuleOpen, setIsConfirmDeleteModuleOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<any | null>(null);
  const [moduleForm, setModuleForm] = useState<any>({
    courseId: 0,
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
  
  // Consultas para obter cursos, módulos e aulas
  const { 
    data: courses = [], 
    isLoading: isLoadingCourses,
    isError: isCoursesError
  } = useQuery({
    queryKey: ['/api/course'],
    queryFn: async () => {
      const res = await fetch('/api/course');
      if (!res.ok) {
        console.error('Erro ao buscar cursos:', res.status, res.statusText);
        throw new Error('Falha ao carregar cursos');
      }
      return res.json();
    }
  });
  
  const { 
    data: modules = [], 
    isLoading: isLoadingModules,
    isError: isModulesError
  } = useQuery({
    queryKey: ['/api/course/modules'],
    queryFn: async () => {
      const res = await fetch('/api/course/modules');
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
    queryKey: ['/api/course/lessons'],
    queryFn: async () => {
      const res = await fetch('/api/course/lessons');
      if (!res.ok) {
        console.error('Erro ao buscar aulas:', res.status, res.statusText);
        throw new Error('Falha ao carregar aulas');
      }
      return res.json();
    }
  });
  
  // Consulta para obter configurações dos cursos
  const { 
    data: courseSettings = {}, 
    isLoading: isLoadingCourseSettings,
    isError: isCourseSettingsError
  } = useQuery({
    queryKey: ['/api/course/settings'],
    queryFn: async () => {
      const res = await fetch('/api/course/settings');
      if (!res.ok) {
        console.error('Erro ao buscar configurações:', res.status, res.statusText);
        throw new Error('Falha ao carregar configurações dos cursos');
      }
      return res.json();
    }
  });
  
  // Handler para mudanças no formulário de curso
  const handleCourseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
  
  // Mutations para cursos
  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/course', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar curso');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course'] });
      setIsCourseDialogOpen(false);
      toast({
        title: 'Curso criado com sucesso',
        description: 'O curso foi adicionado à plataforma',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar curso',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const updateCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/course/${data.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar curso');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course'] });
      setIsCourseDialogOpen(false);
      toast({
        title: 'Curso atualizado com sucesso',
        description: 'As alterações foram salvas',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar curso',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/courses/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir curso');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsConfirmDeleteCourseOpen(false);
      toast({
        title: 'Curso excluído com sucesso',
        description: 'O curso foi removido permanentemente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir curso',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para configurações de cursos
  const updateCourseSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/course/settings', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course/settings'] });
      toast({
        title: 'Configurações atualizadas',
        description: 'As configurações dos cursos foram atualizadas com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar configurações',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutations para módulos
  const createModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/course/modules', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course/modules'] });
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
      const response = await apiRequest('PUT', `/api/course/modules/${data.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course/modules'] });
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
      const response = await apiRequest('DELETE', `/api/course/modules/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course/modules'] });
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
      const response = await apiRequest('POST', '/api/course/lessons', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course/lessons'] });
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
      const response = await apiRequest('PUT', `/api/course/lessons/${data.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course/lessons'] });
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
      const response = await apiRequest('DELETE', `/api/course/lessons/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course/lessons'] });
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
  const handleCourseSubmit = () => {
    if (!courseForm.title || !courseForm.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    if (currentCourse) {
      updateCourseMutation.mutate(courseForm);
    } else {
      createCourseMutation.mutate(courseForm);
    }
  };
  
  const handleDeleteCourse = () => {
    if (currentCourse && currentCourse.id) {
      deleteCourseMutation.mutate(currentCourse.id);
    }
  };
  
  const handleSettingsSubmit = (data: any) => {
    updateCourseSettingsMutation.mutate(data);
  };
  
  const handleModuleSubmit = () => {
    if (!moduleForm.title || !moduleForm.description || !moduleForm.courseId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios, incluindo o curso ao qual este módulo pertence",
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
                  onClick={() => setActiveTab('coursesList')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'coursesList' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mr-3" />
                  <span>Cursos</span>
                </button>
                <button
                  onClick={() => setActiveTab('modules')}
                  className={`flex items-center w-full px-4 py-2 rounded-md ${
                    activeTab === 'modules' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Layers className="w-4 h-4 mr-3" />
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
                {activeTab === 'coursesList' && 'Gerenciamento de Cursos'}
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
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Nova Arte Multi-Formato
                    </Button>
                  )}
                  
                  {activeTab === 'categories' && (
                    <Button 
                      variant="default" 
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  )}
                </div>
              )}
              
              {(activeTab === 'coursesList') && (
                <Button 
                  onClick={() => {
                    setCurrentCourse(null);
                    setCourseForm({
                      title: '',
                      description: '',
                      thumbnailUrl: '',
                      featuredImage: '',
                      level: 'iniciante',
                      status: 'active',
                      isPublished: true,
                      isPremium: false
                    });
                    setIsCourseDialogOpen(true);
                  }}
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Curso
                </Button>
              )}
              
              {(activeTab === 'modules') && (
                <Button 
                  onClick={() => {
                    setCurrentModule(null);
                    setModuleForm({
                      courseId: 0,
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
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Módulo
                </Button>
              )}
              
              {(activeTab === 'lessons') && (
                <Button 
                  onClick={() => {
                    setCurrentLesson(null);
                    setLessonForm({
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
                    setIsLessonDialogOpen(true);
                  }}
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aula
                </Button>
              )}
            </div>
          </div>
        </header>
        
        <main className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Estatísticas Gerais</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        <span>Usuários Totais</span>
                      </div>
                      <div className="font-medium">1,245</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <Image className="w-5 h-5 mr-2 text-blue-500" />
                        <span>Artes Publicadas</span>
                      </div>
                      <div className="font-medium">3,672</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <Video className="w-5 h-5 mr-2 text-blue-500" />
                        <span>Vídeo-aulas</span>
                      </div>
                      <div className="font-medium">84</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <Crown className="w-5 h-5 mr-2 text-amber-500" />
                        <span>Usuários Premium</span>
                      </div>
                      <div className="font-medium">327</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Cursos</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Módulos</div>
                          <div className="text-sm text-gray-500">15 publicados</div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('modules')} className="text-blue-600 hover:text-blue-800">
                        <ChevronDown className="w-5 h-5 rotate-[270deg]" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                          <Video className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Aulas</div>
                          <div className="text-sm text-gray-500">84 publicadas</div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('lessons')} className="text-blue-600 hover:text-blue-800">
                        <ChevronDown className="w-5 h-5 rotate-[270deg]" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                          <Settings className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Configurações</div>
                          <div className="text-sm text-gray-500">Banner, textos</div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('coursesConfig')} className="text-blue-600 hover:text-blue-800">
                        <ChevronDown className="w-5 h-5 rotate-[270deg]" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Conteúdo</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                          <Image className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Artes</div>
                          <div className="text-sm text-gray-500">3.6k publicadas</div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('arts')} className="text-blue-600 hover:text-blue-800">
                        <ChevronDown className="w-5 h-5 rotate-[270deg]" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
                          <LayoutGrid className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Categorias</div>
                          <div className="text-sm text-gray-500">12 principais</div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('categories')} className="text-blue-600 hover:text-blue-800">
                        <ChevronDown className="w-5 h-5 rotate-[270deg]" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mr-3">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Formatos</div>
                          <div className="text-sm text-gray-500">6 padrões</div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('formats')} className="text-blue-600 hover:text-blue-800">
                        <ChevronDown className="w-5 h-5 rotate-[270deg]" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-blue-800">Acesso ao Site</h3>
                          <p className="text-sm mt-2">Visualize a plataforma</p>
                        </div>
                        <Home className="w-8 h-8 text-blue-500" />
                      </div>
                      <Link href="/">
                        <button className="mt-4 text-blue-600 text-sm hover:text-blue-800 flex items-center">
                          Acessar Site
                          <ChevronDown className="w-4 h-4 ml-1 rotate-[270deg]" />
                        </button>
                      </Link>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-purple-800">Vídeo-aulas</h3>
                          <p className="text-sm mt-2">Página de cursos</p>
                        </div>
                        <Video className="w-8 h-8 text-purple-500" />
                      </div>
                      <Link href="/videoaulas">
                        <button className="mt-4 text-purple-600 text-sm hover:text-purple-800 flex items-center">
                          Visualizar
                          <ChevronDown className="w-4 h-4 ml-1 rotate-[270deg]" />
                        </button>
                      </Link>
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
                
                <div className="bg-white border rounded-lg p-4 mt-6 md:col-span-2">
                  <h3 className="font-semibold mb-4">Acesso rápido a cursos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => setActiveTab('modules')}
                      variant="outline" 
                      className="flex items-center justify-center h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Gerenciar Módulos
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab('lessons')}
                      variant="outline" 
                      className="flex items-center justify-center h-12 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Gerenciar Aulas
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
                    {modules.map((module: any) => (
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
                    onClick={() => {
                      setCurrentLesson(null);
                      setLessonForm({
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
                      setIsLessonDialogOpen(true);
                    }}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Aula
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2 items-center">
                    <Select
                      value="all"
                      onValueChange={(value) => console.log(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os módulos</SelectItem>
                        {modules.map((module: any) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value="all"
                      onValueChange={(value) => console.log(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Select
                    value="recent"
                    onValueChange={(value) => console.log(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais recentes</SelectItem>
                      <SelectItem value="oldest">Mais antigos</SelectItem>
                      <SelectItem value="order">Ordem de exibição</SelectItem>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {isLoadingLessons ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse flex items-center border-b py-4">
                        <div className="h-10 w-16 bg-gray-200 rounded mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isLessonsError ? (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro!</AlertTitle>
                    <AlertDescription>
                      Não foi possível carregar as aulas. Por favor, tente novamente.
                    </AlertDescription>
                  </Alert>
                ) : lessons.length === 0 ? (
                  <div className="text-center py-10 border rounded-lg">
                    <Video className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma aula encontrada</h3>
                    <p className="text-gray-500 mb-4">Comece criando sua primeira aula de curso.</p>
                    <Button 
                      onClick={() => {
                        setCurrentLesson(null);
                        setLessonForm({
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
                        setIsLessonDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Aula
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Título</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Módulo</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Duração</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-600 border-b">Status</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-600 border-b">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lessons.map((lesson: any) => {
                          // Encontrar o módulo associado
                          const moduleInfo = modules.find((m: any) => m.id === lesson.moduleId);
                          
                          // Formatar duração
                          const formatDuration = (seconds: number) => {
                            const minutes = Math.floor(seconds / 60);
                            const remainingSeconds = seconds % 60;
                            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                          };
                          
                          return (
                            <tr key={lesson.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 border-b">
                                <div className="flex items-center">
                                  <div className="h-10 w-16 bg-gray-100 rounded mr-3">
                                    <img 
                                      src={lesson.thumbnailUrl || "https://via.placeholder.com/640x360?text=Sem+Imagem"} 
                                      alt={lesson.title} 
                                      className="h-10 w-16 object-cover rounded"
                                      onError={(e) => {
                                        e.currentTarget.src = "https://via.placeholder.com/640x360?text=Erro+ao+carregar";
                                      }}
                                    />
                                  </div>
                                  <div className="font-medium">
                                    {lesson.title}
                                    <p className="text-xs text-gray-500 mt-1">{lesson.videoProvider}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 border-b">
                                {moduleInfo ? moduleInfo.title : 'Módulo desconhecido'}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {formatDuration(lesson.duration)}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {lesson.isPremium ? (
                                  <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                                    Premium
                                  </span>
                                ) : (
                                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    Gratuito
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 border-b text-right">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setCurrentLesson(lesson);
                                    setLessonForm({
                                      id: lesson.id,
                                      moduleId: lesson.moduleId,
                                      title: lesson.title,
                                      description: lesson.description,
                                      videoUrl: lesson.videoUrl,
                                      videoProvider: lesson.videoProvider,
                                      duration: lesson.duration,
                                      thumbnailUrl: lesson.thumbnailUrl,
                                      order: lesson.order,
                                      isPremium: lesson.isPremium,
                                      showLessonNumber: lesson.showLessonNumber
                                    });
                                    setIsLessonDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setCurrentLesson(lesson);
                                    setIsConfirmDeleteLessonOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* Diálogo para adicionar/editar aula */}
              <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileVideo className="h-5 w-5" />
                      {currentLesson ? 'Editar Aula' : 'Adicionar Aula'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="lessonTitle">Título da aula *</Label>
                        <Input
                          id="lessonTitle"
                          name="title"
                          value={lessonForm.title}
                          onChange={handleLessonFormChange}
                          placeholder="Ex: Introdução ao Design de Posts"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="lessonModule">Módulo *</Label>
                        <Select
                          name="moduleId"
                          value={lessonForm.moduleId ? lessonForm.moduleId.toString() : ""}
                          onValueChange={value => 
                            setLessonForm({...lessonForm, moduleId: Number(value)})
                          }
                        >
                          <SelectTrigger id="lessonModule" className="h-10">
                            <SelectValue placeholder="Selecione o módulo" />
                          </SelectTrigger>
                          <SelectContent>
                            {modules.map((module: any) => (
                              <SelectItem key={module.id} value={module.id.toString()}>
                                {module.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="lessonOrder">Ordem na sequência *</Label>
                        <Input
                          id="lessonOrder"
                          name="order"
                          type="number"
                          value={lessonForm.order}
                          onChange={handleLessonFormChange}
                          placeholder="Número da ordem"
                          min={1}
                        />
                      </div>
                      
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="lessonDescription">Descrição *</Label>
                        <Textarea
                          id="lessonDescription"
                          name="description"
                          value={lessonForm.description}
                          onChange={handleLessonFormChange}
                          placeholder="Breve descrição sobre a aula"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="lessonVideoProvider">Plataforma de vídeo *</Label>
                        <Select
                          name="videoProvider"
                          value={lessonForm.videoProvider}
                          onValueChange={value => 
                            setLessonForm({...lessonForm, videoProvider: value})
                          }
                        >
                          <SelectTrigger id="lessonVideoProvider" className="h-10">
                            <SelectValue placeholder="Selecione a plataforma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="vimeo">Vimeo</SelectItem>
                            <SelectItem value="vturb">vTurb</SelectItem>
                            <SelectItem value="panda">Panda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="lessonVideoUrl">URL do vídeo *</Label>
                        <Input
                          id="lessonVideoUrl"
                          name="videoUrl"
                          value={lessonForm.videoUrl}
                          onChange={handleLessonFormChange}
                          placeholder="Ex: https://www.youtube.com/watch?v=abcdefghijk"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="lessonDuration">Duração (segundos) *</Label>
                        <Input
                          id="lessonDuration"
                          name="duration"
                          type="number"
                          value={lessonForm.duration}
                          onChange={handleLessonFormChange}
                          placeholder="Duração em segundos"
                          min={1}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="lessonThumbnailUrl">URL da miniatura *</Label>
                        <Input
                          id="lessonThumbnailUrl"
                          name="thumbnailUrl"
                          value={lessonForm.thumbnailUrl}
                          onChange={handleLessonFormChange}
                          placeholder="URL da imagem de miniatura"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="lessonPremium"
                          name="isPremium"
                          checked={lessonForm.isPremium}
                          onCheckedChange={checked => 
                            setLessonForm({...lessonForm, isPremium: checked === true})
                          }
                        />
                        <Label htmlFor="lessonPremium" className="text-sm">
                          <span className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            Conteúdo premium
                          </span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="lessonShowNumber"
                          name="showLessonNumber"
                          checked={lessonForm.showLessonNumber}
                          onCheckedChange={checked => 
                            setLessonForm({...lessonForm, showLessonNumber: checked === true})
                          }
                        />
                        <Label htmlFor="lessonShowNumber" className="text-sm">
                          <span className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-blue-500" />
                            Mostrar numeração da aula
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="border-t pt-4 mt-4">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsLessonDialogOpen(false)}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleLessonSubmit}
                        disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                        className="gap-2"
                      >
                        {createLessonMutation.isPending || updateLessonMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : currentLesson ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Atualizar aula
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Criar aula
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Diálogo de confirmação para excluir aula */}
              <Dialog open={isConfirmDeleteLessonOpen} onOpenChange={setIsConfirmDeleteLessonOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Excluir Aula
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="mb-4">
                      Tem certeza que deseja excluir a aula <strong>{currentLesson?.title}</strong>?
                    </p>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção</AlertTitle>
                      <AlertDescription>
                        A exclusão da aula será permanente e afetará o progresso dos usuários que estavam acompanhando este conteúdo.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter className="flex justify-between gap-3 border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsConfirmDeleteLessonOpen(false)}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteLesson}
                      disabled={deleteLessonMutation.isPending}
                      className="gap-2"
                    >
                      {deleteLessonMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Excluir aula
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="arts">
              <ArtsList setIsMultiFormOpen={setIsMultiFormOpen} />
            </TabsContent>
            
            <TabsContent value="categories">
              <CategoriesList />
            </TabsContent>
            
            <TabsContent value="formats">
              <FormatsList />
            </TabsContent>
            
            <TabsContent value="fileTypes">
              <FileTypesList />
            </TabsContent>
            
            <TabsContent value="coursesList">
              <div className="mb-6 grid grid-cols-1 gap-6">
                <div className="col-span-full">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Cursos</h2>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setCurrentCourse(null);
                          setCourseForm({
                            title: '',
                            description: '',
                            thumbnailUrl: '',
                            featuredImage: '',
                            level: 'iniciante',
                            status: 'active',
                            isPublished: true,
                            isPremium: false
                          });
                          setIsCourseDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Curso
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Imagem</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Nível</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Premium</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingCourses ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                <div className="flex justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : isCoursesError ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-red-500">
                                Erro ao carregar os cursos. Tente novamente.
                              </TableCell>
                            </TableRow>
                          ) : courses.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                Nenhum curso encontrado. Clique em "Novo Curso" para criar.
                              </TableCell>
                            </TableRow>
                          ) : (
                            courses.map((course) => (
                              <TableRow key={course.id}>
                                <TableCell>
                                  <div className="w-16 h-9 bg-gray-100 rounded overflow-hidden">
                                    {course.thumbnailUrl ? (
                                      <img 
                                        src={course.thumbnailUrl} 
                                        alt={course.title} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{course.title}</TableCell>
                                <TableCell>
                                  {course.level === 'iniciante' && 'Iniciante'}
                                  {course.level === 'intermediario' && 'Intermediário'}
                                  {course.level === 'avancado' && 'Avançado'}
                                </TableCell>
                                <TableCell>
                                  {course.status === 'active' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      Ativo
                                    </Badge>
                                  )}
                                  {course.status === 'draft' && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                      Rascunho
                                    </Badge>
                                  )}
                                  {course.status === 'archived' && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                      Arquivado
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {course.isPremium ? (
                                    <Badge variant="default" className="bg-amber-500">Premium</Badge>
                                  ) : (
                                    <Badge variant="outline">Grátis</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setCurrentCourse(course);
                                          setCourseForm({
                                            ...course
                                          });
                                          setIsCourseDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setCurrentCourse(course);
                                          setIsConfirmDeleteCourseOpen(true);
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Diálogo para adicionar/editar curso */}
              <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {currentCourse ? 'Editar Curso' : 'Adicionar Curso'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="courseTitle">Título do curso *</Label>
                        <Input
                          id="courseTitle"
                          name="title"
                          value={courseForm.title}
                          onChange={handleCourseFormChange}
                          placeholder="Ex: Dominando o Design para Redes Sociais"
                        />
                      </div>
                      
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="courseDescription">Descrição</Label>
                        <Textarea
                          id="courseDescription"
                          name="description"
                          value={courseForm.description}
                          onChange={handleCourseFormChange}
                          placeholder="Descreva o conteúdo do curso"
                          rows={4}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="courseThumbnailUrl">URL da thumbnail</Label>
                        <Input
                          id="courseThumbnailUrl"
                          name="thumbnailUrl"
                          value={courseForm.thumbnailUrl}
                          onChange={handleCourseFormChange}
                          placeholder="Ex: https://example.com/thumbnail.jpg"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="courseFeaturedImage">URL da imagem de destaque</Label>
                        <Input
                          id="courseFeaturedImage"
                          name="featuredImage"
                          value={courseForm.featuredImage}
                          onChange={handleCourseFormChange}
                          placeholder="Ex: https://example.com/featured.jpg"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="courseLevel">Nível</Label>
                        <Select
                          name="level"
                          value={courseForm.level}
                          onValueChange={(value) => 
                            setCourseForm({...courseForm, level: value})
                          }
                        >
                          <SelectTrigger id="courseLevel" className="h-10">
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iniciante">Iniciante</SelectItem>
                            <SelectItem value="intermediario">Intermediário</SelectItem>
                            <SelectItem value="avancado">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="courseStatus">Status</Label>
                        <Select
                          name="status"
                          value={courseForm.status}
                          onValueChange={(value) => 
                            setCourseForm({...courseForm, status: value})
                          }
                        >
                          <SelectTrigger id="courseStatus" className="h-10">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="archived">Arquivado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="courseIsPublished"
                          name="isPublished"
                          checked={courseForm.isPublished}
                          onCheckedChange={(checked) => 
                            setCourseForm({...courseForm, isPublished: checked === true})
                          }
                        />
                        <Label htmlFor="courseIsPublished" className="text-sm">
                          <span className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-500" />
                            Publicado
                          </span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="courseIsPremium"
                          name="isPremium"
                          checked={courseForm.isPremium}
                          onCheckedChange={(checked) => 
                            setCourseForm({...courseForm, isPremium: checked === true})
                          }
                        />
                        <Label htmlFor="courseIsPremium" className="text-sm">
                          <span className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            Premium
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="border-t pt-4 mt-4">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCourseDialogOpen(false)}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCourseSubmit}
                        disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                        className="gap-2"
                      >
                        {createCourseMutation.isPending || updateCourseMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : currentCourse ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Atualizar curso
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Criar curso
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Diálogo para confirmação de exclusão de curso */}
              <Dialog open={isConfirmDeleteCourseOpen} onOpenChange={setIsConfirmDeleteCourseOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Excluir Curso
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="mb-4">
                      Tem certeza que deseja excluir o curso <strong>{currentCourse?.title}</strong>?
                    </p>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção</AlertTitle>
                      <AlertDescription>
                        A exclusão do curso também pode excluir todos os módulos e aulas associados. Esta ação é permanente e não pode ser desfeita.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter className="flex justify-between gap-3 border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsConfirmDeleteCourseOpen(false)}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteCourse}
                      disabled={deleteCourseMutation.isPending}
                      className="gap-2"
                    >
                      {deleteCourseMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Excluir curso
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            <TabsContent value="coursesConfig">
              <div className="mb-6 grid grid-cols-1 gap-6">
                <div className="col-span-full">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Configurações de Cursos</h2>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Recarregar configurações atuais
                          queryClient.invalidateQueries({ queryKey: ['/api/courses/settings'] });
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    </div>
                    
                    {isLoadingCourseSettings ? (
                      <div className="py-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-500">Carregando configurações...</p>
                      </div>
                    ) : isCourseSettingsError ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>
                          Não foi possível carregar as configurações dos cursos. Tente novamente.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-6">
                        <div className="grid gap-3">
                          <h3 className="text-md font-medium">Configurações da Página de Cursos</h3>
                          <Separator />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="grid gap-2">
                              <Label htmlFor="settingsBannerTitle">Título do Banner</Label>
                              <Input
                                id="settingsBannerTitle"
                                name="bannerTitle"
                                value={courseSettings.bannerTitle || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const updated = {...courseSettings, bannerTitle: value};
                                  updateCourseSettingsMutation.mutate(updated);
                                }}
                                placeholder="Ex: Aprenda com nossos cursos exclusivos"
                              />
                            </div>
                            
                            <div className="grid gap-2">
                              <Label htmlFor="settingsBannerDescription">Descrição do Banner</Label>
                              <Textarea
                                id="settingsBannerDescription"
                                name="bannerDescription"
                                value={courseSettings.bannerDescription || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const updated = {...courseSettings, bannerDescription: value};
                                  updateCourseSettingsMutation.mutate(updated);
                                }}
                                placeholder="Descreva o propósito dos cursos"
                                rows={3}
                              />
                            </div>
                            
                            <div className="grid gap-2">
                              <Label htmlFor="settingsBannerImageUrl">URL da Imagem do Banner</Label>
                              <Input
                                id="settingsBannerImageUrl"
                                name="bannerImageUrl"
                                value={courseSettings.bannerImageUrl || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const updated = {...courseSettings, bannerImageUrl: value};
                                  updateCourseSettingsMutation.mutate(updated);
                                }}
                                placeholder="Ex: https://example.com/banner.jpg"
                              />
                            </div>
                            
                            <div className="grid gap-2">
                              <Label htmlFor="settingsWelcomeMessage">Mensagem de Boas-Vindas</Label>
                              <Textarea
                                id="settingsWelcomeMessage"
                                name="welcomeMessage"
                                value={courseSettings.welcomeMessage || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const updated = {...courseSettings, welcomeMessage: value};
                                  updateCourseSettingsMutation.mutate(updated);
                                }}
                                placeholder="Mensagem para os alunos"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid gap-3 mt-4">
                          <h3 className="text-md font-medium">Configurações Avançadas</h3>
                          <Separator />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="settingsShowModuleNumbers"
                                name="showModuleNumbers"
                                checked={courseSettings.showModuleNumbers || false}
                                onCheckedChange={(checked) => {
                                  const updated = {...courseSettings, showModuleNumbers: checked === true};
                                  updateCourseSettingsMutation.mutate(updated);
                                }}
                              />
                              <Label htmlFor="settingsShowModuleNumbers" className="text-sm">
                                <span className="flex items-center gap-2">
                                  <ListOrdered className="h-4 w-4 text-blue-500" />
                                  Mostrar numeração dos módulos
                                </span>
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="settingsUseCustomPlayerColors"
                                name="useCustomPlayerColors"
                                checked={courseSettings.useCustomPlayerColors || false}
                                onCheckedChange={(checked) => {
                                  const updated = {...courseSettings, useCustomPlayerColors: checked === true};
                                  updateCourseSettingsMutation.mutate(updated);
                                }}
                              />
                              <Label htmlFor="settingsUseCustomPlayerColors" className="text-sm">
                                <span className="flex items-center gap-2">
                                  <Palette className="h-4 w-4 text-purple-500" />
                                  Usar cores personalizadas no player
                                </span>
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="settingsEnableComments"
                                name="enableComments"
                                checked={courseSettings.enableComments !== false}
                                onCheckedChange={(checked) => {
                                  const updated = {...courseSettings, enableComments: checked === true};
                                  updateCourseSettingsMutation.mutate(updated);
                                }}
                              />
                              <Label htmlFor="settingsEnableComments" className="text-sm">
                                <span className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4 text-green-500" />
                                  Habilitar comentários nas aulas
                                </span>
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="settingsAllowNonPremiumEnrollment"
                                name="allowNonPremiumEnrollment"
                                checked={courseSettings.allowNonPremiumEnrollment || false}
                                onCheckedChange={(checked) => {
                                  const updated = {...courseSettings, allowNonPremiumEnrollment: checked === true};
                                  updateCourseSettingsMutation.mutate(updated);
                                }}
                              />
                              <Label htmlFor="settingsAllowNonPremiumEnrollment" className="text-sm">
                                <span className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-amber-500" />
                                  Permitir matrícula para não-premium
                                </span>
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <SiteSettings />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      {/* Diálogo de criação de arte multi-formato */}
      <SimpleFormMultiDialog open={isMultiFormOpen} onOpenChange={setIsMultiFormOpen} />
    </div>
  );
};

export default AdminDashboard;