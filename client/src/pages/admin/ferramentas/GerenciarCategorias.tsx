import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Pencil, Trash, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertFerramentaCategoriaSchema } from '@shared/schema';

// Esquema para categorias de ferramentas
const categoriaFormSchema = insertFerramentaCategoriaSchema.extend({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  slug: z.string().min(2, "O slug deve ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  ordem: z.number().int().optional(),
  ativo: z.boolean().default(true),
});

type CategoriaFormValues = z.infer<typeof categoriaFormSchema>;

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  ordem?: number;
  ativo?: boolean;
};

export const GerenciarCategorias: React.FC = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<Categoria | null>(null);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Categoria | null>(null);

  // Buscar todas as categorias
  const { data: categorias, isLoading, error } = useQuery<Categoria[]>({
    queryKey: ['/api/admin/ferramentas/categorias'],
  });

  // Formulário para criar/editar categoria
  const form = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues: {
      nome: '',
      slug: '',
      descricao: '',
      icone: '',
      ordem: 0,
      ativo: true,
    },
  });

  // Resetar formulário ao abrir o diálogo
  const resetFormulario = () => {
    form.reset({
      nome: categoriaEmEdicao?.nome || '',
      slug: categoriaEmEdicao?.slug || '',
      descricao: categoriaEmEdicao?.descricao || '',
      icone: categoriaEmEdicao?.icone || '',
      ordem: categoriaEmEdicao?.ordem || 0,
      ativo: categoriaEmEdicao?.ativo !== undefined ? categoriaEmEdicao.ativo : true,
    });
  };

  // Editar categoria selecionada
  const handleEditarCategoria = (categoria: Categoria) => {
    setCategoriaEmEdicao(categoria);
    setDialogOpen(true);
  };

  // Prepara diálogo para nova categoria
  const handleNovaCategoria = () => {
    setCategoriaEmEdicao(null);
    form.reset({
      nome: '',
      slug: '',
      descricao: '',
      icone: '',
      ordem: 0,
      ativo: true,
    });
    setDialogOpen(true);
  };

  // Mutation para criar categoria
  const criarCategoriaMutation = useMutation({
    mutationFn: async (data: CategoriaFormValues) => {
      const response = await apiRequest('POST', '/api/admin/ferramentas/categorias', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Categoria criada com sucesso',
        description: 'A categoria foi adicionada à lista de categorias de ferramentas',
        variant: 'default',
      });
      setDialogOpen(false);
      // Atualizar a lista de categorias
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ferramentas/categorias'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar categoria
  const atualizarCategoriaMutation = useMutation({
    mutationFn: async (data: { id: number; categoria: CategoriaFormValues }) => {
      const response = await apiRequest('PUT', `/api/admin/ferramentas/categorias/${data.id}`, data.categoria);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Categoria atualizada com sucesso',
        description: 'As alterações foram salvas com sucesso',
        variant: 'default',
      });
      setDialogOpen(false);
      // Atualizar a lista de categorias
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ferramentas/categorias'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para excluir categoria
  const excluirCategoriaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/ferramentas/categorias/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Categoria excluída com sucesso',
        description: 'A categoria foi removida da lista de categorias',
        variant: 'default',
      });
      setCategoriaParaExcluir(null);
      // Atualizar a lista de categorias
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ferramentas/categorias'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas/categorias'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmit = (values: CategoriaFormValues) => {
    if (categoriaEmEdicao) {
      atualizarCategoriaMutation.mutate({
        id: categoriaEmEdicao.id,
        categoria: values,
      });
    } else {
      criarCategoriaMutation.mutate(values);
    }
  };

  // Gerar slug automático a partir do nome
  const gerarSlugAutomatico = () => {
    const nome = form.getValues('nome');
    if (nome) {
      const slug = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      form.setValue('slug', slug, { shouldValidate: true });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Erro ao carregar categorias</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Ocorreu um erro ao tentar carregar as categorias. Tente novamente mais tarde.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/ferramentas/categorias'] })}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Categorias de Ferramentas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie as categorias disponíveis para as ferramentas úteis.
          </p>
        </div>
        <Button onClick={handleNovaCategoria} className="sm:self-start">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : categorias && categorias.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((categoria) => (
              <TableRow key={categoria.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{categoria.nome}</TableCell>
                <TableCell>{categoria.slug}</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {categoria.descricao || '-'}
                </TableCell>
                <TableCell>{categoria.ordem || 0}</TableCell>
                <TableCell>
                  <Badge variant={categoria.ativo ? "default" : "outline"}>
                    {categoria.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditarCategoria(categoria)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a categoria "{categoria.nome}"? 
                            Esta ação não pode ser desfeita, e todas as ferramentas relacionadas a esta categoria 
                            ficarão sem categoria.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => excluirCategoriaMutation.mutate(categoria.id)}
                          >
                            {excluirCategoriaMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Trash className="h-4 w-4 mr-2" />
                            )}
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center justify-center p-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Nenhuma categoria cadastrada. Crie a primeira categoria para começar.
              </p>
              <Button onClick={handleNovaCategoria}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para criar/editar categoria */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {categoriaEmEdicao ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {categoriaEmEdicao
                ? "Edite os detalhes da categoria selecionada."
                : "Preencha os campos para criar uma nova categoria de ferramentas."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Edição de Imagem"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Se for uma nova categoria, sugerir slug baseado no nome
                          if (!categoriaEmEdicao) {
                            setTimeout(gerarSlugAutomatico, 300);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl className="flex-1">
                        <Input
                          placeholder="Ex: edicao-de-imagem"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={gerarSlugAutomatico}
                        title="Gerar slug a partir do nome"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o propósito desta categoria de ferramentas"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="icone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do ícone Lucide React"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <FormDescription className="text-xs">
                        Categoria ativa estará disponível na interface do usuário.
                      </FormDescription>
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
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={criarCategoriaMutation.isPending || atualizarCategoriaMutation.isPending}
                >
                  {(criarCategoriaMutation.isPending || atualizarCategoriaMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {categoriaEmEdicao ? "Salvar alterações" : "Criar categoria"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};