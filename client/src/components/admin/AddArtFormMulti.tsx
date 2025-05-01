import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { User, Plus, Trash2, Check, X, FileImage, PenLine } from 'lucide-react';

// Definição do esquema para validação do formulário principal
const artGroupSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  isPremium: z.boolean().optional()
});

// Definição do esquema para validação de cada variação
const variationSchema = z.object({
  formatId: z.string().min(1, 'Selecione um formato'),
  fileTypeId: z.string().min(1, 'Selecione um tipo de arquivo'),
  editUrl: z.string().optional(),
  isPrimary: z.boolean().optional()
});

const AddArtFormMulti = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estado para controlar o passo atual do formulário
  const [step, setStep] = useState(1);
  
  // Estado para armazenar as variações de formato
  const [variations, setVariations] = useState<any[]>([{
    formatId: '',
    fileTypeId: '',
    editUrl: '',
    isPrimary: true,
    image: null,
    imagePreview: null
  }]);
  
  // Estado para controlar a aba de variação ativa
  const [activeVariationTab, setActiveVariationTab] = useState('variation-0');
  
  // Consultas para obter dados necessários
  const { data: categories, isLoading: isLoadingCategories } = useQuery({ 
    queryKey: ['/api/categories'],
  });
  
  const { data: formats, isLoading: isLoadingFormats } = useQuery({ 
    queryKey: ['/api/formats'],
  });
  
  const { data: fileTypes, isLoading: isLoadingFileTypes } = useQuery({ 
    queryKey: ['/api/fileTypes'],
  });
  
  // Formulário principal para os dados do grupo
  const form = useForm<z.infer<typeof artGroupSchema>>({
    resolver: zodResolver(artGroupSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      isPremium: false
    }
  });
  
  // Mutação para criar o grupo de arte
  const createArtMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/art-groups', data, {
        isFormData: true
      });
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: () => {
      toast({
        title: 'Arte criada com sucesso!',
        description: 'A arte foi adicionada ao sistema.',
        variant: 'default'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      navigate('/admin/arts');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar arte',
        description: error.message || 'Ocorreu um erro ao adicionar a arte.',
        variant: 'destructive'
      });
    }
  });
  
  // Adicionar uma nova variação
  const addVariation = () => {
    // Verificar se já existem variações para todos os formatos disponíveis
    if (formats && variations.length >= formats.length) {
      toast({
        title: 'Limite de formatos atingido',
        description: 'Você já adicionou todos os formatos disponíveis.',
        variant: 'destructive'
      });
      return;
    }
    
    // Verificar formatos já utilizados
    const usedFormatIds = variations.map(v => v.formatId);
    const remainingFormats = formats?.filter(f => !usedFormatIds.includes(f.id.toString()));
    
    if (!remainingFormats?.length) {
      toast({
        title: 'Todos os formatos já foram adicionados',
        description: 'Você já adicionou todos os formatos disponíveis.',
        variant: 'destructive'
      });
      return;
    }
    
    const newVariation = {
      formatId: '',
      fileTypeId: '',
      editUrl: '',
      isPrimary: false,
      image: null,
      imagePreview: null
    };
    
    setVariations([...variations, newVariation]);
    const newIndex = variations.length;
    setActiveVariationTab(`variation-${newIndex}`);
  };
  
  // Remover uma variação
  const removeVariation = (index: number) => {
    if (variations.length <= 1) {
      toast({
        title: 'Operação não permitida',
        description: 'É necessário pelo menos uma variação de formato.',
        variant: 'destructive'
      });
      return;
    }
    
    // Se a variação sendo removida é a primária, definir a primeira como primária
    if (variations[index].isPrimary) {
      const newVariations = [...variations];
      // Remover a variação solicitada
      newVariations.splice(index, 1);
      // Definir a primeira variação restante como primária
      if (newVariations.length > 0) {
        newVariations[0].isPrimary = true;
      }
      setVariations(newVariations);
    } else {
      // Caso não seja a primária, simplesmente remover
      const newVariations = [...variations];
      newVariations.splice(index, 1);
      setVariations(newVariations);
    }
    
    // Ajustar a aba ativa
    setActiveVariationTab(`variation-${Math.max(0, index - 1)}`);
  };
  
  // Atualizar uma variação
  const updateVariation = (index: number, field: string, value: any) => {
    const newVariations = [...variations];
    
    // Caso especial para definir como primária
    if (field === 'isPrimary' && value === true) {
      // Remover a marca primária de todas as variações
      newVariations.forEach(variation => {
        variation.isPrimary = false;
      });
    }
    
    newVariations[index] = {
      ...newVariations[index],
      [field]: value
    };
    
    setVariations(newVariations);
  };
  
  // Manipular upload de imagem para uma variação
  const handleImageChange = (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const newVariations = [...variations];
      newVariations[index] = {
        ...newVariations[index],
        image: file,
        imagePreview: reader.result as string
      };
      setVariations(newVariations);
    };
    reader.readAsDataURL(file);
  };
  
  // Verificar se o formato já foi selecionado em outra variação
  const isFormatUsed = (formatId: string, currentIndex: number) => {
    return variations.some((v, idx) => 
      idx !== currentIndex && v.formatId === formatId
    );
  };
  
  // Enviar o formulário
  const onSubmit = async (values: z.infer<typeof artGroupSchema>) => {
    // Validar se pelo menos uma variação tem imagem
    const hasImage = variations.some(v => v.image);
    if (!hasImage) {
      toast({
        title: 'Imagem obrigatória',
        description: 'Adicione pelo menos uma imagem para continuar.',
        variant: 'destructive'
      });
      return;
    }
    
    // Validar se todas as variações têm formato e tipo de arquivo selecionados
    const incompleteVariations = variations.filter(v => 
      v.image && (!v.formatId || !v.fileTypeId)
    );
    
    if (incompleteVariations.length > 0) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha formato e tipo de arquivo para todas as variações com imagem.',
        variant: 'destructive'
      });
      return;
    }
    
    // Encontrar a variação primária
    const primaryVariation = variations.find(v => v.isPrimary);
    if (!primaryVariation?.image) {
      toast({
        title: 'Variação principal requerida',
        description: 'A variação principal deve ter uma imagem.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Preparar os dados para envio - primeiro criamos o grupo com a variação primária
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('categoryId', values.categoryId);
      formData.append('isPremium', values.isPremium ? 'true' : 'false');
      formData.append('formatId', primaryVariation.formatId);
      formData.append('fileTypeId', primaryVariation.fileTypeId);
      formData.append('editUrl', primaryVariation.editUrl || '');
      formData.append('image', primaryVariation.image);
      
      // Criar o grupo com a variação primária
      const result = await createArtMutation.mutateAsync(formData);
      
      // Agora, adicionar as variações restantes
      const otherVariations = variations.filter(v => !v.isPrimary && v.image);
      
      if (otherVariations.length > 0) {
        let failedVariations = 0;
        
        // Adicionar cada variação adicional sequencialmente
        for (const variation of otherVariations) {
          try {
            const variationFormData = new FormData();
            variationFormData.append('formatId', variation.formatId);
            variationFormData.append('fileTypeId', variation.fileTypeId);
            variationFormData.append('editUrl', variation.editUrl || '');
            variationFormData.append('image', variation.image);
            
            await apiRequest('POST', `/api/art-groups/${result.id}/variations`, variationFormData, {
              isFormData: true
            });
          } catch (error) {
            console.error('Erro ao adicionar variação:', error);
            failedVariations++;
          }
        }
        
        if (failedVariations > 0) {
          toast({
            title: 'Atenção',
            description: `Arte criada, mas ${failedVariations} variações não puderam ser adicionadas.`,
            variant: 'warning'
          });
        }
      }
      
      // Navegar para a lista de artes
      navigate('/admin/arts');
    } catch (error) {
      console.error('Erro ao criar arte:', error);
    }
  };
  
  // Renderizar preview das variações
  const renderVariationPreview = (variation: any, index: number) => {
    const format = formats?.find(f => f.id.toString() === variation.formatId);
    const fileType = fileTypes?.find(f => f.id.toString() === variation.fileTypeId);
    
    return (
      <div className="relative group overflow-hidden rounded-md border">
        {variation.imagePreview ? (
          <div className="aspect-[4/3] bg-muted">
            <img 
              src={variation.imagePreview} 
              alt={`Prévia da variação ${index + 1}`}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground">
            <FileImage size={40} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="flex flex-wrap gap-1">
            {format && (
              <Badge variant="secondary" className="text-xs">
                {format.name}
              </Badge>
            )}
            {fileType && (
              <Badge variant="outline" className="text-xs text-white">
                {fileType.name}
              </Badge>
            )}
            {variation.isPrimary && (
              <Badge variant="default" className="text-xs">
                Principal
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (isLoadingCategories || isLoadingFormats || isLoadingFileTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Arte</CardTitle>
          <CardDescription>
            Crie uma nova arte com múltiplas variações de formato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={`step-${step}`} onValueChange={(value) => setStep(parseInt(value.split('-')[1]))}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="step-1">Informações Básicas</TabsTrigger>
              <TabsTrigger value="step-2">Formatos</TabsTrigger>
              <TabsTrigger value="step-3">Revisão</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="step-1" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Arte</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o título da arte" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category: any) => (
                              <SelectItem 
                                key={category.id} 
                                value={category.id.toString()}
                              >
                                {category.name}
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
                    name="isPremium"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Arte Premium</FormLabel>
                          <FormDescription>
                            Marque esta opção para disponibilizar apenas para usuários premium.
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="button" 
                      onClick={() => setStep(2)}
                      disabled={!form.formState.isValid}
                    >
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="step-2" className="space-y-4 mt-4">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Formatos da Arte</h3>
                    <Button 
                      type="button" 
                      onClick={addVariation}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Plus size={16} />
                      Adicionar Formato
                    </Button>
                  </div>
                  
                  <Tabs 
                    value={activeVariationTab} 
                    onValueChange={setActiveVariationTab}
                    className="w-full"
                  >
                    <TabsList className="flex-wrap">
                      {variations.map((_, index) => (
                        <TabsTrigger 
                          key={`tab-${index}`} 
                          value={`variation-${index}`}
                          className="relative"
                        >
                          Formato {index + 1}
                          {variations.length > 1 && (
                            <button
                              type="button"
                              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeVariation(index);
                              }}
                            >
                              <X size={10} />
                            </button>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {variations.map((variation, index) => (
                      <TabsContent key={`content-${index}`} value={`variation-${index}`} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <FormLabel>Formato</FormLabel>
                              <Select
                                value={variation.formatId}
                                onValueChange={(value) => {
                                  if (isFormatUsed(value, index)) {
                                    toast({
                                      title: 'Formato já utilizado',
                                      description: 'Este formato já está sendo usado em outra variação.',
                                      variant: 'destructive'
                                    });
                                    return;
                                  }
                                  updateVariation(index, 'formatId', value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um formato" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formats?.map((format: any) => (
                                    <SelectItem 
                                      key={format.id} 
                                      value={format.id.toString()}
                                      disabled={isFormatUsed(format.id.toString(), index)}
                                    >
                                      {format.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <FormLabel>Tipo de Arquivo</FormLabel>
                              <Select
                                value={variation.fileTypeId}
                                onValueChange={(value) => updateVariation(index, 'fileTypeId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um tipo de arquivo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fileTypes?.map((fileType: any) => (
                                    <SelectItem 
                                      key={fileType.id} 
                                      value={fileType.id.toString()}
                                    >
                                      {fileType.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <FormLabel>URL de Edição</FormLabel>
                              <Input
                                placeholder="URL para edição (Canva, Google Slides, etc.)"
                                value={variation.editUrl || ''}
                                onChange={(e) => updateVariation(index, 'editUrl', e.target.value)}
                              />
                              <FormDescription>
                                Insira um link para edição externa (opcional).
                              </FormDescription>
                            </div>
                            
                            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                              <Checkbox
                                checked={variation.isPrimary}
                                onCheckedChange={(checked) => {
                                  updateVariation(index, 'isPrimary', checked);
                                }}
                                disabled={variation.isPrimary}
                              />
                              <div className="space-y-1 leading-none">
                                <FormLabel>Definir como principal</FormLabel>
                                <FormDescription>
                                  Esta é a variação mostrada na galeria.
                                </FormDescription>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <FormLabel>Imagem</FormLabel>
                            <div className="border rounded-md p-4 flex flex-col items-center justify-center min-h-[200px]">
                              {variation.imagePreview ? (
                                <div className="space-y-4 w-full">
                                  <div className="aspect-[4/3] relative group">
                                    <img 
                                      src={variation.imagePreview} 
                                      alt="Preview" 
                                      className="w-full h-full object-contain rounded-md"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          updateVariation(index, 'image', null);
                                          updateVariation(index, 'imagePreview', null);
                                        }}
                                      >
                                        Remover
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <FileImage className="h-16 w-16 mx-auto text-muted-foreground" />
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    Clique para selecionar uma imagem
                                  </p>
                                  <Input
                                    type="file"
                                    onChange={(e) => handleImageChange(index, e.target.files)}
                                    accept="image/*"
                                    className="mt-4"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                  
                  <div className="pt-4 flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setStep(3)}
                    >
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="step-3" className="space-y-4 mt-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Revisão</h3>
                    <p className="text-muted-foreground">
                      Verifique os detalhes antes de publicar.
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 border rounded-md space-y-2">
                      <h4 className="font-medium">Informações Básicas</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Título:</span>
                          <p>{form.getValues("title")}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Categoria:</span>
                          <p>
                            {categories?.find((c: any) => 
                              c.id.toString() === form.getValues("categoryId")
                            )?.name || 'Não selecionada'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Premium:</span>
                          <p>{form.getValues("isPremium") ? 'Sim' : 'Não'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-md space-y-2">
                      <h4 className="font-medium">Formatos ({variations.filter(v => v.image).length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {variations.map((variation, index) => 
                          variation.image && renderVariationPreview(variation, index)
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(2)}
                    >
                      Voltar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createArtMutation.isPending}
                    >
                      {createArtMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Publicar Arte
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddArtFormMulti;