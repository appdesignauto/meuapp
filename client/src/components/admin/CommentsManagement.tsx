import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDistance, subDays, parseISO, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Star,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Calendar,
  ThumbsUp,
  User,
  BookOpen,
  FileText,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Definição das interfaces para tipagem
interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  lessonId: number;
  likes: number;
  isHidden: boolean;
  username: string;
  name: string | null;
  profileImageUrl: string | null;
  lessonTitle: string;
  moduleName: string;
}

// Funções utilitárias 
const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const formatRelativeDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { 
      addSuffix: true,
      locale: ptBR
    });
  } catch (error) {
    return 'Data desconhecida';
  }
};

// Interface para filtros avançados
interface AdvancedFilters {
  dateRange: {
    enabled: boolean;
    days: number;
  };
  likesCount: {
    enabled: boolean;
    min: number;
    max: number;
  };
  modules: {
    enabled: boolean;
    selected: string[];
  };
  users: {
    enabled: boolean;
    selected: string[];
  };
}

const CommentsManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'hidden' | 'visible'>('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  
  // Estados para filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateRange: {
      enabled: false,
      days: 7,
    },
    likesCount: {
      enabled: false,
      min: 0,
      max: 10
    },
    modules: {
      enabled: false,
      selected: []
    },
    users: {
      enabled: false,
      selected: []
    }
  });
  
  // Consulta para obter todos os comentários
  const { 
    data: comments, 
    isLoading, 
    error,
    refetch,
    isRefetching
  } = useQuery<Comment[]>({
    queryKey: ['/api/video-comments/admin', filter],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/video-comments/admin?filter=${filter}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar comentários');
      }
      return response.json();
    }
  });

  // Mutação para alternar visibilidade de um comentário
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ commentId, isHidden }: { commentId: number, isHidden: boolean }) => {
      const response = await apiRequest('PATCH', `/api/video-comments/${commentId}/visibility`, {
        isHidden
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar comentário');
      }
      return response.json();
    },
    onSuccess: (_, params) => {
      // Obter comentário para saber a qual aula ele pertence
      const comment = comments?.find(c => c.id === params.commentId);
      
      if (comment) {
        // Disparar evento de sincronização para atualizar a página de videoaulas
        import('@/lib/queryClient').then(({ triggerCommentSyncEvent }) => {
          triggerCommentSyncEvent({
            type: params.isHidden ? 'hide' : 'show',
            commentId: comment.id,
            lessonId: comment.lessonId,
            timestamp: Date.now()
          });
        });
      }
      
      // Invalidar consulta do painel admin
      queryClient.invalidateQueries({ queryKey: ['/api/video-comments/admin'] });
      
      toast({
        title: 'Comentário atualizado',
        description: 'A visibilidade do comentário foi alterada com sucesso.',
      });
      setSelectedComment(null);
      setIsViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar comentário',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });

  // Mutação para excluir comentário
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest('DELETE', `/api/video-comments/${commentId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir comentário');
      }
      return response.json();
    },
    onSuccess: (_, commentId) => {
      // Obter comentário excluído para saber a qual aula ele pertencia
      const deletedComment = comments?.find(c => c.id === commentId);
      
      if (deletedComment) {
        // Disparar evento de sincronização para atualizar a página de videoaulas
        import('@/lib/queryClient').then(({ triggerCommentSyncEvent }) => {
          triggerCommentSyncEvent({
            type: 'delete',
            commentId: deletedComment.id,
            lessonId: deletedComment.lessonId,
            timestamp: Date.now()
          });
        });
      }
      
      // Invalidar consulta do painel admin
      queryClient.invalidateQueries({ queryKey: ['/api/video-comments/admin'] });
      
      toast({
        title: 'Comentário excluído',
        description: 'O comentário foi excluído permanentemente.',
      });
      setSelectedComment(null);
      setIsViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir comentário',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });

  // Função para confirmar exclusão
  const confirmDelete = (commentId: number) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente este comentário? Esta ação não pode ser desfeita.')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  // Função para visualizar detalhes do comentário
  const viewCommentDetails = (comment: Comment) => {
    setSelectedComment(comment);
    setIsViewDialogOpen(true);
  };

  // Filtro por termo de busca
  const passesSearchFilter = (comment: Comment): boolean => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      comment.content.toLowerCase().includes(searchLower) ||
      (comment.name?.toLowerCase() || '').includes(searchLower) ||
      comment.username.toLowerCase().includes(searchLower) ||
      comment.lessonTitle.toLowerCase().includes(searchLower) ||
      comment.moduleName.toLowerCase().includes(searchLower)
    );
  };
  
  // Função para verificar se um comentário passa pelos filtros avançados
  const passesAdvancedFilters = (comment: Comment): boolean => {
    // Filtro por data
    if (advancedFilters.dateRange.enabled) {
      try {
        const commentDate = parseISO(comment.createdAt);
        const cutoffDate = subDays(new Date(), advancedFilters.dateRange.days);
        if (isBefore(commentDate, cutoffDate)) {
          return false;
        }
      } catch (error) {
        console.error("Erro ao processar data:", error);
        // Em caso de erro de formatação da data, vamos considerar que o comentário passa
      }
    }
    
    // Filtro por curtidas
    if (advancedFilters.likesCount.enabled) {
      const { min, max } = advancedFilters.likesCount;
      if (comment.likes < min || comment.likes > max) {
        return false;
      }
    }
    
    // Filtro por módulo
    if (advancedFilters.modules.enabled && advancedFilters.modules.selected.length > 0) {
      if (!advancedFilters.modules.selected.includes(comment.moduleName)) {
        return false;
      }
    }
    
    // Filtro por usuário
    if (advancedFilters.users.enabled && advancedFilters.users.selected.length > 0) {
      if (!advancedFilters.users.selected.includes(comment.username)) {
        return false;
      }
    }
    
    return true;
  };

  // Extrair módulos e usuários únicos dos comentários para filtros avançados
  const uniqueModules = React.useMemo(() => {
    if (!comments) return [];
    return [...new Set(comments.map(comment => comment.moduleName))].sort();
  }, [comments]);
  
  const uniqueUsers = React.useMemo(() => {
    if (!comments) return [];
    return [...new Set(comments.map(comment => comment.username))].sort();
  }, [comments]);
  
  // Aplicar todos os filtros aos comentários
  const filteredComments = React.useMemo(() => {
    if (!comments) return [];
    
    return comments.filter(comment => {
      return passesSearchFilter(comment) && passesAdvancedFilters(comment);
    });
  }, [comments, searchTerm, advancedFilters]);
  
  // Funções para manipular filtros avançados
  const updateDateRange = (enabled: boolean, days?: number) => {
    setAdvancedFilters(prev => ({
      ...prev,
      dateRange: {
        enabled,
        days: days !== undefined ? days : prev.dateRange.days
      }
    }));
  };
  
  const updateLikesRange = (enabled: boolean, min?: number, max?: number) => {
    setAdvancedFilters(prev => ({
      ...prev,
      likesCount: {
        enabled,
        min: min !== undefined ? min : prev.likesCount.min,
        max: max !== undefined ? max : prev.likesCount.max
      }
    }));
  };
  
  const updateModuleFilter = (enabled: boolean, modules?: string[]) => {
    setAdvancedFilters(prev => ({
      ...prev,
      modules: {
        enabled,
        selected: modules || prev.modules.selected
      }
    }));
  };
  
  const updateUserFilter = (enabled: boolean, users?: string[]) => {
    setAdvancedFilters(prev => ({
      ...prev,
      users: {
        enabled,
        selected: users || prev.users.selected
      }
    }));
  };
  
  const toggleModuleSelection = (moduleName: string) => {
    setAdvancedFilters(prev => {
      const isSelected = prev.modules.selected.includes(moduleName);
      const newSelected = isSelected
        ? prev.modules.selected.filter(m => m !== moduleName)
        : [...prev.modules.selected, moduleName];
        
      return {
        ...prev,
        modules: {
          ...prev.modules,
          selected: newSelected
        }
      };
    });
  };
  
  const toggleUserSelection = (username: string) => {
    setAdvancedFilters(prev => {
      const isSelected = prev.users.selected.includes(username);
      const newSelected = isSelected
        ? prev.users.selected.filter(u => u !== username)
        : [...prev.users.selected, username];
        
      return {
        ...prev,
        users: {
          ...prev.users,
          selected: newSelected
        }
      };
    });
  };
  
  // Função para verificar se algum filtro avançado está ativo
  const hasActiveAdvancedFilters = advancedFilters.dateRange.enabled || 
                                  advancedFilters.likesCount.enabled || 
                                  (advancedFilters.modules.enabled && advancedFilters.modules.selected.length > 0) ||
                                  (advancedFilters.users.enabled && advancedFilters.users.selected.length > 0);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar comentários</AlertTitle>
          <AlertDescription>
            {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-6">
        <Popover open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant={hasActiveAdvancedFilters ? "default" : "outline"} 
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Filter className="h-4 w-4" />
              Filtros Avançados
              {hasActiveAdvancedFilters && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {(advancedFilters.dateRange.enabled ? 1 : 0) + 
                   (advancedFilters.likesCount.enabled ? 1 : 0) + 
                   (advancedFilters.modules.enabled && advancedFilters.modules.selected.length > 0 ? 1 : 0) +
                   (advancedFilters.users.enabled && advancedFilters.users.selected.length > 0 ? 1 : 0)}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-5" align="start">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filtros Avançados</h4>
              
              {/* Filtro por Data */}
              <div className="border border-border rounded-md p-3 pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h5 className="text-sm font-medium">Filtrar por data</h5>
                  </div>
                  <Checkbox 
                    checked={advancedFilters.dateRange.enabled}
                    onCheckedChange={(checked) => updateDateRange(checked === true)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Período: Últimos {advancedFilters.dateRange.days} dias</span>
                  </div>
                  <Slider 
                    min={1}
                    max={30}
                    step={1}
                    value={[advancedFilters.dateRange.days]}
                    onValueChange={(value) => updateDateRange(advancedFilters.dateRange.enabled, value[0])}
                    disabled={!advancedFilters.dateRange.enabled}
                  />
                </div>
              </div>
              
              {/* Filtro por Curtidas */}
              <div className="border border-border rounded-md p-3 pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                    <h5 className="text-sm font-medium">Filtrar por curtidas</h5>
                  </div>
                  <Checkbox 
                    checked={advancedFilters.likesCount.enabled}
                    onCheckedChange={(checked) => updateLikesRange(checked === true)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Entre {advancedFilters.likesCount.min} e {advancedFilters.likesCount.max} curtidas</span>
                  </div>
                  <Slider 
                    min={0}
                    max={50}
                    step={1}
                    value={[advancedFilters.likesCount.min, advancedFilters.likesCount.max]}
                    onValueChange={(value) => updateLikesRange(advancedFilters.likesCount.enabled, value[0], value[1])}
                    disabled={!advancedFilters.likesCount.enabled}
                  />
                </div>
              </div>
              
              {/* Filtro por Módulo */}
              <div className="border border-border rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <h5 className="text-sm font-medium">Filtrar por módulo</h5>
                  </div>
                  <Checkbox 
                    checked={advancedFilters.modules.enabled}
                    onCheckedChange={(checked) => updateModuleFilter(checked === true)}
                  />
                </div>
                {uniqueModules.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto p-1 space-y-1.5">
                    {uniqueModules.map(moduleName => (
                      <div key={moduleName} className="flex items-center gap-2">
                        <Checkbox 
                          id={`module-${moduleName}`}
                          disabled={!advancedFilters.modules.enabled}
                          checked={advancedFilters.modules.selected.includes(moduleName)}
                          onCheckedChange={() => toggleModuleSelection(moduleName)}
                        />
                        <Label 
                          htmlFor={`module-${moduleName}`} 
                          className="text-xs hover:cursor-pointer"
                        >
                          {moduleName}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-xs text-muted-foreground">Nenhum módulo disponível</span>
                  </div>
                )}
              </div>
              
              {/* Filtro por Usuário */}
              <div className="border border-border rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h5 className="text-sm font-medium">Filtrar por usuário</h5>
                  </div>
                  <Checkbox 
                    checked={advancedFilters.users.enabled}
                    onCheckedChange={(checked) => updateUserFilter(checked === true)}
                  />
                </div>
                {uniqueUsers.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto p-1 space-y-1.5">
                    {uniqueUsers.map(username => (
                      <div key={username} className="flex items-center gap-2">
                        <Checkbox 
                          id={`user-${username}`}
                          disabled={!advancedFilters.users.enabled}
                          checked={advancedFilters.users.selected.includes(username)}
                          onCheckedChange={() => toggleUserSelection(username)}
                        />
                        <Label 
                          htmlFor={`user-${username}`} 
                          className="text-xs hover:cursor-pointer"
                        >
                          {username}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-xs text-muted-foreground">Nenhum usuário disponível</span>
                  </div>
                )}
              </div>
              
              {/* Botões de ação */}
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setAdvancedFilters({
                      dateRange: { enabled: false, days: 7 },
                      likesCount: { enabled: false, min: 0, max: 10 },
                      modules: { enabled: false, selected: [] },
                      users: { enabled: false, selected: [] }
                    });
                  }}
                >
                  Limpar filtros
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setIsAdvancedFiltersOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="flex items-center gap-2">
          {hasActiveAdvancedFilters && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setAdvancedFilters({
                  dateRange: { enabled: false, days: 7 },
                  likesCount: { enabled: false, min: 0, max: 10 },
                  modules: { enabled: false, selected: [] },
                  users: { enabled: false, selected: [] }
                });
              }}
              className="flex items-center gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          )}
          <Button 
            variant={isRefetching ? "default" : "outline"}
            size="sm" 
            onClick={() => refetch()}
            className="flex items-center gap-1.5"
            disabled={isRefetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-primary-foreground' : ''}`} />
            {isRefetching ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Pesquisar comentários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            prefix={<Search className="h-4 w-4 text-gray-400 mr-2" />}
          />
        </div>
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as 'all' | 'hidden' | 'visible')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os comentários</SelectItem>
            <SelectItem value="visible">Visíveis</SelectItem>
            <SelectItem value="hidden">Ocultos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredComments?.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum comentário encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm
              ? 'Tente ajustar os termos de busca para encontrar o que procura.'
              : filter !== 'all'
                ? `Não há comentários ${filter === 'hidden' ? 'ocultos' : 'visíveis'} no momento.`
                : 'Não há comentários disponíveis para moderação.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments?.map(comment => (
            <Card key={comment.id} className={comment.isHidden ? 'opacity-70' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={comment.profileImageUrl || ''} alt={comment.name || comment.username} />
                      <AvatarFallback>{getInitials(comment.name || comment.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{comment.name || comment.username}</h4>
                        <Badge variant="outline" className="text-xs">
                          {comment.username}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatRelativeDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {comment.isHidden && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Oculto
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="4" cy="12" r="1" />
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="20" cy="12" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewCommentDetails(comment)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleVisibilityMutation.mutate({ 
                            commentId: comment.id, 
                            isHidden: !comment.isHidden 
                          })}
                          disabled={toggleVisibilityMutation.isPending}
                          className={toggleVisibilityMutation.isPending ? "opacity-70" : ""}
                        >
                          {comment.isHidden ? (
                            <>
                              <Eye className={`mr-2 h-4 w-4 ${toggleVisibilityMutation.isPending ? "animate-pulse" : ""}`} />
                              {toggleVisibilityMutation.isPending && comment.id === toggleVisibilityMutation.variables?.commentId ? "Processando..." : "Tornar visível"}
                            </>
                          ) : (
                            <>
                              <EyeOff className={`mr-2 h-4 w-4 ${toggleVisibilityMutation.isPending ? "animate-pulse" : ""}`} />
                              {toggleVisibilityMutation.isPending && comment.id === toggleVisibilityMutation.variables?.commentId ? "Processando..." : "Ocultar comentário"}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => confirmDelete(comment.id)}
                          className={`text-red-600 ${deleteCommentMutation.isPending ? "opacity-70" : ""}`}
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 className={`mr-2 h-4 w-4 ${deleteCommentMutation.isPending ? "animate-pulse" : ""}`} />
                          {deleteCommentMutation.isPending && comment.id === deleteCommentMutation.variables ? "Excluindo..." : "Excluir"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  {comment.content.length > 150 
                    ? `${comment.content.substring(0, 150)}...` 
                    : comment.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    {comment.lessonTitle}
                  </Badge>
                  <span className="mx-0.5">•</span>
                  <span>{comment.moduleName}</span>
                  <span className="mx-0.5">•</span>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    {comment.likes || 0} curtidas
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de visualização detalhada */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Comentário</DialogTitle>
            <DialogDescription>
              Visualize e modere o comentário selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedComment && (
            <>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedComment.profileImageUrl || ''} alt={selectedComment.name || selectedComment.username} />
                    <AvatarFallback>{getInitials(selectedComment.name || selectedComment.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">{selectedComment.name || selectedComment.username}</h4>
                    <p className="text-sm text-gray-500">
                      @{selectedComment.username} • {formatRelativeDate(selectedComment.createdAt)}
                    </p>
                  </div>
                  {selectedComment.isHidden && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Oculto
                    </Badge>
                  )}
                </div>

                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <p className="text-gray-800 whitespace-pre-line">{selectedComment.content}</p>
                </div>

                <div className="bg-gray-100 p-3 rounded-md">
                  <h5 className="text-sm font-medium mb-1">Informações adicionais</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Aula:</span>
                      <div className="font-medium">{selectedComment.lessonTitle}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Módulo:</span>
                      <div className="font-medium">{selectedComment.moduleName}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">ID do usuário:</span>
                      <div className="font-medium">{selectedComment.userId}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Curtidas:</span>
                      <div className="font-medium">{selectedComment.likes || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => confirmDelete(selectedComment.id)}
                    disabled={deleteCommentMutation.isPending}
                  >
                    <Trash2 className={`mr-2 h-4 w-4 ${deleteCommentMutation.isPending ? "animate-pulse" : ""}`} />
                    {deleteCommentMutation.isPending && selectedComment.id === deleteCommentMutation.variables ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedComment.isHidden ? "default" : "outline"}
                    onClick={() => toggleVisibilityMutation.mutate({ 
                      commentId: selectedComment.id, 
                      isHidden: !selectedComment.isHidden 
                    })}
                    disabled={toggleVisibilityMutation.isPending}
                  >
                    {selectedComment.isHidden ? (
                      <>
                        <Eye className={`mr-2 h-4 w-4 ${toggleVisibilityMutation.isPending ? "animate-pulse" : ""}`} />
                        {toggleVisibilityMutation.isPending && selectedComment.id === toggleVisibilityMutation.variables?.commentId ? "Processando..." : "Tornar Visível"}
                      </>
                    ) : (
                      <>
                        <EyeOff className={`mr-2 h-4 w-4 ${toggleVisibilityMutation.isPending ? "animate-pulse" : ""}`} />
                        {toggleVisibilityMutation.isPending && selectedComment.id === toggleVisibilityMutation.variables?.commentId ? "Processando..." : "Ocultar"}
                      </>
                    )}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Fechar
                    </Button>
                  </DialogClose>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentsManagement;