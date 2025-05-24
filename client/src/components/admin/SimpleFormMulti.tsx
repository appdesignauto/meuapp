import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Loader2, Upload, X, Check, AlertCircle, 
  Settings2, FileImage, FolderOpen, FileType, LayoutGrid,
  BadgePlus, Link2, PenLine, UploadCloud, BookImage,
  ChevronLeft, ArrowRight
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Esquema para validação do formato individual
const formatSchema = z.object({
  format: z.string().min(1, "Formato é obrigatório"),
  fileType: z.string().min(1, "Tipo de arquivo é obrigatório"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  imageUrl: z.string().min(5, "URL da imagem é obrigatória"),
  previewUrl: z.string().optional(),
  editUrl: z.string().min(5, "URL de edição é obrigatória"),
});

// Esquema para a primeira etapa (seleção de formatos)
const step1Schema = z.object({
  categoryId: z.string().min(1, "Por favor selecione uma categoria"),
  globalFileType: z.string().min(1, "Por favor selecione um tipo de arquivo"),
  isPremium: z.boolean().default(false),
  globalTitle: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  globalDescription: z.string().optional(),
  selectedFormats: z.array(z.string()).min(1, "Selecione pelo menos um formato")
});

// Esquema do formulário completo
const formSchema = z.object({
  categoryId: z.string().min(1, "Por favor selecione uma categoria"),
  globalFileType: z.string().min(1, "Por favor selecione um tipo de arquivo"),
  isPremium: z.boolean().default(false),
  formats: z.array(formatSchema).min(1, "Adicione pelo menos um formato")
});

type Step1Values = z.infer<typeof step1Schema>;
type FormValues = z.infer<typeof formSchema>;
type FormatValues = z.infer<typeof formatSchema>;

interface SimpleFormMultiProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleFormMulti({ isOpen, onClose }: SimpleFormMultiProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Selecionar formatos, 2: Preencher detalhes
  const [currentTab, setCurrentTab] = useState<string | null>(null);
  const [formatDetails, setFormatDetails] = useState<Record<string, FormatValues>>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [formatsComplete, setFormatsComplete] = useState<Record<string, boolean>>({});

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

  // Configuração do formulário para a etapa 1
  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      categoryId: '',
      globalFileType: 'canva', // "canva" como tipo de arquivo padrão
      isPremium: true, // Arte premium sempre selecionada por padrão
      globalTitle: '',
      globalDescription: '',
      selectedFormats: []
    },
  });

  // Configuração do formulário para a etapa de detalhes (etapa 2)
  const formatForm = useForm<FormatValues>({
    resolver: zodResolver(formatSchema),
    defaultValues: {
      format: '',
      fileType: 'canva',
      title: '',
      description: '',
      imageUrl: '',
      previewUrl: '',
      editUrl: '',
    }
  });

  // Estado de carregamento
  const isLoading = isLoadingCategories || isLoadingFormats || isLoadingFileTypes;

  // Obter o nome do formato a partir do slug
  const getFormatName = (slug: string) => {
    const format = formats.find((f: any) => f.slug === slug);
    return format ? format.name : slug;
  };

  // Avançar para a etapa 2
  const goToStep2 = (data: Step1Values) => {
    // Criar objetos para cada formato selecionado
    const initialDetails: Record<string, FormatValues> = {};
    
    data.selectedFormats.forEach(formatSlug => {
      initialDetails[formatSlug] = {
        format: formatSlug,
        fileType: data.globalFileType,
        // Usar o título global para cada formato, se disponível
        title: data.globalTitle || '',
        // Usar a descrição global para cada formato, se disponível
        description: data.globalDescription || '',
        imageUrl: '',
        previewUrl: '',
        editUrl: ''
      };
    });
    
    setFormatDetails(initialDetails);
    setCurrentTab(data.selectedFormats[0]); // Definir a primeira aba como atual
    setStep(2);
  };

  // Voltar para a etapa 1
  const goToStep1 = () => {
    setStep(1);
  };

  // Verificar se o formato atual está completo
  useEffect(() => {
    if (step === 2 && currentTab) {
      // Verificar quais formatos estão completos
      const updatedFormatsComplete: Record<string, boolean> = {};
      
      Object.entries(formatDetails).forEach(([formatSlug, details]) => {
        const isComplete = !!(details.title && details.editUrl && details.imageUrl);
        updatedFormatsComplete[formatSlug] = isComplete;
      });
      
      setFormatsComplete(updatedFormatsComplete);
    }
  }, [formatDetails, step, currentTab]);

  // Manipulador para seleção de formatos
  const toggleFormat = (formatSlug: string) => {
    const currentFormats = step1Form.getValues().selectedFormats || [];
    let newFormats;
    
    if (currentFormats.includes(formatSlug)) {
      newFormats = currentFormats.filter(slug => slug !== formatSlug);
    } else {
      newFormats = [...currentFormats, formatSlug];
    }
    
    step1Form.setValue('selectedFormats', newFormats, { shouldValidate: true });
  };

  // Salvar os detalhes do formato atual
  const saveFormatDetails = (formatSlug: string, data: any) => {
    setFormatDetails(prev => ({
      ...prev,
      [formatSlug]: {
        ...prev[formatSlug],
        ...data
      }
    }));
  };

  // Upload de imagens
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, formatSlug: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const identifier = `image-${formatSlug}`;
    setUploading(prev => ({ ...prev, [identifier]: true }));
    setUploadError(prev => ({ ...prev, [identifier]: '' }));

    try {
      // Garantir que a categoria foi selecionada
      const categoryId = step1Form.getValues().categoryId;
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
      
      // Adicionar informações do designer (usuário logado)
      if (user && user.id) {
        formData.append('designerId', user.id.toString());
      }

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Falha ao fazer upload da imagem');
      }

      const result = await response.json();
      
      // Atualizar a imagem no estado
      setImages(prev => ({
        ...prev,
        [formatSlug]: result.imageUrl
      }));

      // Atualizar o campo imageUrl nos detalhes do formato
      saveFormatDetails(formatSlug, { imageUrl: result.imageUrl });

      toast({
        title: "Upload concluído",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      setUploadError(prev => ({
        ...prev,
        [identifier]: error.message || "Falha ao carregar a imagem"
      }));
      
      toast({
        title: "Erro no upload",
        description: error.message || "Falha ao carregar a imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, [identifier]: false }));
    }
  };

  // Submeter o formulário completo
  const handleSubmit = async () => {
    // Verificar se todos os formatos estão completos
    const allComplete = Object.values(formatsComplete).every(v => v);
    
    if (!allComplete) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os detalhes para cada formato selecionado.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Converter dados para o formato esperado pela API
      const formattedData = {
        categoryId: parseInt(step1Form.getValues().categoryId),
        globalFileType: step1Form.getValues().globalFileType,
        isPremium: step1Form.getValues().isPremium,
        globalTitle: step1Form.getValues().globalTitle,
        globalDescription: step1Form.getValues().globalDescription,
        formats: Object.values(formatDetails),
      };

      // Enviar para a API
      const response = await apiRequest('POST', '/api/admin/artes/multi', formattedData);
      const result = await response.json();

      toast({
        title: "Arte salva com sucesso",
        description: "A arte com múltiplos formatos foi criada.",
      });

      // Resetar o formulário
      step1Form.reset({
        categoryId: '',
        globalFileType: 'canva',
        isPremium: true,
        globalTitle: '',
        globalDescription: '',
        selectedFormats: []
      });
      
      setFormatDetails({});
      setImages({});
      setStep(1);
      
      // Invalidar a consulta para atualizar a lista de artes
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a arte. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-5xl pt-0 px-0 pb-0">
        <div className="overflow-y-auto max-h-[80vh]">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileImage className="h-6 w-6 mr-2" />
                <DialogTitle className="text-xl">Adicionar Arte Multi-Formato</DialogTitle>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <DialogDescription className="text-blue-100">
              Crie uma arte com variações para diferentes formatos (feed, stories, etc.)
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6">
            {step === 1 && (
            <form onSubmit={step1Form.handleSubmit(goToStep2)} className="space-y-8">
              {/* Configuração Global - Etapa 1 */}
              <div className="bg-blue-50/60 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <Settings2 className="h-5 w-5 mr-2 text-blue-600" />
                  Configuração Global
                </h3>
                
                <div className="space-y-6">
                  {/* Título e Descrição Global */}
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <h4 className="text-md font-semibold mb-3 flex items-center text-blue-700">
                      <PenLine className="h-4 w-4 mr-1.5 text-blue-600" />
                      Título e Descrição Global
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="globalTitle" className="text-sm font-medium">
                          Título <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Controller
                          control={step1Form.control}
                          name="globalTitle"
                          render={({ field }) => (
                            <Input
                              id="globalTitle"
                              placeholder="Título principal da arte"
                              className="bg-blue-50/40 border-blue-100"
                              {...field}
                            />
                          )}
                        />
                        {step1Form.formState.errors.globalTitle && (
                          <p className="text-sm text-red-500">
                            {step1Form.formState.errors.globalTitle.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="globalDescription" className="text-sm font-medium flex items-center">
                          Descrição <span className="text-gray-400 text-xs ml-1">(opcional)</span>
                        </Label>
                        <Controller
                          control={step1Form.control}
                          name="globalDescription"
                          render={({ field }) => (
                            <Textarea
                              id="globalDescription"
                              placeholder="Descrição geral da arte"
                              className="bg-blue-50/40 border-blue-100 h-24"
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="category" className="text-sm font-medium flex items-center">
                          <FolderOpen className="h-4 w-4 mr-1.5 text-blue-600" />
                          Categoria <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Controller
                          control={step1Form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
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
                        {step1Form.formState.errors.categoryId && (
                          <p className="text-sm text-red-500 mt-1">
                            {step1Form.formState.errors.categoryId.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="globalFileType" className="text-sm font-medium flex items-center">
                          <FileType className="h-4 w-4 mr-1.5 text-blue-600" />
                          Tipo de Arquivo <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Controller
                          control={step1Form.control}
                          name="globalFileType"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
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
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <div className="bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                          <BadgePlus className="h-4 w-4 mr-1.5 text-blue-600" />
                          Visibilidade da Arte
                        </h4>
                        <div className="flex items-center space-x-3">
                          <Controller
                            control={step1Form.control}
                            name="isPremium"
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="isPremium"
                                className="data-[state=checked]:bg-blue-600"
                              />
                            )}
                          />
                          <Label htmlFor="isPremium" className="font-medium text-gray-700">Arte Premium</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Seleção de formatos - Etapa 1 */}
              <div className="pt-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <LayoutGrid className="h-5 w-5 mr-2 text-blue-600" />
                  Formatos<span className="text-red-500 ml-1">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-5">Selecione um ou mais formatos para sua arte</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {formats.map((format: any) => {
                    const isSelected = step1Form.getValues().selectedFormats.includes(format.slug);
                    return (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => toggleFormat(format.slug)}
                        className={`
                          py-3 px-4 rounded-lg font-medium text-center
                          transition-all duration-200 shadow-sm
                          ${isSelected 
                            ? 'bg-blue-600 text-white transform scale-105 ring-2 ring-blue-300'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                          }
                        `}
                      >
                        {format.name}
                      </button>
                    );
                  })}
                </div>
                {step1Form.formState.errors.selectedFormats && (
                  <p className="text-sm text-red-500 mt-2">
                    {step1Form.formState.errors.selectedFormats.message}
                  </p>
                )}
              </div>

              {/* Resumo dos formatos selecionados - Etapa 1 */}
              {step1Form.getValues().selectedFormats.length > 0 && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium mb-2">Formatos selecionados:</h3>
                  <div className="flex flex-wrap gap-2">
                    {step1Form.getValues().selectedFormats.map(formatSlug => {
                      const formatName = getFormatName(formatSlug);
                      return (
                        <div key={formatSlug} className="px-3 py-1 rounded-full text-sm flex items-center gap-1 bg-green-100 text-green-800">
                          {formatName}
                          <Check className="h-3 w-3" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botão para avançar para a etapa 2 */}
              <div className="flex justify-end mt-8">
                <Button 
                  type="submit"
                  disabled={step1Form.getValues().selectedFormats.length === 0}
                  className="px-6 py-2 flex items-center gap-2"
                >
                  Próximo Passo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && currentTab && (
            <div className="space-y-6">
              {/* Cabeçalho da Etapa 2 */}
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={goToStep1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar para seleção de formatos
                </Button>
                
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">
                    Categoria: {categories.find((c: any) => c.id.toString() === step1Form.getValues().categoryId)?.name}
                  </p>
                </div>
              </div>

              {/* Abas para cada formato */}
              <Tabs 
                defaultValue={currentTab}
                className="w-full" 
                value={currentTab} 
                onValueChange={setCurrentTab}
              >
                <TabsList className="w-full flex overflow-x-auto mb-4 space-x-2">
                  {step1Form.getValues().selectedFormats.map(formatSlug => {
                    const formatName = getFormatName(formatSlug);
                    const isComplete = formatsComplete[formatSlug];
                    
                    return (
                      <TabsTrigger 
                        key={formatSlug}
                        value={formatSlug}
                        className={`flex items-center gap-1 ${isComplete ? 'data-[state=active]:bg-green-600 data-[state=active]:text-white' : ''}`}
                      >
                        {formatName}
                        {isComplete && <Check className="h-3 w-3" />}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {step1Form.getValues().selectedFormats.map(formatSlug => {
                  const formatName = getFormatName(formatSlug);
                  const details = formatDetails[formatSlug] || {
                    format: formatSlug,
                    fileType: step1Form.getValues().globalFileType,
                    title: '',
                    description: '',
                    imageUrl: '',
                    previewUrl: '',
                    editUrl: ''
                  };
                  
                  return (
                    <TabsContent key={formatSlug} value={formatSlug} className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800">
                        <BookImage className="h-5 w-5 mr-2 text-blue-600" />
                        Detalhes do formato: {formatName}
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                          <Label className="flex items-center text-sm font-medium">
                            <PenLine className="h-4 w-4 mr-1.5 text-blue-600" />
                            Título <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            value={details.title}
                            onChange={(e) => saveFormatDetails(formatSlug, { title: e.target.value })}
                            placeholder="Título da arte"
                            className="bg-blue-50/40 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="flex items-center text-sm font-medium">
                            <Link2 className="h-4 w-4 mr-1.5 text-blue-600" />
                            Link de Edição <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            value={details.editUrl}
                            onChange={(e) => saveFormatDetails(formatSlug, { editUrl: e.target.value })}
                            placeholder="URL para edição (Canva, Google Drive, etc)"
                            className="bg-blue-50/40 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <Label className="flex items-center text-sm font-medium">
                          <FileType className="h-4 w-4 mr-1.5 text-blue-600" />
                          Descrição <span className="text-gray-400 text-xs ml-1">(opcional)</span>
                        </Label>
                        <Textarea
                          value={details.description || ''}
                          onChange={(e) => saveFormatDetails(formatSlug, { description: e.target.value })}
                          placeholder="Breve descrição desta arte (opcional)"
                          rows={2}
                          className="bg-blue-50/40 border-blue-100 focus:border-blue-300 focus:ring-blue-200 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center text-sm font-medium">
                          <UploadCloud className="h-4 w-4 mr-1.5 text-blue-600" /> 
                          Imagem Principal <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <div 
                          className={`relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center w-full h-40 ${
                            uploading[`image-${formatSlug}`] 
                              ? 'border-blue-300 bg-blue-50' 
                              : uploadError[`image-${formatSlug}`] 
                                ? 'border-red-300 bg-red-50'
                                : details.imageUrl 
                                  ? 'border-green-300 bg-green-50/30'
                                  : 'border-blue-100 hover:border-blue-300 bg-blue-50/30 hover:bg-blue-50/50'
                          }`}
                        >
                          {details.imageUrl ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={details.imageUrl} 
                                alt="Imagem carregada" 
                                className="h-full mx-auto object-contain cursor-pointer"
                              />
                              <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full">
                                <Check className="h-4 w-4" />
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              {uploading[`image-${formatSlug}`] ? (
                                <>
                                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                                  <p className="text-sm text-blue-500 mt-2">Enviando...</p>
                                </>
                              ) : uploadError[`image-${formatSlug}`] ? (
                                <>
                                  <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                                  <p className="text-sm text-red-500 mt-2">
                                    {uploadError[`image-${formatSlug}`]}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 mx-auto text-blue-400" />
                                  <p className="text-sm text-blue-500 mt-2">Clique para fazer upload</p>
                                </>
                              )}
                            </div>
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleImageUpload(e, formatSlug)}
                            disabled={uploading[`image-${formatSlug}`]}
                            accept="image/*"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
              
              {/* Barra de progresso e botão de envio */}
              <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium">Progresso:</h3>
                  <div className="text-sm">
                    {Object.values(formatsComplete).filter(Boolean).length} de {step1Form.getValues().selectedFormats.length} formatos completos
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${Object.values(formatsComplete).filter(Boolean).length / step1Form.getValues().selectedFormats.length * 100}%` 
                    }}
                  ></div>
                </div>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={Object.values(formatsComplete).some(complete => !complete)}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2"
                >
                  {Object.values(formatsComplete).some(complete => !complete) ? (
                    "Complete todos os formatos para salvar"
                  ) : (
                    "Salvar Arte Multi-Formato"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}