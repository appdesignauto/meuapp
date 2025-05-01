import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Loader2, Upload, X, Check, AlertCircle, 
  Settings2, FileImage, FolderOpen, FileType, LayoutGrid,
  BadgePlus, Link2, PenLine, UploadCloud, BookImage,
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

// Esquema para a primeira etapa (informações gerais + seleção de formatos)
const step1Schema = z.object({
  categoryId: z.string().min(1, "Por favor selecione uma categoria"),
  globalFileType: z.string().min(1, "Por favor selecione um tipo de arquivo"),
  isPremium: z.boolean().default(true),
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
  const [step, setStep] = useState(1); // 1: Configurações globais, 2: Formatos, 3: Upload
  const [currentTab, setCurrentTab] = useState<string>("");
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

  // Avançar para a etapa 2 (Upload e detalhes de cada formato)
  const goToStep2 = (data: Step1Values) => {
    console.log("Avançando para etapa 2: Seleção de formatos", data);
    
    // Verificar se pelo menos um formato foi selecionado
    const selectedFormats = data.selectedFormats;
    if (!selectedFormats || selectedFormats.length === 0) {
      toast({
        title: "Nenhum formato selecionado",
        description: "Por favor, selecione pelo menos um formato para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Criar objetos iniciais para cada formato selecionado
    const initialDetails: Record<string, FormatValues> = {};
    
    selectedFormats.forEach(formatSlug => {
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
    setCurrentTab(selectedFormats[0]); // Definir a primeira aba como atual
    setStep(2);
  };
  
  // Avançar para a etapa 3 (Revisão)
  const goToStep3 = () => {
    console.log("Avançando para etapa 3: Revisão");
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
    if (step === 2) {
      // Verificar quais formatos estão completos
      const updatedFormatsComplete: Record<string, boolean> = {};
      
      Object.entries(formatDetails).forEach(([formatSlug, details]) => {
        const isComplete = !!(details.title && details.editUrl && details.imageUrl);
        updatedFormatsComplete[formatSlug] = isComplete;
      });
      
      setFormatsComplete(updatedFormatsComplete);
    }
  }, [formatDetails, step]);

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
        <div className="overflow-y-auto max-h-[85vh]">
          {/* Header com título e botão de fechar */}
          <div className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center gap-2">
              <FileImage className="h-6 w-6 text-blue-600" />
              <DialogTitle className="text-xl font-bold">Adicionar Arte Multi-Formato</DialogTitle>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Indicador de progresso (etapas) */}
          <div className="flex flex-col items-center border-b pb-4">
            <div className="pt-5 pb-2">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-medium ${step === 1 ? 'bg-blue-600' : 'bg-green-600'}`}>
                  {step > 1 ? <Check className="h-6 w-6" /> : 1}
                </div>
                <div className={`w-20 h-1.5 ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                  step === 2 ? 'bg-blue-600 text-white' : (step > 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700')
                }`}>
                  {step > 2 ? <Check className="h-6 w-6" /> : 2}
                </div>
                <div className={`w-20 h-1.5 ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                  step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  3
                </div>
              </div>
            </div>
            <div className="flex justify-between w-full px-10 text-sm font-medium">
              <div className={`${step === 1 ? 'text-blue-600' : (step > 1 ? 'text-green-600' : 'text-gray-500')}`}>Informações</div>
              <div className={`${step === 2 ? 'text-blue-600' : (step > 2 ? 'text-green-600' : 'text-gray-500')}`}>Upload</div>
              <div className={`${step === 3 ? 'text-blue-600' : 'text-gray-500'}`}>Revisão</div>
            </div>
          </div>
          
          <div className="p-6">
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
                          Informações da Arte
                        </h4>
                        <div className="bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 text-xs text-blue-600">
                          Global
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Categoria */}
                        <div className="space-y-2">
                          <Label htmlFor="categoryId" className="text-sm font-medium">
                            Categoria <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            onValueChange={(value) => step1Form.setValue('categoryId', value, { shouldValidate: true })}
                            value={step1Form.getValues().categoryId}
                          >
                            <SelectTrigger
                              id="categoryId"
                              className={`focus:ring-blue-500 ${
                                step1Form.formState.errors.categoryId ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
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
                          {step1Form.formState.errors.categoryId && (
                            <p className="text-red-500 text-xs mt-1">
                              {step1Form.formState.errors.categoryId.message}
                            </p>
                          )}
                        </div>

                        {/* Tipo de Arquivo */}
                        <div className="space-y-2">
                          <Label htmlFor="globalFileType" className="text-sm font-medium">
                            Tipo de Arquivo <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            onValueChange={(value) => step1Form.setValue('globalFileType', value, { shouldValidate: true })}
                            value={step1Form.getValues().globalFileType}
                          >
                            <SelectTrigger
                              id="globalFileType"
                              className={`focus:ring-blue-500 ${
                                step1Form.formState.errors.globalFileType ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <SelectValue placeholder="Selecione um tipo de arquivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {fileTypes.map((fileType: any) => (
                                <SelectItem key={fileType.id} value={fileType.slug}>
                                  {fileType.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {step1Form.formState.errors.globalFileType && (
                            <p className="text-red-500 text-xs mt-1">
                              {step1Form.formState.errors.globalFileType.message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-6">
                        {/* Título Global */}
                        <div className="space-y-2">
                          <Label htmlFor="globalTitle" className="text-sm font-medium">
                            Título <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="globalTitle"
                            placeholder="Título global da arte"
                            {...step1Form.register('globalTitle')}
                            className={`focus:ring-blue-500 ${
                              step1Form.formState.errors.globalTitle ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {step1Form.formState.errors.globalTitle && (
                            <p className="text-red-500 text-xs mt-1">
                              {step1Form.formState.errors.globalTitle.message}
                            </p>
                          )}
                        </div>
                        
                        {/* Descrição Global */}
                        <div className="space-y-2">
                          <Label htmlFor="globalDescription" className="text-sm font-medium flex items-center">
                            Descrição <span className="text-gray-400 text-xs ml-1">(opcional)</span>
                          </Label>
                          <Textarea
                            id="globalDescription"
                            placeholder="Descrição global que será aplicada a todos os formatos (opcional)"
                            {...step1Form.register('globalDescription')}
                            className="border-gray-300 focus:ring-blue-500 h-32"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Opções e Seleção de Formatos */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold flex items-center text-gray-700">
                          <LayoutGrid className="h-4 w-4 mr-1.5 text-blue-600" />
                          Formatos
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Selecionados: {step1Form.getValues().selectedFormats?.length || 0}
                          </span>
                        </div>
                      </div>
                      
                      {/* Opções Adicionais */}
                      <div className="mb-6 flex gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isPremium"
                            checked={step1Form.getValues().isPremium}
                            onCheckedChange={(checked) => {
                              step1Form.setValue('isPremium', checked);
                            }}
                          />
                          <Label htmlFor="isPremium" className="font-medium cursor-pointer">
                            Arte Premium
                          </Label>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">
                          Selecione os formatos <span className="text-red-500">*</span>
                        </Label>
                        
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                          {formats.map((format: any) => {
                            const isSelected = step1Form.getValues().selectedFormats?.includes(format.slug);
                            
                            return (
                              <div
                                key={format.id}
                                onClick={() => toggleFormat(format.slug)}
                                className={`border-2 rounded-lg p-3 cursor-pointer transition-colors flex flex-col items-center
                                  ${isSelected 
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
                                  }`}
                              >
                                <FileImage className={`h-8 w-8 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {format.name}
                                </span>
                                {isSelected && (
                                  <div className="mt-1 text-xs inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 w-5 h-5">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {step1Form.formState.errors.selectedFormats && (
                          <p className="text-red-500 text-xs mt-1">
                            {step1Form.formState.errors.selectedFormats.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botão de Continuar */}
                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
            
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
                    Preencha os detalhes de cada formato
                  </div>
                </div>

                {/* Tabs para navegar entre formatos */}
                <Tabs 
                  value={currentTab} 
                  onValueChange={setCurrentTab}
                  className="w-full"
                >
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Navegue entre os formatos:</h3>
                    <TabsList className="w-full flex gap-2 bg-transparent p-0">
                      {Object.keys(formatDetails).map(formatSlug => {
                        const formatName = getFormatName(formatSlug);
                        const isComplete = formatsComplete[formatSlug];
                        const isActive = currentTab === formatSlug;
                        
                        return (
                          <TabsTrigger 
                            key={formatSlug} 
                            value={formatSlug}
                            className={`
                              flex items-center gap-1.5 py-2 px-4 rounded-lg 
                              ${isActive ? 'bg-white shadow-sm border border-gray-200' : 'bg-transparent'} 
                              ${isComplete 
                                ? (isActive ? 'text-blue-700 font-medium' : 'text-green-600') 
                                : (isActive ? 'text-gray-800' : 'text-gray-500')
                              }
                            `}
                          >
                            {formatName}
                            {isComplete && <Check className="h-3.5 w-3.5 text-green-600" />}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>

                  {/* Conteúdo de cada tab/formato */}
                  {Object.entries(formatDetails).map(([formatSlug, details]) => (
                    <TabsContent key={formatSlug} value={formatSlug} className="mt-6">
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                          <h2 className="text-lg font-semibold flex items-center">
                            <BookImage className="h-5 w-5 mr-2 text-white" />
                            {getFormatName(formatSlug)}
                          </h2>
                        </div>

                        <div className="p-6">
                          {/* Formulário para detalhes do formato */}
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Título */}
                              <div className="space-y-2">
                                <Label htmlFor={`title-${formatSlug}`} className="text-sm font-medium">
                                  Título <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`title-${formatSlug}`}
                                  placeholder="Título específico para este formato"
                                  value={details.title}
                                  onChange={(e) => saveFormatDetails(formatSlug, { title: e.target.value })}
                                  className="border-gray-300 focus:ring-blue-500"
                                />
                              </div>

                              {/* URL de edição */}
                              <div className="space-y-2">
                                <Label htmlFor={`editUrl-${formatSlug}`} className="text-sm font-medium flex items-center">
                                  <Link2 className="h-4 w-4 mr-1.5 text-blue-600" />
                                  URL de Edição <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`editUrl-${formatSlug}`}
                                  placeholder="URL do Canva, Google Drive, etc."
                                  value={details.editUrl}
                                  onChange={(e) => saveFormatDetails(formatSlug, { editUrl: e.target.value })}
                                  className="border-gray-300 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            {/* Upload de imagem */}
                            <div className="space-y-2">
                              <Label htmlFor={`image-${formatSlug}`} className="text-sm font-medium flex items-center">
                                <UploadCloud className="h-4 w-4 mr-1.5 text-blue-600" />
                                Imagem de Preview <span className="text-red-500">*</span>
                              </Label>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-all hover:border-blue-400">
                                    <div className="flex flex-col items-center justify-center py-3">
                                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                      <p className="text-sm text-gray-500">
                                        Clique para selecionar ou arraste uma imagem
                                      </p>
                                      <input
                                        id={`image-${formatSlug}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, formatSlug)}
                                        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                      />
                                      {/* Status de upload em tempo real */}
                                      {uploading[`image-${formatSlug}`] && (
                                        <div className="flex items-center justify-center mt-2 text-blue-600">
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          <span className="text-sm">Enviando imagem...</span>
                                        </div>
                                      )}
                                      {uploadError[`image-${formatSlug}`] && (
                                        <div className="mt-2 flex items-center text-red-500 text-sm">
                                          <AlertCircle className="h-4 w-4 mr-1" />
                                          {uploadError[`image-${formatSlug}`]}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="col-span-1">
                                  {details.imageUrl ? (
                                    <div className="border rounded-lg overflow-hidden h-full flex items-center justify-center bg-gray-50">
                                      <img
                                        src={details.imageUrl}
                                        alt={`Preview de ${getFormatName(formatSlug)}`}
                                        className="object-contain max-h-40 w-full"
                                      />
                                    </div>
                                  ) : (
                                    <div className="border rounded-lg overflow-hidden h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                      <p className="text-sm text-center px-4">
                                        Preview da imagem <br />aparecerá aqui
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Descrição específica para o formato */}
                            <div className="space-y-2">
                              <Label htmlFor={`description-${formatSlug}`} className="text-sm font-medium flex items-center">
                                Descrição <span className="text-gray-400 text-xs ml-1">(opcional)</span>
                              </Label>
                              <Textarea
                                id={`description-${formatSlug}`}
                                placeholder="Descrição específica para este formato"
                                value={details.description || ''}
                                onChange={(e) => saveFormatDetails(formatSlug, { description: e.target.value })}
                                className="border-gray-300 focus:ring-blue-500 h-20"
                              />
                            </div>
                          </div>
                          
                          {/* Status de conclusão */}
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className={`flex items-center ${
                              formatsComplete[formatSlug] 
                                ? 'text-green-600' 
                                : 'text-amber-600'
                            }`}>
                              {formatsComplete[formatSlug] ? (
                                <>
                                  <Check className="h-5 w-5 mr-2" />
                                  <span>Formato completo</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-5 w-5 mr-2" />
                                  <span>Preencha todos os campos obrigatórios</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Navegação entre etapas */}
                <div className="mt-8 pt-5 border-t border-gray-200">
                  {Object.values(formatsComplete).some(complete => !complete) ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
                      <div className="flex items-center text-amber-700 mb-1">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <h3 className="font-medium">Faltam campos a preencher</h3>
                      </div>
                      <p className="text-sm text-amber-600 pl-7">
                        Complete todos os campos obrigatórios em cada formato para poder avançar.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-4">
                      <div className="flex items-center text-green-700 mb-1">
                        <Check className="h-5 w-5 mr-2" />
                        <h3 className="font-medium">Tudo pronto!</h3>
                      </div>
                      <p className="text-sm text-green-600 pl-7">
                        Todos os detalhes dos formatos foram preenchidos. Você pode avançar para a próxima etapa.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <Button 
                      type="button"
                      onClick={goToPreviousStep}
                      className="flex-1 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Voltar
                    </Button>
                    
                    <Button 
                      type="button"
                      onClick={goToStep3}
                      disabled={Object.values(formatsComplete).some(complete => !complete)}
                      className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      Revisar
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
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
                    Revisão - Confirme as informações antes de salvar
                  </div>
                </div>
                
                {/* Resumo da arte multi-formato */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <FileImage className="h-5 w-5 mr-2 text-white" />
                      Revisão - Resumo da Arte Multi-Formato
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Informações globais */}
                      <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                        <h3 className="text-base font-medium text-blue-700 mb-3 flex items-center">
                          <Settings2 className="h-4 w-4 mr-2" />
                          Informações Globais
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Título Global</p>
                            <p className="font-medium">{step1Form.getValues().globalTitle}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Tipo de Arquivo</p>
                            <p className="font-medium capitalize">{step1Form.getValues().globalFileType}</p>
                          </div>
                          
                          {step1Form.getValues().globalDescription && (
                            <div className="col-span-1 md:col-span-2">
                              <p className="text-sm text-gray-500">Descrição Global</p>
                              <p className="text-sm">{step1Form.getValues().globalDescription}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-sm text-gray-500">Arte Premium</p>
                            <p className="font-medium">
                              {step1Form.getValues().isPremium ? 
                                <span className="text-amber-600 flex items-center">
                                  <Check className="h-4 w-4 mr-1 text-green-600" /> 
                                  Sim
                                </span> : 
                                <span className="text-gray-600">Não</span>
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lista de formatos */}
                      <div>
                        <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center">
                          <LayoutGrid className="h-4 w-4 mr-2 text-blue-600" />
                          Formatos Incluídos
                        </h3>
                        
                        <div className="space-y-3 mt-4">
                          {Object.entries(formatDetails).map(([formatSlug, details]) => (
                            <div key={formatSlug} className="flex border border-gray-200 rounded-lg p-2 bg-white">
                              <div className="h-16 w-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                                {details.imageUrl ? (
                                  <img
                                    src={details.imageUrl}
                                    alt={`Preview de ${getFormatName(formatSlug)}`}
                                    className="object-cover h-full w-full"
                                  />
                                ) : (
                                  <div className="bg-gray-100 h-full w-full flex items-center justify-center text-gray-400">
                                    <FileImage className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 flex-grow">
                                <div className="flex items-center">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                    {getFormatName(formatSlug)}
                                  </span>
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <p className="text-sm font-medium line-clamp-1">{details.title}</p>
                                  <p className="text-xs text-gray-500 line-clamp-1">
                                    <span className="font-medium">Link:</span> {details.editUrl.substring(0, 30)}...
                                  </p>
                                  {details.description && (
                                    <p className="text-xs text-gray-600 line-clamp-2">{details.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botão para salvar */}
                <div className="mt-8 pt-5 border-t border-gray-200">
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-4">
                    <div className="flex items-center text-green-700 mb-1">
                      <Check className="h-5 w-5 mr-2" />
                      <h3 className="font-medium">Revisão concluída</h3>
                    </div>
                    <p className="text-sm text-green-600 pl-7">
                      Todos os detalhes estão preenchidos. Clique em Salvar para finalizar.
                    </p>
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-6 rounded-xl text-base font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {uploadAllComplete ? (
                      <>
                        Upload Concluído
                        <Check className="h-5 w-5 ml-1" />
                      </>
                    ) : (
                      <>
                        Salvar Arte Multi-Formato
                        <Check className="h-5 w-5 ml-1" />
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