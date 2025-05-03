import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  FileEdit, 
  Layers, 
  Crown, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Interface para módulos de curso
interface CourseModule {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  level: "iniciante" | "intermediario" | "avancado";
  order: number;
  isActive: boolean;
  isPremium: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  totalLessons?: number;
}

// Interface para lições de curso
interface CourseLesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  videoUrl: string;
  videoProvider: "youtube" | "vimeo" | "vturb" | "panda";
  duration?: number;
  thumbnailUrl?: string;
  order: number;
  isPremium: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// Componente de formulário para adicionar/editar módulo
const ModuleForm = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  initialData?: CourseModule;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    level: initialData?.level || 'iniciante',
    order: initialData?.order || 1,
    isPremium: initialData?.isPremium || false,
    isActive: initialData?.isActive ?? true,
    thumbnailUrl: initialData?.thumbnailUrl || '',
    thumbnail: null as File | null
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, thumbnail: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Criar FormData para upload
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('level', formData.level);
    submitData.append('order', formData.order.toString());
    submitData.append('isPremium', formData.isPremium.toString());
    submitData.append('isActive', formData.isActive.toString());
    
    // Adicionar thumbnail se selecionado
    if (formData.thumbnail) {
      submitData.append('thumbnail', formData.thumbnail);
    } else if (initialData?.thumbnailUrl) {
      submitData.append('thumbnailUrl', initialData.thumbnailUrl);
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título do Módulo</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Título do módulo"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrição detalhada do módulo"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="level">Nível de Dificuldade</Label>
          <Select
            value={formData.level}
            onValueChange={(value) => handleChange({ target: { name: 'level', value } } as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iniciante">Iniciante</SelectItem>
              <SelectItem value="intermediario">Intermediário</SelectItem>
              <SelectItem value="avancado">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="order">Ordem de Exibição</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min="1"
            value={formData.order}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Switch
            id="isPremium"
            checked={formData.isPremium}
            onCheckedChange={(checked) => handleSwitchChange('isPremium', checked)}
          />
          <Label htmlFor="isPremium" className="cursor-pointer">
            Conteúdo Premium
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Módulo Ativo
          </Label>
        </div>
      </div>

      <div>
        <Label htmlFor="thumbnail">Imagem de Capa</Label>
        <Input
          id="thumbnail"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1"
        />
        {(initialData?.thumbnailUrl || formData.thumbnailUrl) && !formData.thumbnail && (
          <div className="mt-2">
            <p className="text-sm text-neutral-500 mb-1">Imagem atual:</p>
            <img
              src={initialData?.thumbnailUrl || formData.thumbnailUrl}
              alt="Thumbnail atual"
              className="w-32 h-24 object-cover rounded-md"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Módulo' : 'Criar Módulo'}
        </Button>
      </div>
    </form>
  );
};

// Componente de formulário para adicionar/editar lição
const LessonForm = ({
  initialData,
  moduleId,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  initialData?: CourseLesson;
  moduleId: number;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    videoUrl: initialData?.videoUrl || '',
    videoProvider: initialData?.videoProvider || 'youtube',
    duration: initialData?.duration || 0,
    order: initialData?.order || 1,
    isPremium: initialData?.isPremium || false,
    moduleId: moduleId,
    thumbnailUrl: initialData?.thumbnailUrl || '',
    thumbnail: null as File | null
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, thumbnail: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Criar FormData para upload
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('videoUrl', formData.videoUrl);
    submitData.append('videoProvider', formData.videoProvider);
    submitData.append('duration', formData.duration.toString());
    submitData.append('order', formData.order.toString());
    submitData.append('isPremium', formData.isPremium.toString());
    submitData.append('moduleId', formData.moduleId.toString());
    
    // Adicionar thumbnail se selecionado
    if (formData.thumbnail) {
      submitData.append('thumbnail', formData.thumbnail);
    } else if (initialData?.thumbnailUrl) {
      submitData.append('thumbnailUrl', initialData.thumbnailUrl);
    }

    onSubmit(submitData);
  };

  // Validação básica da URL do vídeo conforme o provider
  const validateVideoUrl = () => {
    const url = formData.videoUrl.trim();
    
    if (!url) return true;

    switch (formData.videoProvider) {
      case 'youtube':
        return url.includes('youtube.com') || url.includes('youtu.be');
      case 'vimeo':
        return url.includes('vimeo.com');
      default:
        return true;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título da Aula</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Título da aula"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrição detalhada da aula"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="videoProvider">Plataforma de Vídeo</Label>
          <Select
            value={formData.videoProvider}
            onValueChange={(value) => handleChange({ target: { name: 'videoProvider', value } } as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="vimeo">Vimeo</SelectItem>
              <SelectItem value="vturb">Vturb</SelectItem>
              <SelectItem value="panda">Panda</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="order">Ordem de Exibição</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min="1"
            value={formData.order}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="videoUrl">URL do Vídeo</Label>
        <Input
          id="videoUrl"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleChange}
          placeholder="URL do vídeo (YouTube, Vimeo, etc.)"
          required
          className={!validateVideoUrl() ? 'border-red-500' : ''}
        />
        {!validateVideoUrl() && (
          <p className="text-red-500 text-sm mt-1">
            URL não parece ser válida para o provedor selecionado
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="duration">Duração (em segundos)</Label>
        <Input
          id="duration"
          name="duration"
          type="number"
          min="0"
          value={formData.duration}
          onChange={handleChange}
          placeholder="Duração do vídeo em segundos"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPremium"
          checked={formData.isPremium}
          onCheckedChange={(checked) => handleSwitchChange('isPremium', checked)}
        />
        <Label htmlFor="isPremium" className="cursor-pointer">
          Conteúdo Premium
        </Label>
      </div>

      <div>
        <Label htmlFor="thumbnail">Imagem de Capa</Label>
        <Input
          id="thumbnail"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1"
        />
        {(initialData?.thumbnailUrl || formData.thumbnailUrl) && !formData.thumbnail && (
          <div className="mt-2">
            <p className="text-sm text-neutral-500 mb-1">Imagem atual:</p>
            <img
              src={initialData?.thumbnailUrl || formData.thumbnailUrl}
              alt="Thumbnail atual"
              className="w-32 h-24 object-cover rounded-md"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !validateVideoUrl()}>
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Aula' : 'Criar Aula'}
        </Button>
      </div>
    </form>
  );
};

// Componente de cartão para módulo
const ModuleCard = ({ 
  module, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onManageLessons
}: { 
  module: CourseModule; 
  onEdit: () => void; 
  onDelete: () => void;
  onToggleActive: () => void;
  onManageLessons: () => void;
}) => {
  const levelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado"
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{module.title}</CardTitle>
            <CardDescription className="line-clamp-2">{module.description}</CardDescription>
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            {module.isPremium && (
              <div className="p-1 bg-amber-100 rounded text-amber-700">
                <Crown size={16} />
              </div>
            )}
            <div className={`p-1 rounded ${module.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {module.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-neutral-600 mb-1">
          <span className="font-medium">Nível:</span>
          <span className="ml-2">{levelLabels[module.level]}</span>
        </div>
        <div className="flex items-center text-sm text-neutral-600 mb-1">
          <span className="font-medium">Aulas:</span>
          <span className="ml-2">{module.totalLessons || 0}</span>
        </div>
        <div className="flex items-center text-sm text-neutral-600">
          <span className="font-medium">Ordem:</span>
          <span className="ml-2">{module.order}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-1">
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={onManageLessons}
        >
          <Layers className="mr-2 h-4 w-4" />
          Gerenciar Aulas
        </Button>
        <div className="flex space-x-1 ml-2">
          <Button variant="outline" size="icon" onClick={onToggleActive}>
            {module.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Componente de cartão para lição
const LessonCard = ({ 
  lesson, 
  onEdit, 
  onDelete,
}: { 
  lesson: CourseLesson; 
  onEdit: () => void; 
  onDelete: () => void;
}) => {
  // Formato de duração hh:mm:ss
  const formatDuration = (seconds: number = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    
    return h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{lesson.title}</CardTitle>
            <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
          </div>
          {lesson.isPremium && (
            <div className="p-1 bg-amber-100 rounded text-amber-700">
              <Crown size={16} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-neutral-600 mb-1">
          <span className="font-medium">Plataforma:</span>
          <span className="ml-2 capitalize">{lesson.videoProvider}</span>
        </div>
        {lesson.duration && (
          <div className="flex items-center text-sm text-neutral-600 mb-1">
            <span className="font-medium">Duração:</span>
            <span className="ml-2">{formatDuration(lesson.duration)}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-neutral-600">
          <span className="font-medium">Ordem:</span>
          <span className="ml-2">{lesson.order}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <div className="flex space-x-2 w-full">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="flex-1"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Página principal de gerenciamento de cursos
export default function GerenciarCursosPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('modules');
  
  // Estados para modal de criar/editar módulo
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  
  // Estados para modal de criar/editar lição
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  
  // Estados para visualizar lições de um módulo específico
  const [viewingModuleLessons, setViewingModuleLessons] = useState<CourseModule | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterPremium, setFilterPremium] = useState<'all' | 'premium' | 'free'>('all');

  // Buscar todos os módulos
  const { 
    data: modules,
    isLoading: isLoadingModules,
    error: modulesError
  } = useQuery({
    queryKey: ['/api/courses/modules'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/courses/modules');
      return await res.json();
    }
  });

  // Buscar lições de um módulo quando selecionado
  const {
    data: lessons,
    isLoading: isLoadingLessons,
    error: lessonsError,
    refetch: refetchLessons
  } = useQuery({
    queryKey: ['/api/courses/modules', selectedModuleId, 'lessons'],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      const res = await apiRequest('GET', `/api/courses/modules/${selectedModuleId}/lessons`);
      return await res.json();
    },
    enabled: !!selectedModuleId
  });

  // Mutação para criar módulo
  const createModuleMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest(
        'POST',
        '/api/courses/modules',
        data,
        {
          'Content-Type': 'multipart/form-data',
        }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Módulo criado com sucesso',
        description: 'O novo módulo foi adicionado corretamente.',
      });
      setIsAddModuleOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/courses/modules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar módulo',
        description: error.message || 'Ocorreu um erro ao criar o módulo. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Mutação para atualizar módulo
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const res = await apiRequest(
        'PUT',
        `/api/courses/modules/${id}`,
        data,
        {
          'Content-Type': 'multipart/form-data',
        }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Módulo atualizado com sucesso',
        description: 'As alterações foram salvas corretamente.',
      });
      setEditingModule(null);
      queryClient.invalidateQueries({ queryKey: ['/api/courses/modules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar módulo',
        description: error.message || 'Ocorreu um erro ao atualizar o módulo. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Mutação para excluir módulo
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/courses/modules/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Módulo excluído com sucesso',
        description: 'O módulo foi removido corretamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses/modules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir módulo',
        description: error.message || 'Ocorreu um erro ao excluir o módulo. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Toggle ativação/desativação de módulo
  const toggleModuleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PUT', `/api/courses/modules/${id}`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Status do módulo alterado com sucesso',
        description: 'O status de ativação do módulo foi alterado corretamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses/modules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar status do módulo',
        description: error.message || 'Ocorreu um erro ao alterar o status do módulo.',
        variant: 'destructive'
      });
    }
  });

  // Mutação para criar lição
  const createLessonMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const moduleId = data.get('moduleId');
      const res = await apiRequest(
        'POST',
        `/api/courses/modules/${moduleId}/lessons`,
        data,
        {
          'Content-Type': 'multipart/form-data',
        }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Aula criada com sucesso',
        description: 'A nova aula foi adicionada corretamente.',
      });
      setIsAddLessonOpen(false);
      if (selectedModuleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/courses/modules', selectedModuleId, 'lessons'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar aula',
        description: error.message || 'Ocorreu um erro ao criar a aula. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Mutação para atualizar lição
  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const res = await apiRequest(
        'PUT',
        `/api/courses/lessons/${id}`,
        data,
        {
          'Content-Type': 'multipart/form-data',
        }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Aula atualizada com sucesso',
        description: 'As alterações foram salvas corretamente.',
      });
      setEditingLesson(null);
      if (selectedModuleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/courses/modules', selectedModuleId, 'lessons'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar aula',
        description: error.message || 'Ocorreu um erro ao atualizar a aula. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Mutação para excluir lição
  const deleteLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/cursos/lessons/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Aula excluída com sucesso',
        description: 'A aula foi removida corretamente.',
      });
      if (selectedModuleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/cursos/modules', selectedModuleId, 'lessons'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir aula',
        description: error.message || 'Ocorreu um erro ao excluir a aula. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Manipuladores para módulos
  const handleAddModule = (data: FormData) => {
    createModuleMutation.mutate(data);
  };

  const handleEditModule = (data: FormData) => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data });
    }
  };

  const handleDeleteModule = (id: number) => {
    deleteModuleMutation.mutate(id);
  };

  const handleToggleModuleActive = (module: CourseModule) => {
    toggleModuleActiveMutation.mutate({ 
      id: module.id, 
      isActive: !module.isActive 
    });
  };

  const handleManageLessons = (module: CourseModule) => {
    setViewingModuleLessons(module);
    setSelectedModuleId(module.id);
    setActiveTab('lessons');
  };

  // Manipuladores para lições
  const handleAddLesson = (data: FormData) => {
    createLessonMutation.mutate(data);
  };

  const handleEditLesson = (data: FormData) => {
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data });
    }
  };

  const handleDeleteLesson = (id: number) => {
    deleteLessonMutation.mutate(id);
  };

  // Filtrar módulos
  const filteredModules = modules ? modules.filter((module: CourseModule) => {
    // Filtrar por termo de busca
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por status ativo
    let matchesActive = true;
    if (filterActive === 'active') matchesActive = module.isActive;
    if (filterActive === 'inactive') matchesActive = !module.isActive;
    
    // Filtrar por status premium
    let matchesPremium = true;
    if (filterPremium === 'premium') matchesPremium = module.isPremium;
    if (filterPremium === 'free') matchesPremium = !module.isPremium;
    
    return matchesSearch && matchesActive && matchesPremium;
  }) : [];
  
  // Ordenar módulos
  const sortedModules = [...filteredModules].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.order - b.order;
    } else {
      return b.order - a.order;
    }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Gerenciar Cursos | DesignAuto</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Videoaulas</h1>
          <p className="text-neutral-600">Gerencie módulos, aulas e conteúdo educacional</p>
        </div>
        
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button variant="outline" onClick={() => setLocation('/admin')}>
            Voltar ao Dashboard
          </Button>
          <Button onClick={() => setLocation('/cursos')}>
            Ver Página de Cursos
          </Button>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modules">Gerenciar Módulos</TabsTrigger>
          <TabsTrigger value="lessons" disabled={!viewingModuleLessons}>
            {viewingModuleLessons ? `Aulas: ${viewingModuleLessons.title}` : 'Gerenciar Aulas'}
          </TabsTrigger>
        </TabsList>
        
        {/* Aba de Módulos */}
        <TabsContent value="modules">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Buscar módulos..."
                  className="pl-9 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <Select
                  value={filterActive}
                  onValueChange={(value: any) => setFilterActive(value)}
                >
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={filterPremium}
                  onValueChange={(value: any) => setFilterPremium(value)}
                >
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="free">Gratuitos</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={sortOrder === 'asc' ? 'Ordenação crescente' : 'Ordenação decrescente'}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button onClick={() => {
              setEditingModule(null);
              setIsAddModuleOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Módulo
            </Button>
          </div>
          
          {isLoadingModules ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : modulesError ? (
            <div className="text-center py-12">
              <p className="text-red-500">Erro ao carregar módulos</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/cursos/modules/admin'] })}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedModules.length > 0 ? (
                sortedModules.map((module: CourseModule) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onEdit={() => {
                      setEditingModule(module);
                      setIsAddModuleOpen(true);
                    }}
                    onDelete={() => handleDeleteModule(module.id)}
                    onToggleActive={() => handleToggleModuleActive(module)}
                    onManageLessons={() => handleManageLessons(module)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                  <Layers className="mx-auto h-10 w-10 text-neutral-400 mb-3" />
                  <h3 className="text-lg font-medium text-neutral-700">Nenhum módulo encontrado</h3>
                  <p className="text-neutral-500 mt-1">
                    {searchTerm || filterActive !== 'all' || filterPremium !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Clique em "Novo Módulo" para começar'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Modal para adicionar/editar módulo */}
          <AlertDialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {editingModule ? 'Editar Módulo' : 'Adicionar Novo Módulo'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {editingModule 
                    ? 'Edite as informações do módulo abaixo.'
                    : 'Preencha os campos abaixo para criar um novo módulo de curso.'
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <ModuleForm
                initialData={editingModule || undefined}
                onSubmit={editingModule ? handleEditModule : handleAddModule}
                onCancel={() => setIsAddModuleOpen(false)}
                isSubmitting={createModuleMutation.isPending || updateModuleMutation.isPending}
              />
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
        
        {/* Aba de Lições */}
        <TabsContent value="lessons">
          {viewingModuleLessons && (
            <>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setActiveTab('modules');
                      setViewingModuleLessons(null);
                    }}
                  >
                    Voltar aos Módulos
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold">{viewingModuleLessons.title}</h2>
                    <p className="text-sm text-neutral-500">
                      {viewingModuleLessons.isPremium ? 'Conteúdo Premium' : 'Conteúdo Gratuito'}
                    </p>
                  </div>
                </div>
                
                <Button onClick={() => {
                  setEditingLesson(null);
                  setIsAddLessonOpen(true);
                }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Aula
                </Button>
              </div>
              
              {isLoadingLessons ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
              ) : lessonsError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Erro ao carregar aulas</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => refetchLessons()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessons && lessons.length > 0 ? (
                    lessons
                      .sort((a: CourseLesson, b: CourseLesson) => a.order - b.order)
                      .map((lesson: CourseLesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          onEdit={() => {
                            setEditingLesson(lesson);
                            setIsAddLessonOpen(true);
                          }}
                          onDelete={() => handleDeleteLesson(lesson.id)}
                        />
                      ))
                  ) : (
                    <div className="col-span-full text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                      <FileEdit className="mx-auto h-10 w-10 text-neutral-400 mb-3" />
                      <h3 className="text-lg font-medium text-neutral-700">Nenhuma aula encontrada</h3>
                      <p className="text-neutral-500 mt-1">
                        Clique em "Nova Aula" para adicionar conteúdo a este módulo
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Modal para adicionar/editar lição */}
              <AlertDialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
                <AlertDialogContent className="max-w-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {editingLesson ? 'Editar Aula' : 'Adicionar Nova Aula'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {editingLesson 
                        ? 'Edite as informações da aula abaixo.'
                        : 'Preencha os campos abaixo para criar uma nova aula para este módulo.'
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <LessonForm
                    initialData={editingLesson || undefined}
                    moduleId={viewingModuleLessons.id}
                    onSubmit={editingLesson ? handleEditLesson : handleAddLesson}
                    onCancel={() => setIsAddLessonOpen(false)}
                    isSubmitting={createLessonMutation.isPending || updateLessonMutation.isPending}
                  />
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}