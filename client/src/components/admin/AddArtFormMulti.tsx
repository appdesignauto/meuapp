import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Plus, Trash2, Upload, Image } from 'lucide-react';

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
      formats: [
        {
          format: '',
          fileType: '',
          title: '',
          description: '',
          imageUrl: '',
          previewUrl: '',
          editUrl: '',
        }
      ]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'formats',
  });

  // Função para adicionar um novo formato
  const addFormat = () => {
    append({
      format: '',
      fileType: '',
      title: '',
      description: '',
      imageUrl: '',
      previewUrl: '',
      editUrl: '',
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
        formats: [
          {
            format: '',
            fileType: '',
            title: '',
            description: '',
            imageUrl: '',
            previewUrl: '',
            editUrl: '',
          }
        ]
      });
      setImages({});
      setPreviewImages({});
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

            {/* Seção dinâmica para formatos */}
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Formatos da Arte</h3>
                <Button 
                  type="button" 
                  onClick={addFormat} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Adicionar Formato
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="border-dashed">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">Formato {index + 1}</CardTitle>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`formats.${index}.format`}>Formato <span className="text-red-500">*</span></Label>
                        <Controller
                          control={form.control}
                          name={`formats.${index}.format`}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o formato" />
                              </SelectTrigger>
                              <SelectContent>
                                {formats?.map((format: any) => (
                                  <SelectItem key={format.id} value={format.slug}>
                                    {format.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.formState.errors.formats?.[index]?.format && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.formats?.[index]?.format?.message}
                          </p>
                        )}
                      </div>
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

                    <div className="space-y-2">
                      <Label htmlFor={`formats.${index}.description`}>Descrição</Label>
                      <Textarea
                        {...form.register(`formats.${index}.description`)}
                        placeholder="Descrição da arte"
                        rows={3}
                      />
                      {form.formState.errors.formats?.[index]?.description && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.formats?.[index]?.description?.message}
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Imagem Principal <span className="text-red-500">*</span></Label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageChange(e, index)}
                              className="flex-1"
                              disabled={uploading[`main-${index}`]}
                            />
                            {images[index] && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleImagePreview(index)}
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {uploading[`main-${index}`] && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${uploadProgress[`main-${index}`] || 0}%` }}
                              ></div>
                            </div>
                          )}
                          <Input
                            {...form.register(`formats.${index}.imageUrl`)}
                            placeholder="URL da imagem"
                            value={images[index] || form.getValues(`formats.${index}.imageUrl`)}
                            readOnly
                            className="hidden"
                          />
                          {form.formState.errors.formats?.[index]?.imageUrl && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.formats?.[index]?.imageUrl?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Imagem de Pré-visualização (opcional)</Label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageChange(e, index, true)}
                              className="flex-1"
                              disabled={uploading[`preview-${index}`]}
                            />
                            {previewImages[index] && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleImagePreview(index, true)}
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {uploading[`preview-${index}`] && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${uploadProgress[`preview-${index}`] || 0}%` }}
                              ></div>
                            </div>
                          )}
                          <Input
                            {...form.register(`formats.${index}.previewUrl`)}
                            placeholder="URL da pré-visualização"
                            value={previewImages[index] || form.getValues(`formats.${index}.previewUrl`)}
                            readOnly
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`formats.${index}.editUrl`}>URL de Edição <span className="text-red-500">*</span></Label>
                      <Input
                        {...form.register(`formats.${index}.editUrl`)}
                        placeholder="URL para edição da arte (ex: link do Canva)"
                      />
                      {form.formState.errors.formats?.[index]?.editUrl && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.formats?.[index]?.editUrl?.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {form.formState.errors.formats && !Array.isArray(form.formState.errors.formats) && (
                <Alert variant="destructive">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {form.formState.errors.formats.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
                className="flex items-center gap-2"
              >
                {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar Arte
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedImage(undefined)}>
          <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {selectedImage.isPreview ? 'Pré-visualização' : 'Imagem Principal'} - Formato {selectedImage.index + 1}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedImage(undefined)}>
                ✕
              </Button>
            </div>
            <div className="overflow-auto">
              <img 
                src={selectedImage.data} 
                alt="Preview" 
                className="max-w-full h-auto" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}