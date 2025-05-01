import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Loader2, 
  Upload, 
  Check, 
  X, 
  Edit, 
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CreateArtGroupRequest, AddVariationRequest } from '@shared/interfaces/art-groups';

// Esquema para validação do formulário
const createArtSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  categoryId: z.string().min(1, { message: 'Selecione uma categoria' }),
  isPremium: z.boolean().default(false),
  formatId: z.string().min(1, { message: 'Selecione um formato' }),
  fileTypeId: z.string().min(1, { message: 'Selecione um tipo de arquivo' }),
  editUrl: z.string().url({ message: 'URL de edição inválida' }).optional().or(z.literal('')),
});

type CreateArtFormValues = z.infer<typeof createArtSchema>;

interface Variation {
  formatId: string;
  fileTypeId: string;
  imageFile: File | null;
  editUrl?: string;
  isPrimary?: boolean;
  imagePreview?: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

const AddArtFormMulti = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [step, setStep] = useState<'info' | 'variations' | 'success'>('info');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados das categorias, formatos e tipos de arquivo
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
  });

  const { data: formats, isLoading: isLoadingFormats } = useQuery({
    queryKey: ['/api/formats'],
    queryFn: () => fetch('/api/formats').then(res => res.json()),
  });

  const { data: fileTypes, isLoading: isLoadingFileTypes } = useQuery({
    queryKey: ['/api/fileTypes'],
    queryFn: () => fetch('/api/fileTypes').then(res => res.json()),
  });

  // Formulário com validação
  const form = useForm<CreateArtFormValues>({
    resolver: zodResolver(createArtSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      isPremium: false,
      formatId: '',
      fileTypeId: '',
      editUrl: '',
    },
  });

  // Manipuladores para imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Adicionar variação à lista
  const addVariation = () => {
    const newVariation: Variation = {
      formatId: '',
      fileTypeId: '',
      imageFile: null,
      editUrl: '',
      isPrimary: false,
      status: 'idle',
    };
    setVariations([...variations, newVariation]);
  };

  // Remover variação da lista
  const removeVariation = (index: number) => {
    const updatedVariations = [...variations];
    updatedVariations.splice(index, 1);
    setVariations(updatedVariations);
  };

  // Atualizar propriedades da variação
  const updateVariation = (index: number, field: keyof Variation, value: any) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setVariations(updatedVariations);
  };

  // Manipular mudança de imagem para variação
  const handleVariationImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        updateVariation(index, 'imagePreview', event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      updateVariation(index, 'imageFile', file);
    }
  };

  // Criar grupo de arte (primeira etapa)
  const createArtGroup = async (data: CreateArtFormValues) => {
    if (!imageFile) {
      toast({
        title: 'Imagem obrigatória',
        description: 'Por favor, selecione uma imagem para a arte',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar FormData para envio
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('categoryId', data.categoryId);
      formData.append('isPremium', data.isPremium ? 'true' : 'false');
      formData.append('formatId', data.formatId);
      formData.append('fileTypeId', data.fileTypeId);
      if (data.editUrl) formData.append('editUrl', data.editUrl);
      formData.append('image', imageFile);

      // Enviar para a API
      const response = await fetch('/api/art-groups', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar grupo de arte');
      }

      const result = await response.json();
      setGroupId(result.id);
      
      // Avançar para a próxima etapa
      setStep('variations');
      
      toast({
        title: 'Grupo de arte criado',
        description: 'Agora você pode adicionar variações desta arte',
      });

    } catch (error: any) {
      toast({
        title: 'Erro ao criar grupo de arte',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar variação
  const uploadVariation = async (variation: Variation, index: number) => {
    if (!groupId || !variation.imageFile) return;
    
    // Atualizar status para uploading
    updateVariation(index, 'status', 'uploading');
    
    try {
      // Criar FormData para envio
      const formData = new FormData();
      formData.append('formatId', variation.formatId);
      formData.append('fileTypeId', variation.fileTypeId);
      if (variation.editUrl) formData.append('editUrl', variation.editUrl);
      if (variation.isPrimary) formData.append('isPrimary', 'true');
      formData.append('image', variation.imageFile);

      // Enviar para a API
      const response = await fetch(`/api/art-groups/${groupId}/variations`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar variação');
      }

      // Atualizar status para sucesso
      updateVariation(index, 'status', 'success');
      
    } catch (error: any) {
      // Atualizar status para erro
      updateVariation(index, 'status', 'error');
      updateVariation(index, 'error', error.message);
    }
  };

  // Enviar todas as variações
  const uploadAllVariations = async () => {
    // Se não existirem variações, publicamos com a variação principal apenas
    const hasValidVariations = variations.some(v => v.imageFile !== null);
    
    // Seguir adiante mesmo se não houver variações adicionais
    // A variação principal já foi criada no primeiro passo
    if (variations.length > 0 && !hasValidVariations) {
      toast({
        title: 'Variações adicionadas sem imagem',
        description: 'As variações devem ter uma imagem selecionada. Remova as variações vazias ou adicione imagens.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Upload de cada variação válida
    const uploadPromises = variations
      .filter(v => v.imageFile !== null)
      .map((variation, index) => uploadVariation(variation, index));
    
    await Promise.all(uploadPromises);
    
    // Verificar se todos os uploads foram bem-sucedidos
    const allSuccess = variations.every(v => 
      v.status === 'success' || (v.status === 'idle' && v.imageFile === null)
    );
    
    if (allSuccess) {
      setStep('success');
      
      // Mensagem adaptada baseada no número de variações adicionais
      const hasAddedVariations = variations.some(v => v.status === 'success');
      toast({
        title: 'Arte publicada com sucesso',
        description: hasAddedVariations 
          ? 'Todas as variações foram adicionadas' 
          : 'Arte principal publicada com sucesso',
      });
      
      // Atualizar cache para atualizar a lista de artes
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/art-groups'] });
    } else {
      toast({
        title: 'Alguns uploads falharam',
        description: 'Verifique os erros e tente novamente',
        variant: 'destructive',
      });
    }
    
    setIsSubmitting(false);
  };

  // Reiniciar o formulário
  const resetForm = () => {
    form.reset();
    setImageFile(null);
    setImagePreview(null);
    setVariations([]);
    setGroupId(null);
    setStep('info');
  };

  // Renderizar o formulário inicial
  const renderInfoStep = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createArtGroup)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Arte</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Promoção Troca de Óleo" {...field} />
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
                      {isLoadingCategories ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        categories?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
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
              control={form.control}
              name="formatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um formato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingFormats ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        formats?.map((format: any) => (
                          <SelectItem key={format.id} value={format.id.toString()}>
                            {format.name}
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
              control={form.control}
              name="fileTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Arquivo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo de arquivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingFileTypes ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        fileTypes?.map((fileType: any) => (
                          <SelectItem key={fileType.id} value={fileType.id.toString()}>
                            {fileType.name}
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
              control={form.control}
              name="editUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL para Edição</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Link para editar o arquivo (Canva, Google Slides, etc.)
                  </FormDescription>
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
                      Esta arte será visível apenas para usuários premium.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            <FormItem>
              <FormLabel>Imagem da Arte</FormLabel>
              <FormControl>
                <div className="border rounded-md p-4 space-y-4">
                  {!imagePreview ? (
                    <div>
                      <Input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        id="imageUpload"
                      />
                      <label htmlFor="imageUpload" className="block">
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <Upload className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-center text-gray-500">
                            Clique para selecionar uma imagem
                            <br />
                            <span className="text-xs">JPG, PNG, WEBP até 5MB</span>
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-auto rounded-md object-contain max-h-[300px]" 
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Esta imagem será usada como visualização principal da arte.
              </FormDescription>
            </FormItem>
            
            <Alert>
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Depois de criar esta arte, você poderá adicionar variações em outros formatos.
                Por exemplo, se esta arte for em formato "Feed", você poderá adicionar versões em
                "Stories", "Cartaz", etc.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Avançar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  // Renderizar o passo de adicionar variações
  const renderVariationsStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Adicionar Variações</h3>
          <p className="text-sm text-muted-foreground">
            Adicione versões desta arte em outros formatos
          </p>
        </div>
        <Button
          onClick={addVariation}
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Variação
        </Button>
      </div>
      
      <div className="space-y-4">
        {variations.length === 0 ? (
          <Alert>
            <AlertTitle>Pronto para publicar!</AlertTitle>
            <AlertDescription>
              <p>A arte principal já está pronta para ser publicada.</p>
              <p className="mt-2">Se desejar adicionar variações em outros formatos, clique no botão "Adicionar Variação".</p>
              <p className="mt-2 font-semibold">Você pode clicar em "Publicar Arte" para publicar apenas a versão principal.</p>
            </AlertDescription>
          </Alert>
        ) : (
          variations.map((variation, index) => (
            <Card key={index} className={variation.status === 'error' ? 'border-red-300' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    Variação #{index + 1}
                    {variation.status === 'uploading' && (
                      <Badge variant="outline" className="ml-2 bg-yellow-50">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Enviando...
                      </Badge>
                    )}
                    {variation.status === 'success' && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Enviado
                      </Badge>
                    )}
                    {variation.status === 'error' && (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700">
                        <X className="h-3 w-3 mr-1" />
                        Erro
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariation(index)}
                    className="h-8 w-8"
                    disabled={isSubmitting || variation.status === 'uploading'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Formato</label>
                      <Select
                        value={variation.formatId}
                        onValueChange={(value) => updateVariation(index, 'formatId', value)}
                        disabled={isSubmitting || variation.status === 'uploading' || variation.status === 'success'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um formato" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingFormats ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            formats?.map((format: any) => (
                              <SelectItem key={format.id} value={format.id.toString()}>
                                {format.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Arquivo</label>
                      <Select
                        value={variation.fileTypeId}
                        onValueChange={(value) => updateVariation(index, 'fileTypeId', value)}
                        disabled={isSubmitting || variation.status === 'uploading' || variation.status === 'success'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingFileTypes ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            fileTypes?.map((fileType: any) => (
                              <SelectItem key={fileType.id} value={fileType.id.toString()}>
                                {fileType.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL para Edição</label>
                      <Input
                        placeholder="https://..."
                        value={variation.editUrl || ''}
                        onChange={(e) => updateVariation(index, 'editUrl', e.target.value)}
                        disabled={isSubmitting || variation.status === 'uploading' || variation.status === 'success'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Link para editar o arquivo (opcional)
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`primary-${index}`}
                        checked={!!variation.isPrimary}
                        onCheckedChange={(checked) => updateVariation(index, 'isPrimary', !!checked)}
                        disabled={isSubmitting || variation.status === 'uploading' || variation.status === 'success'}
                      />
                      <label
                        htmlFor={`primary-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Definir como imagem principal do grupo
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Imagem</label>
                    {!variation.imagePreview ? (
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`imageUpload-${index}`}
                          onChange={(e) => handleVariationImageChange(index, e)}
                          disabled={isSubmitting || variation.status === 'uploading' || variation.status === 'success'}
                        />
                        <label htmlFor={`imageUpload-${index}`} className="block">
                          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-xs text-center text-gray-500">
                              Clique para selecionar uma imagem
                            </p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img 
                          src={variation.imagePreview} 
                          alt="Preview" 
                          className="w-full h-auto rounded-md object-contain max-h-[150px]" 
                        />
                        {variation.status !== 'success' && variation.status !== 'uploading' && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => {
                              updateVariation(index, 'imageFile', null);
                              updateVariation(index, 'imagePreview', undefined);
                            }}
                            disabled={isSubmitting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {variation.status === 'error' && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Erro no upload</AlertTitle>
                    <AlertDescription>
                      {variation.error || 'Ocorreu um erro ao enviar esta variação.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setStep('info')}
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <div className="space-x-2">
          <Button
            type="button"
            variant="default"
            onClick={uploadAllVariations}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Publicar Arte'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Renderizar o passo de sucesso
  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <Check className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Arte publicada com sucesso!</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua arte com múltiplos formatos foi criada e está disponível na plataforma.
      </p>
      <div className="mt-6 flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={resetForm}
        >
          Criar Nova Arte
        </Button>
        <Button asChild>
          <a href="/admin/arts">Ver Todas as Artes</a>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Arte com Múltiplos Formatos</CardTitle>
          <CardDescription>
            Crie uma arte principal e adicione variações em diferentes formatos (Feed, Stories, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'info' && renderInfoStep()}
          {step === 'variations' && renderVariationsStep()}
          {step === 'success' && renderSuccessStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddArtFormMulti;