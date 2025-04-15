import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X, Upload, Loader2 } from 'lucide-react';
import { Art } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Esquema de validação
const artSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  imageUrl: z.string().url('URL da imagem inválida'),
  editUrl: z.string().url('URL de edição inválida').optional().or(z.literal('')),
  isPremium: z.boolean().default(false),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  collectionId: z.string().min(1, 'Selecione uma coleção'),
  format: z.string().min(1, 'Selecione um formato'),
  fileType: z.string().min(1, 'Selecione um tipo de arquivo'),
});

type ArtFormData = z.infer<typeof artSchema>;

interface ArtFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingArt: Art | null;
}

const ArtForm = ({ isOpen, onClose, editingArt }: ArtFormProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPremium, setIsPremium] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch collections
  const { data: collectionsData } = useQuery<{collections: any[]}>({
    queryKey: ['/api/collections'],
  });
  const collections = collectionsData?.collections;
  
  // Fetch formats
  const { data: formats } = useQuery<any[]>({
    queryKey: ['/api/formats'],
  });
  
  // Fetch fileTypes
  const { data: fileTypes } = useQuery<any[]>({
    queryKey: ['/api/fileTypes'],
  });
  
  // Mutation para upload de imagem
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer upload da imagem');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // A API retorna as URLs da imagem original e da thumbnail
      setValue('imageUrl', data.imageUrl);
      toast({
        title: 'Upload realizado',
        description: 'Imagem enviada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer o upload da imagem.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ArtFormData>({
    resolver: zodResolver(artSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      editUrl: '',
      isPremium: false,
      categoryId: '',
      collectionId: '',
      format: '',
      fileType: '',
    },
  });

  // Mutation para criar/atualizar arte
  const mutation = useMutation({
    mutationFn: async (data: ArtFormData) => {
      const transformedData = {
        ...data,
        categoryId: parseInt(data.categoryId),
        collectionId: parseInt(data.collectionId),
        isPremium,
      };
      
      if (editingArt) {
        return apiRequest('PUT', `/api/admin/arts/${editingArt.id}`, transformedData);
      } else {
        return apiRequest('POST', '/api/admin/arts', transformedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      toast({
        title: editingArt ? 'Arte atualizada' : 'Arte criada',
        description: editingArt 
          ? 'A arte foi atualizada com sucesso' 
          : 'A arte foi criada com sucesso',
        variant: 'default',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar a arte.',
        variant: 'destructive',
      });
    },
  });

  // Preenche o formulário quando está editando
  useEffect(() => {
    if (editingArt) {
      setValue('title', editingArt.title);
      setValue('description', editingArt.description || '');
      setValue('imageUrl', editingArt.imageUrl);
      setValue('editUrl', editingArt.editUrl || '');
      setValue('categoryId', editingArt.categoryId.toString());
      setValue('collectionId', editingArt.collectionId?.toString() || '1'); // Usa o primeiro como fallback
      setValue('format', editingArt.format || '');
      setValue('fileType', editingArt.fileType || '');
      setIsPremium(editingArt.isPremium);
    }
  }, [editingArt, setValue]);

  const onSubmit = (data: ArtFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingArt ? 'Editar Arte' : 'Adicionar Nova Arte'}
          </DialogTitle>
          <DialogDescription>
            {editingArt
              ? 'Atualize as informações da arte abaixo.'
              : 'Preencha os detalhes da nova arte abaixo.'}
          </DialogDescription>
          <Button 
            className="absolute right-4 top-4" 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Título da arte"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descrição da arte"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Upload de Imagem</Label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex gap-2 items-center"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Selecionar Imagem
                    </>
                  )}
                </Button>
                {uploading && (
                  <p className="text-sm text-muted-foreground">
                    Enviando e otimizando imagem...
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input
                id="imageUrl"
                {...register('imageUrl')}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-500">{errors.imageUrl.message}</p>
              )}
              {watch('imageUrl') && (
                <div className="mt-2 w-full max-h-40 overflow-hidden rounded border">
                  <img 
                    src={watch('imageUrl')} 
                    alt="Preview" 
                    className="w-full object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Imagem+Inválida';
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="editUrl">URL de Edição (opcional)</Label>
              <Input
                id="editUrl"
                {...register('editUrl')}
                placeholder="URL para edição no Canva ou Google Drive"
              />
              {errors.editUrl && (
                <p className="text-sm text-red-500">{errors.editUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <Select
                value={watch('categoryId')}
                onValueChange={(value) => setValue('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-500">{errors.categoryId.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collectionId">Coleção</Label>
              <Select
                value={watch('collectionId')}
                onValueChange={(value) => setValue('collectionId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma coleção" />
                </SelectTrigger>
                <SelectContent>
                  {collections?.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id.toString()}>
                      {collection.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.collectionId && (
                <p className="text-sm text-red-500">{errors.collectionId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select
                value={watch('format')}
                onValueChange={(value) => setValue('format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um formato" />
                </SelectTrigger>
                <SelectContent>
                  {formats?.map((format) => (
                    <SelectItem key={format.id} value={format.name}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.format && (
                <p className="text-sm text-red-500">{errors.format.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileType">Tipo de Arquivo</Label>
              <Select
                value={watch('fileType')}
                onValueChange={(value) => setValue('fileType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {fileTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fileType && (
                <p className="text-sm text-red-500">{errors.fileType.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="isPremium" 
                checked={isPremium}
                onCheckedChange={setIsPremium}
              />
              <Label htmlFor="isPremium">Arte Premium</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : editingArt ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ArtForm;