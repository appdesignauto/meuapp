import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { X, Upload, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';

// Esquema para cada formato
const formatSchema = z.object({
  format: z.string().min(1, 'Selecione um formato'),
  imageUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  editUrl: z.string().url('URL de edição inválida').optional().or(z.literal('')),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  fileType: z.string().min(1, 'Selecione um tipo de arquivo'),
});

// Esquema principal
const artMultiSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  isPremium: z.boolean().default(false),
  formats: z.array(formatSchema).min(1, 'Adicione pelo menos um formato'),
});

type FormatData = z.infer<typeof formatSchema>;
type ArtMultiFormData = z.infer<typeof artMultiSchema>;

interface AddArtFormMultiProps {
  onSuccess?: () => void;
}

const AddArtFormMulti = ({ onSuccess }: AddArtFormMultiProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPremium, setIsPremium] = useState(false);
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});
  const [uploadingPreviewMap, setUploadingPreviewMap] = useState<Record<number, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showSubmitAlert, setShowSubmitAlert] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const previewInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // Fetch categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch formats
  const { data: formats } = useQuery<any[]>({
    queryKey: ['/api/formats'],
  });
  
  // Fetch fileTypes
  const { data: fileTypes } = useQuery<any[]>({
    queryKey: ['/api/fileTypes'],
  });
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ArtMultiFormData>({
    resolver: zodResolver(artMultiSchema),
    defaultValues: {
      categoryId: '',
      isPremium: false,
      formats: [{ 
        format: '', 
        imageUrl: '', 
        previewUrl: '',
        editUrl: '', 
        title: '', 
        description: '', 
        fileType: '' 
      }]
    },
  });
  
  // Usar field array para gerenciar campos dinâmicos de formato
  const { fields, append, remove } = useFieldArray({
    control,
    name: "formats",
  });
  
  // Mutation para upload de imagem
  const uploadMutation = useMutation({
    mutationFn: async ({ file, index, isPreview = false }: { file: File, index: number, isPreview?: boolean }) => {
      if (isPreview) {
        setUploadingPreviewMap(prev => ({ ...prev, [index]: true }));
      } else {
        setUploadingMap(prev => ({ ...prev, [index]: true }));
      }
      
      const formData = new FormData();
      formData.append('image', file);
      // Especificar o uso do Supabase Storage
      formData.append('storage', 'supabase');
      
      // Adicionar a categoria selecionada para organização de pastas
      if (selectedCategory) {
        const selected = categories?.find(cat => cat.id.toString() === selectedCategory);
        if (selected?.slug) {
          console.log(`Usando categoria ${selected.name} (${selected.slug}) para organização`);
          formData.append('categorySlug', selected.slug);
        }
      }
      
      // Obter usuário atual para o ID do designer
      try {
        const userData = queryClient.getQueryData<any>(['/api/user']);
        if (userData && userData.id) {
          console.log(`Usando ID do designer ${userData.id} para organização de pastas`);
          formData.append('designerId', userData.id.toString());
        }
      } catch (error) {
        console.warn("Não foi possível obter ID do usuário para organização de pastas");
      }
      
      console.log(`Enviando imagem${isPreview ? ' de prévia' : ''}:`, file.name, file.type, Math.round(file.size/1024) + "KB");
      console.log("Iniciando upload de imagem...");
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer upload da imagem');
      }
      
      const data = await response.json();
      return { data, index, isPreview };
    },
    onSuccess: ({ data, index, isPreview }) => {
      if (isPreview) {
        setValue(`formats.${index}.previewUrl`, data.imageUrl);
      } else {
        setValue(`formats.${index}.imageUrl`, data.imageUrl);
      }
      
      toast({
        title: 'Upload realizado com sucesso',
        description: `Imagem ${isPreview ? 'de prévia ' : ''}enviada para o Supabase Storage`,
      });
    },
    onError: (error: any) => {
      console.error("Erro no upload da imagem:", error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer o upload da imagem.',
        variant: 'destructive',
      });
    },
    onSettled: ({ index, isPreview }) => {
      if (isPreview) {
        setUploadingPreviewMap(prev => ({ ...prev, [index]: false }));
      } else {
        setUploadingMap(prev => ({ ...prev, [index]: false }));
      }
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, isPreview = false) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ file, index, isPreview });
    }
  };
  
  // Mutation para salvar arte com múltiplos formatos
  const saveArtMutation = useMutation({
    mutationFn: async (data: ArtMultiFormData) => {
      const transformedData = {
        ...data,
        categoryId: parseInt(data.categoryId),
        isPremium,
      };
      
      return apiRequest('POST', '/api/admin/arts/multi', transformedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      toast({
        title: 'Arte multi-formato criada',
        description: 'A arte com múltiplos formatos foi criada com sucesso',
        variant: 'default',
      });
      reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar a arte.',
        variant: 'destructive',
      });
    },
  });
  
  // Monitora mudanças na categoria selecionada
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'categoryId') {
        setSelectedCategory(value.categoryId || '');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);
  
  // Verificar se pelo menos um formato tem imagem antes de submeter
  const checkFormatImages = () => {
    const formats = watch('formats');
    const hasImages = formats.some(format => format.imageUrl);
    
    if (!hasImages) {
      toast({
        title: 'Imagens obrigatórias',
        description: 'Adicione pelo menos uma imagem antes de salvar',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };
  
  const onSubmit = (data: ArtMultiFormData) => {
    if (!checkFormatImages()) return;
    setShowSubmitAlert(true);
  };
  
  const confirmSubmit = () => {
    const data = watch();
    saveArtMutation.mutate(data);
    setShowSubmitAlert(false);
  };
  
  const addFormatBlock = () => {
    append({ 
      format: '', 
      imageUrl: '', 
      previewUrl: '',
      editUrl: '', 
      title: '', 
      description: '', 
      fileType: '' 
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Adicionar Arte Multi-Formato</CardTitle>
        <CardDescription>
          Crie uma arte com múltiplos formatos (Feed, Story, Cartaz, etc)
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Categoria (obrigatória, no topo) */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria <span className="text-amber-600">*</span></Label>
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
            {!selectedCategory && (
              <p className="text-xs text-amber-600">
                Selecione uma categoria antes de fazer upload das imagens
              </p>
            )}
          </div>
          
          {/* Opção de Premium */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isPremium"
              checked={isPremium}
              onCheckedChange={setIsPremium}
            />
            <Label htmlFor="isPremium">Arte Premium</Label>
          </div>
          
          <Separator className="my-4" />
          
          {/* Blocos de formato */}
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Formatos</h3>
              <Button 
                type="button" 
                onClick={addFormatBlock}
                className="flex gap-2 items-center"
              >
                <Plus className="h-4 w-4" />
                Adicionar Formato
              </Button>
            </div>
            
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                {/* Botão para remover bloco */}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Formato */}
                  <div className="space-y-2">
                    <Label>Formato <span className="text-amber-600">*</span></Label>
                    <Select
                      value={watch(`formats.${index}.format`)}
                      onValueChange={(value) => setValue(`formats.${index}.format`, value)}
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
                    {errors.formats?.[index]?.format && (
                      <p className="text-sm text-red-500">
                        {errors.formats[index]?.format?.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Tipo de Arquivo */}
                  <div className="space-y-2">
                    <Label>Tipo de Arquivo <span className="text-amber-600">*</span></Label>
                    <Select
                      value={watch(`formats.${index}.fileType`)}
                      onValueChange={(value) => setValue(`formats.${index}.fileType`, value)}
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
                    {errors.formats?.[index]?.fileType && (
                      <p className="text-sm text-red-500">
                        {errors.formats[index]?.fileType?.message}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Upload da imagem */}
                <div className="space-y-2">
                  <Label>Upload de Imagem <span className="text-amber-600">*</span></Label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={(el) => fileInputRefs.current[`format-${index}`] = el}
                      onChange={(e) => handleFileChange(e, index)}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRefs.current[`format-${index}`]?.click()}
                      disabled={uploadingMap[index] || !selectedCategory}
                      className="flex gap-2 items-center"
                    >
                      {uploadingMap[index] ? (
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
                    {!selectedCategory && (
                      <p className="text-sm text-amber-600">
                        Selecione uma categoria primeiro
                      </p>
                    )}
                  </div>
                  <input
                    type="hidden"
                    {...register(`formats.${index}.imageUrl`)}
                  />
                  {watch(`formats.${index}.imageUrl`) && (
                    <div className="mt-2 w-full max-h-40 overflow-hidden rounded border">
                      <img 
                        src={watch(`formats.${index}.imageUrl`)} 
                        alt="Preview" 
                        className="w-full object-contain" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Imagem+Inválida';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Título e descrição */}
                <div className="space-y-2">
                  <Label>Título <span className="text-amber-600">*</span></Label>
                  <Input
                    {...register(`formats.${index}.title`)}
                    placeholder="Título do formato"
                  />
                  {errors.formats?.[index]?.title && (
                    <p className="text-sm text-red-500">
                      {errors.formats[index]?.title?.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição <span className="text-amber-600">*</span></Label>
                  <Textarea
                    {...register(`formats.${index}.description`)}
                    placeholder="Descrição do formato"
                  />
                  {errors.formats?.[index]?.description && (
                    <p className="text-sm text-red-500">
                      {errors.formats[index]?.description?.message}
                    </p>
                  )}
                </div>
                
                {/* URL de edição (opcional) */}
                <div className="space-y-2">
                  <Label>URL de Edição (opcional)</Label>
                  <Input
                    {...register(`formats.${index}.editUrl`)}
                    placeholder="URL para edição no Canva ou Google Drive"
                  />
                  {errors.formats?.[index]?.editUrl && (
                    <p className="text-sm text-red-500">
                      {errors.formats[index]?.editUrl?.message}
                    </p>
                  )}
                </div>
                
                {/* Imagem de prévia (opcional) */}
                <div className="space-y-2">
                  <Label>Imagem de Prévia (opcional)</Label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={(el) => previewInputRefs.current[`preview-${index}`] = el}
                      onChange={(e) => handleFileChange(e, index, true)}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => previewInputRefs.current[`preview-${index}`]?.click()}
                      disabled={uploadingPreviewMap[index] || !selectedCategory}
                      className="flex gap-2 items-center"
                    >
                      {uploadingPreviewMap[index] ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando prévia...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Selecionar Prévia
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    type="hidden"
                    {...register(`formats.${index}.previewUrl`)}
                  />
                  {watch(`formats.${index}.previewUrl`) && (
                    <div className="mt-2 w-full max-h-40 overflow-hidden rounded border">
                      <img 
                        src={watch(`formats.${index}.previewUrl`)} 
                        alt="Preview" 
                        className="w-full object-contain" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Prévia+Inválida';
                        }}
                      />
                    </div>
                  )}
                </div>
                
              </div>
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => reset()}>
            Limpar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || Object.values(uploadingMap).some(v => v) || Object.values(uploadingPreviewMap).some(v => v)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Criar Arte Multi-Formato'
            )}
          </Button>
        </CardFooter>
      </form>
      
      {/* Diálogo de confirmação */}
      <AlertDialog open={showSubmitAlert} onOpenChange={setShowSubmitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar criação de arte multi-formato</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a criar uma arte com {fields.length} formato(s).
              Esta ação não pode ser desfeita facilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AddArtFormMulti;