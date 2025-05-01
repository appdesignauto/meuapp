import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Plus, Trash2, Upload, Image, Check } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { ArtFormatSchema, ArtGroupSchema } from '@shared/interfaces/art-groups';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [selectedImage, setSelectedImage] = useState<{ data: any, index: number, isPreview: boolean } | undefined>(undefined);
  const [images, setImages] = useState<{ [key: string]: string }>({});
  const [previewImages, setPreviewImages] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Estado para controlar os formatos selecionados
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("selection");

  // Consultas para obter dados
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: formats, isLoading: isLoadingFormats } = useQuery({
    queryKey: ['/api/formats'],
  });

  const { data: fileTypes, isLoading: isLoadingFileTypes } = useQuery({
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

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'formats',
  });

  // Efeito para sincronizar os formatos selecionados com o formulário
  useEffect(() => {
    const currentFormats = form.getValues().formats;
    
    // Adicionar novos formatos que foram selecionados
    selectedFormats.forEach(formatSlug => {
      const exists = currentFormats.some(f => f.format === formatSlug);
      if (!exists) {
        append({
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

    // Remover formatos que foram desmarcados
    const newFormats = currentFormats.filter(f => selectedFormats.includes(f.format));
    replace(newFormats);
  }, [selectedFormats, append, replace]);

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
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number, isPreview: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const identifier = isPreview ? `preview-${index}` : `main-${index}`;
    setUploading({ ...uploading, [identifier]: true });
    setUploadProgress({ ...uploadProgress, [identifier]: 0 });

    try {
      // Garantir que a categoria foi selecionada
      const categoryId = form.getValues('categoryId');
      if (!categoryId) {
        toast({
          title: "Selecione uma categoria",
          description: "Você precisa selecionar uma categoria antes de fazer upload de imagens.",
          variant: "destructive",
        });
        setUploading({ ...uploading, [identifier]: false });
        return;
      }

      // Encontrar o nome da categoria para uso na pasta
      const category = categories?.find((cat: any) => cat.id.toString() === categoryId);
      if (!category) {
        toast({
          title: "Categoria não encontrada",
          description: "A categoria selecionada não foi encontrada.",
          variant: "destructive",
        });
        setUploading({ ...uploading, [identifier]: false });
        return;
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
        throw new Error('Falha ao fazer upload da imagem');
      }

      const result = await response.json();

      // Atualizar estado com a URL da imagem
      if (isPreview) {
        setPreviewImages({ ...previewImages, [index]: result.url });
        form.setValue(`formats.${index}.previewUrl`, result.url);
      } else {
        setImages({ ...images, [index]: result.url });
        form.setValue(`formats.${index}.imageUrl`, result.url);
      }

      toast({
        title: "Upload concluído",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Falha ao carregar a imagem",
        variant: "destructive",
      });
    } finally {
      setUploading({ ...uploading, [identifier]: false });
    }
  };

  // Visualizar imagem selecionada
  const handleImagePreview = (index: number, isPreview: boolean = false) => {
    const imageUrl = isPreview ? previewImages[index] : images[index];
    if (imageUrl) {
      setSelectedImage({ data: imageUrl, index, isPreview });
    }
  };

  // Função para continuar para as abas de formatos
  const proceedToFormatTabs = () => {
    if (selectedFormats.length === 0) {
      toast({
        title: "Selecione pelo menos um formato",
        description: "Você precisa selecionar pelo menos um formato para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se a categoria foi selecionada
    const categoryId = form.getValues('categoryId');
    if (!categoryId) {
      toast({
        title: "Selecione uma categoria",
        description: "Você precisa selecionar uma categoria antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    // Definir a primeira aba como ativa
    if (selectedFormats.length > 0) {
      setCurrentTab(selectedFormats[0]);
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
      setCurrentTab("selection");
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

  // Encontrar o índice do formato atual no array de formatos do formulário
  const getFormatIndex = (formatSlug: string) => {
    return form.getValues().formats.findIndex(f => f.format === formatSlug);
  };

  // Função para renderizar o conteúdo de uma aba específica
  const renderFormatTabContent = (formatSlug: string) => {
    const index = getFormatIndex(formatSlug);
    if (index === -1) return null;

    const formatName = formats?.find((f: any) => f.slug === formatSlug)?.name || formatSlug;

    return (
      <Card key={formatSlug} className="border-solid border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Detalhes do formato: {formatName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`formats.${index}.fileType`}>Tipo de Arquivo <span className="text-red-500">*</span></Label>
              <Controller
                control={form.control}
                name={`formats.${index}.fileType`}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.slug}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.formats?.[index]?.fileType && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.formats?.[index]?.fileType?.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`formats.${index}.title`}>Título <span className="text-red-500">*</span></Label>
              <Input
                {...form.register(`formats.${index}.title`)}
                placeholder="Título da arte"
              />
              {form.formState.errors.formats?.[index]?.title && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.formats?.[index]?.title?.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`formats.${index}.description`}>Descrição</Label>
            <Textarea
              {...form.register(`formats.${index}.description`)}
              placeholder="Descrição da arte (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`formats.${index}.editUrl`}>URL de Edição <span className="text-red-500">*</span></Label>
            <Input
              {...form.register(`formats.${index}.editUrl`)}
              placeholder="URL para edição (Canva, Google Drive, etc)"
            />
            {form.formState.errors.formats?.[index]?.editUrl && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.formats?.[index]?.editUrl?.message}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Imagem Principal <span className="text-red-500">*</span></Label>
              <div className="flex items-center space-x-2">
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center w-full h-32 bg-gray-50 ${
                    uploading[`main-${index}`] ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {images[index] ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={images[index]} 
                        alt="Imagem carregada" 
                        className="h-full mx-auto object-contain cursor-pointer"
                        onClick={() => handleImagePreview(index)}
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      {uploading[`main-${index}`] ? (
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
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
                    onChange={(e) => handleImageChange(e, index)}
                    disabled={uploading[`main-${index}`]}
                    accept="image/*"
                  />
                  <input 
                    type="hidden" 
                    {...form.register(`formats.${index}.imageUrl`)}
                    value={images[index] || ''}
                  />
                </div>
              </div>
              {form.formState.errors.formats?.[index]?.imageUrl && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.formats?.[index]?.imageUrl?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imagem de Pré-visualização (opcional)</Label>
              <div className="flex items-center space-x-2">
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center w-full h-32 bg-gray-50 ${
                    uploading[`preview-${index}`] ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {previewImages[index] ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={previewImages[index]} 
                        alt="Pré-visualização" 
                        className="h-full mx-auto object-contain cursor-pointer"
                        onClick={() => handleImagePreview(index, true)}
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      {uploading[`preview-${index}`] ? (
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
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
                    onChange={(e) => handleImageChange(e, index, true)}
                    disabled={uploading[`preview-${index}`]}
                    accept="image/*"
                  />
                  <input 
                    type="hidden" 
                    {...form.register(`formats.${index}.previewUrl`)}
                    value={previewImages[index] || ''}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Função para renderizar a tabela de visão geral
  const renderOverview = () => {
    return (
      <Card className="border-solid border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Visão Geral</CardTitle>
          <CardDescription>
            Verifique todos os formatos antes de salvar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Formato</th>
                  <th className="text-left p-2 border">Tipo</th>
                  <th className="text-left p-2 border">Título</th>
                  <th className="text-left p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {form.getValues().formats.map((format, index) => {
                  const formatName = formats?.find((f: any) => f.slug === format.format)?.name || format.format;
                  const fileTypeName = fileTypes?.find((t: any) => t.slug === format.fileType)?.name || format.fileType;
                  const isComplete = format.title && format.imageUrl && format.editUrl && format.fileType;
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="p-2 border">{formatName}</td>
                      <td className="p-2 border">{fileTypeName}</td>
                      <td className="p-2 border">{format.title || '—'}</td>
                      <td className="p-2 border">
                        {isComplete ? (
                          <span className="flex items-center text-green-600">
                            <Check className="w-4 h-4 mr-1" /> Completo
                          </span>
                        ) : (
                          <span className="text-red-500">Incompleto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
                        {categories?.map((category: any) => (
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

            {/* Tabs para o fluxo de trabalho */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              {/* Tab de seleção de formatos */}
              <TabsContent value="selection" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Formatos<span className="text-red-500">*</span></h3>
                  <p className="text-sm text-gray-500 mb-4">Selecione pelo menos um formato para sua coleção</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {formats?.map((format: any) => (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => toggleFormat(format.slug)}
                        className={`
                          h-16 py-2 px-3 rounded flex items-center justify-center
                          transition-colors duration-200 text-center
                          ${selectedFormats.includes(format.slug) 
                            ? 'bg-blue-600 text-white font-medium'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        {format.name.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button 
                    type="button" 
                    onClick={proceedToFormatTabs}
                    className="flex items-center gap-2"
                  >
                    Continuar
                  </Button>
                </div>
              </TabsContent>

              {/* Tabs para cada formato */}
              {selectedFormats.map(formatSlug => (
                <TabsContent key={formatSlug} value={formatSlug}>
                  {renderFormatTabContent(formatSlug)}
                </TabsContent>
              ))}

              {/* Tab de visão geral */}
              <TabsContent value="overview">
                {renderOverview()}
              </TabsContent>

              {/* Adicionar a TabsList apenas se houver formatos selecionados */}
              {selectedFormats.length > 0 && currentTab !== "selection" && (
                <div className="mt-6">
                  <TabsList className="w-full overflow-x-auto whitespace-nowrap flex">
                    <TabsTrigger value="selection" className="flex-shrink-0">
                      Voltar
                    </TabsTrigger>
                    {selectedFormats.map(formatSlug => {
                      const formatName = formats?.find((f: any) => f.slug === formatSlug)?.name || formatSlug;
                      return (
                        <TabsTrigger key={formatSlug} value={formatSlug} className="flex-shrink-0">
                          {formatName}
                        </TabsTrigger>
                      );
                    })}
                    <TabsTrigger value="overview" className="flex-shrink-0">
                      Visão Geral
                    </TabsTrigger>
                  </TabsList>
                </div>
              )}
            </Tabs>

            {/* Botão de enviar apenas na aba de visão geral */}
            {currentTab === "overview" && (
              <div className="flex justify-end">
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