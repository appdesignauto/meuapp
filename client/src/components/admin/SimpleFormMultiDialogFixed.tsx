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
  ChevronLeft, ChevronRight, ArrowRight, Save as SaveIcon,
  Square, Smartphone, MonitorSmartphone, LayoutTemplate, 
  Columns, ScreenShare, Image
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
  editingArt?: any; // Arte existente para edição
  isEditing?: boolean; // Flag para indicar modo de edição
}

export default function SimpleFormMultiDialog({ 
  isOpen, 
  onClose, 
  editingArt, 
  isEditing = false 
}: SimpleFormMultiDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(isEditing ? 2 : 1); // 1: Configurações globais, 2: Formatos, 3: Upload
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

  // Formulário para etapa 1 (configurações globais)
  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      categoryId: '',
      globalFileType: 'canva',
      isPremium: true,
      globalTitle: '',
      globalDescription: '',
      selectedFormats: []
    }
  });

  // Estado de carregamento
  const isLoading = isLoadingCategories || isLoadingFormats || isLoadingFileTypes;

  // Efeito para carregar dados da arte quando em modo de edição
  useEffect(() => {
    if (isEditing && editingArt && !isLoading) {
      console.log("=== MODO DE EDIÇÃO INICIADO ===");
      console.log("Dados completos da arte:", editingArt);
      console.log(`ID da arte: ${editingArt.id}`);
      console.log(`Título da arte: ${editingArt.title}`);
      console.log(`Grupo da arte: ${editingArt.groupId}`);
      console.log(`Tipo de dados do groupId: ${typeof editingArt.groupId}`);
      
      // Log para ajudar na depuração da API recém-implementada
      console.log("DEPURAÇÃO: Nova API de grupo implementada - testando carregamento de artes do grupo");
      
      // Atualizar o formulário da etapa 1 com os dados da arte
      step1Form.setValue('categoryId', editingArt.categoryId?.toString() || '');
      step1Form.setValue('globalFileType', editingArt.fileType || 'canva');
      step1Form.setValue('isPremium', editingArt.isPremium || true);
      step1Form.setValue('globalTitle', editingArt.title || '');
      step1Form.setValue('globalDescription', editingArt.description || '');
      
      // O groupId pode estar no banco mas não no objeto editingArt (que vem da API)
      // Vamos fazer uma consulta para verificar o groupId diretamente
      const artId = editingArt.id;
      
      // Verificar se o artId é válido
      if (!artId) {
        console.error("ID da arte não encontrado para verificação de grupo");
        handleSingleArtEdit();
        return;
      }
      
      console.log(`Verificando grupo para arte ${artId} usando endpoint check-group`);
      
      // Tentar buscar informações do grupo para esta arte, mesmo se o groupId não estiver no objeto
      apiRequest('GET', `/api/admin/arts/${artId}/check-group`)
        .then(res => {
          console.log(`Resposta da verificação de grupo recebida, status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          const groupId = data.groupId;
          console.log(`Verificação de groupId para arte ${artId}: ${groupId}`);
          
          if (groupId) {
            // Agora temos o groupId confirmado, buscar todas as artes do grupo
            console.log(`Buscando artes do grupo: ${groupId}`);
            
            return apiRequest('GET', `/api/admin/arts/group/${groupId}`)
              .then(res => {
                console.log(`Resposta recebida, status: ${res.status}`);
                return res.json();
              });
          } else {
            console.log(`Arte ${artId} não pertence a nenhum grupo`);
            handleSingleArtEdit();
            return { arts: [] };
          }
        })
        .then(data => {
          // Só processar esta parte se tivermos um groupId
          if (!data || !data.arts) return;
          
          console.log(`Dados recebidos do grupo:`, data);
          const groupArts = data.arts || [];
          
          console.log(`Artes encontradas no grupo: ${groupArts.length}`);
          
          if (Array.isArray(groupArts) && groupArts.length > 0) {
            // Extrair os formatos das artes do grupo
            const formatSlugs = groupArts.map(art => art.format);
            console.log(`Formatos encontrados: ${formatSlugs.join(', ')}`);
            
            step1Form.setValue('selectedFormats', formatSlugs);
            
            // Preencher os detalhes de cada formato
            const initialDetails: Record<string, FormatValues> = {};
            groupArts.forEach(art => {
              initialDetails[art.format] = {
                format: art.format,
                fileType: art.fileType || 'canva',
                title: art.title || '',
                description: art.description || '',
                imageUrl: art.imageUrl || '',
                previewUrl: art.previewUrl || '',
                editUrl: art.editUrl || '',
              };
              console.log(`Formato ${art.format} carregado: ${art.title}`);
            });
            
            setFormatDetails(initialDetails);
            
            // Verificar quais formatos estão completos
            const updatedFormatsComplete: Record<string, boolean> = {};
            Object.entries(initialDetails).forEach(([formatSlug, details]) => {
              const isComplete = !!(details.title && details.editUrl && details.imageUrl);
              updatedFormatsComplete[formatSlug] = isComplete;
            });
            setFormatsComplete(updatedFormatsComplete);
            
            // Definir a aba da arte que está sendo editada como atual
            setCurrentTab(editingArt.format);
            console.log(`Definindo aba ativa: ${editingArt.format}`);
            
            // Guardar as imagens
            const imageMap: Record<string, string> = {};
            groupArts.forEach(art => {
              imageMap[art.format] = art.imageUrl || '';
            });
            setImages(imageMap);
            
            // Avançar direto para a etapa 2 (upload) depois de carregar os dados
            console.log(`Avançando para etapa 2 após carregar dados do grupo`);
            setTimeout(() => {
              setStep(2);
            }, 100);
          } else {
            console.log(`Nenhuma arte encontrada no grupo, tratando como arte única`);
            // Se não encontrou artes do grupo, tratar como arte única
            handleSingleArtEdit();
          }
        })
        .catch((error) => {
          console.error("Erro ao carregar dados do grupo:", error);
          // Em caso de erro, tratar como arte única
          handleSingleArtEdit();
        });
    } else {
      // O código não precisa mais verificar editingArt.groupId, pois agora usamos o endpoint check-group
      // Esse bloco só é executado se o fetch para check-group falhou
      if (isEditing && editingArt) {
        console.log("Verificação de grupo não foi encontrada, tratando como arte única");
        handleSingleArtEdit();
      }
    }
  }, [isEditing, editingArt, isLoading]);

  // Função para tratar edição de arte única
  const handleSingleArtEdit = () => {
    if (!editingArt) return;
    
    // Usar apenas o formato da arte atual
    const formatSlug = editingArt.format;
    if (formatSlug) {
      step1Form.setValue('selectedFormats', [formatSlug]);
      
      // Configurar detalhes do formato
      const initialDetails: Record<string, FormatValues> = {
        [formatSlug]: {
          format: formatSlug,
          fileType: editingArt.fileType || 'canva',
          title: editingArt.title || '',
          description: editingArt.description || '',
          imageUrl: editingArt.imageUrl || '',
          previewUrl: editingArt.previewUrl || '',
          editUrl: editingArt.editUrl || '',
        }
      };
      
      setFormatDetails(initialDetails);
      setCurrentTab(formatSlug);
      
      // Marcar formato como completo
      setFormatsComplete({
        [formatSlug]: true
      });
      
      // Definir as imagens
      setImages({
        [formatSlug]: editingArt.imageUrl || ''
      });
      
      // Avançar direto para a etapa 2 (upload) depois de carregar os dados
      setTimeout(() => {
        setStep(2);
      }, 100);
    }
  };

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

      let response;
      let successMessage;

      // Verificar se estamos editando ou criando
      if (isEditing && editingArt) {
        // Adicionar ID da arte existente para edição
        if (editingArt.groupId) {
          // Se tem groupId, atualizar o grupo inteiro
          formattedData.groupId = editingArt.groupId;
          response = await apiRequest('PUT', `/api/admin/arts/group/${editingArt.groupId}`, formattedData);
        } else {
          // Se não tem groupId, mas estamos adicionando múltiplos formatos a uma arte existente
          formattedData.artId = editingArt.id;
          response = await apiRequest('PUT', `/api/admin/arts/multi/${editingArt.id}`, formattedData);
        }
        successMessage = "Arte atualizada com sucesso";
      } else {
        // Criar nova arte multi-formato
        response = await apiRequest('POST', '/api/admin/arts/multi', formattedData);
        successMessage = "Arte criada com sucesso";
      }

      const result = await response.json();

      toast({
        title: successMessage,
        description: isEditing 
          ? "As alterações foram salvas."
          : "A arte com múltiplos formatos foi criada.",
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
              <DialogTitle className="text-xl font-bold">
                {isEditing ? 'Editar Arte Multi-Formato' : 'Adicionar Arte Multi-Formato'}
              </DialogTitle>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Indicador de progresso (etapas) com textos alinhados */}
          <div className="flex flex-col items-center border-b pb-4">
            <div className="pt-5 pb-2">
              <div className="flex justify-center space-x-10">
                <div className="flex flex-col items-center">
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center mb-1 ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {step > 1 ? <Check className="h-5 w-5" /> : 1}
                  </div>
                  <div className="text-sm font-medium">Informações Gerais</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center mb-1 ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {step > 2 ? <Check className="h-5 w-5" /> : 2}
                  </div>
                  <div className="text-sm font-medium">Formatos e Uploads</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center mb-1 ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {step > 3 ? <Check className="h-5 w-5" /> : 3}
                  </div>
                  <div className="text-sm font-medium">Revisão</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo do formulário baseado na etapa atual */}
          <div className="p-6">
            {/* Etapa 1: Informações gerais */}
            {step === 1 && (
              <form onSubmit={step1Form.handleSubmit(goToStep2)} className="space-y-6">
                <div>
                  <Label htmlFor="categoryId">Categoria <span className="text-red-500">*</span></Label>
                  <Controller
                    name="categoryId"
                    control={step1Form.control}
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
                  {step1Form.formState.errors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{step1Form.formState.errors.categoryId.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="globalFileType">Tipo de Arquivo <span className="text-red-500">*</span></Label>
                  <Controller
                    name="globalFileType"
                    control={step1Form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
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
                    )}
                  />
                  {step1Form.formState.errors.globalFileType && (
                    <p className="text-red-500 text-sm mt-1">{step1Form.formState.errors.globalFileType.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="globalTitle">Título Global <span className="text-red-500">*</span></Label>
                  <Input
                    {...step1Form.register("globalTitle")}
                    placeholder="Título da arte"
                  />
                  {step1Form.formState.errors.globalTitle && (
                    <p className="text-red-500 text-sm mt-1">{step1Form.formState.errors.globalTitle.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="globalDescription">Descrição Global</Label>
                  <Textarea
                    {...step1Form.register("globalDescription")}
                    placeholder="Descrição opcional da arte"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isPremium"
                    control={step1Form.control}
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
                
                <div>
                  <Label>Formatos <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {formats.map((format: any) => (
                      <div
                        key={format.id}
                        className={`
                          border rounded-md p-3 cursor-pointer transition-colors 
                          ${step1Form.watch('selectedFormats')?.includes(format.slug) 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        onClick={() => toggleFormat(format.slug)}
                      >
                        <div className="flex items-center space-x-2">
                          {format.slug === 'feed' && <Smartphone className="h-4 w-4" />}
                          {format.slug === 'stories' && <MonitorSmartphone className="h-4 w-4" />}
                          {format.slug === 'web-banner' && <ScreenShare className="h-4 w-4" />}
                          {format.slug === 'capa-fan-page' && <Image className="h-4 w-4" />}
                          {format.slug === 'cartaz' && <BookImage className="h-4 w-4" />}
                          {format.slug === 'carrocel' && <LayoutTemplate className="h-4 w-4" />}
                          <span className="font-medium">{format.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                      </div>
                    ))}
                  </div>
                  {step1Form.formState.errors.selectedFormats && (
                    <p className="text-red-500 text-sm mt-1">{step1Form.formState.errors.selectedFormats.message}</p>
                  )}
                </div>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <Button onClick={onClose} type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
            
            {/* Etapa 2: Formatos e uploads */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label>Selecione um formato para editar:</Label>
                  <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-2">
                    <TabsList className="w-full overflow-x-auto flex-wrap">
                      {step1Form.getValues().selectedFormats.map((formatSlug) => (
                        <TabsTrigger
                          key={formatSlug}
                          value={formatSlug}
                          className="flex items-center space-x-1 min-w-[120px]"
                        >
                          {formatSlug === 'feed' && <Smartphone className="h-4 w-4" />}
                          {formatSlug === 'stories' && <MonitorSmartphone className="h-4 w-4" />}
                          {formatSlug === 'web-banner' && <ScreenShare className="h-4 w-4" />}
                          {formatSlug === 'capa-fan-page' && <Image className="h-4 w-4" />}
                          {formatSlug === 'cartaz' && <BookImage className="h-4 w-4" />}
                          {formatSlug === 'carrocel' && <LayoutTemplate className="h-4 w-4" />}
                          <span>{getFormatName(formatSlug)}</span>
                          {formatsComplete[formatSlug] && (
                            <Check className="h-3.5 w-3.5 text-green-500 ml-1" />
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {step1Form.getValues().selectedFormats.map((formatSlug) => (
                      <TabsContent key={formatSlug} value={formatSlug} className="mt-6 space-y-6">
                        {/* Detalhes do formato específico */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-6">
                            <div>
                              <Label htmlFor={`${formatSlug}-title`}>Título <span className="text-red-500">*</span></Label>
                              <Input
                                id={`${formatSlug}-title`}
                                value={formatDetails[formatSlug]?.title || ''}
                                onChange={(e) => saveFormatDetails(formatSlug, { title: e.target.value })}
                                placeholder="Título específico para este formato"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`${formatSlug}-description`}>Descrição</Label>
                              <Textarea
                                id={`${formatSlug}-description`}
                                value={formatDetails[formatSlug]?.description || ''}
                                onChange={(e) => saveFormatDetails(formatSlug, { description: e.target.value })}
                                placeholder="Descrição específica para este formato"
                                rows={3}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`${formatSlug}-editUrl`}>URL de Edição <span className="text-red-500">*</span></Label>
                              <Input
                                id={`${formatSlug}-editUrl`}
                                value={formatDetails[formatSlug]?.editUrl || ''}
                                onChange={(e) => saveFormatDetails(formatSlug, { editUrl: e.target.value })}
                                placeholder="URL do arquivo para edição (ex: Canva, Google Drive)"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`${formatSlug}-previewUrl`}>URL de Pré-visualização</Label>
                              <Input
                                id={`${formatSlug}-previewUrl`}
                                value={formatDetails[formatSlug]?.previewUrl || ''}
                                onChange={(e) => saveFormatDetails(formatSlug, { previewUrl: e.target.value })}
                                placeholder="URL opcional para pré-visualização"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <Label>Upload de Imagem <span className="text-red-500">*</span></Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center">
                              {images[formatSlug] ? (
                                <div className="space-y-3">
                                  <div className="relative mx-auto max-w-xs overflow-hidden rounded border border-gray-200">
                                    <img
                                      src={images[formatSlug]}
                                      alt={`Preview de ${getFormatName(formatSlug)}`}
                                      className="h-auto w-full object-cover"
                                    />
                                  </div>
                                  <div className="flex justify-center space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center"
                                      asChild
                                    >
                                      <a href={images[formatSlug]} target="_blank" rel="noopener noreferrer">
                                        <Eye className="mr-1 h-4 w-4" /> Ver
                                      </a>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center"
                                      onClick={() => {
                                        setImages(prev => {
                                          const newImages = { ...prev };
                                          delete newImages[formatSlug];
                                          return newImages;
                                        });
                                        saveFormatDetails(formatSlug, { imageUrl: '' });
                                      }}
                                    >
                                      <Trash className="mr-1 h-4 w-4" /> Remover
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gray-100">
                                    <Upload className="h-10 w-10 text-gray-400" />
                                    <div className="mt-1 text-sm font-medium text-gray-400">Carregar imagem</div>
                                  </div>
                                  <div className="flex justify-center">
                                    <Label
                                      htmlFor={`upload-${formatSlug}`}
                                      className="cursor-pointer inline-flex items-center space-x-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                      <UploadCloud className="h-4 w-4" />
                                      <span>Selecionar arquivo</span>
                                      <Input
                                        id={`upload-${formatSlug}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, formatSlug)}
                                        className="hidden"
                                      />
                                    </Label>
                                  </div>
                                  {uploading[`image-${formatSlug}`] && (
                                    <div className="flex justify-center mt-2">
                                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                      <span className="ml-2 text-sm text-gray-500">Enviando...</span>
                                    </div>
                                  )}
                                  {uploadError[`image-${formatSlug}`] && (
                                    <div className="flex justify-center mt-2 text-sm text-red-500">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      {uploadError[`image-${formatSlug}`]}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex items-center">
                                {formatsComplete[formatSlug] ? (
                                  <div className="flex items-center text-green-600">
                                    <Check className="h-5 w-5 mr-1" />
                                    <span>Formato completo</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-amber-600">
                                    <AlertCircle className="h-5 w-5 mr-1" />
                                    <span>Preencha todos os campos obrigatórios</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  
                  <Button type="button" onClick={goToStep3} disabled={!Object.values(formatsComplete).every(Boolean)}>
                    Continuar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Etapa 3: Revisão e confirmação */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Revisão</h3>
                  <div className="space-y-4">
                    <div className="rounded-md border border-gray-200 p-4">
                      <h4 className="font-medium text-blue-600 mb-2">Informações Gerais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">Categoria:</div>
                          <div>
                            {categories.find((cat: any) => cat.id.toString() === step1Form.getValues().categoryId)?.name || 'Não selecionada'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">Tipo de Arquivo:</div>
                          <div>
                            {fileTypes.find((ft: any) => ft.slug === step1Form.getValues().globalFileType)?.name || 'Não selecionado'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">Título Global:</div>
                          <div>{step1Form.getValues().globalTitle || 'Não definido'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">Arte Premium:</div>
                          <div>{step1Form.getValues().isPremium ? 'Sim' : 'Não'}</div>
                        </div>
                        <div className="space-y-1 col-span-1 md:col-span-2">
                          <div className="font-medium">Descrição Global:</div>
                          <div>{step1Form.getValues().globalDescription || 'Não definida'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Formatos ({Object.keys(formatDetails).length})</h4>
                      <div className="space-y-3">
                        {Object.entries(formatDetails).map(([formatSlug, details]) => (
                          <div key={formatSlug} className="rounded-md border border-gray-200 p-4">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center space-x-2">
                                {formatSlug === 'feed' && <Smartphone className="h-4 w-4" />}
                                {formatSlug === 'stories' && <MonitorSmartphone className="h-4 w-4" />}
                                {formatSlug === 'web-banner' && <ScreenShare className="h-4 w-4" />}
                                {formatSlug === 'capa-fan-page' && <Image className="h-4 w-4" />}
                                {formatSlug === 'cartaz' && <BookImage className="h-4 w-4" />}
                                {formatSlug === 'carrocel' && <LayoutTemplate className="h-4 w-4" />}
                                <h5 className="font-medium">{getFormatName(formatSlug)}</h5>
                              </div>
                              {formatsComplete[formatSlug] && (
                                <div className="flex items-center text-green-600 text-xs font-medium">
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span>Completo</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1 col-span-1 md:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div className="space-y-1">
                                    <div className="font-medium">Título:</div>
                                    <div>{details.title || 'Não definido'}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="font-medium">Tipo de Arquivo:</div>
                                    <div>
                                      {fileTypes.find((ft: any) => ft.slug === details.fileType)?.name || 'Não selecionado'}
                                    </div>
                                  </div>
                                  <div className="space-y-1 col-span-1 md:col-span-2">
                                    <div className="font-medium">URL de Edição:</div>
                                    <div className="truncate text-blue-600 hover:underline">
                                      <a href={details.editUrl} target="_blank" rel="noopener noreferrer">
                                        {details.editUrl || 'Não definida'}
                                      </a>
                                    </div>
                                  </div>
                                  {details.previewUrl && (
                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                      <div className="font-medium">URL de Pré-visualização:</div>
                                      <div className="truncate text-blue-600 hover:underline">
                                        <a href={details.previewUrl} target="_blank" rel="noopener noreferrer">
                                          {details.previewUrl}
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                  {details.description && (
                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                      <div className="font-medium">Descrição:</div>
                                      <div>{details.description}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex justify-center items-start">
                                {images[formatSlug] ? (
                                  <div className="relative max-w-[120px] overflow-hidden rounded border border-gray-200">
                                    <img
                                      src={images[formatSlug]}
                                      alt={`Imagem para ${getFormatName(formatSlug)}`}
                                      className="h-auto w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                                    <Image className="h-8 w-8 text-gray-300" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  
                  <Button type="button" onClick={handleSubmit} className="space-x-1">
                    <SaveIcon className="mr-1 h-4 w-4" />
                    <span>{isEditing ? 'Salvar Alterações' : 'Criar Arte'}</span>
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