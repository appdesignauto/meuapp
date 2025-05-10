import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Loader2, 
  Image, 
  ExternalLink, 
  CheckSquare,
  Star,
  Filter 
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Ferramenta, FerramentaCategoria } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema para validação de formulário de ferramenta
const ferramentaSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  websiteUrl: z.string().min(1, 'URL do site é obrigatória'),
  categoriaId: z.number().min(1, 'Categoria é obrigatória'),
  isExterno: z.boolean().default(true),
  isNovo: z.boolean().default(false),
  ordem: z.number().min(0, 'Ordem deve ser maior que zero'),
  ativo: z.boolean().default(true),
});

type FerramentaFormValues = z.infer<typeof ferramentaSchema>;

const GerenciarFerramentas: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ferramentaEmEdicao, setFerramentaEmEdicao] = useState<Ferramenta | null>(null);
  const [ferramentaParaExcluir, setFerramentaParaExcluir] = useState<Ferramenta | null>(null);
  const [dialogoNovaAberto, setDialogoNovaAberto] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);

  // Formulário para criar/editar ferramenta
  const form = useForm<FerramentaFormValues>({
    resolver: zodResolver(ferramentaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      imageUrl: '',
      websiteUrl: '',
      categoriaId: 0,
      isExterno: true,
      isNovo: false,
      ordem: 0,
      ativo: true,
    }
  });

  // Buscar todas as categorias
  const { data: categorias = [] } = useQuery<FerramentaCategoria[]>({
    queryKey: ['/api/ferramentas/categorias'],
  });

  // Buscar todas as ferramentas
  const { 
    data: ferramentas = [], 
    isLoading 
  } = useQuery<Ferramenta[]>({
    queryKey: ['/api/ferramentas'],
  });

  // Ferramentas filtradas
  const ferramentrasFiltradas = categoriaFiltro 
    ? ferramentas.filter(f => f.categoriaId === categoriaFiltro)
    : ferramentas;

  // Criar nova ferramenta
  const criarFerramentaMutation = useMutation({
    mutationFn: async (dados: FerramentaFormValues) => {
      const res = await apiRequest('POST', '/api/admin/ferramentas', dados);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
      toast({
        title: 'Ferramenta criada',
        description: 'A ferramenta foi criada com sucesso!',
      });
      setDialogoNovaAberto(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar ferramenta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar ferramenta
  const atualizarFerramentaMutation = useMutation({
    mutationFn: async (dados: FerramentaFormValues) => {
      const { id, ...restoDados } = dados;
      const res = await apiRequest('PUT', `/api/admin/ferramentas/${id}`, restoDados);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
      toast({
        title: 'Ferramenta atualizada',
        description: 'A ferramenta foi atualizada com sucesso!',
      });
      setFerramentaEmEdicao(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar ferramenta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Excluir ferramenta
  const excluirFerramentaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/ferramentas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
      toast({
        title: 'Ferramenta excluída',
        description: 'A ferramenta foi excluída com sucesso!',
      });
      setFerramentaParaExcluir(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir ferramenta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleEditarFerramenta = (ferramenta: Ferramenta) => {
    form.reset({
      id: ferramenta.id,
      nome: ferramenta.nome,
      descricao: ferramenta.descricao || '',
      imageUrl: ferramenta.imageUrl || '',
      websiteUrl: ferramenta.websiteUrl,
      categoriaId: ferramenta.categoriaId,
      isExterno: ferramenta.isExterno,
      isNovo: ferramenta.isNovo,
      ordem: ferramenta.ordem,
      ativo: ferramenta.ativo,
    });
    setFerramentaEmEdicao(ferramenta);
  };

  const handleCriarFerramenta = () => {
    form.reset({
      nome: '',
      descricao: '',
      imageUrl: '',
      websiteUrl: '',
      categoriaId: categorias.length > 0 ? categorias[0].id : 0,
      isExterno: true,
      isNovo: true,
      ordem: Math.max(0, ...ferramentas.map(f => f.ordem)) + 1,
      ativo: true,
    });
    setDialogoNovaAberto(true);
  };

  const onSubmitNova = (dados: FerramentaFormValues) => {
    criarFerramentaMutation.mutate(dados);
  };

  const onSubmitEditar = (dados: FerramentaFormValues) => {
    atualizarFerramentaMutation.mutate(dados);
  };

  const handleExcluirFerramenta = (ferramenta: Ferramenta) => {
    setFerramentaParaExcluir(ferramenta);
  };

  const confirmarExclusao = () => {
    if (ferramentaParaExcluir) {
      excluirFerramentaMutation.mutate(ferramentaParaExcluir.id);
    }
  };

  // Encontrar o nome da categoria por ID
  const getNomeCategoria = (categoriaId: number) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nome : 'Categoria não encontrada';
  };

  // Renderizar formulário de ferramenta (comum para criar e editar)
  const renderFerramentaForm = (onSubmit: (dados: FerramentaFormValues) => void, isCreating: boolean) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome*</FormLabel>
              <FormControl>
                <Input placeholder="Nome da ferramenta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição da ferramenta (opcional)"
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
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem</FormLabel>
              <FormControl>
                <Input 
                  placeholder="URL da imagem (opcional)" 
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
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Site*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="URL do site da ferramenta" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoriaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria*</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value.toString()}
                value={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  value={field.value || 0}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="isExterno"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Link Externo</FormLabel>
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
          <FormField
            control={form.control}
            name="isNovo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Marcar como Novo</FormLabel>
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
          <FormField
            control={form.control}
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            type="submit" 
            disabled={
              isCreating ? criarFerramentaMutation.isPending : atualizarFerramentaMutation.isPending
            }
          >
            {(isCreating ? criarFerramentaMutation.isPending : atualizarFerramentaMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isCreating ? 'Criar Ferramenta' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Ferramentas</h2>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            onValueChange={(value) => setCategoriaFiltro(value === "all" ? null : parseInt(value))}
            defaultValue="all"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                  {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleCriarFerramenta}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Ferramenta
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : ferramentrasFiltradas.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center p-12">
            <p className="text-gray-500 mb-4">
              {categoriaFiltro 
                ? "Nenhuma ferramenta encontrada nesta categoria" 
                : "Nenhuma ferramenta cadastrada"}
            </p>
            {!categoriaFiltro && (
              <Button onClick={handleCriarFerramenta}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Ferramenta
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Imagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ferramentrasFiltradas.map((ferramenta) => (
                <TableRow key={ferramenta.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {ferramenta.nome}
                      {ferramenta.isNovo && (
                        <Badge variant="default" className="ml-1">
                          Novo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getNomeCategoria(ferramenta.categoriaId)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className="font-mono text-xs cursor-pointer hover:bg-gray-100"
                      onClick={() => window.open(ferramenta.websiteUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {ferramenta.websiteUrl.replace(/^https?:\/\//, '').substring(0, 20)}
                      {ferramenta.websiteUrl.replace(/^https?:\/\//, '').length > 20 ? '...' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ferramenta.imageUrl ? (
                      <div className="h-8 w-8 rounded overflow-hidden">
                        <img 
                          src={ferramenta.imageUrl} 
                          alt={ferramenta.nome} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-tool.webp';
                          }}
                        />
                      </div>
                    ) : (
                      <Badge variant="outline">Sem imagem</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {ferramenta.ativo ? (
                      <Badge variant="default">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditarFerramenta(ferramenta)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExcluirFerramenta(ferramenta)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir ferramenta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a ferramenta "{ferramentaParaExcluir?.nome}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmarExclusao}>
                            {excluirFerramentaMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog para criar nova ferramenta */}
      <Dialog open={dialogoNovaAberto} onOpenChange={setDialogoNovaAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Ferramenta</DialogTitle>
          </DialogHeader>
          {renderFerramentaForm(onSubmitNova, true)}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar ferramenta */}
      <Dialog 
        open={ferramentaEmEdicao !== null} 
        onOpenChange={(open) => !open && setFerramentaEmEdicao(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Ferramenta</DialogTitle>
          </DialogHeader>
          {renderFerramentaForm(onSubmitEditar, false)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarFerramentas;