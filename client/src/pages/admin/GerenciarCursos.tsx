import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
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
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
}

const GerenciarCursos = () => {
  const { toast } = useToast();
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
    isPremium: false
  });
  
  // Consultas para obter módulos e aulas
  const { 
    data: modules = [], 
    isLoading: isLoadingModules,
    isError: isModulesError
  } = useQuery({
    queryKey: ['/api/course-modules'],
    queryFn: () => fetch('/api/course-modules').then(res => res.json()),
  });
  
  const { 
    data: lessons = [], 
    isLoading: isLoadingLessons,
    isError: isLessonsError
  } = useQuery({
    queryKey: ['/api/course-lessons'],
    queryFn: () => fetch('/api/course-lessons').then(res => res.json()),
  });

  // Mutations para módulos
  const createModuleMutation = useMutation({
    mutationFn: async (data: CourseModule) => {
      const response = await apiRequest('POST', '/api/course-modules', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-modules'] });
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
      const response = await apiRequest('PUT', `/api/course-modules/${data.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-modules'] });
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
      const response = await apiRequest('DELETE', `/api/course-modules/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir módulo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-modules'] });
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
      const response = await apiRequest('POST', '/api/course-lessons', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-lessons'] });
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
      const response = await apiRequest('PUT', `/api/course-lessons/${data.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-lessons'] });
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
      const response = await apiRequest('DELETE', `/api/course-lessons/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir aula');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/course-lessons'] });
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
  const handleOpenAddLesson = (moduleId: number) => {
    setCurrentLesson(null);
    const moduleLessons = lessons.filter((lesson: CourseLesson) => lesson.moduleId === moduleId);
    setLessonForm({
      moduleId,
      title: '',
      description: '',
      videoUrl: '',
      videoProvider: 'youtube',
      order: moduleLessons.length + 1,
      isPremium: false
    });
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
    const { name, value } = e.target;
    setLessonForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLessonSelectChange = (name: string, value: string) => {
    setLessonForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLessonToggleChange = (name: string, checked: boolean) => {
    setLessonForm(prev => ({ ...prev, [name]: checked }));
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

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
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
                                    <TableHead className="w-12 text-center">#</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead className="hidden md:table-cell">Provider</TableHead>
                                    <TableHead className="hidden md:table-cell">Premium</TableHead>
                                    <TableHead className="w-20"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getLessonsByModule(module.id!).map((lesson: CourseLesson) => (
                                    <TableRow key={lesson.id}>
                                      <TableCell className="text-center font-medium">{lesson.order}</TableCell>
                                      <TableCell>{lesson.title}</TableCell>
                                      <TableCell className="hidden md:table-cell">
                                        {getVideoProviderBadge(lesson.videoProvider)}
                                      </TableCell>
                                      <TableCell className="hidden md:table-cell">
                                        {lesson.isPremium ? 
                                          <Badge variant="secondary">Premium</Badge> : 
                                          <Badge variant="outline">Gratuito</Badge>
                                        }
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-end gap-2">
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
                                            className="text-red-500 hover:text-red-600"
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
                        
                        <div className="px-4 pb-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <Eye className="w-4 h-4 mr-1" /> 
                            <span>Visualizações: {0}</span>
                          </div>
                          <div className="ml-6 flex items-center text-sm text-gray-500">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> 
                            <span>Conclusões: {0}</span>
                          </div>
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
              <h2 className="text-xl font-semibold">Todas as Aulas</h2>
              <div className="flex gap-2 items-center">
                <Select onValueChange={value => setActiveTab('modulos')}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Adicionar aula a um módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module: CourseModule) => (
                      <SelectItem 
                        key={module.id} 
                        value={String(module.id)}
                        onSelect={() => {
                          if (module.id) handleOpenAddLesson(module.id);
                        }}
                      >
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLessonsError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Erro ao carregar aulas. Tente novamente mais tarde.
                </AlertDescription>
              </Alert>
            ) : isLoadingLessons ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-3 border rounded-lg flex items-center">
                    <Skeleton className="h-12 w-12 rounded mr-4" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center p-10 border rounded-lg bg-gray-50">
                <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aula encontrada</h3>
                <p className="text-gray-500 mb-4">Crie módulos e adicione aulas para começar.</p>
                <Button onClick={() => setActiveTab('modulos')}>
                  Ver módulos
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="hidden md:table-cell">Provider</TableHead>
                      <TableHead className="hidden md:table-cell">Premium</TableHead>
                      <TableHead className="hidden md:table-cell">Ordem</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map((lesson: CourseLesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell className="font-medium">{lesson.title}</TableCell>
                        <TableCell>{getModuleName(lesson.moduleId)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {getVideoProviderBadge(lesson.videoProvider)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {lesson.isPremium ? 
                            <Badge variant="secondary">Premium</Badge> : 
                            <Badge variant="outline">Gratuito</Badge>
                          }
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{lesson.order}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
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
                              className="text-red-500 hover:text-red-600"
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
        </Tabs>
      </div>
      
      {/* Dialog para adicionar/editar módulo */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {currentModule ? 'Editar módulo' : 'Adicionar novo módulo'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título do módulo</Label>
              <Input
                id="title"
                name="title"
                value={moduleForm.title}
                onChange={handleModuleFormChange}
                placeholder="Ex: Fundamentos de Design Automotivo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={moduleForm.description}
                onChange={handleModuleFormChange}
                placeholder="Breve descrição sobre o conteúdo do módulo"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnailUrl">URL da miniatura</Label>
              <Input
                id="thumbnailUrl"
                name="thumbnailUrl"
                value={moduleForm.thumbnailUrl}
                onChange={handleModuleFormChange}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="level">Nível</Label>
                <Select 
                  value={moduleForm.level} 
                  name="level"
                  onValueChange={(value) => handleLessonSelectChange("level", value)}
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
              <div className="grid gap-2">
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  value={moduleForm.order}
                  onChange={handleModuleFormChange}
                  min={1}
                />
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={moduleForm.isActive}
                  onCheckedChange={(checked) => handleModuleToggleChange("isActive", checked)}
                />
                <Label htmlFor="isActive">Ativo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPremium"
                  checked={moduleForm.isPremium}
                  onCheckedChange={(checked) => handleModuleToggleChange("isPremium", checked)}
                />
                <Label htmlFor="isPremium">Premium</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleModuleSubmit}
              disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
            >
              {createModuleMutation.isPending || updateModuleMutation.isPending ? (
                <>Salvando...</>
              ) : currentModule ? (
                <>Salvar mudanças</>
              ) : (
                <>Criar módulo</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar exclusão de módulo */}
      <Dialog open={isConfirmDeleteModuleOpen} onOpenChange={setIsConfirmDeleteModuleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Excluir módulo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir o módulo 
              <span className="font-medium"> {currentModule?.title}</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta ação também excluirá todas as aulas associadas a este módulo 
              e não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteModuleOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteModule}
              disabled={deleteModuleMutation.isPending}
            >
              {deleteModuleMutation.isPending ? 'Excluindo...' : 'Excluir módulo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para adicionar/editar aula */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {currentLesson ? 'Editar aula' : 'Adicionar nova aula'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lessonTitle">Título da aula</Label>
              <Input
                id="lessonTitle"
                name="title"
                value={lessonForm.title}
                onChange={handleLessonFormChange}
                placeholder="Ex: Introdução ao Design para Instagram"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lessonDescription">Descrição</Label>
              <Textarea
                id="lessonDescription"
                name="description"
                value={lessonForm.description}
                onChange={handleLessonFormChange}
                placeholder="Breve descrição sobre o conteúdo da aula"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="moduleId">Módulo</Label>
              <Select 
                value={String(lessonForm.moduleId)} 
                onValueChange={(value) => handleLessonSelectChange("moduleId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module: CourseModule) => (
                    <SelectItem key={module.id} value={String(module.id)}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoUrl">URL do vídeo</Label>
              <Input
                id="videoUrl"
                name="videoUrl"
                value={lessonForm.videoUrl}
                onChange={handleLessonFormChange}
                placeholder="https://youtube.com/watch?v=exemplo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="videoProvider">Plataforma do vídeo</Label>
                <Select 
                  value={lessonForm.videoProvider} 
                  onValueChange={(value) => handleLessonSelectChange("videoProvider", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="vturb">vTurb</SelectItem>
                    <SelectItem value="panda">Panda</SelectItem>
                    <SelectItem value="direct">URL Direta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lessonOrder">Ordem</Label>
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
              <Label htmlFor="lessonThumbnailUrl">URL da miniatura (opcional)</Label>
              <Input
                id="lessonThumbnailUrl"
                name="thumbnailUrl"
                value={lessonForm.thumbnailUrl || ''}
                onChange={handleLessonFormChange}
                placeholder="Deixe em branco para usar miniatura padrão do vídeo"
              />
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
            <div className="flex items-center space-x-2">
              <Switch
                id="lessonIsPremium"
                checked={lessonForm.isPremium}
                onCheckedChange={(checked) => handleLessonToggleChange("isPremium", checked)}
              />
              <Label htmlFor="lessonIsPremium">Aula Premium</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleLessonSubmit}
              disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
            >
              {createLessonMutation.isPending || updateLessonMutation.isPending ? (
                <>Salvando...</>
              ) : currentLesson ? (
                <>Salvar mudanças</>
              ) : (
                <>Criar aula</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar exclusão de aula */}
      <Dialog open={isConfirmDeleteLessonOpen} onOpenChange={setIsConfirmDeleteLessonOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Excluir aula</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir a aula 
              <span className="font-medium"> {currentLesson?.title}</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta ação não pode ser desfeita. O progresso dos usuários 
              nesta aula também será removido.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteLessonOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteLesson}
              disabled={deleteLessonMutation.isPending}
            >
              {deleteLessonMutation.isPending ? 'Excluindo...' : 'Excluir aula'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarCursos;