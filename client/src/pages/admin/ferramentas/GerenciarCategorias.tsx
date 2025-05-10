import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit, Trash2, Search, Loader2, ArrowUpDown } from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FerramentaCategoria } from '@shared/schema';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

// Schema para validação do formulário
const categoriaSchema = z.object({
  nome: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  ordem: z.number().int().min(0, "Ordem deve ser um número positivo"),
  ativo: z.boolean().default(true)
});

type CategoriaFormValues = z.infer<typeof categoriaSchema>;

const GerenciarCategorias: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estado para busca de categorias
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para ordenação
  const [sortField, setSortField] = useState<'nome' | 'ordem'>('ordem');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Estados para controle de modais
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<FerramentaCategoria | null>(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState<FerramentaCategoria | null>(null);

  // Buscar categorias
  const { data: categorias, isLoading, error } = useQuery({
    queryKey: ['/api/ferramentas/categorias'],
    queryFn: async () => {
      const response = await fetch('/api/ferramentas/categorias');
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
      }
      return response.json() as Promise<FerramentaCategoria[]>;
    }
  });

  // Filtrar categorias pelo termo de busca
  const categoriasFiltradas = categorias?.filter(categoria => 
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (categoria.descricao && categoria.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Ordenar categorias
  const categoriasOrdenadas = [...categoriasFiltradas].sort((a, b) => {
    const fieldA = sortField === 'nome' ? a.nome.toLowerCase() : a.ordem || 0;
    const fieldB = sortField === 'nome' ? b.nome.toLowerCase() : b.ordem || 0;
    
    if (sortField === 'nome') {
      return sortDirection === 'asc' 
        ? String(fieldA).localeCompare(String(fieldB))
        : String(fieldB).localeCompare(String(fieldA));
    } else {
      return sortDirection === 'asc' 
        ? Number(fieldA) - Number(fieldB)
        : Number(fieldB) - Number(fieldA);
    }
  });

  // Toggle ordenação
  const handleToggleSort = (field: 'nome' | 'ordem') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form para adicionar categoria
  const addForm = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      icone: '',
      ordem: 0,
      ativo: true
    }
  });

  // Form para editar categoria
  const editForm = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      icone: '',
      ordem: 0,
      ativo: true
    }
  });

  // Mutation para adicionar categoria
  const addCategoriaMutation = useMutation({
    mutationFn: async (data: CategoriaFormValues) => {
      const res = await apiRequest('POST', '/api/admin/ferramentas/categorias', data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao criar categoria');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso",
      });
      addForm.reset();
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para editar categoria
  const editCategoriaMutation = useMutation({
    mutationFn: async (data: CategoriaFormValues & { id: number }) => {
      const { id, ...formData } = data;
      const res = await apiRequest('PUT', `/api/admin/ferramentas/categorias/${id}`, formData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao atualizar categoria');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso",
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setCategoriaToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir categoria
  const deleteCategoriaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/ferramentas/categorias/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao excluir categoria');
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setCategoriaToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleAddSubmit = (data: CategoriaFormValues) => {
    addCategoriaMutation.mutate(data);
  };

  const handleEditSubmit = (data: CategoriaFormValues) => {
    if (categoriaToEdit) {
      editCategoriaMutation.mutate({ ...data, id: categoriaToEdit.id });
    }
  };

  const handleEdit = (categoria: FerramentaCategoria) => {
    setCategoriaToEdit(categoria);
    editForm.reset({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      icone: categoria.icone || '',
      ordem: categoria.ordem || 0,
      ativo: categoria.ativo
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (categoria: FerramentaCategoria) => {
    setCategoriaToDelete(categoria);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoriaToDelete) {
      deleteCategoriaMutation.mutate(categoriaToDelete.id);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar categorias: {error instanceof Error ? error.message : 'Erro desconhecido'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar categorias..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Categoria</DialogTitle>
            </DialogHeader>
            
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da categoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição da categoria" 
                          className="resize-none" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="icone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome do ícone (Lucide React)" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          value={field.value?.toString() || '0'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addCategoriaMutation.isPending}>
                    {addCategoriaMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Adicionar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : categoriasOrdenadas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm ? 'Nenhuma categoria encontrada com esse termo.' : 'Nenhuma categoria cadastrada.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleToggleSort('nome')}>
                  <div className="flex items-center">
                    Nome
                    {sortField === 'nome' && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ícone</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleToggleSort('ordem')}>
                  <div className="flex items-center">
                    Ordem
                    {sortField === 'ordem' && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriasOrdenadas.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell>{categoria.id}</TableCell>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
                  <TableCell className="max-w-xs truncate">{categoria.descricao || '-'}</TableCell>
                  <TableCell>{categoria.icone || '-'}</TableCell>
                  <TableCell>{categoria.ordem}</TableCell>
                  <TableCell>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      categoria.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {categoria.ativo ? 'Ativo' : 'Inativo'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(categoria)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(categoria)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição da categoria" 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="icone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome do ícone (Lucide React)" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="ordem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value?.toString() || '0'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editCategoriaMutation.isPending}>
                  {editCategoriaMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria &quot;{categoriaToDelete?.nome}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteCategoriaMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCategoriaMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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