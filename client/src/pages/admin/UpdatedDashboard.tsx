import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import AnalyticsSettings from '@/components/admin/AnalyticsSettings';
import ReportsManagement from '@/components/admin/ReportsManagement';
import CollaborationRequestsManagement from '@/components/admin/CollaborationRequestsManagement';
import AffiliateRequestsManagement from '@/components/admin/AffiliateRequestsManagement';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';
import SubscriptionSettings from '@/components/admin/SubscriptionSettings';
import SubscriptionDashboard from '@/components/admin/SubscriptionDashboard';
import SimpleSubscriptionDashboard from '@/components/admin/SimpleSubscriptionDashboard';
import SaasDashboard from '@/components/admin/SaasDashboard';
import PlatformMetrics from '@/components/admin/PlatformMetrics';
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
  Flag,
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
  FileImage,
  FileText,
  Pencil,
  MoreVertical,
  AlertCircle,
  AlertTriangle,
  Loader2,
  XCircle,
  CheckCircle2,
  Crown,
  Sparkles,
  Upload,
  Zap,
  Award,
  FileVideo,
  MoreHorizontal,
  Edit,
  Eye, 
  RefreshCw,
  ListOrdered,
  BellRing,
  Palette,
  Save,
  Calendar,
  Wrench,
  FlagIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import ModernUserManagement from '@/components/admin/ModernUserManagement';
import CommunityManagement from './community/CommunityManagement';
import SiteSettings from '@/components/admin/SiteSettings';
import CommentsManagement from '@/components/admin/CommentsManagement';
import FormatsList from '@/components/admin/FormatsList';
import CourseStatisticsPanel from '@/components/admin/CourseStatisticsPanel';
import FileTypesList from '@/components/admin/FileTypesList';
import PopupManagement from '@/components/admin/PopupManagement';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from "@/lib/queryClient";
import GerenciarFerramentas from './ferramentas/GerenciarFerramentas';
import GerenciarCategorias from './ferramentas/GerenciarCategorias';

const AdminDashboard = () => {
  const { user, logoutMutation } = useAuth();
  // Define aba padrão baseada no nível de acesso
  const getDefaultTab = () => {
    if (user?.nivelacesso === 'suporte') {
      return 'subscriptions'; // Suporte inicia na aba Assinaturas
    }
    return 'arts'; // Admin e designer_adm iniciam na aba Artes
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMultiFormOpen, setIsMultiFormOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  // Função para verificar se o usuário tem acesso a uma aba específica
  const hasTabAccess = (tabName: string): boolean => {
    if (user?.nivelacesso === 'admin') {
      return true; // Admin tem acesso total
    }
    
    if (user?.nivelacesso === 'designer_adm') {
      // Designer ADM tem acesso apenas a: arts, courses, ferramentas, community
      const allowedTabs = ['arts', 'courses', 'ferramentas', 'community'];
      return allowedTabs.includes(tabName);
    }
    
    if (user?.nivelacesso === 'suporte') {
      // Suporte tem acesso apenas a: subscriptions, users, community, reports
      const allowedTabs = ['subscriptions', 'users', 'community', 'reports'];
      return allowedTabs.includes(tabName);
    }
    
    return false;
  };

  // Estados para cursos
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isConfirmDeleteCourseOpen, setIsConfirmDeleteCourseOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<any | null>(null);
  // Estado dos arquivos de upload
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  
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
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('todos'); // Filtro por curso
  const [moduleViewMode, setModuleViewMode] = useState<'grid' | 'list'>('grid'); // Modo de visualização (grid ou lista)
  const [moduleForm, setModuleForm] = useState<any>({
    courseId: '', // String vazia para forçar seleção explícita
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
  
  // Estados para configurações de cursos
  const [selectedCourseForSettings, setSelectedCourseForSettings] = useState<any | null>(null);
  
  // Consulta para obter configurações específicas do curso selecionado
  const { 
    data: specificCourseSettings,
    isLoading: isLoadingSpecificSettings,
    isError: isSpecificSettingsError
  } = useQuery({
    queryKey: ['/api/course/settings', selectedCourseForSettings?.id],
    queryFn: async () => {
      if (!selectedCourseForSettings?.id) {
        return null; // Não faz requisição se não houver curso selecionado
      }
      
      const res = await fetch(`/api/course/settings?courseId=${selectedCourseForSettings.id}`);
      if (!res.ok) {
        console.error('Erro ao buscar configurações específicas:', res.status, res.statusText);
        throw new Error(`Falha ao carregar configurações do curso ${selectedCourseForSettings.title}`);
      }
      return res.json();
    },
    enabled: !!selectedCourseForSettings?.id, // Só executa quando houver um curso selecionado
    refetchOnWindowFocus: false,
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  // Consultas para obter cursos, módulos e aulas
  const { 
    data: courses = [], 
    isLoading: isLoadingCourses,
    isError: isCoursesError
  } = useQuery({
    queryKey: ['/api/course'],
    queryFn: async () => {
      try {
        console.log("Consultando API de cursos em: /api/course");
        const res = await fetch('/api/course');
        
        if (!res.ok) {
          console.error('Erro ao buscar cursos:', res.status, res.statusText);
          const errorText = await res.text();
          console.error('Resposta da API:', errorText);
          throw new Error(`Falha ao carregar cursos: ${res.status} ${res.statusText}`);
        }
        
        const jsonData = await res.json();
        console.log("Cursos recebidos da API:", jsonData);
        return jsonData;
      } catch (error) {
        console.error("Exceção ao buscar cursos:", error);
        throw error;
      }
    },
    retry: 1
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
  
  // Consulta para obter configurações dos cursos (padrão, sem courseId específico)
  const { 
    data: courseSettingsData = {}, 
    isLoading: isLoadingCourseSettings,
    isError: isCourseSettingsError
  } = useQuery({
    queryKey: ['/api/course/settings', 'default'],
    queryFn: async () => {
      const res = await fetch('/api/course/settings');
      if (!res.ok) {
        console.error('Erro ao buscar configurações:', res.status, res.statusText);
        throw new Error('Falha ao carregar configurações dos cursos');
      }
      return res.json();
    },
    refetchOnWindowFocus: false
  });
  
  // Estado local para gerenciar edições antes de salvar
  const [courseSettings, setCourseSettings] = useState(courseSettingsData);
  
  // Atualiza o estado local quando os dados da API são carregados ou quando o curso selecionado muda
  useEffect(() => {
    if (selectedCourseForSettings?.id && specificCourseSettings) {
      // Se temos um curso selecionado e configurações específicas para ele, usamos essas configurações
      console.log(`Carregando configurações específicas do curso "${selectedCourseForSettings.title}":`, specificCourseSettings);
      setCourseSettings(specificCourseSettings);
    } else if (!isLoadingCourseSettings && !isCourseSettingsError && courseSettingsData) {
      // Caso contrário, usamos as configurações padrão
      console.log('Carregando configurações padrão:', courseSettingsData);
      setCourseSettings(courseSettingsData);
    }
  }, [
    courseSettingsData, 
    isLoadingCourseSettings, 
    isCourseSettingsError, 
    selectedCourseForSettings, 
    specificCourseSettings
  ]);
  
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
    mutationFn: async (formData: any) => {
      try {
        console.log("Enviando requisição para criar curso:", formData);
        const response = await apiRequest('POST', '/api/course', formData);
        
        if (!response.ok) {
          console.error("Erro na resposta:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Corpo da resposta de erro:", errorText);
          
          let errorMessage = 'Erro ao criar curso';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error("Falha ao analisar resposta de erro como JSON:", e);
            errorMessage = `Erro ${response.status}: ${errorText.substring(0, 100)}`;
          }
          
          throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        console.log("Curso criado com sucesso:", responseData);
        return responseData;
      } catch (error) {
        console.error("Exceção ao criar curso:", error);
        throw error;
      }
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
      const response = await apiRequest('DELETE', `/api/course/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir curso');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course'] });
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
    onSuccess: (data, variables) => {
      // Invalida consulta padrão
      queryClient.invalidateQueries({ queryKey: ['/api/course/settings', 'default'] });
      
      // Se houver um courseId, também invalida a consulta específica desse curso
      if (variables.courseId) {
        console.log(`Invalidando cache para o curso ${variables.courseId}`);
        queryClient.invalidateQueries({ queryKey: ['/api/course/settings', variables.courseId] });
      }
      
      toast({
        title: 'Configurações atualizadas',
        description: variables.courseId 
          ? `As configurações do curso foram atualizadas com sucesso` 
          : 'As configurações padrão foram atualizadas com sucesso',
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
  
  // Handlers para upload de imagens
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };
  
  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFeaturedImageFile(e.target.files[0]);
    }
  };
  
  // Upload da thumbnail (formato horizontal)
  const handleThumbnailUpload = async () => {
    if (!thumbnailFile) return;
    
    setUploadingThumbnail(true);
    
    try {
      const formData = new FormData();
      formData.append('thumbnail', thumbnailFile);
      
      // Se estamos editando um curso, incluir o ID
      if (currentCourse && currentCourse.id) {
        formData.append('courseId', currentCourse.id.toString());
      }
      
      // Usar a rota específica para thumbnails horizontais
      const response = await fetch('/api/courses/thumbnail-upload-horizontal', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro no upload:', errorData);
        throw new Error('Falha no upload da imagem');
      }
      
      const data = await response.json();
      
      // Atualiza o formulário com a URL da imagem
      setCourseForm(prev => ({
        ...prev,
        thumbnailUrl: data.thumbnailUrl
      }));
      
      toast({
        title: 'Upload realizado com sucesso',
        description: 'A thumbnail foi carregada e associada ao curso',
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Não foi possível fazer o upload da imagem',
        variant: 'destructive',
      });
    } finally {
      setUploadingThumbnail(false);
    }
  };
  
  // Upload da imagem de destaque (formato vertical)
  const handleFeaturedImageUpload = async () => {
    if (!featuredImageFile) return;
    
    setUploadingFeatured(true);
    
    try {
      const formData = new FormData();
      formData.append('thumbnail', featuredImageFile);
      
      // Se estamos editando um curso, incluir o ID
      if (currentCourse && currentCourse.id) {
        formData.append('courseId', currentCourse.id.toString());
      }
      
      // Usar a rota específica para thumbnails verticais (imagem de destaque)
      const response = await fetch('/api/courses/thumbnail-upload-vertical', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro no upload:', errorData);
        throw new Error('Falha no upload da imagem de destaque');
      }
      
      const data = await response.json();
      
      // Atualiza o formulário com a URL da imagem
      setCourseForm(prev => ({
        ...prev,
        featuredImage: data.featuredImage
      }));
      
      toast({
        title: 'Upload realizado com sucesso',
        description: 'A imagem de destaque foi carregada',
      });
    } catch (error) {
      console.error('Erro no upload da imagem de destaque:', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Não foi possível fazer o upload da imagem de destaque',
        variant: 'destructive',
      });
    } finally {
      setUploadingFeatured(false);
    }
  };
  
  // Handler para o upload de banner da configuração de cursos
  const handleBannerUpload = async () => {
    if (!bannerFile) return;
    
    setUploadingBanner(true);
    
    try {
      const formData = new FormData();
      formData.append('banner', bannerFile);
      
      // Se temos um curso selecionado para configurações, incluir o ID
      if (selectedCourseForSettings) {
        formData.append('courseId', selectedCourseForSettings.id.toString());
      }
      
      const response = await fetch('/api/admin/upload-banner', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro no upload do banner:', errorData);
        throw new Error('Falha no upload do banner');
      }
      
      const data = await response.json();
      
      // Atualiza as configurações com a nova URL do banner
      const updatedSettings = {
        ...courseSettings,
        bannerImageUrl: data.bannerUrl
      };
      
      // Atualiza no servidor
      updateCourseSettingsMutation.mutate(updatedSettings, {
        onSuccess: () => {
          // Invalidar cache para garantir que as alterações apareçam na página de videoaulas
          queryClient.invalidateQueries({ queryKey: ['/api/course/settings', 'default'] });
          
          // Se houver um curso selecionado, também invalidar a consulta específica desse curso
          if (selectedCourseForSettings?.id) {
            queryClient.invalidateQueries({ queryKey: ['/api/course/settings', selectedCourseForSettings.id] });
          }
          
          // Limpa a pré-visualização e o arquivo selecionado após o upload bem-sucedido
          setBannerFile(null);
          if (bannerPreviewUrl) {
            URL.revokeObjectURL(bannerPreviewUrl);
            setBannerPreviewUrl(null);
          }
          
          toast({
            title: 'Banner enviado com sucesso',
            description: 'A imagem do banner foi atualizada',
          });
        }
      });
    } catch (error) {
      console.error('Erro no upload do banner:', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Não foi possível fazer o upload do banner',
        variant: 'destructive',
      });
    } finally {
      setUploadingBanner(false);
    }
  };
  
  // Handler para o input do arquivo de banner
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      
      // Criar uma URL de visualização da imagem
      const previewUrl = URL.createObjectURL(file);
      setBannerPreviewUrl(previewUrl);
    }
  };
  
  // Limpar a URL de visualização quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [bannerPreviewUrl]);
  
  // Não selecionamos automaticamente nenhum curso na aba de configurações
  // O usuário deve selecionar manualmente qual curso deseja editar
  // Isso evita conflitos com cursos que já existem em outras abas

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
    // Adiciona o courseId do curso selecionado, se existir
    const settingsToUpdate = {
      ...data,
      courseId: selectedCourseForSettings?.id || undefined
    };
    
    updateCourseSettingsMutation.mutate(settingsToUpdate, {
      onSuccess: () => {
        // A invalidação de cache já é tratada no onSuccess da mutation
        toast({
          title: "Configurações salvas",
          description: selectedCourseForSettings?.id
            ? `As configurações do curso "${selectedCourseForSettings.title}" foram atualizadas`
            : "As configurações padrão foram atualizadas com sucesso",
          duration: 3000,
        });
      }
    });
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
  
  // Verifica se o usuário é admin, designer_adm ou suporte
  const isAuthorized = user?.nivelacesso === 'admin' || user?.nivelacesso === 'designer_adm' || user?.nivelacesso === 'suporte';

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
      {/* Overlay - aparece em telas pequenas quando a sidebar está aberta */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Botão flutuante para abrir sidebar quando fechado */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-3 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-blue-50 hover:border-blue-200"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <PanelRight className="w-5 h-5 text-gray-600 hover:text-blue-600" />
        </button>
      )}
      
      {/* Sidebar - com possibilidade de ser recolhida em todos os tamanhos de tela */}
      <div 
        className={`
          fixed lg:relative z-40 h-full bg-white border-r border-gray-200/80
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-16'} 
          transition-all duration-300 ease-in-out overflow-hidden
        `}
      >
        <div className="py-4 px-4 border-b border-gray-200/80 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">DA</span>
            </div>
            <h1 className={`text-lg font-semibold text-gray-900 ${!sidebarOpen ? 'lg:opacity-0 lg:w-0' : ''} transition-opacity duration-300`}>DesignAuto</h1>
          </div>
          <button 
            className={`text-gray-400 hover:text-gray-600 p-1.5 rounded-md transition-colors ${!sidebarOpen ? 'lg:mx-auto' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Recolher menu" : "Expandir menu"}
          >
            {sidebarOpen ? <PanelLeft className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </button>
        </div>
        <div className="px-4 py-5 overflow-hidden">
          <div className={`flex items-center mb-6 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className={`${sidebarOpen ? 'mr-3' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium text-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-medium text-gray-900 truncate text-sm">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.nivelacesso === 'admin' ? 'Administrador' : 
                   user?.nivelacesso === 'designer_adm' ? 'Designer Admin' : 
                   user?.nivelacesso === 'suporte' ? 'Suporte' : 'Usuário'}
                </p>
              </div>
            )}
          </div>
          <nav className="space-y-1">
            {/* Dashboard principal - apenas para admin */}
            {hasTabAccess('stats') && (
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === 'stats' 
                    ? 'bg-orange-50 text-orange-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title="Dashboard"
              >
                <LayoutDashboard className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                  activeTab === 'stats' ? 'text-orange-600' : 'text-gray-500'
                }`} />
                {sidebarOpen && <span className="font-medium">Dashboard</span>}
              </button>
            )}
            
            {/* Financeiro - apenas para admin */}
            {hasTabAccess('financeiro') && (
              <button
                onClick={() => setActiveTab('financeiro')}
                className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === 'financeiro' 
                    ? 'bg-orange-50 text-orange-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title="Postagens"
              >
                <BarChart3 className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                  activeTab === 'financeiro' ? 'text-orange-600' : 'text-gray-500'
                }`} />
                {sidebarOpen && <span className="font-medium">Postagens</span>}
              </button>
            )}
            
            {/* Usuários - dropdown com assinaturas */}
            {(hasTabAccess('users') || hasTabAccess('subscriptions')) && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={['users', 'subscriptions'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
                <CollapsibleTrigger 
                  className={`flex items-center w-full px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-sm ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                  title="Usuários"
                >
                  <Users className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-500`} />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium">Usuários</span>
                      <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                    </>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className={`${sidebarOpen ? 'pl-6' : 'flex flex-col items-center'} space-y-1`}>
                {hasTabAccess('users') && (
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'users' 
                        ? 'bg-orange-50 text-orange-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                    title="Gerenciar Usuários"
                  >
                    <Users className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                      activeTab === 'users' ? 'text-orange-600' : 'text-gray-500'
                    }`} />
                    {sidebarOpen && <span className="font-medium">Gerenciar Usuários</span>}
                  </button>
                )}
                {hasTabAccess('subscriptions') && (
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'subscriptions' 
                        ? 'bg-orange-50 text-orange-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                    title="Assinaturas Hotmart"
                  >
                    <CreditCard className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                      activeTab === 'subscriptions' ? 'text-orange-600' : 'text-gray-500'
                    }`} />
                    {sidebarOpen && <span className="font-medium">Assinaturas Hotmart</span>}
                  </button>
                )}
              </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Gerenciamento de Conteúdo - Oculto para suporte */}
            {user?.nivelacesso !== 'suporte' && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={['arts', 'categories', 'formats', 'fileTypes', 'community'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-sm ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title="Monetização"
              >
                <Layers className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-500`} />
                {sidebarOpen && (
                  <>
                    <span className="font-medium">Monetização</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-6' : 'flex flex-col items-center'} space-y-1`}>
                <button
                  onClick={() => setActiveTab('arts')}
                  className={`flex items-center w-full py-2 rounded-md transition-all duration-200 ${
                    activeTab === 'arts' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  } ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                  title="Artes"
                >
                  <Image className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                  {sidebarOpen && <span className="truncate text-sm">Artes</span>}
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex items-center w-full py-2 rounded-md transition-all duration-200 ${
                    activeTab === 'categories' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  } ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                  title="Categorias"
                >
                  <LayoutGrid className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                  {sidebarOpen && <span className="truncate text-sm">Categorias</span>}
                </button>
                <button
                  onClick={() => setActiveTab('formats')}
                  className={`flex items-center w-full py-2 rounded-md transition-all duration-200 ${
                    activeTab === 'formats' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  } ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                  title="Formatos"
                >
                  <CreditCard className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                  {sidebarOpen && <span className="truncate text-sm">Formatos</span>}
                </button>
                <button
                  onClick={() => setActiveTab('fileTypes')}
                  className={`flex items-center w-full py-2 rounded-md transition-all duration-200 ${
                    activeTab === 'fileTypes' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  } ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                  title="Tipos de Arquivo"
                >
                  <FileType className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                  {sidebarOpen && <span className="truncate text-sm">Tipos de Arquivo</span>}
                </button>
                {hasTabAccess('community') && (
                  <button
                    onClick={() => setActiveTab('community')}
                    className={`flex items-center w-full py-2 rounded-md transition-all duration-200 ${
                      activeTab === 'community' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    } ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                    title="Comunidade"
                  >
                    <MessageSquare className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                    {sidebarOpen && <span className="truncate text-sm">Comunidade</span>}
                  </button>
                )}

              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Cursos e Vídeo-aulas - Visível para suporte e admin */}
            {(user?.nivelacesso === 'suporte' || user?.nivelacesso === 'admin' || user?.nivelacesso === 'designer_adm') && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={['courses', 'modules', 'lessons', 'coursesConfig', 'courseStats'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-sm ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title="Cursos"
              >
                <BookOpen className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-500`} />
                {sidebarOpen && (
                  <>
                    <span className="font-medium">Cursos</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-6' : 'flex flex-col items-center'} space-y-1`}>
                <button
                  onClick={() => setActiveTab('coursesList')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'coursesList' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Cursos"
                >
                  <BookOpen className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'coursesList' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Cursos</span>}
                </button>
                <button
                  onClick={() => setActiveTab('modules')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'modules' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Módulos"
                >
                  <Layers className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'modules' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Módulos</span>}
                </button>
                <button
                  onClick={() => setActiveTab('lessons')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'lessons' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Aulas"
                >
                  <Video className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'lessons' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Aulas</span>}
                </button>
                <button
                  onClick={() => setActiveTab('courseStats')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'courseStats' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Estatísticas"
                >
                  <BarChart3 className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'courseStats' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Estatísticas</span>}
                </button>
                <button
                  onClick={() => setActiveTab('coursesConfig')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'coursesConfig' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Configurações"
                >
                  <Settings className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'coursesConfig' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Configurações</span>}
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'comments' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Comentários"
                >
                  <MessageSquare className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                  {sidebarOpen && <span className="truncate text-sm">Comentários</span>}
                </button>
              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Marketing - Oculto para suporte */}
            {user?.nivelacesso !== 'suporte' && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={['popups'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-sm ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title="Marketing"
              >
                <BellRing className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-500`} />
                {sidebarOpen && (
                  <>
                    <span className="font-medium">Marketing</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-6' : 'flex flex-col items-center'} space-y-1`}>
                <button
                  onClick={() => setActiveTab('popups')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'popups' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Popups"
                >
                  <BellRing className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'popups' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Gerenciar Popups</span>}
                </button>
              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Reports - Visível para suporte */}
            {(user?.nivelacesso === 'suporte' || user?.nivelacesso === 'admin') && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={['reports'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-sm ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title="Reports"
              >
                <FlagIcon className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-500`} />
                {sidebarOpen && (
                  <>
                    <span className="font-medium">Reports</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-6' : 'flex flex-col items-center'} space-y-1`}>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'reports' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Reports"
                >
                  <FlagIcon className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'reports' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Gerenciar Reports</span>}
                </button>
                <button
                  onClick={() => setActiveTab('collaboration-requests')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'collaboration-requests' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Colaboração"
                >
                  <Users className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'collaboration-requests' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Gerenciar Colaboração</span>}
                </button>
                <button
                  onClick={() => setActiveTab('affiliate-requests')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'affiliate-requests' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Afiliação"
                >
                  <Award className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'affiliate-requests' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Gerenciar Afiliação</span>}
                </button>
              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Ferramentas - Oculto para suporte */}
            {user?.nivelacesso !== 'suporte' && (
              <Collapsible 
                className="rounded-lg overflow-hidden mb-1"
                defaultOpen={['ferramentas'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200 ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title="Ferramentas"
              >
                <Wrench className={`${sidebarOpen ? 'w-5 h-5' : 'w-5 h-5 mx-auto'}`} />
                {sidebarOpen && (
                  <>
                    <span className="ml-3 truncate">Ferramentas</span>
                    <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200 ui-open:rotate-180" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`mt-1 ${sidebarOpen ? 'pl-5' : 'flex flex-col items-center'} space-y-1`}>
                <button
                  onClick={() => setActiveTab('ferramentas')}
                  className={`flex items-center w-full py-2 rounded-md transition-all duration-200 ${
                    activeTab === 'ferramentas' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  } ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                  title="Gerenciar Ferramentas"
                >
                  <Wrench className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                  {sidebarOpen && <span className="truncate text-sm">Gerenciar Ferramentas</span>}
                </button>
              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Configurações - Oculto para suporte */}
            {user?.nivelacesso !== 'suporte' && (
              <Collapsible 
                className="rounded-lg overflow-hidden mb-1"
                defaultOpen={['settings', 'collections'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200 ${!sidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
                title="Configurações"
              >
                <Settings className={`${sidebarOpen ? 'w-5 h-5' : 'w-5 h-5 mx-auto'}`} />
                {sidebarOpen && (
                  <>
                    <span className="ml-3 truncate">Configurações</span>
                    <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200 ui-open:rotate-180" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`mt-1 ${sidebarOpen ? 'pl-5' : 'flex flex-col items-center'} space-y-1`}>
                {hasTabAccess('settings') && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center w-full py-2 rounded-md transition-all duration-200 ${
                      activeTab === 'settings' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    } ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                    title="Configurações do Site"
                  >
                    <Settings className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                    {sidebarOpen && <span className="truncate">Configurações do Site</span>}
                  </button>
                )}

                {user?.nivelacesso === 'admin' && (
                  <>
                    <Link 
                      href="/admin/logo-upload"
                      title="Gerenciar Logo"
                      className={`flex items-center w-full py-2 rounded-md transition-all duration-200
                      text-gray-600 hover:bg-gray-50 
                      ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                    >
                      <Image className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                      {sidebarOpen && <span className="truncate">Gerenciar Logo</span>}
                    </Link>
                    <Link 
                      href="/admin/storage-test"
                      title="Testar Armazenamento"
                      className={`flex items-center w-full py-2 rounded-md transition-all duration-200
                      text-gray-600 hover:bg-gray-50 
                      ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                    >
                      <HardDrive className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                      {sidebarOpen && <span className="truncate">Testar Armazenamento</span>}
                    </Link>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`flex items-center w-full py-2 rounded-md transition-all duration-200 ${
                        activeTab === 'analytics' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      } ${sidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'}`}
                      title="Analytics"
                    >
                      <BarChart3 className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : 'mx-auto'}`} />
                      {sidebarOpen && <span className="truncate">Analytics</span>}
                    </button>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>
            )}
          </nav>
        </div>
        <div className={`mt-auto ${sidebarOpen ? 'p-4' : 'p-3 flex flex-col items-center'} border-t border-gray-200/80 space-y-1`}>
          <Link 
            href="/"
            title="para o Site"
            className={`flex items-center w-full py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-medium
            ${sidebarOpen ? 'px-3 justify-start' : 'px-2 justify-center'}`}
          >
            <Home className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-500`} />
            {sidebarOpen && <span>para o Site</span>}
          </Link>
          <button
            onClick={handleLogout}
            title="Configurações"
            className={`flex items-center w-full py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-medium
            ${sidebarOpen ? 'px-3 justify-start' : 'px-2 justify-center'}`}
          >
            <Settings className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-500`} />
            {sidebarOpen && <span>Configurações</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${!sidebarOpen ? 'lg:ml-0 lg:w-[calc(100%-5rem)]' : 'lg:w-[calc(100%-16rem)]'}`}>
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
                {activeTab === 'financeiro' && 'Dashboard Financeiro'}
                {activeTab === 'subscriptions' && 'Gerenciamento de Assinaturas'}
                {activeTab === 'settings' && 'Configurações'}
                {activeTab === 'coursesList' && 'Gerenciamento de Cursos'}

                {activeTab === 'modules' && 'Módulos dos Cursos'}
                {activeTab === 'lessons' && 'Aulas dos Cursos'}
                {activeTab === 'coursesConfig' && 'Configurações de Cursos'}
                {activeTab === 'courseStats' && 'Estatísticas dos Cursos'}
                {activeTab === 'comments' && 'Gerenciamento de Comentários'}
                {activeTab === 'popups' && 'Gerenciamento de Popups'}
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
            <TabsContent value="comments">
              <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Comentários</h2>
                    <p className="text-gray-500 mt-1">Visualize, modere e gerencie os comentários dos usuários nas aulas</p>
                  </div>
                </div>
              </div>
              
              <CommentsManagement />
            </TabsContent>
            
            <TabsContent value="popups">
              <PopupManagement />
            </TabsContent>
            
            <TabsContent value="courseStats">
              <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Estatísticas dos Cursos</h2>
                    <p className="text-gray-500 mt-1">Análise de desempenho e métricas dos cursos</p>
                  </div>
                  <div className="flex gap-4">
                    <Select defaultValue="7dias">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hoje">Hoje</SelectItem>
                        <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                        <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                        <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                        <SelectItem value="total">Todo período</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <CourseStatisticsPanel />
            </TabsContent>

            <TabsContent value="financeiro">
              <SaasDashboard />
            </TabsContent>
            
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

                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                        <span>Cursos</span>
                      </div>
                      <div className="font-medium">{courses?.length || 0}</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <Layers className="w-5 h-5 mr-2 text-purple-500" />
                        <span>Módulos</span>
                      </div>
                      <div className="font-medium">{modules?.length || 0}</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600">
                        <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                        <span>Aulas</span>
                      </div>
                      <div className="font-medium">{lessons?.length || 0}</div>
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
                        courseId: '', // Começamos com courseId vazio para forçar escolha explícita
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
                
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  {/* Filtro de curso */}
                  <div className="flex-1">
                    <Select
                      value={selectedCourseFilter}
                      onValueChange={setSelectedCourseFilter}
                    >
                      <SelectTrigger className="w-full md:w-[220px]">
                        <SelectValue placeholder="Filtrar por curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os cursos</SelectItem>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Controles direita: Ordenação e Modo de Visualização */}
                  <div className="flex gap-2 items-center">
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
                    
                    {/* Alternador de visualização */}
                    <div className="flex bg-gray-100 rounded-md p-1">
                      <Button 
                        size="icon" 
                        variant={moduleViewMode === 'grid' ? 'default' : 'ghost'}
                        className="h-8 w-8"
                        onClick={() => setModuleViewMode('grid')}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant={moduleViewMode === 'list' ? 'default' : 'ghost'}
                        className="h-8 w-8"
                        onClick={() => setModuleViewMode('list')}
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
                          courseId: '', // Começamos com courseId vazio para forçar escolha explícita
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
                  <>
                    {/* Filtramos os módulos com base no curso selecionado */}
                    {(() => {
                      // Filtragem dos módulos
                      const filteredModules = selectedCourseFilter && selectedCourseFilter !== 'todos'
                        ? modules.filter((module: any) => module.courseId === parseInt(selectedCourseFilter))
                        : modules;
                      
                      // Se não houver módulos após a filtragem
                      if (filteredModules.length === 0) {
                        return (
                          <div className="text-center py-8 border rounded-lg">
                            <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              {selectedCourseFilter && selectedCourseFilter !== 'todos'
                                ? "Nenhum módulo encontrado para o curso selecionado" 
                                : "Nenhum módulo encontrado"}
                            </h3>
                            <p className="text-gray-500 mb-4">
                              {selectedCourseFilter && selectedCourseFilter !== 'todos'
                                ? "Tente selecionar outro curso ou crie um novo módulo para este curso."
                                : "Comece criando seu primeiro módulo de curso."}
                            </p>
                            <Button 
                              onClick={() => {
                                setCurrentModule(null);
                                setModuleForm({
                                  courseId: selectedCourseFilter || '',
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
                        );
                      }
                      
                      // Grid view (modo de grade)
                      if (moduleViewMode === 'grid') {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredModules.map((module: any) => (
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
                                    courseId: module.courseId,
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
                        );
                      } 
                      // List view (modo de lista)
                      else {
                        return (
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12"></TableHead>
                                  <TableHead>Título</TableHead>
                                  <TableHead>Curso</TableHead>
                                  <TableHead>Nível</TableHead>
                                  <TableHead className="text-center">Aulas</TableHead>
                                  <TableHead className="text-center">Status</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredModules.map((module: any) => {
                                  // Encontrar o nome do curso
                                  const course = courses.find((c: any) => c.id === module.courseId);
                                  return (
                                    <TableRow key={module.id}>
                                      <TableCell>
                                        {module.isPremium && (
                                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                            <Crown className="h-3 w-3 mr-1" />
                                            PRO
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                          {module.thumbnailUrl && (
                                            <img 
                                              src={module.thumbnailUrl} 
                                              alt="" 
                                              className="w-10 h-6 object-cover rounded"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                              }}
                                            />
                                          )}
                                          <span className="line-clamp-1">{module.title}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {course?.title || "Curso não encontrado"}
                                      </TableCell>
                                      <TableCell>
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                          module.level === 'iniciante' ? 'bg-blue-100 text-blue-800' :
                                          module.level === 'intermediario' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {module.level === 'iniciante' ? 'Iniciante' :
                                           module.level === 'intermediario' ? 'Intermediário' :
                                           'Avançado'}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {module.lessons?.length || 0}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {module.isActive ? (
                                          <Badge variant="outline" className="border-green-500 text-green-600">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="border-gray-400 text-gray-600">
                                            Inativo
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => {
                                              setCurrentModule(module);
                                              setModuleForm({
                                                id: module.id,
                                                courseId: module.courseId,
                                                title: module.title,
                                                description: module.description,
                                                thumbnailUrl: module.thumbnailUrl,
                                                level: module.level,
                                                order: module.order,
                                                isActive: module.isActive,
                                                isPremium: module.isPremium
                                              });
                                              setIsModuleDialogOpen(true);
                                            }}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => {
                                              setCurrentModule(module);
                                              setIsConfirmDeleteModuleOpen(true);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      }
                    })()}
                  </>
                )}
              </div>
              
              {/* Diálogo para adicionar/editar módulo */}
              <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {currentModule ? 'Editar Módulo' : 'Adicionar Módulo'}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha todos os campos obrigatórios (*) para criar ou editar um módulo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="moduleCourse">Curso *</Label>
                        <Select
                          name="courseId"
                          value={moduleForm.courseId ? moduleForm.courseId.toString() : ''}
                          onValueChange={(value) => {
                            setModuleForm({
                              ...moduleForm,
                              courseId: parseInt(value)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          O módulo será vinculado ao curso selecionado
                        </p>
                      </div>
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
                        <Label htmlFor="moduleThumbnail">Miniatura do módulo *</Label>
                        <div className="flex flex-col gap-4">
                          {/* Área de upload */}
                          <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="file"
                              id="moduleThumbnailUpload"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  setThumbnailFile(file);
                                  
                                  // Cria URL temporária para preview
                                  const objectUrl = URL.createObjectURL(file);
                                  setBannerPreviewUrl(objectUrl);
                                  
                                  // Indica que está fazendo upload (será alterado após o envio)
                                  setUploadingThumbnail(true);
                                  
                                  // Prepara o FormData para upload
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  
                                  // Faz o upload da imagem para o servidor usando a rota específica para thumbnails de módulos
                                  fetch('/api/upload/module-thumbnail', {
                                    method: 'POST',
                                    body: formData,
                                  })
                                    .then(res => {
                                      if (!res.ok) {
                                        throw new Error('Falha ao fazer upload da imagem');
                                      }
                                      return res.json();
                                    })
                                    .then(data => {
                                      // Atualiza o formulário com a URL da imagem
                                      setModuleForm({
                                        ...moduleForm,
                                        thumbnailUrl: data.fileUrl
                                      });
                                      
                                      toast({
                                        title: 'Upload concluído',
                                        description: 'Imagem enviada com sucesso',
                                      });
                                    })
                                    .catch(error => {
                                      toast({
                                        title: 'Erro no upload',
                                        description: error.message,
                                        variant: 'destructive',
                                      });
                                    })
                                    .finally(() => {
                                      setUploadingThumbnail(false);
                                    });
                                }
                              }}
                            />
                            <Button 
                              variant="ghost" 
                              className="w-full h-full flex flex-col items-center justify-center"
                              onClick={() => {
                                const fileInput = document.getElementById('moduleThumbnailUpload');
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                            >
                              <Upload className="h-8 w-8 mb-2 text-gray-400" />
                              <span className="font-medium text-sm">Clique para fazer upload da imagem</span>
                              <span className="text-xs text-gray-500 mt-1">PNG, JPG ou WEBP até 5MB</span>
                            </Button>
                          </div>
                          
                          {/* Preview da imagem */}
                          {(moduleForm.thumbnailUrl || bannerPreviewUrl) && (
                            <div className="mt-2">
                              <div className="flex items-center gap-3">
                                <p className="text-sm font-medium">Preview:</p>
                                <div className="relative h-16 w-28 border rounded-lg overflow-hidden">
                                  <img
                                    src={bannerPreviewUrl || moduleForm.thumbnailUrl}
                                    alt="Preview da miniatura"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://via.placeholder.com/640x360?text=Erro+ao+carregar";
                                    }}
                                  />
                                  
                                  {uploadingThumbnail && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* URL da imagem (opcional) */}
                              <Input
                                className="mt-2"
                                id="moduleThumbUrl"
                                name="thumbnailUrl"
                                value={moduleForm.thumbnailUrl}
                                onChange={handleModuleFormChange}
                                placeholder="URL da imagem de miniatura"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Você também pode inserir diretamente a URL da imagem
                              </p>
                            </div>
                          )}
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
              <ModernUserManagement />
            </TabsContent>
            
            <TabsContent value="subscriptions">
              <SimpleSubscriptionDashboard />
            </TabsContent>
            
            <TabsContent value="community">
              <CommunityManagement />
            </TabsContent>
            
            <TabsContent value="reports">
              <ReportsManagement />
            </TabsContent>
            
            <TabsContent value="collaboration-requests">
              <CollaborationRequestsManagement />
            </TabsContent>
            
            <TabsContent value="affiliate-requests">
              <AffiliateRequestsManagement />
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
                            <TableHead>Conteúdo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingCourses ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4">
                                <div className="flex justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : isCoursesError ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4 text-red-500">
                                Erro ao carregar os cursos. Tente novamente.
                              </TableCell>
                            </TableRow>
                          ) : courses.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4 text-gray-500">
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
                                <TableCell>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Layers className="h-4 w-4 text-blue-500" />
                                      <span>{course.moduleCount || 0} módulos</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm mt-1">
                                      <FileText className="h-4 w-4 text-green-500" />
                                      <span>{course.lessonCount || 0} aulas</span>
                                    </div>
                                  </div>
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
                        <Label htmlFor="courseThumbnailUrl">Thumbnail do curso</Label>
                        <div className="space-y-2">
                          {/* Preview da imagem atual se existir */}
                          {courseForm.thumbnailUrl && (
                            <div className="mt-2 relative rounded-md overflow-hidden w-full h-32 bg-gray-100">
                              <img 
                                src={courseForm.thumbnailUrl} 
                                alt="Thumbnail do curso" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                id="courseThumbnailUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                className="cursor-pointer"
                              />
                            </div>
                            <Button 
                              type="button" 
                              size="sm"
                              onClick={handleThumbnailUpload}
                              disabled={!thumbnailFile || uploadingThumbnail}
                              className="min-w-24"
                            >
                              {uploadingThumbnail ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* Campo oculto para manter a URL */}
                          <Input
                            id="courseThumbnailUrl"
                            name="thumbnailUrl"
                            value={courseForm.thumbnailUrl}
                            onChange={handleCourseFormChange}
                            type="hidden"
                          />
                          
                          <p className="text-xs text-gray-500">
                            Formato horizontal - Recomendado: 1280x720px (16:9)
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="courseFeaturedImage">Imagem de destaque</Label>
                        <div className="space-y-2">
                          {/* Preview da imagem atual se existir */}
                          {courseForm.featuredImage && (
                            <div className="mt-2 relative rounded-md overflow-hidden w-32 h-48 bg-gray-100">
                              <img 
                                src={courseForm.featuredImage} 
                                alt="Imagem de destaque" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                id="courseFeaturedImageUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleFeaturedImageChange}
                                className="cursor-pointer"
                              />
                            </div>
                            <Button 
                              type="button" 
                              size="sm"
                              onClick={handleFeaturedImageUpload}
                              disabled={!featuredImageFile || uploadingFeatured}
                              className="min-w-24"
                            >
                              {uploadingFeatured ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* Campo oculto para manter a URL */}
                          <Input
                            id="courseFeaturedImage"
                            name="featuredImage"
                            value={courseForm.featuredImage}
                            onChange={handleCourseFormChange}
                            type="hidden"
                          />
                          
                          <p className="text-xs text-gray-500">
                            Formato vertical - Recomendado: 600x900px (2:3)
                          </p>
                        </div>
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
                    
                    {isLoadingCourseSettings || isLoadingCourses ? (
                      <div className="py-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-500">Carregando configurações...</p>
                      </div>
                    ) : isCourseSettingsError || isCoursesError ? (
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
                          
                          {/* Seleção de curso */}
                          <div className="grid gap-2 mt-2">
                            <Label htmlFor="selectCourseForSettings">Selecionar Curso</Label>
                            <Select 
                              onValueChange={(value) => {
                                const selectedCourse = courses.find((course) => course.id.toString() === value);
                                setSelectedCourseForSettings(selectedCourse);
                                
                                if (selectedCourse?.id) {
                                  // Para qualquer curso selecionado, sincronizar as informações
                                  if (selectedCourse.thumbnailUrl) {
                                    // Atualiza o estado local com os dados do curso e inclui courseId
                                    setCourseSettings({
                                      ...courseSettings,
                                      courseId: selectedCourse.id,
                                      bannerTitle: selectedCourse.title || courseSettings.bannerTitle,
                                      bannerDescription: selectedCourse.description || courseSettings.bannerDescription,
                                      bannerImageUrl: selectedCourse.thumbnailUrl || courseSettings.bannerImageUrl
                                    });
                                    
                                    // Buscar as configurações específicas deste curso (se existirem)
                                    fetch(`/api/course/settings?courseId=${selectedCourse.id}`)
                                      .then(response => response.json())
                                      .then(data => {
                                        if (data && Object.keys(data).length > 0) {
                                          // Se existirem configurações específicas, atualiza o estado
                                          setCourseSettings({
                                            ...data,
                                            courseId: selectedCourse.id
                                          });
                                          toast({
                                            title: "Configurações carregadas",
                                            description: "As configurações específicas deste curso foram carregadas.",
                                            duration: 3000,
                                          });
                                        }
                                      })
                                      .catch(error => {
                                        console.error("Erro ao buscar configurações do curso:", error);
                                      });
                                    
                                    // Notifica o usuário que as alterações precisam ser salvas
                                    toast({
                                      title: "Dados carregados",
                                      description: "Os dados do curso foram carregados. Clique em 'Salvar todas as configurações' para aplicar as mudanças.",
                                      duration: 5000,
                                    });
                                  }
                                }
                              }}
                              value={selectedCourseForSettings?.id?.toString() || ''}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um curso" />
                              </SelectTrigger>
                              <SelectContent>
                                {courses.map((course) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              Selecione um curso para visualizar e editar suas informações
                            </p>
                          </div>
                          
                          {selectedCourseForSettings && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium text-lg">Editando: {selectedCourseForSettings.title}</h4>
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    if (selectedCourseForSettings.id) {
                                      updateCourseMutation.mutate(selectedCourseForSettings, {
                                        onSuccess: () => {
                                          toast({
                                            title: "Curso atualizado",
                                            description: "As informações do curso foram salvas com sucesso",
                                            duration: 3000,
                                          });
                                          // Invalidar o cache para atualizar os dados
                                          queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
                                        }
                                      });
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700"
                                  disabled={updateCourseMutation.isPending}
                                >
                                  {updateCourseMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Salvando...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Salvar Curso
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="courseTitle">Título do Curso</Label>
                                  <Input
                                    id="courseTitle"
                                    value={selectedCourseForSettings.title || ''}
                                    onChange={(e) => {
                                      setSelectedCourseForSettings({
                                        ...selectedCourseForSettings,
                                        title: e.target.value
                                      });
                                    }}
                                    // Não salva automaticamente
                                    placeholder="Título do curso"
                                  />
                                </div>
                                
                                <div className="grid gap-2">
                                  <Label htmlFor="courseDescription">Descrição do Curso</Label>
                                  <Textarea
                                    id="courseDescription"
                                    value={selectedCourseForSettings.description || ''}
                                    onChange={(e) => {
                                      setSelectedCourseForSettings({
                                        ...selectedCourseForSettings,
                                        description: e.target.value
                                      });
                                    }}
                                    // Não salva automaticamente
                                    placeholder="Descrição do curso"
                                    rows={3}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="grid gap-2">
                              <Label htmlFor="settingsBannerTitle">Título do Banner</Label>
                              <Input
                                id="settingsBannerTitle"
                                name="bannerTitle"
                                value={courseSettings.bannerTitle || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCourseSettings(prev => ({...prev, bannerTitle: value}));
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
                                  setCourseSettings(prev => ({...prev, bannerDescription: value}));
                                }}
                                placeholder="Descreva o propósito dos cursos"
                                rows={3}
                              />
                            </div>
                            
                            <div className="grid gap-2 md:col-span-2">
                              <Label>Banner da Página de Cursos</Label>
                              
                              {courseSettings.bannerImageUrl && (
                                <div className="mt-2 mb-3 relative">
                                  <img 
                                    src={courseSettings.bannerImageUrl} 
                                    alt="Banner atual" 
                                    className="w-full h-auto max-h-48 object-cover rounded-md border"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Banner atual</p>
                                </div>
                              )}
                              
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="bannerFileInput"
                                    type="file"
                                    onChange={handleBannerFileChange}
                                    accept="image/*"
                                    disabled={uploadingBanner}
                                    className="flex-1"
                                  />
                                  <Button 
                                    type="button" 
                                    size="sm"
                                    onClick={handleBannerUpload}
                                    disabled={!bannerFile || uploadingBanner}
                                    className={`min-w-24 ${bannerFile ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                  >
                                    {uploadingBanner ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Enviando...
                                      </>
                                    ) : !bannerFile ? (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Enviar
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Enviar Banner
                                      </>
                                    )}
                                  </Button>
                                </div>
                                
                                {/* Pré-visualização do arquivo selecionado */}
                                {bannerPreviewUrl && bannerFile && (
                                  <div className="mt-2 relative bg-gray-50 p-3 rounded-md border border-blue-200">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center">
                                        <Image className="h-6 w-6 text-blue-500" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium truncate">{bannerFile.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {(bannerFile.size / 1024).toFixed(1)} KB
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <img 
                                        src={bannerPreviewUrl} 
                                        alt="Pré-visualização" 
                                        className="w-full h-auto max-h-48 object-cover rounded-md border"
                                      />
                                      <p className="text-xs text-blue-600 mt-1">Imagem selecionada (pré-visualização)</p>
                                    </div>
                                  </div>
                                )}
                                
                                <p className="text-xs text-gray-500">
                                  Tamanho recomendado: 1920x600px. Formatos: JPG, PNG ou WebP.
                                </p>
                              </div>
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
                                  // Atualiza apenas o estado local
                                  setCourseSettings(prev => ({...prev, showModuleNumbers: checked === true}));
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
                                  // Atualiza apenas o estado local
                                  setCourseSettings(prev => ({...prev, useCustomPlayerColors: checked === true}));
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
                                  // Atualiza apenas o estado local
                                  setCourseSettings(prev => ({...prev, enableComments: checked === true}));
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
                                  // Atualiza apenas o estado local
                                  setCourseSettings(prev => ({...prev, allowNonPremiumEnrollment: checked === true}));
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
                          
                          {/* Botão para salvar todas as configurações */}
                          <div className="flex justify-end mt-6">
                            <Button 
                              onClick={() => {
                                // Garante que o courseId está incluído se um curso estiver selecionado
                                const settingsToSave = {
                                  ...courseSettings,
                                  courseId: selectedCourseForSettings?.id || undefined
                                };
                                
                                console.log("Enviando configurações com courseId:", settingsToSave);
                                
                                updateCourseSettingsMutation.mutate(settingsToSave, {
                                  onSuccess: () => {
                                    // Invalidar todos os caches relacionados com as configurações de cursos
                                    queryClient.invalidateQueries({ queryKey: ['/api/course/settings'] });
                                    queryClient.invalidateQueries({ queryKey: ['/api/courses/settings'] });
                                    
                                    // Também devemos atualizar as informações do curso selecionado
                                    if (selectedCourseForSettings?.id) {
                                      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
                                    }
                                    
                                    toast({
                                      title: "Configurações salvas",
                                      description: `As configurações${selectedCourseForSettings ? ` do curso '${selectedCourseForSettings.title}'` : ''} foram salvas com sucesso`,
                                      duration: 3000,
                                    });
                                  },
                                  onError: (error) => {
                                    toast({
                                      title: "Erro ao salvar",
                                      description: `Não foi possível salvar as configurações: ${error.message}`,
                                      variant: "destructive",
                                      duration: 5000,
                                    });
                                  }
                                });
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={updateCourseSettingsMutation.isPending}
                            >
                              {updateCourseSettingsMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Salvar todas as configurações
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {hasTabAccess('settings') && (
              <TabsContent value="settings">
                <SiteSettings />
              </TabsContent>
            )}
            
            {/* Gerenciamento de Ferramentas */}
            <TabsContent value="analytics" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex flex-col space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Analytics e Rastreamento</h2>
                    <p className="text-muted-foreground">
                      Configure os serviços de analytics e rastreamento para monitorar o desempenho do site.
                    </p>
                  </div>
                  <div className="grid gap-6">
                    <AnalyticsSettings />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ferramentas" className="mt-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex flex-col space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Ferramentas</h2>
                    <p className="text-muted-foreground">
                      Gerencie as ferramentas e categorias disponíveis no site.
                    </p>
                  </div>
                  
                  <Tabs defaultValue="ferramentas" className="w-full">
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
              </div>
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