import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import VideoPreview from '@/components/admin/VideoPreview';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Video, 
  FileVideo,
  BookOpen,
  Eye,
  CheckCircle2,
  Home,
  LogOut,
  Settings,
  LayoutDashboard,
  BarChart3,
  Users,
  Image,
  LayoutGrid,
  Upload,
  AlertTriangle,
  Loader2,
  XCircle,
  Clock,
  Youtube,
  Play,
  ImagePlus,
  Award,
  Crown,
  Sparkles,
  Zap,
  Folders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Tipos para módulos e aulas
interface CourseModule {
  id?: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  level: string;
  order: number;
  isActive: boolean;
  isPremium: boolean;
}

interface CourseLesson {
  id?: number;
  moduleId: number;
  title: string;
  description: string;
  videoUrl: string;
  videoProvider: string;
  duration?: number | null;
  thumbnailUrl?: string | null;
  order: number;
  isPremium: boolean;
  additionalMaterialsUrl?: string | null;
  showLessonNumber?: boolean;
}

const GerenciarCursos = () => {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('modulos');
  
  // Estados para módulos
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isConfirmDeleteModuleOpen, setIsConfirmDeleteModuleOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [moduleForm, setModuleForm] = useState<CourseModule>({
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
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [lessonForm, setLessonForm] = useState<CourseLesson>({
    moduleId: 0,
    title: '',
    description: '',
    videoUrl: '',
    videoProvider: 'youtube',
    order: 0,
    isPremium: false,
    showLessonNumber: true // Nova propriedade para controlar a exibição do número da aula
  });
  
  // Estados para upload de miniatura de aula
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [thumbnailUploadError, setThumbnailUploadError] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para configurações da página
  const [pageSettings, setPageSettings] = useState({
    courseHeroTitle: '',
    courseHeroSubtitle: '',
    courseHeroImageUrl: '',
    courseRating: '',
    courseReviewCount: 0,
    courseTotalHours: '',
    courseTotalModules: 0
  });
  
  // Estados para upload de banner
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);
  const [bannerSizes, setBannerSizes] = useState({
    desktop: { width: 1920, height: 600 },
    tablet: { width: 1024, height: 400 },
    mobile: { width: 768, height: 350 }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      const data = await res.json();
      console.log('Módulos carregados:', data);
      return data;
    },
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
      const data = await res.json();
      console.log('Aulas carregadas:', data);
      return data;
    },
  });
  
  // Consulta para obter configurações do site
  const {
    data: siteSettings,
    isLoading: isLoadingSettings,
    isError: isSettingsError
  } = useQuery({
    queryKey: ['/api/site-settings'],
    queryFn: () => fetch('/api/site-settings').then(res => res.json()),
  });
  
  // Atualiza as configurações da página quando os dados do site são carregados
  useEffect(() => {
    if (siteSettings) {
      setPageSettings({
        courseHeroTitle: siteSettings.courseHeroTitle || '',
        courseHeroSubtitle: siteSettings.courseHeroSubtitle || '',
        courseHeroImageUrl: siteSettings.courseHeroImageUrl || '',
        courseRating: siteSettings.courseRating || '',
        courseReviewCount: siteSettings.courseReviewCount || 0,
        courseTotalHours: siteSettings.courseTotalHours || '',
        courseTotalModules: siteSettings.courseTotalModules || 0
      });
    }
  }, [siteSettings]);

  // Mutations para módulos
  const createModuleMutation = useMutation({
    mutationFn: async (data: CourseModule) => {
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
    mutationFn: async (data: CourseModule) => {
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
        description: 'O módulo foi removido da lista de cursos',
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
    mutationFn: async (data: CourseLesson) => {
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
    mutationFn: async (data: CourseLesson) => {
      console.log('[CLIENT] Enviando dados para atualização de aula:', data);
      const response = await apiRequest('PUT', `/api/courses/lessons/${data.id}`, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CLIENT] Erro na resposta da API:', errorData);
        throw new Error(errorData.message || 'Erro ao atualizar aula');
      }
      
      const updatedLesson = await response.json();
      console.log('[CLIENT] Aula atualizada com sucesso:', updatedLesson);
      return updatedLesson;
    },
    onSuccess: (updatedLesson) => {
      console.log('[CLIENT] Sucesso na atualização, invalidando cache...');
      
      // Invalida todas as queries relacionadas a lições
      queryClient.invalidateQueries({ 
        queryKey: ['/api/courses/lessons'],
        refetchType: 'all'
      });
      
      // Também invalida módulos pois podem ter informações agregadas das lições
      queryClient.invalidateQueries({ 
        queryKey: ['/api/courses/modules'],
        refetchType: 'all'
      });
      
      console.log('[CLIENT] Cache invalidado, fechando diálogo...');
      setIsLessonDialogOpen(false);
      
      toast({
        title: 'Aula atualizada com sucesso',
        description: `"${updatedLesson.title}" foi atualizada com sucesso`,
      });
      
      console.log('[CLIENT] Processo de atualização da aula concluído');
    },
    onError: (error: Error) => {
      console.error('[CLIENT] Erro durante atualização da aula:', error);
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
        description: 'A aula foi removida do módulo',
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

  // Handlers para módulos
  const handleOpenAddModule = () => {
    setCurrentModule(null);
    setModuleForm({
      title: '',
      description: '',
      thumbnailUrl: '',
      level: 'iniciante',
      order: modules.length + 1,
      isActive: true,
      isPremium: false
    });
    setIsModuleDialogOpen(true);
  };
  
  const handleOpenEditModule = (module: CourseModule) => {
    setCurrentModule(module);
    setModuleForm({ ...module });
    setIsModuleDialogOpen(true);
  };
  
  const handleOpenDeleteModule = (module: CourseModule) => {
    setCurrentModule(module);
    setIsConfirmDeleteModuleOpen(true);
  };
  
  const handleModuleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setModuleForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleModuleToggleChange = (name: string, checked: boolean) => {
    setModuleForm(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleModuleSubmit = () => {
    if (currentModule?.id) {
      updateModuleMutation.mutate({ ...moduleForm, id: currentModule.id });
    } else {
      createModuleMutation.mutate(moduleForm);
    }
  };
  
  const handleDeleteModule = () => {
    if (currentModule?.id) {
      deleteModuleMutation.mutate(currentModule.id);
    }
  };

  // Handlers para aulas
  // Reseta o formulário de aula para valores padrão
  const resetLessonForm = (moduleId?: number) => {
    setLessonForm({
      moduleId: moduleId || 0,
      title: '',
      description: '',
      videoUrl: '',
      videoProvider: 'youtube',
      duration: 0,
      thumbnailUrl: '',
      isPremium: false,
      order: 0,
      showLessonNumber: true
    });
    
    // Limpar estados de upload de miniatura
    setThumbnailFile(null);
    setThumbnailUploadError(null);
    setThumbnailUploadProgress(0);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleOpenAddLesson = (moduleId: number) => {
    setCurrentLesson(null);
    const moduleLessons = lessons.filter((lesson: CourseLesson) => lesson.moduleId === moduleId);
    resetLessonForm(moduleId);
    setLessonForm(prev => ({
      ...prev,
      moduleId,
      order: moduleLessons.length + 1
    }));
    setIsLessonDialogOpen(true);
  };
  
  const handleOpenEditLesson = (lesson: CourseLesson) => {
    setCurrentLesson(lesson);
    setLessonForm({ ...lesson });
    setIsLessonDialogOpen(true);
  };
  
  const handleOpenDeleteLesson = (lesson: CourseLesson) => {
    setCurrentLesson(lesson);
    setIsConfirmDeleteLessonOpen(true);
  };
  
  const handleLessonFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setLessonForm(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };
  
  const handleLessonSelectChange = (name: string, value: string) => {
    setLessonForm(prev => ({ 
      ...prev, 
      [name]: name === 'moduleId' ? parseInt(value, 10) : value 
    }));
  };
  
  const handleLessonToggleChange = (name: string, checked: boolean) => {
    setLessonForm(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handler para upload de miniatura de aula
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar tamanho do arquivo (5MB máximo)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setThumbnailFile(file);
      setThumbnailUploadError(null);
      thumbnailUploadMutation.mutate(file);
    }
  };
  
  // Mutation para upload de miniatura
  const thumbnailUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingThumbnail(true);
      setThumbnailUploadProgress(0);
      
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      // Iniciar um timer para simular o progresso enquanto o upload acontece
      let uploadTimer = setInterval(() => {
        setThumbnailUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadTimer);
            return prev;
          }
          return prev + 5;
        });
      }, 200);
      
      try {
        const response = await fetch('/api/lesson-thumbnail-upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        clearInterval(uploadTimer);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao fazer upload da miniatura');
        }
        
        setThumbnailUploadProgress(100);
        const data = await response.json();
        return data;
      } catch (error: any) {
        clearInterval(uploadTimer);
        setThumbnailUploadError(error.message);
        throw error;
      } finally {
        setIsUploadingThumbnail(false);
      }
    },
    onSuccess: (data) => {
      // Atualizar o formulário com a URL da miniatura
      setLessonForm(prev => ({
        ...prev,
        thumbnailUrl: data.thumbnailUrl
      }));
      
      toast({
        title: "Miniatura enviada com sucesso",
        description: "A imagem foi otimizada e salva no servidor",
      });
      
      // Limpar o campo de arquivo para permitir selecionar o mesmo arquivo novamente
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
      
      // Limpar o estado do arquivo
      setThumbnailFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar miniatura",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handler para campos de duração (horas, minutos, segundos)
  const handleDurationChange = (type: 'hours' | 'minutes' | 'seconds', value: number) => {
    // Garantir valores não negativos e dentro dos limites
    value = Math.max(0, value);
    if (type === 'minutes' || type === 'seconds') {
      value = Math.min(59, value);
    }
    
    // Obter a duração atual como número
    let currentDuration = 0;
    if (lessonForm.duration !== undefined && lessonForm.duration !== null) {
      if (typeof lessonForm.duration === 'string') {
        // Se for uma string formatada como tempo, convertemos para segundos
        if (lessonForm.duration.includes(':')) {
          const parts = lessonForm.duration.split(':').map(part => parseInt(part, 10));
          if (parts.length === 3) {
            currentDuration = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
          } else if (parts.length === 2) {
            currentDuration = (parts[0] * 60) + parts[1];
          }
        } else {
          // Tenta interpretar como valor numérico
          currentDuration = parseInt(lessonForm.duration, 10) || 0;
        }
      } else if (typeof lessonForm.duration === 'number') {
        currentDuration = lessonForm.duration;
      }
    }
    
    // Calcular duração atual em componentes
    const hours = type === 'hours' ? value : Math.floor(currentDuration / 3600);
    const minutes = type === 'minutes' ? value : Math.floor((currentDuration % 3600) / 60);
    const seconds = type === 'seconds' ? value : currentDuration % 60;
    
    // Calcular nova duração total em segundos
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    
    console.log(`Nova duração: ${hours}h:${minutes}m:${seconds}s = ${totalSeconds}s`);
    
    setLessonForm(prev => ({
      ...prev,
      duration: totalSeconds
    }));
  };
  
  const handleLessonSubmit = () => {
    if (currentLesson?.id) {
      updateLessonMutation.mutate({ ...lessonForm, id: currentLesson.id });
    } else {
      createLessonMutation.mutate(lessonForm);
    }
  };
  
  const handleDeleteLesson = () => {
    if (currentLesson?.id) {
      deleteLessonMutation.mutate(currentLesson.id);
    }
  };

  // Funções de utilidade
  const getLessonsByModule = (moduleId: number) => {
    return lessons
      .filter((lesson: CourseLesson) => lesson.moduleId === moduleId)
      .sort((a: CourseLesson, b: CourseLesson) => a.order - b.order);
  };
  
  const getModuleName = (moduleId: number) => {
    const module = modules.find((m: CourseModule) => m.id === moduleId);
    return module ? module.title : 'Módulo não encontrado';
  };
  
  // Formatar duração para visualização de tempo "HH:MM:SS" ou "MM:SS"
  const formatarDuracaoPreview = (segundos?: number | null) => {
    if (segundos === undefined || segundos === null) return "00:00";
    
    // Verificar se já é uma string formatada como "MM:SS" ou "HH:MM:SS"
    if (typeof segundos === 'string' && segundos.includes(':')) {
      // Se já estiver no formato adequado, retorna a string diretamente
      return segundos;
    }
    
    // Garantir que segundos seja um número
    let totalSegundos = 0;
    
    if (typeof segundos === 'string') {
      totalSegundos = parseInt(segundos, 10);
    } else if (typeof segundos === 'number') {
      totalSegundos = segundos;
    }
    
    if (isNaN(totalSegundos) || totalSegundos < 0) {
      console.warn(`Valor inválido para formatação de duração: ${segundos}`);
      return "00:00";
    }
    
    // Calcular horas, minutos e segundos
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segsRestantes = totalSegundos % 60;
    
    // Formatar com horas se for necessário
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segsRestantes.toString().padStart(2, '0')}`;
    }
    
    // Formatar sempre com padding para minutos e segundos
    return `${minutos.toString().padStart(2, '0')}:${segsRestantes.toString().padStart(2, '0')}`;
  };
  
  // Formata a duração para uma exibição mais humanizada (ex: "1h 15min" ou "5min 30s")
  const formatarDuracaoHumanizada = (segundos?: number | null) => {
    if (segundos === undefined || segundos === null) return "Não definida";
    
    // Garantir que segundos seja um número
    let totalSegundos = 0;
    
    if (typeof segundos === 'string') {
      if (segundos.includes(':')) {
        // Converter de formato "HH:MM:SS" ou "MM:SS" para segundos
        const partes = segundos.split(':').map(p => parseInt(p, 10));
        if (partes.length === 3) {
          totalSegundos = (partes[0] * 3600) + (partes[1] * 60) + partes[2];
        } else if (partes.length === 2) {
          totalSegundos = (partes[0] * 60) + partes[1];
        }
      } else {
        totalSegundos = parseInt(segundos, 10);
      }
    } else if (typeof segundos === 'number') {
      totalSegundos = segundos;
    }
    
    if (isNaN(totalSegundos) || totalSegundos < 0) {
      return "Duração desconhecida";
    }
    
    // Calcular horas, minutos e segundos
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segsRestantes = totalSegundos % 60;
    
    // Montar exibição humanizada
    let resultado = '';
    
    if (horas > 0) {
      resultado += `${horas}h `;
    }
    
    if (minutos > 0 || horas > 0) {
      resultado += `${minutos}min`;
    }
    
    // Só mostrar segundos se não tiver horas e for menos de 10 minutos
    if (horas === 0 && segsRestantes > 0 && minutos < 10) {
      if (minutos > 0) resultado += ' ';
      resultado += `${segsRestantes}s`;
    }
    
    return resultado.trim() || '< 1min';
  };
  
  const getVideoProviderBadge = (provider: string) => {
    switch (provider) {
      case 'youtube':
        return <Badge className="bg-red-500">YouTube</Badge>;
      case 'vimeo':
        return <Badge className="bg-blue-400">Vimeo</Badge>;
      case 'vturb':
        return <Badge className="bg-purple-500">vTurb</Badge>;
      case 'panda':
        return <Badge className="bg-orange-500">Panda</Badge>;
      default:
        return <Badge>Direto</Badge>;
    }
  };

  // Handlers para configurações da página
  const handlePageSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setPageSettings(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };
  
  // Handler para upload de banner
  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione uma imagem para o banner",
        variant: "destructive",
      });
      return;
    }

    const file = e.target.files[0];
    
    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar tamanho (limitar a 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Criar FormData para upload
    const formData = new FormData();
    formData.append('banner', file);
    formData.append('width', bannerSizes.desktop.width.toString());
    formData.append('quality', '80');
    
    // Resetar estados
    setBannerUploadError(null);
    setUploadProgress(0);
    setIsUploadingBanner(true);
    
    // Iniciar upload
    uploadBannerMutation.mutate(formData);
  };
  
  // Mutation para upload de banner
  const uploadBannerMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulando progresso durante upload (atualizações incrementais)
      const uploadTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadTimer);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      try {
        const response = await fetch('/api/admin/upload-banner', {
          method: 'POST',
          body: formData,
          // Não incluir Content-Type aqui para que o navegador defina
          // corretamente o boundary para o FormData
        });
        
        clearInterval(uploadTimer);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha no upload do banner');
        }
        
        setUploadProgress(100);
        const data = await response.json();
        
        // Atualizar tamanhos recomendados se o servidor os fornecer
        if (data.sizes) {
          setBannerSizes(data.sizes);
        }
        
        return data;
      } catch (error: any) {
        clearInterval(uploadTimer);
        setBannerUploadError(error.message);
        throw error;
      } finally {
        setIsUploadingBanner(false);
      }
    },
    onSuccess: (data) => {
      setPageSettings(prev => ({
        ...prev,
        courseHeroImageUrl: data.bannerUrl
      }));
      
      toast({
        title: "Banner enviado com sucesso",
        description: "A imagem foi otimizada e salva no servidor",
      });
      
      // Limpar o campo de arquivo para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar banner",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      // Converter strings para números onde necessário
      const formattedData = {
        courseHeroTitle: data.courseHeroTitle,
        courseHeroSubtitle: data.courseHeroSubtitle,
        courseHeroImageUrl: data.courseHeroImageUrl,
        courseRating: data.courseRating,
        courseReviewCount: Number(data.courseReviewCount),
        courseTotalHours: data.courseTotalHours,
        courseTotalModules: Number(data.courseTotalModules)
      };
      
      console.log('Dados a serem enviados:', formattedData);
      
      const response = await apiRequest('PATCH', '/api/site-settings', formattedData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
      toast({
        title: 'Configurações salvas com sucesso',
        description: 'As alterações foram aplicadas à página de videoaulas',
      });
      setIsSavingSettings(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setIsSavingSettings(false);
    }
  });
  
  const handleSavePageSettings = () => {
    setIsSavingSettings(true);
    updateSettingsMutation.mutate(pageSettings);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md overflow-y-auto">
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
          
          <nav className="mt-4">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
                Painel Principal
              </h3>
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start text-gray-600 mb-1 px-4 py-2">
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/user-stats">
                <Button variant="ghost" className="w-full justify-start text-gray-600 mb-1 px-4 py-2">
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Estatísticas
                </Button>
              </Link>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
                Gerenciamento de Conteúdo
              </h3>
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start text-gray-600 mb-1 px-4 py-2">
                  <Image className="w-5 h-5 mr-3" />
                  Artes
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start text-gray-600 mb-1 px-4 py-2">
                  <LayoutGrid className="w-5 h-5 mr-3" />
                  Categorias
                </Button>
              </Link>
              <Link href="/admin/gerenciar-cursos">
                <Button variant="ghost" className="w-full justify-start text-gray-600 mb-1 px-4 py-2 bg-blue-50 text-blue-600 font-medium">
                  <BookOpen className="w-5 h-5 mr-3" />
                  Cursos
                </Button>
              </Link>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
                Configurações
              </h3>
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start text-gray-600 mb-1 px-4 py-2">
                  <Users className="w-5 h-5 mr-3" />
                  Usuários
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start text-gray-600 mb-1 px-4 py-2">
                  <Settings className="w-5 h-5 mr-3" />
                  Configurações
                </Button>
              </Link>
            </div>
          </nav>
        </div>
        
        <div className="mt-auto p-4 pt-6 border-t">
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
            <h1 className="text-xl font-semibold">Gerenciar Cursos</h1>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao site
                </Button>
              </Link>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Área de Cursos</h2>
              <p className="text-gray-500 mt-1">
                Crie e gerencie módulos e aulas para a plataforma de videoaulas
              </p>
            </div>
            
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="p-6"
            >
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
          
              {/* Tab de Módulos */}
              <TabsContent value="modulos" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Módulos de Curso</h2>
                  <Button 
                    className="flex items-center" 
                    onClick={handleOpenAddModule}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Módulo
                  </Button>
                </div>
                
                {isModulesError ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Erro ao carregar módulos. Tente novamente mais tarde.
                    </AlertDescription>
                  </Alert>
                ) : isLoadingModules ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ))}
                  </div>
                ) : modules.length === 0 ? (
                  <div className="text-center p-10 border rounded-lg bg-gray-50">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum módulo encontrado</h3>
                    <p className="text-gray-500 mb-4">Crie seu primeiro módulo para começar a adicionar aulas.</p>
                    <Button onClick={handleOpenAddModule}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar módulo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Accordion type="multiple" className="space-y-4">
                      {modules.sort((a: CourseModule, b: CourseModule) => a.order - b.order).map((module: CourseModule) => (
                        <AccordionItem 
                          value={String(module.id)} 
                          key={module.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center justify-between border-b p-4 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 h-10 w-10 flex items-center justify-center rounded-lg text-blue-600">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-medium">{module.title}</h3>
                                <div className="flex gap-2 text-xs mt-1">
                                  <Badge variant={module.isActive ? "default" : "outline"}>
                                    {module.isActive ? "Ativo" : "Inativo"}
                                  </Badge>
                                  <Badge variant={module.isPremium ? "secondary" : "outline"}>
                                    {module.isPremium ? "Premium" : "Gratuito"}
                                  </Badge>
                                  <Badge variant="outline" className="capitalize">
                                    {module.level}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleOpenAddLesson(module.id!)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Aula
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleOpenEditModule(module)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleOpenDeleteModule(module)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <AccordionTrigger className="p-0 hover:no-underline" />
                            </div>
                          </div>
                          
                          <AccordionContent className="pt-4">
                            <div className="px-4 mb-4">
                              <p className="text-sm text-gray-600">{module.description}</p>
                            </div>
                            
                            <div className="px-4 mb-4">
                              <h4 className="text-sm font-medium mb-2">Aulas neste módulo</h4>
                              {getLessonsByModule(module.id!).length === 0 ? (
                                <div className="text-center py-8 border rounded-lg bg-gray-50">
                                  <FileVideo className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-500">
                                    Nenhuma aula neste módulo
                                  </p>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={() => handleOpenAddLesson(module.id!)}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Adicionar aula
                                  </Button>
                                </div>
                              ) : (
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Ordem</TableHead>
                                        <TableHead>Aula</TableHead>
                                        <TableHead>Vídeo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[100px]">Ações</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {getLessonsByModule(module.id!).map((lesson: CourseLesson) => (
                                        <TableRow key={lesson.id}>
                                          <TableCell className="font-medium">{lesson.order}</TableCell>
                                          <TableCell>
                                            <div>
                                              <div className="font-medium text-blue-600">{lesson.title}</div>
                                              <div className="text-xs text-gray-600 mt-1">
                                                {lesson.description ? (
                                                  lesson.description.length > 50 
                                                    ? `${lesson.description.substring(0, 50)}...` 
                                                    : lesson.description
                                                ) : <span className="italic text-gray-400">Sem descrição</span>}
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1">
                                                <span className="inline-flex items-center text-amber-600 font-medium">
                                                  <span className="inline-block w-3 h-3 mr-1 text-amber-600">⏱️</span>
                                                  {formatarDuracaoPreview(lesson.duration)}
                                                </span>
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {getVideoProviderBadge(lesson.videoProvider)}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={lesson.isPremium ? "secondary" : "outline"}>
                                              {lesson.isPremium ? "Premium" : "Gratuito"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex space-x-2">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenEditLesson(lesson)}
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleOpenDeleteLesson(lesson)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab de Aulas */}
              <TabsContent value="aulas" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Aulas dos Cursos</h2>
                </div>
                
                {isLessonsError ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Erro ao carregar aulas. Tente novamente mais tarde.
                    </AlertDescription>
                  </Alert>
                ) : isLoadingLessons || isLoadingModules ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))}
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="text-center p-10 border rounded-lg bg-gray-50">
                    <FileVideo className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aula encontrada</h3>
                    <p className="text-gray-500 mb-4">Primeiro crie um módulo, depois adicione aulas a ele.</p>
                    {modules.length > 0 && (
                      <Select 
                        onValueChange={(moduleId) => handleOpenAddLesson(parseInt(moduleId))}
                      >
                        <SelectTrigger className="w-[280px] mx-auto">
                          <SelectValue placeholder="Selecione um módulo para adicionar aula" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((module: CourseModule) => (
                            <SelectItem key={module.id} value={String(module.id)}>{module.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Módulo</TableHead>
                          <TableHead>Ordem</TableHead>
                          <TableHead>Aula</TableHead>
                          <TableHead>Vídeo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lessons.sort((a: CourseLesson, b: CourseLesson) => {
                          // Primeiro ordena por módulo, depois por ordem
                          if (a.moduleId !== b.moduleId) {
                            return a.moduleId - b.moduleId;
                          }
                          return a.order - b.order;
                        }).map((lesson: CourseLesson) => (
                          <TableRow key={lesson.id}>
                            <TableCell className="font-medium">{getModuleName(lesson.moduleId)}</TableCell>
                            <TableCell>{lesson.order}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-blue-600">{lesson.title}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {lesson.description ? (
                                    lesson.description.length > 50 
                                      ? `${lesson.description.substring(0, 50)}...` 
                                      : lesson.description
                                  ) : <span className="italic text-gray-400">Sem descrição</span>}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="inline-flex items-center text-amber-600 font-medium">
                                    <span className="inline-block w-3 h-3 mr-1 text-amber-600">⏱️</span>
                                    {formatarDuracaoPreview(lesson.duration)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getVideoProviderBadge(lesson.videoProvider)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={lesson.isPremium ? "secondary" : "outline"}>
                                {lesson.isPremium ? "Premium" : "Gratuito"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEditLesson(lesson)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleOpenDeleteLesson(lesson)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab de Configurações da Página */}
              <TabsContent value="config" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Configurações da Página de Videoaulas</h2>
                </div>
                
                <div className="bg-white border rounded-lg shadow-sm">
                  <div className="p-6 border-b">
                    <h3 className="text-base font-medium">Hero Banner</h3>
                    <p className="text-sm text-gray-500">
                      Configure como o banner principal da página de videoaulas será exibido
                    </p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="courseHeroTitle">Título do Banner</Label>
                        <Input 
                          id="courseHeroTitle"
                          name="courseHeroTitle"
                          placeholder="DesignAuto Videoaulas"
                          value={pageSettings.courseHeroTitle}
                          onChange={handlePageSettingsChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="courseHeroSubtitle">Subtítulo do Banner</Label>
                        <Input 
                          id="courseHeroSubtitle"
                          name="courseHeroSubtitle"
                          placeholder="A formação completa para você criar designs profissionais..."
                          value={pageSettings.courseHeroSubtitle}
                          onChange={handlePageSettingsChange}
                        />
                      </div>
                      
                      <div className="space-y-2 col-span-full">
                        <div className="flex flex-col">
                          <Label htmlFor="courseHeroImageUrl" className="mb-2">Banner do Curso</Label>
                          
                          {/* Componente de Upload de Banner */}
                          <div className="mb-4 border border-dashed rounded-lg p-4 bg-gray-50">
                            <div className="flex flex-col items-center">
                              <div className="mb-3 w-full">
                                <p className="text-sm text-gray-600 mb-2">
                                  Upload de nova imagem para o banner do curso:
                                </p>
                                
                                <div className="flex items-start space-x-2">
                                  <div className="flex-1">
                                    <div className="relative">
                                      <input
                                        ref={fileInputRef}
                                        type="file"
                                        id="bannerUpload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleBannerFileSelect}
                                        disabled={isUploadingBanner}
                                      />
                                      <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingBanner}
                                        className="w-full flex items-center justify-center"
                                      >
                                        {isUploadingBanner ? (
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                          <Upload className="w-4 h-4 mr-2" />
                                        )}
                                        {isUploadingBanner ? 'Enviando...' : 'Selecionar Imagem'}
                                      </Button>
                                      
                                      {isUploadingBanner && (
                                        <div className="w-full mt-2">
                                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                              style={{ width: `${uploadProgress}%` }}
                                            />
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1 text-center">
                                            {uploadProgress}% concluído
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Informações do banner */}
                              <div className="w-full p-3 bg-blue-50 rounded text-xs text-blue-700">
                                <div className="flex items-start mb-1">
                                  <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                                  <p>Recomendações para o banner do curso:</p>
                                </div>
                                <ul className="list-disc ml-8 space-y-1 mt-1">
                                  <li>Dimensões recomendadas: {bannerSizes.desktop.width}x{bannerSizes.desktop.height}px</li>
                                  <li>Formatos aceitos: JPG, PNG, WebP</li>
                                  <li>Tamanho máximo: 5MB</li>
                                  <li>Use imagens com boa resolução e qualidade</li>
                                </ul>
                              </div>

                              {bannerUploadError && (
                                <div className="w-full mt-3 p-3 bg-red-50 rounded border border-red-200 text-sm text-red-600 flex items-start">
                                  <XCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                  <p>{bannerUploadError}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Campo para a URL da imagem */}
                          <div className="mt-4">
                            <Label htmlFor="courseHeroImageUrl" className="text-sm text-gray-600">URL da imagem atual</Label>
                            <Input 
                              id="courseHeroImageUrl"
                              name="courseHeroImageUrl"
                              placeholder="https://example.com/image.jpg"
                              value={pageSettings.courseHeroImageUrl}
                              onChange={handlePageSettingsChange}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Este campo é atualizado automaticamente após o upload, mas também pode ser editado manualmente.
                            </p>
                          </div>
                        </div>
                        
                        {/* Prévia da imagem */}
                        {pageSettings.courseHeroImageUrl && (
                          <div className="mt-4 p-3 border rounded">
                            <p className="text-sm font-medium text-gray-700 mb-2">Prévia do banner:</p>
                            <div className="relative bg-gray-200 rounded overflow-hidden" style={{ height: '150px' }}>
                              <img 
                                src={pageSettings.courseHeroImageUrl} 
                                alt="Prévia do banner" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://placehold.co/1920x600/e2e8f0/64748b?text=Imagem+Inválida";
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Esta é uma prévia de como o banner aparecerá no topo da página de videoaulas.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg shadow-sm">
                  <div className="p-6 border-b">
                    <h3 className="text-base font-medium">Estatísticas do Curso</h3>
                    <p className="text-sm text-gray-500">
                      Configure as estatísticas exibidas na página de videoaulas
                    </p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="courseRating">Avaliação do Curso</Label>
                        <Input 
                          id="courseRating"
                          name="courseRating"
                          placeholder="4.8"
                          value={pageSettings.courseRating}
                          onChange={handlePageSettingsChange}
                        />
                        <p className="text-xs text-gray-500">Número de 0 a 5, pode incluir decimais (ex: 4.8)</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="courseReviewCount">Número de Avaliações</Label>
                        <Input 
                          id="courseReviewCount"
                          name="courseReviewCount"
                          type="number"
                          placeholder="287"
                          value={pageSettings.courseReviewCount}
                          onChange={handlePageSettingsChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="courseTotalHours">Total de Horas</Label>
                        <Input 
                          id="courseTotalHours"
                          name="courseTotalHours"
                          placeholder="42 horas"
                          value={pageSettings.courseTotalHours}
                          onChange={handlePageSettingsChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="courseTotalModules">Total de Módulos</Label>
                        <Input 
                          id="courseTotalModules"
                          name="courseTotalModules"
                          type="number"
                          placeholder="18"
                          value={pageSettings.courseTotalModules}
                          onChange={handlePageSettingsChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSavePageSettings}
                    disabled={isSavingSettings}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSavingSettings ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
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
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="flex-1"
                  />
                  {moduleForm.thumbnailUrl && (
                    <Button
                      variant="outline"
                      type="button"
                      size="icon"
                      onClick={() => window.open(moduleForm.thumbnailUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {moduleForm.thumbnailUrl && (
                  <div className="mt-2 h-36 overflow-hidden rounded-md border">
                    <img 
                      src={moduleForm.thumbnailUrl} 
                      alt="Prévia da miniatura" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/94a3b8?text=Imagem+não+encontrada";
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="moduleLevel">Nível</Label>
                <Select
                  value={moduleForm.level}
                  onValueChange={(value) => handleModuleFormChange({
                    target: { name: 'level', value }
                  } as React.ChangeEvent<HTMLSelectElement>)}
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
                  min={1}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 mt-2 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <Switch
                  id="moduleActive"
                  checked={moduleForm.isActive}
                  onCheckedChange={(checked) => handleModuleToggleChange('isActive', checked)}
                />
                <Label htmlFor="moduleActive" className="flex items-center gap-2 cursor-pointer">
                  {moduleForm.isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span>Módulo ativo</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="modulePremium"
                  checked={moduleForm.isPremium}
                  onCheckedChange={(checked) => handleModuleToggleChange('isPremium', checked)}
                />
                <Label htmlFor="modulePremium" className="flex items-center gap-2 cursor-pointer">
                  {moduleForm.isPremium ? (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Crown className="h-4 w-4 text-gray-400" />
                  )}
                  <span>Conteúdo premium</span>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Módulo
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser revertida após confirmação
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 p-4 rounded-md mb-4 border border-destructive/30">
              <p className="font-medium">Tem certeza que deseja excluir o módulo "{currentModule?.title}"?</p>
              <p className="text-sm text-gray-700 mt-2">
                Este módulo será removido permanentemente do sistema.
              </p>
            </div>
            
            {currentModule && (
              <div className="mt-4 flex flex-col sm:flex-row gap-4 bg-gray-50 p-3 rounded-md border mb-4">
                <div className="sm:w-1/3">
                  {currentModule.thumbnailUrl ? (
                    <div className="aspect-video w-full rounded-md overflow-hidden border bg-gray-100">
                      <img 
                        src={currentModule.thumbnailUrl}
                        alt={currentModule.title}
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/400x225/e2e8f0/94a3b8?text=Miniatura";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
                      <Folders className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Detalhes do módulo:</h4>
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="font-medium min-w-20">Ordem:</span>
                      <span>{currentModule.order}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium min-w-20">Nível:</span>
                      <span className="flex items-center gap-1">
                        {currentModule.level === 'iniciante' && (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-green-500" />
                            <span>Iniciante</span>
                          </>
                        )}
                        {currentModule.level === 'intermediario' && (
                          <>
                            <Zap className="h-3.5 w-3.5 text-yellow-500" />
                            <span>Intermediário</span>
                          </>
                        )}
                        {currentModule.level === 'avancado' && (
                          <>
                            <Award className="h-3.5 w-3.5 text-red-500" />
                            <span>Avançado</span>
                          </>
                        )}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium min-w-20">Status:</span>
                      <span className="flex items-center gap-1">
                        {currentModule.isPremium ? (
                          <>
                            <Crown className="h-3.5 w-3.5 text-yellow-500" />
                            <span>Premium</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span>Gratuito</span>
                          </>
                        )}
                        {currentModule.isActive ? (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-500 border-gray-200 text-xs">
                            Inativo
                          </Badge>
                        )}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium min-w-20">Total aulas:</span>
                      <span className="flex items-center gap-1">
                        {lessons.filter(lesson => lesson.moduleId === currentModule.id).length}
                        <FileVideo className="h-3.5 w-3.5 text-blue-400 ml-1" />
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            {currentModule && lessons.some(lesson => lesson.moduleId === currentModule.id) && (
              <div className="mb-4">
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="font-semibold text-red-800">Aulas relacionadas serão excluídas</AlertTitle>
                  <AlertDescription className="text-red-700">
                    As seguintes aulas também serão removidas permanentemente:
                  </AlertDescription>
                </Alert>
                <div className="mt-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="max-h-40 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                      {lessons
                        .filter(lesson => lesson.moduleId === currentModule.id)
                        .sort((a, b) => a.order - b.order)
                        .map((lesson) => (
                          <li key={lesson.id} className="flex gap-3 py-1.5 px-2 rounded-md hover:bg-gray-100">
                            <span className="flex-none w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                              {lesson.order}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                              {lesson.isPremium && (
                                <span className="inline-flex items-center text-xs text-amber-600 mt-0.5">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Premium
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
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
      
      {/* Diálogo para adicionar/editar aula */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              {currentLesson ? 'Editar Aula' : 'Adicionar Aula'}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {currentLesson ? 'editar a' : 'criar uma nova'} aula
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lessonModule">Módulo *</Label>
                <Select
                  value={String(lessonForm.moduleId)}
                  onValueChange={(value) => handleLessonSelectChange('moduleId', value)}
                  disabled={currentLesson !== null}
                >
                  <SelectTrigger id="lessonModule">
                    <SelectValue placeholder="Selecione o módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module: CourseModule) => (
                      <SelectItem key={module.id} value={String(module.id)}>{module.title}</SelectItem>
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
                  min={1}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lessonTitle">Título da aula *</Label>
              <Input
                id="lessonTitle"
                name="title"
                value={lessonForm.title}
                onChange={handleLessonFormChange}
                placeholder="Ex: Introdução ao curso"
              />
            </div>
            <div className="grid gap-2">
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

            {/* Seção de Vídeo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="lessonVideoUrl">URL do vídeo *</Label>
                  <Input
                    id="lessonVideoUrl"
                    name="videoUrl"
                    value={lessonForm.videoUrl}
                    onChange={handleLessonFormChange}
                    placeholder="https://youtube.com/watch?v=xyz"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lessonVideoProvider">Plataforma de vídeo</Label>
                    <Select
                      value={lessonForm.videoProvider}
                      onValueChange={(value) => handleLessonSelectChange('videoProvider', value)}
                    >
                      <SelectTrigger id="lessonVideoProvider">
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
                  
                  {/* Botão de prévia do vídeo */}
                  <div className="flex items-end justify-end">
                    <Button
                      variant="outline"
                      type="button"
                      className="gap-2"
                      disabled={!lessonForm.videoUrl}
                      onClick={() => {
                        // Simplesmente atualiza o estado para forçar a renderização do preview
                        setLessonForm(prev => ({ ...prev }));
                      }}
                    >
                      <Play className="h-4 w-4" />
                      Verificar vídeo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="lessonDurationHours" className="text-xs">Horas</Label>
                    <Input
                      id="lessonDurationHours"
                      type="number"
                      value={Math.floor((lessonForm.duration || 0) / 3600)}
                      onChange={(e) => handleDurationChange('hours', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min={0}
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="lessonDurationMinutes" className="text-xs">Minutos</Label>
                    <Input
                      id="lessonDurationMinutes"
                      type="number"
                      value={Math.floor(((lessonForm.duration || 0) % 3600) / 60)}
                      onChange={(e) => handleDurationChange('minutes', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min={0}
                      max={59}
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="lessonDurationSeconds" className="text-xs">Segundos</Label>
                    <Input
                      id="lessonDurationSeconds"
                      type="number"
                      value={(lessonForm.duration || 0) % 60}
                      onChange={(e) => handleDurationChange('seconds', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min={0}
                      max={59}
                      className="h-9"
                    />
                  </div>
                </div>
                
                <div className="flex items-center h-8 px-3 border rounded-md bg-gray-50 text-sm">
                  <span className="mr-2 font-medium">Duração:</span> {formatarDuracaoPreview(lessonForm.duration)}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="additionalMaterialsUrl">URL materiais adicionais (opcional)</Label>
                  <Input
                    id="additionalMaterialsUrl"
                    name="additionalMaterialsUrl"
                    value={lessonForm.additionalMaterialsUrl || ''}
                    onChange={handleLessonFormChange}
                    placeholder="https://exemplo.com/materiais.zip"
                  />
                </div>

                <div className="flex flex-wrap gap-6 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="lessonPremium"
                      checked={lessonForm.isPremium}
                      onCheckedChange={(checked) => handleLessonToggleChange('isPremium', checked)}
                    />
                    <Label htmlFor="lessonPremium" className="flex items-center gap-2 cursor-pointer">
                      {lessonForm.isPremium ? (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Crown className="h-4 w-4 text-gray-400" />
                      )}
                      <span>Conteúdo premium</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showLessonNumber"
                      checked={lessonForm.showLessonNumber}
                      onCheckedChange={(checked) => handleLessonToggleChange('showLessonNumber', checked)}
                    />
                    <Label htmlFor="showLessonNumber" className="flex items-center gap-2 cursor-pointer">
                      {lessonForm.showLessonNumber ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span>Mostrar "Aula X" na miniatura</span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Visualização do vídeo */}
                {lessonForm.videoUrl && (
                  <div>
                    <p className="text-sm font-medium mb-2">Prévia do vídeo:</p>
                    <div className="rounded-md overflow-hidden border aspect-video">
                      <VideoPreview 
                        videoUrl={lessonForm.videoUrl} 
                        videoProvider={lessonForm.videoProvider}
                        thumbnailUrl={lessonForm.thumbnailUrl} 
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lessonThumbnailUrl">URL da miniatura (opcional)</Label>
                    <Input
                      id="lessonThumbnailUrl"
                      name="thumbnailUrl"
                      value={lessonForm.thumbnailUrl || ''}
                      onChange={handleLessonFormChange}
                      placeholder="Deixe em branco para usar miniatura padrão do vídeo"
                    />
                  </div>
                  
                  <div className="grid gap-1 mt-3">
                    <Label htmlFor="lessonThumbnailFile">Ou faça upload de uma imagem</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="lessonThumbnailFile"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailFileChange}
                        ref={thumbnailInputRef}
                        disabled={isUploadingThumbnail}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => thumbnailInputRef.current?.click()}
                        disabled={isUploadingThumbnail}
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progresso de upload da miniatura */}
                  {isUploadingThumbnail && (
                    <div className="mt-2">
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${thumbnailUploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-center mt-1">
                        {thumbnailUploadProgress < 100 
                          ? `Enviando miniatura... ${thumbnailUploadProgress}%`
                          : "Processando imagem..."}
                      </p>
                    </div>
                  )}
                  
                  {/* Erro de upload */}
                  {thumbnailUploadError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {thumbnailUploadError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Visualização de miniatura */}
                  {lessonForm.thumbnailUrl && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Visualização da miniatura:</p>
                      <div className="relative aspect-video rounded-md overflow-hidden border">
                        <img 
                          src={lessonForm.thumbnailUrl} 
                          alt="Prévia da miniatura" 
                          className="w-full h-full object-cover"
                        />
                        {lessonForm.showLessonNumber && lessonForm.order && (
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 text-xs rounded">
                            Aula {lessonForm.order}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Aula
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser revertida após confirmação
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 p-4 rounded-md mb-4 border border-destructive/30">
              <p className="font-medium">Tem certeza que deseja excluir a aula "{currentLesson?.title}"?</p>
              <p className="text-sm text-gray-700 mt-2">
                Esta aula será removida permanentemente do sistema.
              </p>
            </div>
            
            {currentLesson && (
              <div className="mt-4 flex flex-col sm:flex-row gap-4 bg-gray-50 p-3 rounded-md border mb-4">
                <div className="sm:w-1/3">
                  {currentLesson.thumbnailUrl ? (
                    <div className="aspect-video w-full rounded-md overflow-hidden border bg-gray-100">
                      <img 
                        src={currentLesson.thumbnailUrl}
                        alt={currentLesson.title}
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/400x225/e2e8f0/94a3b8?text=Miniatura";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
                      <FileVideo className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Detalhes da aula:</h4>
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="font-medium min-w-20">Módulo:</span>
                      <span>{modules.find(m => m.id === currentLesson.moduleId)?.title || 'Desconhecido'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium min-w-20">Ordem:</span>
                      <span>{currentLesson.order}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium min-w-20">Duração:</span>
                      <span>{formatarDuracaoHumanizada(currentLesson.duration)}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium min-w-20">Status:</span>
                      <span className="flex items-center gap-1">
                        {currentLesson.isPremium ? (
                          <>
                            <Crown className="h-3.5 w-3.5 text-yellow-500" />
                            <span>Premium</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span>Gratuito</span>
                          </>
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Excluir uma aula pode afetar a ordem das aulas restantes no módulo. 
                Considere ajustar a ordem das aulas após a exclusão.
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
    </div>
  );
};

export default GerenciarCursos;