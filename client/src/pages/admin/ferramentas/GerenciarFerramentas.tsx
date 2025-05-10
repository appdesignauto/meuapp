import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Search, 
  ImagePlus, 
  X, 
  ExternalLink,
  Star,
  StarOff,
  Tags
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatTimestamp } from '@/lib/utils';

interface Ferramenta {
  id: number;
  nome: string;
  descricao: string;
  url: string;
  imagemUrl: string;
  categoriaId: number;
  destaque: boolean;
  novo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  categoria: {
    id: number;
    nome: string;
  };
}

interface Categoria {
  id: number;
  nome: string;
}

const GerenciarFerramentas: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [ferramentaToDelete, setFerramentaToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Ferramenta>>({
    nome: '',
    descricao: '',
    url: '',
    categoriaId: 0,
    destaque: false,
    novo: false
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Consulta para buscar ferramentas com filtros
  const { data: ferramentas, isLoading, isError } = useQuery({
    queryKey: ['/api/ferramentas', searchTerm, selectedCategoria],
    queryFn: async () => {
      let url = '/api/ferramentas';
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedCategoria && selectedCategoria !== 'all') {
        params.append('categoria', selectedCategoria.toString());
      }
      
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      const response = await fetch(fullUrl);
      return await response.json();
    },
    staleTime: 1000 * 60, // 1 minuto
  });

  // Consulta para buscar categorias
  const { data: categorias, isLoading: isCategoriaLoading } = useQuery({
    queryKey: ['/api/ferramentas/categorias'],
    staleTime: 1000 * 60, // 1 minuto
  });

  // Mutação para criar/atualizar ferramenta
  const updateFerramentaMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = formData.id 
        ? `/api/ferramentas/${formData.id}` 
        : '/api/ferramentas';
      const method = formData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: data,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
      toast({
        title: "Sucesso",
        description: formData.id ? "Ferramenta atualizada com sucesso" : "Ferramenta criada com sucesso",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao ${formData.id ? 'atualizar' : 'criar'} ferramenta: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir ferramenta
  const deleteFerramentaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/ferramentas/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
      toast({
        title: "Sucesso",
        description: "Ferramenta excluída com sucesso",
      });
      setIsAlertDialogOpen(false);
      setFerramentaToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir ferramenta: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar destaque/novo
  const toggleFeatureStatusMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number; field: string; value: boolean }) => {
      const response = await apiRequest('PATCH', `/api/ferramentas/${id}/status`, { field, value });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ferramentas'] });
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar status: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleEditFerramenta = (ferramenta: Ferramenta) => {
    setFormData(ferramenta);
    setImagePreview(ferramenta.imagemUrl);
    setIsDialogOpen(true);
  };

  const handleDeleteFerramenta = (id: number) => {
    setFerramentaToDelete(id);
    setIsAlertDialogOpen(true);
  };

  const handleToggleStatus = (id: number, field: 'destaque' | 'novo', currentValue: boolean) => {
    toggleFeatureStatusMutation.mutate({ 
      id, 
      field, 
      value: !currentValue 
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Criar uma URL temporária para prévia da imagem
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      url: '',
      categoriaId: 0,
      destaque: false,
      novo: false
    });
    setImagePreview(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.nome || !formData.url || !formData.categoriaId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Validar imagem
    if (!formData.id && !selectedFile) {
      toast({
        title: "Imagem obrigatória",
        description: "Selecione uma imagem para a ferramenta",
        variant: "destructive",
      });
      return;
    }
    
    // Criar FormData para envio de arquivos
    const formDataToSend = new FormData();
    formDataToSend.append('nome', formData.nome || '');
    formDataToSend.append('descricao', formData.descricao || '');
    formDataToSend.append('url', formData.url || '');
    formDataToSend.append('categoriaId', formData.categoriaId?.toString() || '');
    formDataToSend.append('destaque', formData.destaque ? 'true' : 'false');
    formDataToSend.append('novo', formData.novo ? 'true' : 'false');
    
    if (selectedFile) {
      formDataToSend.append('imagem', selectedFile);
    }
    
    setIsUploading(true);
    updateFerramentaMutation.mutate(formDataToSend);
  };

  const handleConfirmDelete = () => {
    if (ferramentaToDelete) {
      deleteFerramentaMutation.mutate(ferramentaToDelete);
    }
  };

  // Renderiza o conteúdo com base no estado de carregamento
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader className="p-4">
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
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
            <p className="text-destructive">Erro ao carregar ferramentas. Tente novamente mais tarde.</p>
          </CardContent>
        </Card>
      );
    }

    if (!ferramentas?.length) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Nenhuma ferramenta encontrada.</p>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="mt-4"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Ferramenta
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ferramentas.map((ferramenta: Ferramenta) => (
          <Card key={ferramenta.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              <img 
                src={ferramenta.imagemUrl} 
                alt={ferramenta.nome}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                }}
              />
              {ferramenta.destaque && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Destaque
                </div>
              )}
              {ferramenta.novo && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Novo
                </div>
              )}
            </div>
            <CardHeader className="p-4">
              <CardTitle className="text-lg truncate">{ferramenta.nome}</CardTitle>
              <CardDescription className="flex items-center">
                <Tags className="h-3 w-3 mr-1" />
                {ferramenta.categoria?.nome || 'Sem categoria'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ferramenta.descricao || 'Sem descrição'}
              </p>
              <div className="mt-2">
                <a 
                  href={ferramenta.url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center hover:underline"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {ferramenta.url ? ferramenta.url.replace(/^https?:\/\//, '').substring(0, 30) : 'Sem URL'}
                  {ferramenta.url && ferramenta.url.length > 30 && '...'}
                </a>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleToggleStatus(ferramenta.id, 'destaque', !!ferramenta.destaque)}
                  title={ferramenta.destaque ? "Remover destaque" : "Definir como destaque"}
                >
                  {ferramenta.destaque ? (
                    <StarOff className="h-4 w-4" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleToggleStatus(ferramenta.id, 'novo', !!ferramenta.novo)}
                  title={ferramenta.novo ? "Remover marcação de novo" : "Marcar como novo"}
                >
                  {ferramenta.novo ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleEditFerramenta(ferramenta)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleDeleteFerramenta(ferramenta.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Ferramentas</h3>
          <p className="text-sm text-muted-foreground">
            Adicione, edite ou remova ferramentas do site.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Ferramenta
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ferramenta..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={selectedCategoria?.toString() || 'all'}
          onValueChange={(value) => setSelectedCategoria(value === 'all' ? null : parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias?.map((categoria: Categoria) => (
              <SelectItem key={categoria.id} value={categoria.id.toString()}>
                {categoria.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de ferramentas */}
      {renderContent()}

      {/* Dialog para criar/editar ferramenta */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Editar' : 'Nova'} Ferramenta</DialogTitle>
            <DialogDescription>
              {formData.id 
                ? 'Faça as alterações necessárias nos campos abaixo.' 
                : 'Preencha os campos abaixo para adicionar uma nova ferramenta.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input 
                  id="nome" 
                  value={formData.nome || ''} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome da ferramenta"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea 
                  id="descricao" 
                  value={formData.descricao || ''} 
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva brevemente a ferramenta"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input 
                  id="url" 
                  value={formData.url || ''} 
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://exemplo.com"
                  type="url"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoriaId?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, categoriaId: parseInt(value) })}
                  required
                >
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias?.map((categoria: Categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imagem">Imagem {!formData.id && '*'}</Label>
                <div className="flex items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Escolher Imagem
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {selectedFile && (
                    <span className="text-sm text-muted-foreground">
                      {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  )}
                </div>
                
                {imagePreview && (
                  <div className="mt-4">
                    <div className="relative aspect-video overflow-hidden rounded-md border">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="destaque"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={!!formData.destaque}
                    onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                  />
                  <Label htmlFor="destaque" className="text-sm">Destacar esta ferramenta</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="novo"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={!!formData.novo}
                    onChange={(e) => setFormData({ ...formData, novo: e.target.checked })}
                  />
                  <Label htmlFor="novo" className="text-sm">Marcar como nova</Label>
                </div>
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
                disabled={updateFerramentaMutation.isPending || isUploading}
              >
                {(updateFerramentaMutation.isPending || isUploading) && (
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
              Tem certeza que deseja excluir esta ferramenta? 
              Esta ação não pode ser desfeita.
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
              {deleteFerramentaMutation.isPending ? (
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

export default GerenciarFerramentas;