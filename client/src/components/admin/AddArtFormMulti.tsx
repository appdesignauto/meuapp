import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Upload, Image, X, Check, AlertCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Esquema de formulário com validação
const formSchema = z.object({
  categoryId: z.string().min(1, "Por favor selecione uma categoria"),
  isPremium: z.boolean().default(false),
  formats: z.array(
    z.object({
      format: z.string().min(1, "Formato é obrigatório"),
      fileType: z.string().min(1, "Tipo de arquivo é obrigatório"),
      title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
      description: z.string().optional(),
      imageUrl: z.string().min(5, "URL da imagem é obrigatória"),
      previewUrl: z.string().optional(),
      editUrl: z.string().min(5, "URL de edição é obrigatória"),
    })
  ).min(1, "Adicione pelo menos um formato")
});

type FormValues = z.infer<typeof formSchema>;

export default function AddArtFormMulti() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [images, setImages] = useState<Record<string, string>>({});
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});

  // Estado para controlar os formatos selecionados
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  // Consultas para obter dados
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: formats = [], isLoading: isLoadingFormats } = useQuery({
    queryKey: ['/api/formats'],
  });

  const { data: fileTypes = [], isLoading: isLoadingFileTypes } = useQuery({
    queryKey: ['/api/fileTypes'],
  });

  // Configuração do formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      isPremium: false,
      formats: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'formats',
  });

  // Efeito para sincronizar os formatos selecionados com o formulário
  useEffect(() => {
    // Remover formatos que foram desmarcados
    const currentFormats = form.getValues().formats || [];
    const formatsToKeep = currentFormats.filter(f => selectedFormats.includes(f.format));
    
    // Adicionar novos formatos
    selectedFormats.forEach(formatSlug => {
      const exists = formatsToKeep.some(f => f.format === formatSlug);
      if (!exists) {
        formatsToKeep.push({
          format: formatSlug,
          fileType: '',
          title: '',
          description: '',
          imageUrl: '',
          previewUrl: '',
          editUrl: '',
        });
      }
    });
    
    // Atualizar o formulário
    form.setValue('formats', formatsToKeep);
  }, [selectedFormats, form]);

  // Manipuladores para seleção de formatos
  const toggleFormat = (formatSlug: string) => {
    setSelectedFormats(prev => {
      if (prev.includes(formatSlug)) {
        // Se já estiver selecionado, remova
        return prev.filter(slug => slug !== formatSlug);
      } else {
        // Se não estiver selecionado, adicione
        return [...prev, formatSlug];
      }
    });
  };

  // Manipuladores para upload de imagens
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, formatSlug: string, isPreview: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const identifier = isPreview ? `preview-${formatSlug}` : `main-${formatSlug}`;
    setUploading({ ...uploading, [identifier]: true });
    setUploadError({ ...uploadError, [identifier]: '' });

    try {
      // Garantir que a categoria foi selecionada
      const categoryId = form.getValues('categoryId');
      if (!categoryId) {
        throw new Error("Selecione uma categoria antes de fazer upload de imagens");
      }

      // Encontrar o nome da categoria para uso na pasta
      const category = categories.find((cat: any) => cat.id.toString() === categoryId);
      if (!category) {
        throw new Error("Categoria não encontrada");
      }

      // Criar FormData para upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category.slug || 'default');

      // Fazer upload da imagem
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao fazer upload da imagem');
      }

      const result = await response.json();

      // Atualizar estado com a URL da imagem
      const index = form.getValues().formats.findIndex(f => f.format === formatSlug);
      if (index === -1) {
        throw new Error("Formato não encontrado no formulário");
      }

      if (isPreview) {
        setPreviewImages({ ...previewImages, [formatSlug]: result.imageUrl });
        form.setValue(`formats.${index}.previewUrl`, result.imageUrl);
      } else {
        setImages({ ...images, [formatSlug]: result.imageUrl });
        form.setValue(`formats.${index}.imageUrl`, result.imageUrl);
      }

      toast({
        title: "Upload concluído",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao carregar a imagem";
      setUploadError({ ...uploadError, [identifier]: errorMessage });
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading({ ...uploading, [identifier]: false });
    }
  };

  // Mutação para salvar a arte
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Converter IDs para números e formatar dados
      const formattedData = {
        categoryId: parseInt(data.categoryId),
        isPremium: data.isPremium,
        formats: data.formats.map(format => ({
          ...format,
          previewUrl: format.previewUrl || null,
        })),
      };

      const response = await apiRequest('POST', '/api/admin/arts/multi', formattedData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Arte salva com sucesso",
        description: "A arte com múltiplos formatos foi criada.",
      });
      form.reset({
        categoryId: '',
        isPremium: false,
        formats: []
      });
      setImages({});
      setPreviewImages({});
      setSelectedFormats([]);
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a arte. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Manipulador de envio do formulário
  const onSubmit = (data: FormValues) => {
    submitMutation.mutate(data);
  };

  // Estado de carregamento
  const isLoading = isLoadingCategories || isLoadingFormats || isLoadingFileTypes;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Função para renderizar cada formato
  const renderFormatBlock = (formatSlug: string) => {
    // Encontrar o formato nos dados do formulário
    const formatIndex = form.getValues().formats.findIndex(f => f.format === formatSlug);
    if (formatIndex === -1) return null;
    
    // Encontrar informações do formato na lista de formatos
    const formatInfo = formats.find((f: any) => f.slug === formatSlug);
    const formatName = formatInfo ? formatInfo.name : formatSlug;

    return (
      <div key={formatSlug} className="mt-6 p-5 border border-gray-200 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{formatName}</h3>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => toggleFormat(formatSlug)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor={`formats.${formatIndex}.fileType`}>Tipo de Arquivo <span className="text-red-500">*</span></Label>
            <Controller
              control={form.control}
              name={`formats.${formatIndex}.fileType`}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.slug}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.formats?.[formatIndex]?.fileType && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.formats?.[formatIndex]?.fileType?.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`formats.${formatIndex}.title`}>Título <span className="text-red-500">*</span></Label>
            <Input
              {...form.register(`formats.${formatIndex}.title`)}
              placeholder="Título da arte"
            />
            {form.formState.errors.formats?.[formatIndex]?.title && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.formats?.[formatIndex]?.title?.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <Label htmlFor={`formats.${formatIndex}.description`}>Descrição</Label>
          <Textarea
            {...form.register(`formats.${formatIndex}.description`)}
            placeholder="Descrição da arte (opcional)"
            rows={3}
          />
        </div>

        <div className="space-y-2 mb-4">
          <Label htmlFor={`formats.${formatIndex}.editUrl`}>URL de Edição <span className="text-red-500">*</span></Label>
          <Input
            {...form.register(`formats.${formatIndex}.editUrl`)}
            placeholder="URL para edição (Canva, Google Drive, etc)"
          />
          {form.formState.errors.formats?.[formatIndex]?.editUrl && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.formats?.[formatIndex]?.editUrl?.message}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Upload de imagem principal */}
          <div className="space-y-2">
            <Label>Imagem Principal <span className="text-red-500">*</span></Label>
            <div className="flex items-center space-x-2">
              <div 
                className={`relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center w-full h-36 ${
                  uploading[`main-${formatSlug}`] 
                    ? 'border-blue-300 bg-blue-50' 
                    : uploadError[`main-${formatSlug}`] 
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                }`}
              >
                {images[formatSlug] ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={images[formatSlug]} 
                      alt="Imagem carregada" 
                      className="h-full mx-auto object-contain cursor-pointer"
                    />
                    {/* Ícone de sucesso */}
                    <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    {uploading[`main-${formatSlug}`] ? (
                      <>
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                        <p className="text-sm text-blue-500 mt-2">Enviando...</p>
                      </>
                    ) : uploadError[`main-${formatSlug}`] ? (
                      <>
                        <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                        <p className="text-sm text-red-500 mt-2">Erro no upload</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Clique para fazer upload</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleImageChange(e, formatSlug)}
                  disabled={uploading[`main-${formatSlug}`]}
                  accept="image/*"
                />
                <input 
                  type="hidden" 
                  {...form.register(`formats.${formatIndex}.imageUrl`)}
                  value={images[formatSlug] || ''}
                />
              </div>
            </div>
            {form.formState.errors.formats?.[formatIndex]?.imageUrl && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.formats?.[formatIndex]?.imageUrl?.message}
              </p>
            )}
          </div>

          {/* Upload de preview (opcional) */}
          <div className="space-y-2">
            <Label>Imagem de Pré-visualização (opcional)</Label>
            <div className="flex items-center space-x-2">
              <div 
                className={`relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center w-full h-36 ${
                  uploading[`preview-${formatSlug}`] 
                    ? 'border-blue-300 bg-blue-50' 
                    : uploadError[`preview-${formatSlug}`] 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                }`}
              >
                {previewImages[formatSlug] ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={previewImages[formatSlug]} 
                      alt="Pré-visualização" 
                      className="h-full mx-auto object-contain cursor-pointer"
                    />
                    {/* Ícone de sucesso */}
                    <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    {uploading[`preview-${formatSlug}`] ? (
                      <>
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                        <p className="text-sm text-blue-500 mt-2">Enviando...</p>
                      </>
                    ) : uploadError[`preview-${formatSlug}`] ? (
                      <>
                        <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                        <p className="text-sm text-red-500 mt-2">Erro no upload</p>
                      </>
                    ) : (
                      <>
                        <Image className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Pré-visualização (opcional)</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleImageChange(e, formatSlug, true)}
                  disabled={uploading[`preview-${formatSlug}`]}
                  accept="image/*"
                />
                <input 
                  type="hidden" 
                  {...form.register(`formats.${formatIndex}.previewUrl`)}
                  value={previewImages[formatSlug] || ''}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Arte Multi-Formato</CardTitle>
          <CardDescription>
            Crie uma arte com variações para diferentes formatos (feed, stories, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção de Categoria e Premium (comum para todos os formatos) */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria <span className="text-red-500">*</span></Label>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Controller
                  control={form.control}
                  name="isPremium"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isPremium"
                    />
                  )}
                />
                <Label htmlFor="isPremium">Arte Premium</Label>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Seleção de formatos */}
            <div>
              <h3 className="text-lg font-medium mb-4">Formatos<span className="text-red-500">*</span></h3>
              <p className="text-sm text-gray-500 mb-4">Selecione um ou mais formatos para sua arte</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formats.map((format: any) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => toggleFormat(format.slug)}
                    className={`
                      py-3 px-4 rounded-lg font-medium text-center
                      transition-colors duration-200
                      ${selectedFormats.includes(format.slug) 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {format.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Container para blocos de formatos */}
            <div id="blocos-formatos">
              {selectedFormats.map(renderFormatBlock)}
            </div>

            {/* Resumo dos formatos selecionados */}
            {selectedFormats.length > 0 && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-2">Formatos selecionados:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFormats.map(formatSlug => {
                    const formatInfo = formats.find((f: any) => f.slug === formatSlug);
                    const formatName = formatInfo ? formatInfo.name : formatSlug;
                    
                    // Verificar se os campos obrigatórios estão preenchidos
                    const formatIndex = form.getValues().formats.findIndex(f => f.format === formatSlug);
                    const formatData = form.getValues().formats[formatIndex];
                    const isComplete = formatData && formatData.title && formatData.imageUrl && formatData.editUrl && formatData.fileType;
                    
                    return (
                      <div key={formatSlug} className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        isComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formatName}
                        {isComplete ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botão de enviar */}
            {selectedFormats.length > 0 && (
              <div className="flex justify-end mt-8">
                <Button 
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="px-8"
                >
                  {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Arte
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}