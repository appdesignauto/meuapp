import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PlusCircle, Pencil, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';

interface Categoria {
  id: number;
  nome: string;
  slug: string;
  destaque: boolean;
  ordem: number;
}

const GerenciarCategorias: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Categoria>>({
    nome: '',
    destaque: false,
    ordem: 0
  });
  const [categoriaToDelete, setCategoriaToDelete] = useState<number | null>(null);

  // Consulta para buscar categorias
  const { data: categorias, isLoading, isError } = useQuery({
    queryKey: ['/api/ferramentas/categorias'],
    staleTime: 1000 * 60, // 1 minuto
  });

  // Mutação para criar/atualizar categoria
  const updateCategoriaMutation = useMutation({
    mutationFn: async (data: Partial<Categoria>) => {
      const url = data.id 
        ? `/api/ferramentas/categorias/${data.id}` 
        : '/api/ferramentas/categorias';
      const method = data.id ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, url, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
      toast({
        title: "Sucesso",
        description: formData.id ? "Categoria atualizada com sucesso" : "Categoria criada com sucesso",
      });
      setIsDialogOpen(false);
      setFormData({ nome: '', destaque: false, ordem: 0 });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao ${formData.id ? 'atualizar' : 'criar'} categoria: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir categoria
  const deleteCategoriaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/ferramentas/categorias/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso",
      });
      setIsAlertDialogOpen(false);
      setCategoriaToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir categoria: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutação para alterar ordem da categoria
  const updateOrdemMutation = useMutation({
    mutationFn: async ({ id, direcao }: { id: number; direcao: 'up' | 'down' }) => {
      const response = await apiRequest('PUT', `/api/ferramentas/categorias/${id}/ordem`, { direcao });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar ordem: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleEditCategoria = (categoria: Categoria) => {
    setFormData(categoria);
    setIsDialogOpen(true);
  };

  const handleDeleteCategoria = (id: number) => {
    setCategoriaToDelete(id);
    setIsAlertDialogOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCategoriaMutation.mutate(formData);
  };

  const handleConfirmDelete = () => {
    if (categoriaToDelete) {
      deleteCategoriaMutation.mutate(categoriaToDelete);
    }
  };

  const handleChangeOrdem = (id: number, direcao: 'up' | 'down') => {
    updateOrdemMutation.mutate({ id, direcao });
  };

  // Renderiza o conteúdo com base no estado de carregamento
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="p-4">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar categorias. Tente novamente mais tarde.</p>
          </CardContent>
        </Card>
      );
    }

    if (!categorias?.length) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="mt-4"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Criar Categoria
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {categorias.map((categoria: Categoria) => (
          <Card key={categoria.id}>
            <div className="flex items-start p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{categoria.nome}</h3>
                  {categoria.destaque && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                      Destaque
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Slug: {categoria.slug} | Ordem: {categoria.ordem}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleChangeOrdem(categoria.id, 'up')}
                  disabled={updateOrdemMutation.isPending}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleChangeOrdem(categoria.id, 'down')}
                  disabled={updateOrdemMutation.isPending}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleEditCategoria(categoria)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleDeleteCategoria(categoria.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Categorias de Ferramentas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as categorias disponíveis para as ferramentas.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {renderContent()}

      {/* Dialog para criar/editar categoria */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Editar' : 'Nova'} Categoria</DialogTitle>
            <DialogDescription>
              {formData.id 
                ? 'Faça as alterações necessárias nos campos abaixo.' 
                : 'Preencha os campos abaixo para criar uma nova categoria.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input 
                  id="nome" 
                  value={formData.nome || ''} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome da categoria"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem de exibição</Label>
                <Input 
                  id="ordem" 
                  type="number"
                  value={formData.ordem || 0} 
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="destaque"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={!!formData.destaque}
                  onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                />
                <Label htmlFor="destaque" className="text-sm">Destacar esta categoria</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateCategoriaMutation.isPending}
              >
                {updateCategoriaMutation.isPending && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {formData.id ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar exclusão */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? 
              Esta ação não pode ser desfeita e também removerá todas as ferramentas associadas a esta categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCategoriaMutation.isPending ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GerenciarCategorias;