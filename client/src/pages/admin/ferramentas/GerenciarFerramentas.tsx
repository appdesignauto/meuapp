import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit, Trash2, Search, Loader2, ArrowUpDown, Upload, ExternalLink } from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Ferramenta, FerramentaCategoria } from '@shared/schema';

// Schema para validação do formulário
const ferramentaSchema = z.object({
  nome: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  imageUrl: z.string().optional(),
  websiteUrl: z.string().url("URL inválida").min(1, "URL é obrigatória"),
  isExterno: z.boolean().default(true),
  isNovo: z.boolean().default(false),
  categoriaId: z.number().min(1, "Selecione uma categoria"),
  ordem: z.number().int().min(0, "Ordem deve ser um número positivo"),
  ativo: z.boolean().default(true)
});

type FerramentaFormValues = z.infer<typeof ferramentaSchema>;

const GerenciarFerramentas: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para busca de ferramentas
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<number | null>(null);
  
  // Estado para ordenação
  const [sortField, setSortField] = useState<'nome' | 'ordem'>('ordem');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Estados para controle de modais
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ferramentaToEdit, setFerramentaToEdit] = useState<Ferramenta | null>(null);
  const [ferramentaToDelete, setFerramentaToDelete] = useState<Ferramenta | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Buscar ferramentas
  const { data: ferramentas, isLoading: loadingFerramentas, error: ferramentasError } = useQuery({
    queryKey: ['/api/ferramentas', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/ferramentas/all');
      if (!response.ok) {
        throw new Error('Erro ao buscar ferramentas');
      }
      return response.json() as Promise<Ferramenta[]>;
    }
  });

  // Buscar categorias
  const { data: categorias, isLoading: loadingCategorias, error: categoriasError } = useQuery({
    queryKey: ['/api/ferramentas/categorias'],
    queryFn: async () => {
      const response = await fetch('/api/ferramentas/categorias');
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
      }
      return response.json() as Promise<FerramentaCategoria[]>;
    }
  });

  // Filtrar ferramentas
  const ferramentasFiltradas = ferramentas?.filter(ferramenta => {
    const matchesSearch = 
      ferramenta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ferramenta.descricao && ferramenta.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategoria = categoriaFilter === null || ferramenta.categoriaId === categoriaFilter;
    
    return matchesSearch && matchesCategoria;
  }) || [];

  // Ordenar ferramentas
  const ferramentasOrdenadas = [...ferramentasFiltradas].sort((a, b) => {
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

  // Form para adicionar ferramenta
  const addForm = useForm<FerramentaFormValues>({
    resolver: zodResolver(ferramentaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      imageUrl: '',
      websiteUrl: '',
      isExterno: true,
      isNovo: false,
      categoriaId: 0,
      ordem: 0,
      ativo: true
    }
  });

  // Form para editar ferramenta
  const editForm = useForm<FerramentaFormValues>({
    resolver: zodResolver(ferramentaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      imageUrl: '',
      websiteUrl: '',
      isExterno: true,
      isNovo: false,
      categoriaId: 0,
      ordem: 0,
      ativo: true
    }
  });

  // Mutation para upload de imagem
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const xhr = new XMLHttpRequest();
      
      const promise = new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.imageUrl);
          } else {
            reject(new Error('Erro ao fazer upload da imagem'));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Erro de rede ao fazer upload da imagem'));
        };
        
        xhr.open('POST', '/api/admin/upload/imagem-ferramenta', true);
        xhr.send(formData);
      });
      
      try {
        const imageUrl = await promise;
        return imageUrl;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    onSuccess: (imageUrl) => {
      // Atualizar o formulário com a URL da imagem
      if (isEditDialogOpen) {
        editForm.setValue('imageUrl', imageUrl);
        setPreviewImage(imageUrl);
      } else {
        addForm.setValue('imageUrl', imageUrl);
        setPreviewImage(imageUrl);
      }
      
      toast({
        title: "Upload concluído",
        description: "A imagem foi enviada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para adicionar ferramenta
  const addFerramentaMutation = useMutation({
    mutationFn: async (data: FerramentaFormValues) => {
      const res = await apiRequest('POST', '/api/admin/ferramentas', data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao criar ferramenta');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ferramenta adicionada",
        description: "A ferramenta foi adicionada com sucesso",
      });
      addForm.reset();
      setIsAddDialogOpen(false);
      setPreviewImage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas', 'all'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para editar ferramenta
  const editFerramentaMutation = useMutation({
    mutationFn: async (data: FerramentaFormValues & { id: number }) => {
      const { id, ...formData } = data;
      const res = await apiRequest('PUT', `/api/admin/ferramentas/${id}`, formData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao atualizar ferramenta');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ferramenta atualizada",
        description: "A ferramenta foi atualizada com sucesso",
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setFerramentaToEdit(null);
      setPreviewImage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas', 'all'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir ferramenta
  const deleteFerramentaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/ferramentas/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao excluir ferramenta');
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Ferramenta excluída",
        description: "A ferramenta foi excluída com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setFerramentaToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas', 'all'] });
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
  const handleAddSubmit = (data: FerramentaFormValues) => {
    addFerramentaMutation.mutate(data);
  };

  const handleEditSubmit = (data: FerramentaFormValues) => {
    if (ferramentaToEdit) {
      editFerramentaMutation.mutate({ ...data, id: ferramentaToEdit.id });
    }
  };

  const handleEdit = (ferramenta: Ferramenta) => {
    setFerramentaToEdit(ferramenta);
    editForm.reset({
      nome: ferramenta.nome,
      descricao: ferramenta.descricao || '',
      imageUrl: ferramenta.imageUrl || '',
      websiteUrl: ferramenta.websiteUrl || '',
      isExterno: ferramenta.isExterno || false,
      isNovo: ferramenta.isNovo || false,
      categoriaId: ferramenta.categoriaId || 0,
      ordem: ferramenta.ordem || 0,
      ativo: ferramenta.ativo || true
    });
    setPreviewImage(ferramenta.imageUrl || null);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (ferramenta: Ferramenta) => {
    setFerramentaToDelete(ferramenta);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ferramentaToDelete) {
      deleteFerramentaMutation.mutate(ferramentaToDelete.id);
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar tipo e tamanho da imagem
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validImageTypes.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione uma imagem nos formatos JPEG, PNG, WEBP ou GIF",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Criar preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload da imagem
      uploadImageMutation.mutate(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (ferramentasError || categoriasError) {
    return (
      <div className="p-4 text-red-500">
        {ferramentasError && <p>Erro ao carregar ferramentas: {ferramentasError instanceof Error ? ferramentasError.message : 'Erro desconhecido'}</p>}
        {categoriasError && <p>Erro ao carregar categorias: {categoriasError instanceof Error ? categoriasError.message : 'Erro desconhecido'}</p>}
      </div>
    );
  }

  const categoriasAtivas = categorias?.filter(cat => cat.ativo) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar ferramentas..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select 
            value={categoriaFilter?.toString() || "null"} 
            onValueChange={(value) => setCategoriaFilter(value === "null" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Todas as categorias</SelectItem>
              {categoriasAtivas.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                  {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Ferramenta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Ferramenta</DialogTitle>
            </DialogHeader>
            
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={addForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da ferramenta" {...field} />
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
                              placeholder="Descrição da ferramenta" 
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
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do Site</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.exemplo.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="categoriaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select
                            value={field.value ? field.value.toString() : ""}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loadingCategorias ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : categoriasAtivas.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500">
                                  Nenhuma categoria disponível
                                </div>
                              ) : (
                                categoriasAtivas.map((categoria) => (
                                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                                    {categoria.nome}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
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
                  </div>
                  
                  <div className="space-y-4">
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-2">Imagem</div>
                      <div className="border rounded-md p-4 flex flex-col items-center justify-center">
                        {previewImage ? (
                          <div className="mb-4 w-full">
                            <img 
                              src={previewImage}
                              alt="Preview" 
                              className="h-48 object-contain mx-auto"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 mb-4">
                            <div className="bg-gray-100 p-8 rounded-md">
                              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Nenhuma imagem selecionada</p>
                          </div>
                        )}
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileChange}
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                        />
                        
                        <FormField
                          control={addForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input
                                  placeholder="URL da imagem"
                                  {...field}
                                  value={field.value || ''}
                                  className="hidden"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleUploadClick}
                          disabled={isUploading}
                          className="w-full"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando... {uploadProgress}%
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              {previewImage ? 'Alterar imagem' : 'Selecionar imagem'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="isExterno"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Link Externo</FormLabel>
                            <FormDescription>
                              É um site externo ao Design Auto?
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
                    
                    <FormField
                      control={addForm.control}
                      name="isNovo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Nova Ferramenta</FormLabel>
                            <FormDescription>
                              Marcar como nova ferramenta?
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
                    
                    <FormField
                      control={addForm.control}
                      name="ativo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Ativo</FormLabel>
                            <FormDescription>
                              A ferramenta estará visível no site?
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
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addFerramentaMutation.isPending}>
                    {addFerramentaMutation.isPending && (
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

      {loadingFerramentas ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : ferramentasOrdenadas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm || categoriaFilter 
              ? 'Nenhuma ferramenta encontrada com esses filtros.' 
              : 'Nenhuma ferramenta cadastrada.'}
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
                <TableHead>Imagem</TableHead>
                <TableHead>Categoria</TableHead>
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
              {ferramentasOrdenadas.map((ferramenta) => {
                const categoria = categorias?.find(c => c.id === ferramenta.categoriaId);
                return (
                  <TableRow key={ferramenta.id}>
                    <TableCell>{ferramenta.id}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{ferramenta.nome}</span>
                        {ferramenta.isNovo && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 mt-1 w-fit">
                            Novo
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ferramenta.imageUrl ? (
                        <img 
                          src={ferramenta.imageUrl} 
                          alt={ferramenta.nome} 
                          className="h-10 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">Sem imagem</span>
                      )}
                    </TableCell>
                    <TableCell>{categoria?.nome || '-'}</TableCell>
                    <TableCell>{ferramenta.ordem}</TableCell>
                    <TableCell>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        ferramenta.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ferramenta.ativo ? 'Ativo' : 'Inativo'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <a 
                          href={ferramenta.websiteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-700 hover:bg-gray-100"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Visitar</span>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ferramenta)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(ferramenta)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </AlertDialogTrigger>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Ferramenta</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da ferramenta" {...field} />
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
                            placeholder="Descrição da ferramenta" 
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
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Site</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.exemplo.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="categoriaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingCategorias ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : categoriasAtivas.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">
                                Nenhuma categoria disponível
                              </div>
                            ) : (
                              categoriasAtivas.map((categoria) => (
                                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                                  {categoria.nome}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
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
                </div>
                
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Imagem</div>
                    <div className="border rounded-md p-4 flex flex-col items-center justify-center">
                      {previewImage ? (
                        <div className="mb-4 w-full">
                          <img 
                            src={previewImage}
                            alt="Preview" 
                            className="h-48 object-contain mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 mb-4">
                          <div className="bg-gray-100 p-8 rounded-md">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                          </div>
                          <p className="text-sm text-gray-500 mt-2">Nenhuma imagem selecionada</p>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormControl>
                              <Input
                                placeholder="URL da imagem"
                                {...field}
                                value={field.value || ''}
                                className="hidden"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {previewImage ? 'Alterar imagem' : 'Selecionar imagem'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="isExterno"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Link Externo</FormLabel>
                          <FormDescription>
                            É um site externo ao Design Auto?
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
                  
                  <FormField
                    control={editForm.control}
                    name="isNovo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Nova Ferramenta</FormLabel>
                          <FormDescription>
                            Marcar como nova ferramenta?
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
                  
                  <FormField
                    control={editForm.control}
                    name="ativo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Ativo</FormLabel>
                          <FormDescription>
                            A ferramenta estará visível no site?
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
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editFerramentaMutation.isPending}>
                  {editFerramentaMutation.isPending && (
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
            <AlertDialogTitle>Excluir Ferramenta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ferramenta &quot;{ferramentaToDelete?.nome}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteFerramentaMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteFerramentaMutation.isPending && (
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

export default GerenciarFerramentas;