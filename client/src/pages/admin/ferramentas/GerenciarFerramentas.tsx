import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Pencil, Trash, FileImage, Check, X, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertFerramentaSchema } from '@shared/schema';

// Esquema para ferramentas
const ferramentaFormSchema = insertFerramentaSchema.extend({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  websiteUrl: z.string().url("URL inválida"),
  categoriaId: z.number().min(1, "Escolha uma categoria"),
  isExterno: z.boolean().default(true),
  isNovo: z.boolean().default(false),
  ordem: z.number().int().optional(),
  ativo: z.boolean().default(true),
});

type FerramentaFormValues = z.infer<typeof ferramentaFormSchema>;

type Ferramenta = {
  id: number;
  nome: string;
  descricao?: string;
  imageUrl?: string;
  websiteUrl: string;
  isExterno: boolean;
  isNovo: boolean;
  categoriaId: number;
  categoria?: {
    id: number;
    nome: string;
    slug: string;
  };
  ordem?: number;
  ativo?: boolean;
  criadoEm?: string;
};

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  ordem?: number;
  ativo?: boolean;
};

export const GerenciarFerramentas: React.FC = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ferramentaEmEdicao, setFerramentaEmEdicao] = useState<Ferramenta | null>(null);
  const [ferramentaParaExcluir, setFerramentaParaExcluir] = useState<Ferramenta | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Buscar todas as ferramentas
  const { data: ferramentas, isLoading, error } = useQuery<Ferramenta[]>({
    queryKey: ['/api/admin/ferramentas/all'],
  });

  // Buscar categorias para o formulário
  const { data: categorias } = useQuery<Categoria[]>({
    queryKey: ['/api/ferramentas/categorias'],
  });

  // Formulário para criar/editar ferramenta
  const form = useForm<FerramentaFormValues>({
    resolver: zodResolver(ferramentaFormSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      websiteUrl: '',
      categoriaId: 0,
      isExterno: true,
      isNovo: false,
      ordem: 0,
      ativo: true,
    },
  });

  // Editar ferramenta selecionada
  const handleEditarFerramenta = (ferramenta: Ferramenta) => {
    setFerramentaEmEdicao(ferramenta);
    setImagePreview(ferramenta.imageUrl || null);
    form.reset({
      nome: ferramenta.nome,
      descricao: ferramenta.descricao || '',
      websiteUrl: ferramenta.websiteUrl,
      categoriaId: ferramenta.categoriaId,
      isExterno: ferramenta.isExterno,
      isNovo: ferramenta.isNovo,
      ordem: ferramenta.ordem || 0,
      ativo: ferramenta.ativo !== undefined ? ferramenta.ativo : true,
    });
    setDialogOpen(true);
  };

  // Prepara diálogo para nova ferramenta
  const handleNovaFerramenta = () => {
    setFerramentaEmEdicao(null);
    setImagePreview(null);
    setImageFile(null);
    form.reset({
      nome: '',
      descricao: '',
      websiteUrl: '',
      categoriaId: 0,
      isExterno: true,
      isNovo: false,
      ordem: 0,
      ativo: true,
    });
    setDialogOpen(true);
  };

  // Manipular upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Apenas imagens nos formatos JPG, PNG, WebP e GIF são permitidas.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo da imagem é 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Salvar arquivo para upload
    setImageFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Limpar imagem selecionada
  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Mutation para fazer upload de imagem
  const uploadImageMutation = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('imagem', file);

      const response = await fetch('/api/admin/ferramentas/upload-imagem', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer upload da imagem');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Mutation para criar ferramenta
  const criarFerramentaMutation = useMutation({
    mutationFn: async (data: FerramentaFormValues & { imageUrl?: string }) => {
      const response = await apiRequest('POST', '/api/admin/ferramentas', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Ferramenta criada com sucesso',
        description: 'A ferramenta foi adicionada à lista de ferramentas úteis',
        variant: 'default',
      });
      setDialogOpen(false);
      // Atualizar a lista de ferramentas
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ferramentas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar ferramenta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar ferramenta
  const atualizarFerramentaMutation = useMutation({
    mutationFn: async (data: { id: number; ferramenta: FerramentaFormValues & { imageUrl?: string } }) => {
      const response = await apiRequest('PUT', `/api/admin/ferramentas/${data.id}`, data.ferramenta);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Ferramenta atualizada com sucesso',
        description: 'As alterações foram salvas com sucesso',
        variant: 'default',
      });
      setDialogOpen(false);
      // Atualizar a lista de ferramentas
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ferramentas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar ferramenta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para excluir ferramenta
  const excluirFerramentaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/ferramentas/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Ferramenta excluída com sucesso',
        description: 'A ferramenta foi removida da lista',
        variant: 'default',
      });
      setFerramentaParaExcluir(null);
      // Atualizar a lista de ferramentas
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ferramentas/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir ferramenta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmit = async (values: FerramentaFormValues) => {
    try {
      let imageUrl = ferramentaEmEdicao?.imageUrl;

      // Se houver um novo arquivo de imagem, fazer upload
      if (imageFile) {
        imageUrl = await uploadImageMutation(imageFile);
      }

      const ferramentaData = { ...values, imageUrl };

      if (ferramentaEmEdicao) {
        await atualizarFerramentaMutation.mutateAsync({
          id: ferramentaEmEdicao.id,
          ferramenta: ferramentaData,
        });
      } else {
        await criarFerramentaMutation.mutateAsync(ferramentaData);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar ferramenta',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Erro ao carregar ferramentas</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Ocorreu um erro ao tentar carregar as ferramentas. Tente novamente mais tarde.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/ferramentas/all'] })}
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
          <h3 className="text-lg font-medium">Ferramentas Úteis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Adicione e gerencie a lista de ferramentas úteis para seus usuários.
          </p>
        </div>
        <Button onClick={handleNovaFerramenta} className="sm:self-start">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Ferramenta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : ferramentas && ferramentas.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ferramentas.map((ferramenta) => (
              <TableRow key={ferramenta.id}>
                <TableCell>
                  {ferramenta.imageUrl ? (
                    <div className="w-10 h-10 rounded overflow-hidden">
                      <img 
                        src={ferramenta.imageUrl} 
                        alt={ferramenta.nome} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                        {ferramenta.nome.charAt(0)}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{ferramenta.nome}</TableCell>
                <TableCell>
                  <a 
                    href={ferramenta.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    {new URL(ferramenta.websiteUrl).hostname}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>
                  {categorias?.find(c => c.id === ferramenta.categoriaId)?.nome || 'Categoria não encontrada'}
                </TableCell>
                <TableCell>
                  <Badge variant={ferramenta.ativo ? "default" : "outline"}>
                    {ferramenta.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {ferramenta.isNovo && (
                      <Badge variant="secondary" className="bg-blue-500 text-white">Novo</Badge>
                    )}
                    {ferramenta.isExterno && (
                      <Badge variant="outline">Externo</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditarFerramenta(ferramenta)}
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
                          <AlertDialogTitle>Excluir Ferramenta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a ferramenta "{ferramenta.nome}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => excluirFerramentaMutation.mutate(ferramenta.id)}
                          >
                            {excluirFerramentaMutation.isPending ? (
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
                Nenhuma ferramenta cadastrada. Crie a primeira ferramenta para começar.
              </p>
              <Button onClick={handleNovaFerramenta}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Ferramenta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para criar/editar ferramenta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {ferramentaEmEdicao ? "Editar Ferramenta" : "Nova Ferramenta"}
            </DialogTitle>
            <DialogDescription>
              {ferramentaEmEdicao
                ? "Edite os detalhes da ferramenta selecionada."
                : "Preencha os campos para adicionar uma nova ferramenta útil."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Ferramenta</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Canva"
                        {...field}
                      />
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
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva brevemente para que serve esta ferramenta"
                        rows={3}
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
                    <FormLabel>URL do Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Endereço completo do site da ferramenta, incluindo https://
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias?.map((categoria) => (
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

              {/* Upload de imagem */}
              <div className="space-y-2">
                <Label htmlFor="imagem">Imagem da Ferramenta</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="imagem"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        className="flex-1"
                      />
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleClearImage}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos aceitos: JPG, PNG, WebP, GIF. Tamanho máximo: 5MB.
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    {imagePreview ? (
                      <div className="relative w-32 h-24 overflow-hidden rounded">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-24 border-2 border-dashed rounded flex items-center justify-center text-gray-400">
                        <FileImage className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="isExterno"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ferramenta Externa</FormLabel>
                        <FormDescription>
                          Quando ativado, abre a URL em uma nova aba
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isNovo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Destacar como Novo</FormLabel>
                        <FormDescription>
                          Adiciona um selo "Novo" à ferramenta
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de exibição</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Valores menores aparecem primeiro
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>
                          Quando desativado, a ferramenta não aparece no site
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
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
                  disabled={criarFerramentaMutation.isPending || atualizarFerramentaMutation.isPending || isUploading}
                >
                  {(criarFerramentaMutation.isPending || atualizarFerramentaMutation.isPending || isUploading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {ferramentaEmEdicao ? "Salvar alterações" : "Criar ferramenta"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};