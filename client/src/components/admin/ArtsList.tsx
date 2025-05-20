import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Eye, Filter, ArrowUpDown, Plus, UserCircle, Layers } from 'lucide-react';
import { Art } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import ArtForm from './ArtForm';
import SimpleFormMultiDialog from './SimpleFormMultiDialog';
import MultiArtTabsDialog from './MultiArtTabsDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ArtsList = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState<{
    isPremium?: boolean;
    categoryId?: number;
    search?: string;
    isVisible?: boolean;
  }>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArt, setEditingArt] = useState<Art | null>(null);
  const [isMultiArtDialogOpen, setIsMultiArtDialogOpen] = useState(false);
  const [selectedArtId, setSelectedArtId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch arts with pagination and filters
  const { data, isLoading } = useQuery<{
    arts: Art[];
    totalCount: number;
  }>({
    queryKey: ['/api/artes', { page, limit, ...filter }],
  });

  // Fetch categories for filter dropdown
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  // Delete art mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/artes/${id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Falha ao excluir a arte');
      }
      
      return result;
    },
    onSuccess: (data) => {
      // Forçar atualização das consultas de artes para refletir a exclusão
      queryClient.invalidateQueries({ queryKey: ['/api/artes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: ['/api/artes'] });
      
      toast({
        title: 'Arte excluída',
        description: 'A arte foi excluída com sucesso.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      console.error('Erro detalhado ao excluir arte:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao excluir a arte.',
        variant: 'destructive',
      });
    },
  });

  // Toggle premium status mutation
  const togglePremiumMutation = useMutation({
    mutationFn: async ({ id, isPremium }: { id: number; isPremium: boolean }) => {
      await apiRequest('PUT', `/api/admin/arts/${id}`, { isPremium });
    },
    onSuccess: () => {
      // Invalidar apenas a consulta principal que está em uso
      queryClient.invalidateQueries({ queryKey: ['/api/artes'] });
      toast({
        title: 'Status premium atualizado',
        description: 'O status premium da arte foi atualizado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar o status premium.',
        variant: 'destructive',
      });
    },
  });
  
  // Toggle visibility status mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: number; isVisible: boolean }) => {
      await apiRequest('PUT', `/api/admin/arts/${id}/visibility`, { isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/artes'] });
      toast({
        title: 'Visibilidade atualizada',
        description: 'A visibilidade da arte foi atualizada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar visibilidade:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar a visibilidade.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation para atribuir o admin como designer de todas as artes
  const updateDesignersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/update-designers');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      toast({
        title: 'Designers atualizados',
        description: 'Todas as artes foram atribuídas ao usuário administrador como designer.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar os designers.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta arte?')) {
      try {
        // Adiciona tratamento para potenciais erros durante a exclusão
        console.log(`Iniciando exclusão da arte ID: ${id}`);
        await deleteMutation.mutateAsync(id);
        
        // Forçar a atualização da lista após exclusão bem-sucedida
        console.log(`Arte ID: ${id} excluída com sucesso`);
        
        // Remover manualmente da lista local se necessário
        queryClient.setQueryData(['/api/artes'], (oldData: any) => {
          if (!oldData || !oldData.arts) return oldData;
          
          return {
            ...oldData,
            arts: oldData.arts.filter((art: Art) => art.id !== id)
          };
        });
        
        // Recarregar dados após exclusão
        queryClient.invalidateQueries({ queryKey: ['/api/artes'] });
      } catch (error) {
        console.error(`Falha ao excluir arte ID: ${id}`, error);
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir a arte. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleTogglePremium = (id: number, currentValue: boolean) => {
    togglePremiumMutation.mutate({ id, isPremium: !currentValue });
  };
  
  const handleToggleVisibility = (id: number, currentValue: boolean) => {
    // O valor enviado ao backend deve ser o novo valor desejado
    // Quando currentValue é true, queremos tornar invisible (false)
    // Quando currentValue é false, queremos tornar visible (true)
    console.log(`Alterando visibilidade da arte ${id}: de ${currentValue ? 'visível' : 'oculta'} para ${!currentValue ? 'visível' : 'oculta'}`);
    toggleVisibilityMutation.mutate({ id, isVisible: !currentValue });
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };
  
  const handleAddNew = () => {
    setEditingArt(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (art: Art) => {
    console.log('Editando arte:', art);
    console.log('Grupo ID da arte:', art.groupId);
    
    // Verificar se a arte pertence a um grupo
    if (art.groupId) {
      // Para artes em grupo, abrir o novo diálogo de múltiplas abas
      setSelectedArtId(art.id);
      setIsMultiArtDialogOpen(true);
      console.log(`Arte pertence ao grupo ${art.groupId}, abrindo diálogo de múltiplas abas`);
    } else {
      // Para artes individuais, manter o comportamento original
      setEditingArt(art);
      setIsFormOpen(true);
      console.log(`Arte individual, abrindo formulário padrão`);
    }
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingArt(null);
  };
  
  // Nova função para fechar o diálogo de múltiplas abas
  const handleCloseMultiArtDialog = () => {
    setIsMultiArtDialogOpen(false);
    setSelectedArtId(null);
  };
  
  // Função para atualizar a lista após a edição
  const handleEditComplete = () => {
    // Recarregar dados após a conclusão da edição
    queryClient.invalidateQueries({ queryKey: ['/api/admin/artes'] });
  };

  const arts = data?.arts || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      {/* Filtros e Pesquisa */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Artes</CardTitle>
              <CardDescription>
                Gerencie todas as artes da plataforma.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  if (window.confirm('Deseja realmente atribuir o usuário administrador como designer de todas as artes?')) {
                    updateDesignersMutation.mutate();
                  }
                }}
                disabled={updateDesignersMutation.isPending}
                className="mr-2"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                {updateDesignersMutation.isPending ? 'Atualizando...' : 'Atribuir Designer'}
              </Button>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Arte
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por título</Label>
              <Input
                id="search"
                placeholder="Pesquisar..."
                className="w-full"
                value={filter.search || ''}
                onChange={(e) => setFilter({ ...filter, search: e.target.value || undefined })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={filter.categoryId?.toString() || ''}
                onValueChange={(value) => 
                  setFilter({ 
                    ...filter, 
                    categoryId: value ? parseInt(value) : undefined 
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todas as categorias</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="premium">Premium</Label>
              <Select
                value={filter.isPremium?.toString() || ''}
                onValueChange={(value) => 
                  setFilter({ 
                    ...filter, 
                    isPremium: value === 'true' ? true : value === 'false' ? false : undefined 
                  })
                }
              >
                <SelectTrigger id="premium">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Premium</SelectItem>
                  <SelectItem value="false">Gratuito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visible">Visibilidade</Label>
              <Select
                value={filter.isVisible?.toString() || 'all'}
                onValueChange={(value) => 
                  setFilter({ 
                    ...filter, 
                    isVisible: value === 'true' ? true : value === 'false' ? false : value === 'all' ? undefined : undefined 
                  })
                }
              >
                <SelectTrigger id="visible">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="true">Visíveis</SelectItem>
                  <SelectItem value="false">Ocultas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex items-end">
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setFilter({})}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabela de Resultados */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>
                {totalCount} artes encontradas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setPage(1);
                  setLimit(parseInt(value));
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="25">25 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-25 rounded-full border-t-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[80px]">Imagem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[100px]">Premium</TableHead>
                    <TableHead className="w-[100px]">Visível</TableHead>
                    <TableHead className="w-[100px]">Criado em</TableHead>
                    <TableHead className="w-[100px]">Grupo</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        Nenhuma arte encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    arts.map((art) => (
                      <TableRow key={art.id}>
                        <TableCell className="font-medium">{art.id}</TableCell>
                        <TableCell>
                          <div className="w-10 h-10 overflow-hidden rounded-md">
                            <img 
                              src={art.imageUrl} 
                              alt={art.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{art.title}</TableCell>
                        <TableCell>
                          {categories?.find(c => c.id === art.categoryId)?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {art.format && typeof art.format === 'string' 
                            ? art.format.charAt(0).toUpperCase() + art.format.slice(1) 
                            : art.format}
                        </TableCell>
                        <TableCell>
                          {art.fileType && typeof art.fileType === 'string'
                            ? art.fileType.charAt(0).toUpperCase() + art.fileType.slice(1)
                            : art.fileType}
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={art.isPremium} 
                            onCheckedChange={() => handleTogglePremium(art.id, art.isPremium)}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={art.isVisible === true || art.isVisible === undefined} 
                            onCheckedChange={() => handleToggleVisibility(art.id, art.isVisible === true || art.isVisible === undefined)}
                            aria-label={art.isVisible === false ? "Arte oculta" : "Arte visível"}
                          />
                        </TableCell>
                        <TableCell>{formatDate(art.createdAt)}</TableCell>
                        <TableCell>
                          {art.groupId ? (
                            <div className="flex items-center gap-1">
                              <div className="h-3 w-3 rounded-full bg-green-500"></div>
                              <span className="text-xs text-gray-600" title="Esta arte faz parte de um grupo">Parte de grupo</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => window.open(art.imageUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleEdit(art)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleDelete(art.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {arts.length} de {totalCount} resultados
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(prev => prev + 1)}
              >
                Próxima
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Formulário para adicionar/editar artes individuais */}
      <SimpleFormMultiDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editingArt={editingArt}
        isEditing={!!editingArt}
      />
      
      {/* Novo componente para editar artes em grupo com abas */}
      <MultiArtTabsDialog 
        isOpen={isMultiArtDialogOpen}
        onClose={handleCloseMultiArtDialog}
        artId={selectedArtId}
        onEditComplete={handleEditComplete}
      />
    </>
  );
};

export default ArtsList;