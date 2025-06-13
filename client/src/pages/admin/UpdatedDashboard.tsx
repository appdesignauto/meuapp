import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import AnalyticsSettings from '@/components/admin/AnalyticsSettings';
import ReportsManagement from '@/components/admin/ReportsManagement';
import CollaborationRequestsManagement from '@/components/admin/CollaborationRequestsManagement';
import AffiliateRequestsManagement from '@/components/admin/AffiliateRequestsManagement';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';
import SubscriptionSettings from '@/components/admin/SubscriptionSettings';

import SimpleSubscriptionDashboard from '@/components/admin/SimpleSubscriptionDashboard';
import PlatformMetrics from '@/components/admin/PlatformMetrics';
import {
  LayoutGrid,
  Image,
  Users,
  User,
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
  ChevronRight,
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
  Save,
  Calendar,
  Wrench,
  FlagIcon,
  Palette
} from 'lucide-react';
import { 
  TrendingUp,
  Clock,
  Download,
  Star
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
import { useSiteSettings } from '@/hooks/use-site-settings';
import GerenciarFerramentas from './ferramentas/GerenciarFerramentas';
import GerenciarCategorias from './ferramentas/GerenciarCategorias';

const AdminDashboard = () => {
  const { user, logoutMutation } = useAuth();
  const { data: siteSettings } = useSiteSettings();
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
          fixed lg:relative z-40 h-full bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen 
            ? 'w-64 translate-x-0' 
            : 'w-16 lg:translate-x-0 -translate-x-full'
          }
        `}
      >
        <div className={`py-4 flex items-center ${sidebarOpen ? 'px-4 justify-between' : 'px-2 justify-center'}`}>
          <div className="flex items-center min-w-0">
            {/* Ícone DA personalizado - clicável para expandir quando recolhido */}
            <div 
              className={`w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${!sidebarOpen ? 'cursor-pointer hover:bg-blue-700 transition-colors' : ''}`}
              onClick={!sidebarOpen ? () => setSidebarOpen(true) : undefined}
              title={!sidebarOpen ? "Expandir menu" : undefined}
            >
              <span className="text-white font-bold text-sm">DA</span>
            </div>
            {sidebarOpen && (
              <div className="ml-3 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 transition-opacity duration-300 truncate">DesignAuto</h1>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button 
              className="text-gray-400 hover:text-gray-600 p-2 rounded-md transition-colors flex-shrink-0"
              onClick={() => setSidebarOpen(false)}
              aria-label="Recolher menu"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className={`py-4 overflow-hidden ${sidebarOpen ? 'px-5' : 'px-2'}`}>
          

          <nav className="space-y-2">
            {/* Dashboard principal - apenas para admin */}
            {hasTabAccess('stats') && (
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center w-full rounded-xl text-base transition-all duration-200 ${
                  activeTab === 'stats' 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${!sidebarOpen ? 'justify-center px-3 py-3 mx-1' : 'px-4 py-3'}`}
                title="Dashboard"
              >
                <LayoutDashboard className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                  activeTab === 'stats' ? 'text-blue-600' : 'text-gray-600'
                }`} />
                {sidebarOpen && <span className="font-semibold">Dashboard</span>}
              </button>
            )}
            

            
            {/* Usuários - dropdown com assinaturas */}
            {(hasTabAccess('users') || hasTabAccess('subscriptions')) && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={false}
                open={sidebarOpen ? undefined : false}
              >
                <CollapsibleTrigger 
                  className={`flex items-center w-full text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200 text-base ${!sidebarOpen ? 'justify-center px-3 py-3 mx-1' : 'px-4 py-3'}`}
                  title="Usuários"
                >
                  <Users className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-600`} />
                  {sidebarOpen && (
                    <>
                      <span className="font-semibold">Usuários</span>
                      <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                    </>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className={`${sidebarOpen ? 'pl-8' : 'flex flex-col items-center'} space-y-1 mt-1`}>
                {hasTabAccess('users') && (
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === 'users' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                    title="Gerenciar Usuários"
                  >
                    <Users className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                      activeTab === 'users' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    {sidebarOpen && <span>Gerenciar Usuários</span>}
                  </button>
                )}
                {hasTabAccess('subscriptions') && (
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === 'subscriptions' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                    title="Assinaturas Hotmart"
                  >
                    <CreditCard className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                      activeTab === 'subscriptions' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    {sidebarOpen && <span>Assinaturas Hotmart</span>}
                  </button>
                )}
              </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Gerenciamento de Conteúdo - Oculto para suporte */}
            {user?.nivelacesso !== 'suporte' && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={false}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200 text-base ${!sidebarOpen ? 'lg:justify-center lg:px-3' : ''}`}
                title="Conteúdo"
              >
                <Layers className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-600`} />
                {sidebarOpen && (
                  <>
                    <span className="font-semibold">Conteúdo</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-8' : 'flex flex-col items-center'} space-y-1 mt-1`}>
                <button
                  onClick={() => setActiveTab('arts')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'arts' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Artes"
                >
                  <Image className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'arts' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Artes</span>}
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'categories' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Categorias"
                >
                  <LayoutGrid className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'categories' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Categorias</span>}
                </button>
                <button
                  onClick={() => setActiveTab('formats')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'formats' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Formatos"
                >
                  <CreditCard className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'formats' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Formatos</span>}
                </button>
                <button
                  onClick={() => setActiveTab('fileTypes')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'fileTypes' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Tipos de Arquivo"
                >
                  <FileType className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'fileTypes' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Tipos de Arquivo</span>}
                </button>
                {hasTabAccess('community') && (
                  <button
                    onClick={() => setActiveTab('community')}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === 'community' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                    title="Comunidade"
                  >
                    <MessageSquare className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                      activeTab === 'community' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    {sidebarOpen && <span>Comunidade</span>}
                  </button>
                )}

              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Cursos e Vídeo-aulas - Visível para suporte e admin */}
            {(user?.nivelacesso === 'suporte' || user?.nivelacesso === 'admin' || user?.nivelacesso === 'designer_adm') && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={false}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200 text-base ${!sidebarOpen ? 'lg:justify-center lg:px-3' : ''}`}
                title="Cursos"
              >
                <BookOpen className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-600`} />
                {sidebarOpen && (
                  <>
                    <span className="font-semibold">Cursos</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-8' : 'flex flex-col items-center'} space-y-1 mt-1`}>
                <button
                  onClick={() => setActiveTab('coursesList')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'coursesList' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Cursos"
                >
                  <BookOpen className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'coursesList' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Cursos</span>}
                </button>
                <button
                  onClick={() => setActiveTab('modules')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'modules' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Módulos"
                >
                  <Layers className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'modules' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Módulos</span>}
                </button>
                <button
                  onClick={() => setActiveTab('lessons')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'lessons' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Aulas"
                >
                  <Video className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'lessons' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Aulas</span>}
                </button>
                <button
                  onClick={() => setActiveTab('courseStats')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'courseStats' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Estatísticas"
                >
                  <BarChart3 className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'courseStats' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Estatísticas</span>}
                </button>
                <button
                  onClick={() => setActiveTab('coursesConfig')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'coursesConfig' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Configurações"
                >
                  <Settings className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'coursesConfig' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Configurações</span>}
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'comments' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Comentários"
                >
                  <MessageSquare className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'comments' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Comentários</span>}
                </button>
              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Marketing - Oculto para suporte */}
            {user?.nivelacesso !== 'suporte' && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={false}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200 text-base ${!sidebarOpen ? 'lg:justify-center lg:px-3' : ''}`}
                title="Marketing"
              >
                <BellRing className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-600`} />
                {sidebarOpen && (
                  <>
                    <span className="font-semibold">Marketing</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-8' : 'flex flex-col items-center'} space-y-1 mt-1`}>
                <button
                  onClick={() => setActiveTab('popups')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'popups' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Popups"
                >
                  <BellRing className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'popups' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Gerenciar Popups</span>}
                </button>
              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Reports - Visível para suporte */}
            {(user?.nivelacesso === 'suporte' || user?.nivelacesso === 'admin') && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={false}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200 text-base ${!sidebarOpen ? 'lg:justify-center lg:px-3' : ''}`}
                title="Reports"
              >
                <FlagIcon className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-600`} />
                {sidebarOpen && (
                  <>
                    <span className="font-semibold">Reports</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-8' : 'flex flex-col items-center'} space-y-1 mt-1`}>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'reports' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Reports"
                >
                  <FlagIcon className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'reports' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Gerenciar Reports</span>}
                </button>
                <button
                  onClick={() => setActiveTab('collaboration-requests')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'collaboration-requests' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Colaboração"
                >
                  <Users className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'collaboration-requests' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Gerenciar Colaboração</span>}
                </button>
                <button
                  onClick={() => setActiveTab('affiliate-requests')}
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'affiliate-requests' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Afiliação"
                >
                  <Award className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                    activeTab === 'affiliate-requests' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span className="font-medium">Gerenciar Afiliação</span>}
                </button>
              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Ferramentas - Oculto para suporte */}
            {user?.nivelacesso !== 'suporte' && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={['ferramentas'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200 text-base ${!sidebarOpen ? 'lg:justify-center lg:px-3' : ''}`}
                title="Ferramentas"
              >
                <Wrench className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-600`} />
                {sidebarOpen && (
                  <>
                    <span className="font-semibold">Ferramentas</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-8' : 'flex flex-col items-center'} space-y-1 mt-1`}>
                <button
                  onClick={() => setActiveTab('ferramentas')}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'ferramentas' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title="Gerenciar Ferramentas"
                >
                  <Wrench className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                    activeTab === 'ferramentas' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {sidebarOpen && <span>Gerenciar Ferramentas</span>}
                </button>
              </CollapsibleContent>
            </Collapsible>
            )}
            
            {/* Configurações - Oculto para suporte */}
            {user?.nivelacesso !== 'suporte' && (
              <Collapsible 
                className="space-y-1"
                defaultOpen={['settings', 'collections'].includes(activeTab)}
                open={sidebarOpen ? undefined : false}
              >
              <CollapsibleTrigger 
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200 text-base ${!sidebarOpen ? 'lg:justify-center lg:px-3' : ''}`}
                title="Configurações"
              >
                <Settings className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-600`} />
                {sidebarOpen && (
                  <>
                    <span className="font-semibold">Configurações</span>
                    <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200 ui-open:rotate-180 text-gray-400" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className={`${sidebarOpen ? 'pl-8' : 'flex flex-col items-center'} space-y-1 mt-1`}>
                {hasTabAccess('settings') && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                    title="Configurações do Site"
                  >
                    <Settings className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} ${
                      activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    {sidebarOpen && <span>Configurações do Site</span>}
                  </button>
                )}

                {user?.nivelacesso === 'admin' && (
                  <>
                    <Link 
                      href="/admin/logo-upload"
                      title="Gerenciar Logo"
                      className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${!sidebarOpen ? 'justify-center' : ''}`}
                    >
                      <Image className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} text-gray-500`} />
                      {sidebarOpen && <span>Gerenciar Logo</span>}
                    </Link>
                    <Link 
                      href="/admin/storage-test"
                      title="Testar Armazenamento"
                      className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${!sidebarOpen ? 'justify-center' : ''}`}
                    >
                      <HardDrive className={`w-3.5 h-3.5 ${!sidebarOpen ? 'mx-auto' : 'mr-2.5'} text-gray-500`} />
                      {sidebarOpen && <span>Testar Armazenamento</span>}
                    </Link>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${!sidebarOpen ? 'justify-center' : ''}`}
                      title="Analytics"
                    >
                      <BarChart3 className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} ${
                        activeTab === 'analytics' ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      {sidebarOpen && <span className="font-medium">Analytics</span>}
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
            href="/painel/perfil"
            className={`flex items-center hover:bg-blue-50 rounded-xl transition-all duration-200 border border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 shadow-sm ${
              !sidebarOpen 
                ? 'justify-center p-1.5 mx-1 mb-2' 
                : 'p-3 mb-2'
            }`}
            title="Ir para Perfil"
          >
            <div className={`relative ${sidebarOpen ? 'mr-3' : ''}`}>
              {user?.profileimageurl ? (
                <img 
                  src={user.profileimageurl} 
                  alt={user.name || 'Admin'} 
                  className={`rounded-full object-cover border-2 border-blue-200 shadow-sm ${
                    !sidebarOpen ? 'w-7 h-7' : 'w-9 h-9'
                  }`}
                />
              ) : (
                <div className={`rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium border-2 border-blue-200 shadow-sm ${
                  !sidebarOpen ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
                }`}>
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
              {!sidebarOpen && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white shadow-sm"></div>
              )}
              {sidebarOpen && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
              )}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-semibold text-gray-900 truncate text-sm">{user?.name || 'Admin'}</p>
                <p className="text-xs text-blue-600 truncate font-medium">
                  {user?.nivelacesso === 'admin' ? 'Administrador' : 
                   user?.nivelacesso === 'designer_adm' ? 'Designer Admin' : 
                   user?.nivelacesso === 'suporte' ? 'Suporte' : 'Usuário'}
                </p>
              </div>
            )}
          </Link>
          <Link 
            href="/"
            title="Ir para o Site"
            className={`flex items-center w-full rounded-xl text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 text-sm font-medium ${
              !sidebarOpen ? 'justify-center px-3 py-3 mx-1' : 'px-4 py-3 justify-start'
            }`}
          >
            <Home className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-gray-600`} />
            {sidebarOpen && <span>Ir para o Site</span>}
          </Link>
          <button
            onClick={handleLogout}
            title="Sair"
            className={`flex items-center w-full rounded-xl text-red-700 hover:bg-red-50 hover:text-red-800 transition-all duration-200 text-sm font-medium ${
              !sidebarOpen ? 'justify-center px-3 py-3 mx-1' : 'px-4 py-3 justify-start'
            }`}
          >
            <LogOut className={`w-4 h-4 ${!sidebarOpen ? 'mx-auto' : 'mr-3'} text-red-600`} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 bg-gray-50 ${!sidebarOpen ? 'lg:ml-0 lg:w-[calc(100%-5rem)]' : 'lg:w-[calc(100%-16rem)]'}`}>
        <header className="bg-white relative border-b border-r border-gray-200 shadow-sm">
          <div className="px-6 py-4 pt-6 flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center mb-3 sm:mb-0">
              {/* Botão de alternância do menu (visível apenas em telas menores) */}
              <button 
                className="sm:hidden mr-3 text-gray-600 hover:text-blue-600"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu lateral"
              >
                <PanelRight className="w-5 h-5" />
              </button>
              
              <div className="flex items-center">
                {activeTab === 'financeiro' && <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />}
                {activeTab === 'stats' && <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />}
                {activeTab === 'arts' && <Palette className="w-6 h-6 text-blue-600 mr-3" />}
                {activeTab === 'users' && <Users className="w-6 h-6 text-blue-600 mr-3" />}
                {activeTab === 'community' && <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />}
                {activeTab === 'settings' && <Settings className="w-6 h-6 text-blue-600 mr-3" />}
                
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'financeiro' && 'Dashboard Financeiro'}
                  {activeTab === 'stats' && 'Dashboard'}
                  {activeTab === 'arts' && 'Artes e Designs'}
                  {activeTab === 'users' && 'Usuários'}
                  {activeTab === 'community' && 'Comunidade'}
                  {activeTab === 'settings' && 'Configurações'}
                  {activeTab === 'categories' && 'Categorias'}
                  {activeTab === 'formats' && 'Formatos'}
                  {activeTab === 'fileTypes' && 'Tipos de Arquivo'}
                  {activeTab === 'collections' && 'Coleções'}
                  {activeTab === 'subscriptions' && 'Assinaturas'}
                  {activeTab === 'coursesList' && 'Cursos'}
                  {activeTab === 'modules' && 'Módulos'}
                  {activeTab === 'lessons' && 'Aulas'}
                  {activeTab === 'coursesConfig' && 'Configurações de Cursos'}
                  {activeTab === 'courseStats' && 'Estatísticas dos Cursos'}
                  {activeTab === 'comments' && 'Comentários'}
                  {activeTab === 'popups' && 'Popups'}
                </h1>
              </div>
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
        
        {/* Linha divisória sutil */}
        <div className="h-px bg-gradient-to-r from-blue-200 via-blue-100 to-transparent mx-6"></div>
        
        <main className="p-6 pt-8">
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


            
            <TabsContent value="stats">
              <div className="space-y-6">
                {/* Header do Dashboard */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-medium text-gray-600">Visão geral da plataforma</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Hoje</div>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                </div>

                {/* Cards de Métricas Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Usuários Totais */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg mr-3">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-gray-900">1.245</div>
                        <div className="text-sm text-green-600 font-medium">+12% este mês</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1">Usuários Totais</div>
                      <div className="text-xs text-gray-500">327 premium ativos</div>
                    </div>
                  </div>

                  {/* Total de Artes */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-purple-50 rounded-lg mr-3">
                        <Image className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-gray-900">2.847</div>
                        <div className="text-sm text-green-600 font-medium">+8% este mês</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1">Total de Artes</div>
                      <div className="text-xs text-gray-500">156 adicionadas esta semana</div>
                    </div>
                  </div>

                  {/* Posts Comunidade */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-green-50 rounded-lg mr-3">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-gray-900">489</div>
                        <div className="text-sm text-green-600 font-medium">+15% este mês</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1">Posts Comunidade</div>
                      <div className="text-xs text-gray-500">73 interações hoje</div>
                    </div>
                  </div>

                  {/* Receita Mensal */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-yellow-50 rounded-lg mr-3">
                        <CreditCard className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-gray-900">R$ 18.2k</div>
                        <div className="text-sm text-green-600 font-medium">+23% este mês</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1">Receita Mensal</div>
                      <div className="text-xs text-gray-500">R$ 1.6k esta semana</div>
                    </div>
                  </div>
                </div>

                {/* Estatísticas Detalhadas */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Estatísticas Detalhadas</h3>
                    <p className="text-sm text-gray-500">Métricas de performance da plataforma</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Coluna Esquerda */}
                    <div className="space-y-6">
                      {/* Vídeo-aulas */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Video className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Vídeo-aulas</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">84</div>
                      </div>

                      {/* Categorias */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <LayoutGrid className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Categorias</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">15</div>
                      </div>

                      {/* Formatos */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <FileType className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Formatos</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">8</div>
                      </div>
                    </div>

                    {/* Coluna Direita */}
                    <div className="space-y-6">
                      {/* Taxa Premium */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-yellow-50 rounded-lg">
                            <Crown className="w-4 h-4 text-yellow-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Taxa Premium</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">26.3%</div>
                      </div>

                      {/* Crescimento */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Crescimento</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">+18.2%</div>
                      </div>

                      {/* Tempo Médio */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-50 rounded-lg">
                            <Clock className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Tempo Médio</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">42min</div>
                      </div>
                    </div>
                  </div>

                  {/* Linha inferior com métricas adicionais */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Downloads */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Download className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Downloads</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">12.8k</div>
                      </div>

                      {/* Comentários */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Comentários</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">1.2k</div>
                      </div>

                      {/* Avaliação */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-yellow-50 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Avaliação</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">4.8★</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Financeiro */}
            <TabsContent value="financeiro">
              <SimpleSubscriptionDashboard />
            </TabsContent>

            {/* Arts */}
            <TabsContent value="arts">
              <PlatformMetrics />
            </TabsContent>

            {/* Users */}
            <TabsContent value="users">
              <ModernUserManagement />
            </TabsContent>

            {/* Community */}
            <TabsContent value="community">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Gerenciamento da Comunidade</h2>
                  <Tabs defaultValue="reports" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="reports">Denúncias</TabsTrigger>
                      <TabsTrigger value="collaboration">Colaboração</TabsTrigger>
                      <TabsTrigger value="affiliate">Afiliados</TabsTrigger>
                      <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="reports" className="space-y-4">
                      <ReportsManagement />
                    </TabsContent>
                    
                    <TabsContent value="collaboration" className="space-y-4">
                      <CollaborationRequestsManagement />
                    </TabsContent>
                    
                    <TabsContent value="affiliate" className="space-y-4">
                      <AffiliateRequestsManagement />
                    </TabsContent>
                    
                    <TabsContent value="subscriptions" className="space-y-4">
                      <SubscriptionManagement />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </TabsContent>

            {/* Settings */}
            {hasTabAccess('settings') && (
              <TabsContent value="settings">
                <SiteSettings />
              </TabsContent>
            )}
            
            {/* Analytics */}
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
      <SimpleFormMultiDialog setIsMultiFormOpen={setIsMultiFormOpen} />
    </div>
  );
};

export default AdminDashboard;
