import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Loader2, Upload, X, Check, AlertCircle, Image as ImageIcon,
  Settings2, FileImage, FolderOpen, FileType, LayoutGrid,
  BadgePlus, Link2, PenLine, UploadCloud, BookImage, Crown,
  ChevronLeft, ChevronRight, ArrowRight
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

interface SimpleFormMultiDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleFormMultiDialog({ isOpen, onClose }: SimpleFormMultiDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Configurações globais, 2: Formatos, 3: Revisão
  const [currentTab, setCurrentTab] = useState<string | null>(null);
  const [formatDetails, setFormatDetails] = useState<Record<string, FormatValues>>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [formatsComplete, setFormatsComplete] = useState<Record<string, boolean>>({});
  const [uploadAllComplete, setUploadAllComplete] = useState(false);

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

  // Avançar para a etapa 3 (Revisão)
  const goToStep3 = () => {
    // Verificar se todos os formatos estão com informações básicas completas
    const allFormatsHaveBasicInfo = Object.values(formatDetails).every(
      details => details.title && details.editUrl
    );
    
    if (!allFormatsHaveBasicInfo) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha título e link de edição para todos os formatos selecionados.",
        variant: "destructive",
      });
      return;
    }
    
    setStep(3);
  };

  // Voltar para a etapa anterior
  const goToPreviousStep = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
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
      const response = await apiRequest('POST', '/api/admin/arts/multi', formattedData);
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
      onClose();
      
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
        {/* Conteúdo único do modal - wrapper principal */}
        <div className="overflow-y-auto max-h-[85vh]">
          {/* Header com título e indicador de etapas */}
          <div className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center gap-4">
              <FileImage className="h-6 w-6 text-blue-600" />
              <DialogTitle className="text-xl font-bold">Adicionar Arte Multi-Formato</DialogTitle>
              
              {/* Indicador de progresso minimalista */}
              <div className="flex items-center ml-6 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <div className={`text-xs ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    Informações
                  </div>
                </div>
                <div className={`h-0.5 w-4 mx-1 ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                
                <div className="flex items-center space-x-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                  <div className={`text-xs ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    Formatos
                  </div>
                </div>
                <div className={`h-0.5 w-4 mx-1 ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                
                <div className="flex items-center space-x-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    3
                  </div>
                  <div className={`text-xs ${step === 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    Revisar
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Fechar"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Conteúdo dos três passos */}
          <div className="p-6">
            {/* Step 1 - Informações básicas */}
            {step === 1 && (
              <form onSubmit={step1Form.handleSubmit(goToStep2)} className="space-y-8">
                {/* Configuração Global - Etapa 1 */}
                <div className="p-2">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <PenLine className="h-5 w-5 mr-2 text-blue-600" />
                    Informações da Arte
                  </h3>
                  
                  <div className="space-y-8">
                    {/* Título e Descrição */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold flex items-center text-gray-700">
                          <PenLine className="h-4 w-4 mr-1.5 text-blue-600" />
                          Dados Principais
                        </h4>
                        <div className="bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5 text-xs text-blue-700">
                          Aplicado automaticamente a todos os formatos
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Estas informações serão aplicadas automaticamente a todos os formatos que você selecionar.
                      </p>
                      
                      <div className="space-y-5">
                        {/* Título da arte */}
                        <div className="space-y-2">
                          <Label htmlFor="globalTitle" className="text-sm font-medium text-gray-700">
                            Título da arte <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Controller
                            control={step1Form.control}
                            name="globalTitle"
                            render={({ field }) => (
                              <Input
                                id="globalTitle"
                                placeholder="Título principal da arte"
                                className="bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
                        
                        {/* Descrição (opcional) */}
                        <div className="space-y-2">
                          <Label htmlFor="globalDescription" className="text-sm font-medium text-gray-700 flex items-center">
                            Descrição <span className="text-gray-400 text-xs ml-1">(opcional)</span>
                          </Label>
                          <Controller
                            control={step1Form.control}
                            name="globalDescription"
                            render={({ field }) => (
                              <Textarea
                                id="globalDescription"
                                placeholder="Descrição geral da arte"
                                className="bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500 h-24"
                                {...field}
                              />
                            )}
                          />
                        </div>
                        
                        {/* Categoria */}
                        <div className="space-y-2">
                          <Label htmlFor="categoryId" className="text-sm font-medium text-gray-700">
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
                                <SelectTrigger className="bg-white border-gray-300 focus:ring-blue-500">
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
                            <p className="text-sm text-red-500">
                              {step1Form.formState.errors.categoryId.message}
                            </p>
                          )}
                        </div>
                        
                        {/* Tipo de arquivo */}
                        <div className="space-y-2">
                          <Label htmlFor="globalFileType" className="text-sm font-medium text-gray-700">
                            Tipo de arquivo <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Controller
                            control={step1Form.control}
                            name="globalFileType"
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="bg-white border-gray-300 focus:ring-blue-500">
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
                          {step1Form.formState.errors.globalFileType && (
                            <p className="text-sm text-red-500">
                              {step1Form.formState.errors.globalFileType.message}
                            </p>
                          )}
                        </div>
                        
                        {/* Arte Premium (toggle) */}
                        <div className="space-y-2">
                          <Label htmlFor="isPremium" className="text-sm font-medium text-gray-700">
                            Arte Premium
                          </Label>
                          <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
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
                            <Label htmlFor="isPremium" className="font-medium text-gray-700">
                              {step1Form.watch("isPremium") ? "Ativo" : "Inativo"}
                            </Label>
                            {step1Form.watch("isPremium") && (
                              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
                                <Crown className="h-3 w-3 mr-1 text-yellow-600" />
                                Premium
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Botões para cancelar e avançar para a etapa 2 */}
                <div className="flex justify-between mt-8">
                  <Button 
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="px-6 py-5 rounded-xl text-base"
                  >
                    Cancelar
                  </Button>
                  
                  <Button 
                    type="submit"
                    className="px-6 py-5 rounded-xl text-base flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
            
            {/* Step 2 - Formatos e detalhes */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Navegação da etapa 2 */}
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={goToPreviousStep}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1.5 border border-blue-200 rounded-lg transition-all hover:bg-blue-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </button>
                  
                  <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    Selecione os formatos e preencha os detalhes
                  </div>
                </div>
                
                {/* Seleção de Formatos - Cards para escolha */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <LayoutGrid className="h-5 w-5 mr-2 text-blue-600" />
                    Formatos Disponíveis
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formats.map((format: any) => {
                      const isSelected = step1Form.getValues().selectedFormats.includes(format.slug);
                      const isComplete = formatsComplete[format.slug] || false;
                      
                      return (
                        <div
                          key={format.id}
                          onClick={() => toggleFormat(format.slug)}
                          className={`
                            relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200
                            ${isSelected 
                              ? (isComplete 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-blue-500 bg-blue-50')
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          {/* Card de formato */}
                          <div className="p-3 flex flex-col items-center">
                            {/* Badge de status */}
                            {isSelected && (
                              <div className={`
                                absolute right-2 top-2 rounded-full p-1
                                ${isComplete ? 'bg-green-100' : 'bg-blue-100'}
                              `}>
                                {isComplete ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            )}
                            
                            {/* Ícone do formato */}
                            <div className={`
                              w-12 h-12 rounded-lg mb-2 flex items-center justify-center
                              ${isSelected 
                                ? (isComplete 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-blue-100 text-blue-600')
                                : 'bg-gray-100 text-gray-500'
                              }
                            `}>
                              {format.slug === 'stories' && <BadgePlus className="h-6 w-6" />}
                              {format.slug === 'feed' && <ImageIcon className="h-6 w-6" />}
                              {format.slug === 'cartaz' && <FileImage className="h-6 w-6" />}
                              {format.slug === 'webbanners' && <LayoutGrid className="h-6 w-6" />}
                              {format.slug === 'carrocel' && <BookImage className="h-6 w-6" />}
                              {format.slug === 'capafanpage' && <FileImage className="h-6 w-6" />}
                            </div>
                            
                            {/* Nome do formato */}
                            <span className={`text-sm font-medium
                              ${isSelected 
                                ? (isComplete ? 'text-green-700' : 'text-blue-700') 
                                : 'text-gray-700'
                              }
                            `}>
                              {format.name}
                            </span>
                            
                            {/* Status do formato */}
                            <span className={`text-xs mt-1
                              ${isSelected
                                ? (isComplete ? 'text-green-600' : 'text-blue-600')
                                : 'text-gray-500'
                              }
                            `}>
                              {!isSelected && 'Clique para selecionar'}
                              {isSelected && isComplete && 'Completo'}
                              {isSelected && !isComplete && 'Pendente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Erro caso nenhum formato seja selecionado */}
                  {step1Form.formState.errors.selectedFormats && (
                    <p className="text-sm text-red-500 mt-2">
                      {step1Form.formState.errors.selectedFormats.message}
                    </p>
                  )}
                </div>
                
                {/* Detalhes dos formatos selecionados com navegação por abas */}
                {step1Form.getValues().selectedFormats.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200">
                      <h3 className="p-4 font-semibold text-gray-800">
                        Detalhes do Formato
                      </h3>
                      
                      {/* Navegação por abas para formatos selecionados */}
                      <Tabs 
                        value={currentTab || ''} 
                        onValueChange={(value) => setCurrentTab(value)}
                        className="w-full"
                      >
                        <TabsList className="w-full h-auto p-0 bg-gray-50 border-t border-gray-200 flex overflow-x-auto custom-scrollbar">
                          {step1Form.getValues().selectedFormats.map((formatSlug) => {
                            const format = formats.find((f: any) => f.slug === formatSlug);
                            const isComplete = formatsComplete[formatSlug] || false;
                            
                            return (
                              <TabsTrigger
                                key={formatSlug}
                                value={formatSlug}
                                className={`flex-1 min-w-[120px] py-3 px-4 text-sm border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none ${
                                  isComplete ? 'text-green-600' : ''
                                }`}
                              >
                                <span className="flex items-center">
                                  {isComplete && <Check className="w-4 h-4 mr-1.5 text-green-600" />}
                                  {format?.name || formatSlug}
                                </span>
                              </TabsTrigger>
                            );
                          })}
                        </TabsList>
                        
                        {/* Conteúdo das abas */}
                        {step1Form.getValues().selectedFormats.map((formatSlug) => {
                          const formatDetail = formatDetails[formatSlug] || {};
                          const isUploading = uploading[`image-${formatSlug}`] || false;
                          const uploadErrorMsg = uploadError[`image-${formatSlug}`] || '';
                          
                          return (
                            <TabsContent key={formatSlug} value={formatSlug} className="p-5 focus:outline-none">
                              <div className="space-y-5">
                                {/* Título e descrição específicos para este formato */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div className="space-y-2">
                                    <Label htmlFor={`${formatSlug}-title`} className="text-sm font-medium text-gray-700">
                                      Título <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id={`${formatSlug}-title`}
                                      value={formatDetail.title || ''}
                                      onChange={(e) => saveFormatDetails(formatSlug, { title: e.target.value })}
                                      placeholder="Título específico para este formato"
                                      className="bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`${formatSlug}-description`} className="text-sm font-medium text-gray-700 flex items-center">
                                      Descrição <span className="text-gray-400 text-xs ml-1">(opcional)</span>
                                    </Label>
                                    <Input
                                      id={`${formatSlug}-description`}
                                      value={formatDetail.description || ''}
                                      onChange={(e) => saveFormatDetails(formatSlug, { description: e.target.value })}
                                      placeholder="Descrição específica para este formato"
                                      className="bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                </div>
                                
                                {/* Link de edição */}
                                <div className="space-y-2">
                                  <Label htmlFor={`${formatSlug}-editUrl`} className="text-sm font-medium text-gray-700">
                                    Link de Edição <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="flex">
                                    <div className="relative flex-grow">
                                      <Input
                                        id={`${formatSlug}-editUrl`}
                                        value={formatDetail.editUrl || ''}
                                        onChange={(e) => saveFormatDetails(formatSlug, { editUrl: e.target.value })}
                                        placeholder="Cole o link do Canva ou Google Drive"
                                        className="bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                      />
                                      <Link2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Upload de imagem */}
                                <div className="space-y-2">
                                  <Label htmlFor={`${formatSlug}-image`} className="text-sm font-medium text-gray-700">
                                    Imagem do Formato <span className="text-red-500">*</span>
                                  </Label>
                                  
                                  {formatDetail.imageUrl ? (
                                    <div className="mb-3">
                                      <div className="relative rounded-lg overflow-hidden border border-gray-200 w-full aspect-video bg-gray-50 flex items-center justify-center">
                                        <img 
                                          src={formatDetail.imageUrl} 
                                          alt={formatDetail.title} 
                                          className="object-contain max-h-full max-w-full"
                                        />
                                      </div>
                                      <div className="mt-2 flex justify-end">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => saveFormatDetails(formatSlug, { imageUrl: '' })}
                                          className="text-xs"
                                        >
                                          Trocar imagem
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg py-8 px-4 bg-gray-50">
                                      <div className="flex flex-col items-center justify-center text-center">
                                        <Upload className="h-8 w-8 text-gray-400 mb-3" />
                                        <h3 className="text-sm font-medium text-gray-700">
                                          Arraste e solte ou clique para fazer upload
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                          PNG, JPG, WEBP até 10MB (preferência .webp)
                                        </p>
                                        
                                        <div className="mt-4">
                                          <label className="relative">
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="bg-white"
                                              disabled={isUploading}
                                            >
                                              {isUploading ? (
                                                <>
                                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                  Enviando...
                                                </>
                                              ) : 'Selecionar arquivo'}
                                            </Button>
                                            <input
                                              type="file"
                                              id={`${formatSlug}-image`}
                                              onChange={(e) => handleImageUpload(e, formatSlug)}
                                              accept="image/*"
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                              disabled={isUploading}
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Mensagem de erro de upload */}
                                  {uploadErrorMsg && (
                                    <p className="text-sm text-red-500 mt-1">
                                      Erro: {uploadErrorMsg}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Informações do formato */}
                                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 mt-6">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <FileType className="h-4 w-4 mr-1.5 text-blue-600" />
                                    Informações do Formato
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                                    <div>
                                      <span className="font-medium block text-gray-700">Formato:</span>
                                      {getFormatName(formatSlug)}
                                    </div>
                                    <div>
                                      <span className="font-medium block text-gray-700">Tipo:</span>
                                      {formatDetail.fileType || step1Form.getValues().globalFileType || 'Não definido'}
                                    </div>
                                    <div>
                                      <span className="font-medium block text-gray-700">Categoria:</span>
                                      {categories.find((cat: any) => cat.id.toString() === step1Form.getValues().categoryId)?.name || 'Não definida'}
                                    </div>
                                    <div>
                                      <span className="font-medium block text-gray-700">Visibilidade:</span>
                                      {step1Form.getValues().isPremium ? (
                                        <span className="flex items-center">
                                          <span className="text-blue-600 mr-1">Premium</span>
                                          <Crown className="h-3 w-3 text-yellow-500" />
                                        </span>
                                      ) : 'Gratuito'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    </div>
                  </div>
                )}
                
                {/* Botões de navegação */}
                <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                  <Button 
                    type="button"
                    onClick={goToPreviousStep}
                    variant="outline"
                    className="px-6 py-5 rounded-xl text-base"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1.5" />
                    Voltar
                  </Button>
                  
                  <Button 
                    onClick={goToStep3}
                    className="px-6 py-5 rounded-xl text-base flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Continuar para Revisão
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3 - Revisão e envio */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Navegação da etapa 3 */}
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={goToPreviousStep}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1.5 border border-blue-200 rounded-lg transition-all hover:bg-blue-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </button>
                  
                  <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    Revisar e publicar
                  </div>
                </div>
                
                {/* Banner de status de revisão */}
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6 shadow-sm">
                  <div className="flex items-center text-green-700 mb-1">
                    <Check className="h-5 w-5 mr-2" />
                    <h3 className="font-medium">Revisão concluída</h3>
                  </div>
                  <p className="text-sm text-green-600 pl-7">
                    Todos os dados estão preenchidos corretamente. Você está pronto para publicar!
                  </p>
                </div>
                
                {/* Revisão dos detalhes */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Settings2 className="h-5 w-5 mr-2 text-blue-600" />
                      Resumo da Arte
                    </h3>
                  </div>
                  
                  <div className="p-5">
                    {/* Detalhes globais */}
                    <div className="mb-6">
                      <h4 className="text-base font-medium mb-3 text-gray-800 flex items-center">
                        <PenLine className="h-4 w-4 mr-1.5 text-blue-600" />
                        Informações Gerais
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Título:</p>
                          <p className="text-sm text-gray-800 bg-white px-3 py-2 rounded border border-gray-100">{step1Form.getValues().globalTitle}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Categoria:</p>
                          <p className="text-sm text-gray-800 flex items-center bg-white px-3 py-2 rounded border border-gray-100">
                            <FolderOpen className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                            {categories.find((cat: any) => cat.id.toString() === step1Form.getValues().categoryId)?.name}
                          </p>
                        </div>
                        
                        {step1Form.getValues().globalDescription && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Descrição:</p>
                            <p className="text-sm text-gray-800 bg-white px-3 py-2 rounded border border-gray-100">
                              {step1Form.getValues().globalDescription}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Tipo de Arquivo:</p>
                          <p className="text-sm text-gray-800 capitalize flex items-center bg-white px-3 py-2 rounded border border-gray-100">
                            <FileType className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                            {fileTypes.find((type: any) => type.slug === step1Form.getValues().globalFileType)?.name || step1Form.getValues().globalFileType}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Visibilidade:</p>
                          <p className="text-sm bg-white px-3 py-2 rounded border border-gray-100 flex items-center">
                            {step1Form.getValues().isPremium ? (
                              <span className="flex items-center text-blue-700">
                                <Crown className="h-3.5 w-3.5 mr-1.5 text-yellow-600" />
                                <span className="font-medium">Premium</span>
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Acesso restrito</span>
                              </span>
                            ) : (
                              <span className="flex items-center text-green-700">
                                <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                                <span className="font-medium">Gratuito</span>
                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Acesso público</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Formatos selecionados com preview */}
                    <div>
                      <h4 className="text-base font-medium mb-3 text-gray-800 flex items-center">
                        <LayoutGrid className="h-4 w-4 mr-1.5 text-blue-600" />
                        Formatos ({Object.keys(formatDetails).length})
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formatDetails).map(([formatSlug, details]) => {
                          const format = formats.find((f: any) => f.slug === formatSlug);
                          const isComplete = formatsComplete[formatSlug] || false;
                          
                          return (
                            <div 
                              key={formatSlug}
                              className={`
                                rounded-lg border overflow-hidden
                                ${isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}
                              `}
                            >
                              <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-white flex justify-between items-center">
                                <h5 className="text-sm font-medium text-gray-800 flex items-center">
                                  {formatSlug === 'stories' && <BadgePlus className="h-4 w-4 mr-1.5 text-blue-600" />}
                                  {formatSlug === 'feed' && <ImageIcon className="h-4 w-4 mr-1.5 text-blue-600" />}
                                  {formatSlug === 'cartaz' && <FileImage className="h-4 w-4 mr-1.5 text-blue-600" />}
                                  {formatSlug === 'webbanners' && <LayoutGrid className="h-4 w-4 mr-1.5 text-blue-600" />}
                                  {formatSlug === 'carrocel' && <BookImage className="h-4 w-4 mr-1.5 text-blue-600" />}
                                  {formatSlug === 'capafanpage' && <FileImage className="h-4 w-4 mr-1.5 text-blue-600" />}
                                  {format?.name || formatSlug}
                                </h5>
                                {isComplete && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center">
                                    <Check className="h-3 w-3 mr-0.5" />
                                    Completo
                                  </span>
                                )}
                              </div>
                              
                              <div className="p-3">
                                {/* Imagem preview */}
                                {details.imageUrl && (
                                  <div className="mb-3 relative rounded-md overflow-hidden bg-white border border-gray-200">
                                    <div className="aspect-video flex items-center justify-center">
                                      <img 
                                        src={details.imageUrl} 
                                        alt={details.title} 
                                        className="object-contain max-w-full max-h-full"
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-1 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium text-gray-700">Título:</span>
                                    <span className="text-gray-800 ml-1">{details.title}</span>
                                  </div>
                                  
                                  {details.description && (
                                    <div>
                                      <span className="font-medium text-gray-700">Descrição:</span>
                                      <span className="text-gray-800 ml-1">{details.description}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center text-blue-600 hover:text-blue-800 truncate">
                                    <Link2 className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <a 
                                      href={details.editUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs truncate"
                                    >
                                      {details.editUrl}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Informações estatísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-700">{Object.keys(formatDetails).length}</p>
                    <p className="text-xs text-blue-600">Formatos</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                    <p className="text-sm font-bold text-blue-700 truncate">
                      {categories.find((cat: any) => cat.id.toString() === step1Form.getValues().categoryId)?.name || "N/A"}
                    </p>
                    <p className="text-xs text-blue-600">Categoria</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                    <p className="text-sm font-bold text-blue-700">
                      {fileTypes.find((type: any) => type.slug === step1Form.getValues().globalFileType)?.name || step1Form.getValues().globalFileType}
                    </p>
                    <p className="text-xs text-blue-600">Tipo de Arquivo</p>
                  </div>
                  
                  <div className={`${step1Form.getValues().isPremium ? 'bg-yellow-50 border-yellow-100' : 'bg-green-50 border-green-100'} border p-3 rounded-lg text-center`}>
                    <p className={`text-sm font-bold ${step1Form.getValues().isPremium ? 'text-yellow-700' : 'text-green-700'} flex items-center justify-center`}>
                      {step1Form.getValues().isPremium ? (
                        <>
                          <Crown className="h-4 w-4 mr-1 text-yellow-600" />
                          Premium
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1 text-green-600" />
                          Gratuito
                        </>
                      )}
                    </p>
                    <p className={`text-xs ${step1Form.getValues().isPremium ? 'text-yellow-600' : 'text-green-600'}`}>Visibilidade</p>
                  </div>
                </div>
                
                {/* Botões de navegação e publicação */}
                <div className="flex flex-col gap-4 mt-8 pt-5 border-t border-gray-200">
                  <div className="flex justify-between">
                    <Button 
                      type="button"
                      onClick={goToPreviousStep}
                      variant="outline"
                      className="px-6 py-5 rounded-xl text-base flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1.5" />
                      Voltar para Editar
                    </Button>
                    
                    <Button 
                      type="button"
                      onClick={onClose}
                      variant="ghost"
                      className="px-6 py-5 rounded-xl text-base"
                    >
                      Cancelar
                    </Button>
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-6 rounded-xl text-base font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {uploadAllComplete ? (
                      <>
                        <Check className="h-5 w-5 mr-1.5" />
                        Upload Concluído com Sucesso
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-5 w-5 mr-1.5" />
                        Publicar Arte Multi-Formato
                      </>
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