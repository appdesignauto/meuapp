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
  Columns, ScreenShare, Image, Eye, Trash, 
  AlignLeft, Text as TypeIcon
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
  formats: z.array(formatSchema).min(1, "Adicione pelo menos um formato"),
  groupId: z.string().optional(),
  globalTitle: z.string().optional(),
  globalDescription: z.string().optional(),
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
      apiRequest('GET', `/api/admin/artes/${artId}/check-group`)
        .then(res => {
          console.log(`Resposta da verificação de grupo recebida, status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('Dados completos da verificação de grupo:', JSON.stringify(data));
          return data;
        })
        .then(data => {
          const groupId = data.groupId;
          console.log(`Verificação de groupId para arte ${artId}: ${groupId}`);
          
          if (groupId) {
            // Agora temos o groupId confirmado, buscar todas as artes do grupo
            console.log(`Buscando artes do grupo: ${groupId}`);
            
            // Forçar a definição do groupId na arte que está sendo editada
            // Isso garante consistência mesmo que o objeto original não o tenha
            if (editingArt) {
              editingArt.groupId = groupId;
            }
            
            return apiRequest('GET', `/api/admin/artes/group/${groupId}`)
              .then(res => {
                console.log(`Resposta recebida da API /api/admin/artes/group/${groupId}, status: ${res.status}`);
                return res.json();
              })
              .then(data => {
                console.log(`Dados completos da resposta do grupo: ${JSON.stringify(data)}`);
                // Verificar se temos dados de artes no formato esperado
                if (!data.arts || !Array.isArray(data.arts) || data.arts.length === 0) {
                  console.warn(`Nenhuma arte encontrada no grupo ou formato inválido:`, data);
                }
                return data;
              })
              .catch(err => {
                console.error(`Erro ao buscar grupo de artes: ${err}`, err);
                return { arts: [] };
              });
          } else {
            console.log(`Arte ${artId} não pertence a nenhum grupo`);
            handleSingleArtEdit();
            return { arts: [] };
          }
        })
        .then(data => {
          // Só processar esta parte se tivermos um groupId
          if (!data || !data.arts) {
            console.log('Nenhuma arte encontrada nos dados recebidos:', data);
            return;
          }
          
          console.log(`Dados recebidos do grupo:`, data);
          const groupArts = data.arts || [];
          
          console.log(`Artes encontradas no grupo: ${groupArts.length}`);
          
          // Importante: Verificar se temos pelo menos uma arte no grupo
          // mesmo com uma arte, podemos editá-la como grupo (mais flexível)
          if (Array.isArray(groupArts) && groupArts.length > 0) {
            console.log(`Total de ${groupArts.length} artes encontradas no grupo ID ${data.groupId}`);
            
            // Extrair os formatos das artes do grupo com melhor validação
            const formatSlugs = groupArts
              .filter(art => art && typeof art === 'object')
              .map(art => art.format)
              .filter(format => format && typeof format === 'string');
              
            console.log(`Formatos encontrados após validação: ${formatSlugs.join(', ')} (${formatSlugs.length} formatos)`);
            
            // Verificação crítica - exibir alerta se não encontrou formatos válidos
            if (formatSlugs.length === 0) {
              console.error('ERRO CRÍTICO: Nenhum formato válido encontrado nas artes do grupo');
              toast({
                title: "Erro ao processar grupo",
                description: "Não foram encontrados formatos válidos neste grupo de artes.",
                variant: "destructive"
              });
            }
            
            // Todos os slugs de formato são considerados válidos, 
            // já que vêm diretamente do banco de dados e já existem artes com esses formatos
            // Não precisamos mais fazer a validação com a lista de formatos disponíveis
            
            // Vamos apenas garantir que não temos duplicatas e valores inválidos
            const formatosValidos = [...new Set(formatSlugs)].filter(slug => slug && typeof slug === 'string');
            
            console.log(`Formatos considerados válidos para edição: ${formatosValidos.join(', ')}`);
            
            if (formatosValidos.length === 0) {
              console.warn('Nenhum formato válido encontrado entre as artes do grupo após limpeza');
            }
            
            // Importante: Definir todos os formatos do grupo no formulário para exibição das abas
            step1Form.setValue('selectedFormats', formatosValidos);
            
            // Adicionamos um log para facilitar diagnóstico futuro
            console.log(`Definidos ${formatosValidos.length} formatos válidos no formulário: ${JSON.stringify(formatosValidos)}`);
            
            // Configurar formulário para modo de edição múltipla
            console.log("Configurando formulário para edição de múltiplas artes");
            
            // Preencher os detalhes de cada formato
            const initialDetails: Record<string, FormatValues> = {};
            console.log(`Processando ${groupArts.length} artes do grupo com formatos válidos: ${formatosValidos.join(', ')}`);
            
            // Mapeamento de todas as artes do grupo por formato para fácil referência
            const artesPorFormato: Record<string, any> = {};
            groupArts.forEach(art => {
              if (art && art.format) {
                artesPorFormato[art.format] = art;
              }
            });
            
            console.log('Formatos válidos para processar:', formatosValidos);
            console.log('Artes disponíveis por formato:', artesPorFormato);
            
            // Agora processamos apenas os formatos válidos
            formatosValidos.forEach(formato => {
              const arte = artesPorFormato[formato];
              if (arte) {
                console.log(`Processando formato ${formato} com arte ID ${arte.id}`);
                initialDetails[formato] = {
                  format: formato,
                  fileType: arte.fileType || 'canva',
                  title: arte.title || '',
                  description: arte.description || '',
                  imageUrl: arte.imageUrl || '',
                  previewUrl: arte.previewUrl || '',
                  editUrl: arte.editUrl || '',
                };
              } else {
                console.warn(`Formato ${formato} selecionado mas não encontrado no grupo de artes!`);
                // Criar um formato vazio para não quebrar a interface
                initialDetails[formato] = {
                  format: formato,
                  fileType: step1Form.getValues('globalFileType') || 'canva',
                  title: '',
                  description: '',
                  imageUrl: '',
                  previewUrl: '',
                  editUrl: '',
                };
              }
              console.log(`Formato ${formato} configurado para edição de grupo`);
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
            // Se houver formatos válidos, definir o formato da arte clicada como aba ativa
            if (formatosValidos.length > 0) {
              console.log(`Grupo tem ${formatosValidos.length} formatos válidos`);
              
              // Definir a aba atual usando o formato da arte que o usuário clicou para editar
              // Se o formato da arte clicada estiver entre os formatos válidos, usá-lo como aba ativa
              if (editingArt && editingArt.format && formatosValidos.includes(editingArt.format)) {
                console.log(`Definindo formato da arte clicada como aba ativa: ${editingArt.format}`);
                setCurrentTab(editingArt.format);
              } else {
                // Caso contrário, usar o primeiro formato como padrão
                console.log(`Formato da arte clicada não encontrado ou inválido, usando o primeiro formato: ${formatosValidos[0]}`);
                setCurrentTab(formatosValidos[0]);
              }
              
              // Log para confirmar a aba ativa
              console.log(`Aba ativa definida como: ${currentTab}`);
              
              // Importante: garantir que step1Form tenha os formatos corretos
              // Várias partes do componente dependem desta informação
              if (Array.isArray(step1Form.getValues('selectedFormats'))) {
                console.log(`selectedFormats atual: ${step1Form.getValues('selectedFormats').join(', ')}`);
              } else {
                console.log(`ERRO: selectedFormats não é um array!`);
              }
              
              // Forçar atualização após a mudança para garantir renderização
              setTimeout(() => {
                console.log(`Verificando formatos selecionados após timeout: ${step1Form.getValues('selectedFormats')?.join(', ')}`);
              }, 100);
            } else if (editingArt && editingArt.format) {
              setCurrentTab(editingArt.format);
              console.log(`Nenhum formato válido no grupo, usando formato da arte: ${editingArt.format}`);
            } else {
              console.error('ERRO CRÍTICO: Não foi possível determinar um formato para a aba ativa');
            }
            
            // Guardar as imagens apenas dos formatos válidos selecionados
            const imageMap: Record<string, string> = {};
            
            // Usar o mesmo mapeamento de artes por formato
            formatosValidos.forEach(formato => {
              const arte = artesPorFormato[formato];
              if (arte && arte.imageUrl) {
                imageMap[formato] = arte.imageUrl;
                console.log(`Imagem registrada para o formato ${formato}: ${arte.imageUrl.substring(0, 50)}...`);
              }
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
      
      // Definir a aba ativa como o formato da arte que está sendo editada
      setCurrentTab(formatSlug);
      console.log(`Definindo aba ativa para formato da arte única: ${formatSlug}`);
      
      // Configurar detalhes do formato
      const initialDetails: Record<string, FormatValues> = {
        [formatSlug]: {
          format: formatSlug,
          fileType: editingArt.fileType || 'canva',
          title: editingArt.title || '',
          description: editingArt.description || '',
          imageUrl: editingArt.imageUrl || '',
          // Campo de previewUrl removido conforme solicitado
          editUrl: editingArt.editUrl || '',
        }
      };
      
      setFormatDetails(initialDetails);
      
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
  
  // Obter o nome do tipo de arquivo a partir do slug
  const getFileTypeName = (slug: string) => {
    if (!fileTypes || !Array.isArray(fileTypes)) return slug;
    const fileType = fileTypes.find((ft: any) => ft.slug === slug);
    return fileType ? fileType.name : slug;
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

    // Atualizar os detalhes dos formatos, preservando dados já inseridos
    const updatedDetails: Record<string, FormatValues> = { ...formatDetails };
    
    selectedFormats.forEach(formatSlug => {
      // Se o formato já existe em formatDetails, atualizar apenas o que veio do form 
      // (isso preserva imageUrl e editUrl que já foram preenchidos)
      if (updatedDetails[formatSlug]) {
        updatedDetails[formatSlug] = {
          ...updatedDetails[formatSlug],
          format: formatSlug,
          fileType: data.globalFileType,
          title: updatedDetails[formatSlug].title || data.globalTitle || '',
          description: updatedDetails[formatSlug].description || data.globalDescription || '',
        };
      } else {
        // Se é um novo formato, inicializar completamente
        updatedDetails[formatSlug] = {
          format: formatSlug,
          fileType: data.globalFileType,
          title: data.globalTitle || '',
          description: data.globalDescription || '',
          imageUrl: '',
          editUrl: ''
        };
      }
    });
    
    // Remover formatos que não estão mais selecionados
    Object.keys(updatedDetails).forEach(formatSlug => {
      if (!selectedFormats.includes(formatSlug)) {
        delete updatedDetails[formatSlug];
      }
    });
    
    setFormatDetails(updatedDetails);
    
    // Se o tab atual não está mais entre os selecionados, definir o primeiro como atual
    if (!selectedFormats.includes(currentTab)) {
      setCurrentTab(selectedFormats[0]);
    }
    
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
        
        // Invalidar o cache para atualizar a UI imediatamente após a edição
        queryClient.invalidateQueries({ queryKey: ['/api/artes'] });
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
      // Garantir que tanto a versão em português quanto a versão em inglês da rota sejam invalidadas
      queryClient.invalidateQueries({ queryKey: ['/api/artes'] });
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
              <div className="flex justify-center space-x-6 md:space-x-12 relative py-3">
                {/* Linhas de conexão entre os círculos */}
                <div className="absolute top-1/2 left-[25%] right-[25%] h-[2px] bg-gray-200 -z-10"></div>
                <div className="absolute top-1/2 left-[50%] right-[25%] h-[2px] bg-gray-200 -z-10"></div>
                
                {/* Linhas de progresso baseado na etapa atual */}
                <div className={`absolute top-1/2 left-[25%] h-[2px] -z-5 transition-all duration-300 ease-in-out
                  ${step >= 2 ? 'right-[25%] bg-blue-500' : 'right-[75%] bg-blue-500'}`}></div>
                <div className={`absolute top-1/2 left-[50%] h-[2px] -z-5 transition-all duration-300 ease-in-out
                  ${step >= 3 ? 'right-[25%] bg-blue-500' : 'right-[50%] bg-blue-500'}`}></div>
                
                <div className="flex flex-col items-center z-10">
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center mb-2 transition-all duration-300 
                    ${step >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-200 text-gray-600'}`}>
                    {step > 1 ? <Check className="h-5 w-5" /> : 1}
                  </div>
                  <div className={`text-sm font-medium ${step === 1 ? 'text-blue-600' : 'text-gray-600'}`}>Informações</div>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center mb-2 transition-all duration-300
                    ${step >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-200 text-gray-600'}`}>
                    {step > 2 ? <Check className="h-5 w-5" /> : 2}
                  </div>
                  <div className={`text-sm font-medium ${step === 2 ? 'text-blue-600' : 'text-gray-600'}`}>Uploads</div>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center mb-2 transition-all duration-300
                    ${step >= 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-200 text-gray-600'}`}>
                    {step > 3 ? <Check className="h-5 w-5" /> : 3}
                  </div>
                  <div className={`text-sm font-medium ${step === 3 ? 'text-blue-600' : 'text-gray-600'}`}>Publicação</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo do formulário baseado na etapa atual */}
          <div className="p-6">
            {/* Etapa 1: Informações gerais */}
            {step === 1 && (
              <form onSubmit={step1Form.handleSubmit(goToStep2)} className="space-y-8">
                {/* Seção 1: Informações básicas */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Settings2 className="h-5 w-5 mr-2 text-blue-500" />
                    Informações
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="categoryId" className="flex items-center mb-1.5">
                        <FolderOpen className="h-4 w-4 mr-1.5 text-gray-500" />
                        Categoria <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Controller
                        name="categoryId"
                        control={step1Form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="bg-white">
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
                        <p className="text-red-500 text-sm mt-1.5">{step1Form.formState.errors.categoryId.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="globalFileType" className="flex items-center mb-1.5">
                        <TypeIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                        Tipo de Arquivo <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Controller
                        name="globalFileType"
                        control={step1Form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="bg-white">
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
                        <p className="text-red-500 text-sm mt-1.5">{step1Form.formState.errors.globalFileType.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Label htmlFor="globalTitle" className="flex items-center mb-1.5">
                      <TypeIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                      Título da Arte <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      {...step1Form.register("globalTitle")}
                      placeholder="Título da arte"
                      className="bg-white"
                    />
                    {step1Form.formState.errors.globalTitle && (
                      <p className="text-red-500 text-sm mt-1.5">{step1Form.formState.errors.globalTitle.message}</p>
                    )}
                  </div>
                  
                  {/* Campo de descrição global removido para evitar inconsistências no multi-formato */}
                  
                  <div className="mt-6 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-center">
                    <div className="flex items-center mr-3">
                      <Controller
                        name="isPremium"
                        control={step1Form.control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="isPremium"
                            className="data-[state=checked]:bg-blue-600"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="isPremium" className="font-medium text-blue-700 cursor-pointer">Arte Premium</Label>
                      <p className="text-xs text-blue-600 mt-0.5">Somente assinantes terão acesso a esta arte.</p>
                    </div>
                  </div>
                </div>
                
                {/* Seção 2: Seleção de formatos */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <LayoutGrid className="h-5 w-5 mr-2 text-blue-500" />
                    Formatos <span className="text-red-500 ml-1">*</span>
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    Selecione os formatos disponíveis para esta arte. Você poderá personalizar cada formato na próxima etapa.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {formats.map((format: any) => (
                      <div
                        key={format.id}
                        className={`
                          border rounded-lg p-4 cursor-pointer transition-all 
                          ${step1Form.watch('selectedFormats')?.includes(format.slug) 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                          }
                        `}
                        onClick={() => toggleFormat(format.slug)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {format.slug === 'feed' && <Smartphone className="h-5 w-5 text-blue-600" />}
                            {format.slug === 'stories' && <MonitorSmartphone className="h-5 w-5 text-blue-600" />}
                            {format.slug === 'web-banner' && <ScreenShare className="h-5 w-5 text-blue-600" />}
                            {format.slug === 'capa-fan-page' && <Image className="h-5 w-5 text-blue-600" />}
                            {format.slug === 'cartaz' && <BookImage className="h-5 w-5 text-blue-600" />}
                            {format.slug === 'carrocel' && <LayoutTemplate className="h-5 w-5 text-blue-600" />}
                            <span className="font-medium text-gray-800">{format.name}</span>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors
                            ${step1Form.watch('selectedFormats')?.includes(format.slug)
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300 bg-white'
                            }`}
                          >
                            {step1Form.watch('selectedFormats')?.includes(format.slug) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2 pl-7">
                          {format.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {step1Form.formState.errors.selectedFormats && (
                    <p className="text-red-500 text-sm mt-3 pl-1">{step1Form.formState.errors.selectedFormats.message}</p>
                  )}
                </div>
                
                <div className="pt-6 flex justify-end space-x-3">
                  <Button 
                    onClick={onClose} 
                    type="button" 
                    variant="outline" 
                    className="px-5"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                  >
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
            
            {/* Etapa 2: Uploads */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="flex items-center text-lg font-medium">
                    <LayoutGrid className="h-5 w-5 mr-2 text-blue-500" />
                    Selecione um formato para editar:
                  </Label>
                  
                  <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-3">
                    <TabsList className="w-full flex overflow-x-auto flex-wrap bg-transparent border-b border-gray-200 p-0 mb-1 h-auto">
                      {/* Renderização de abas de formatos */}
                      {(step1Form.getValues().selectedFormats || []).map((formatSlug) => {
                        console.log(`Renderizando aba para formato: ${formatSlug}`);
                        return (
                          <TabsTrigger
                            key={formatSlug}
                            value={formatSlug}
                            className={`
                              flex items-center space-x-2 min-w-[140px] rounded-none px-4 py-3 
                              font-medium relative bg-transparent text-gray-700 border-0
                              hover:bg-gray-50 hover:text-blue-600 transition-colors
                              data-[state=active]:text-blue-600 data-[state=active]:bg-transparent
                              data-[state=active]:border-b-2 data-[state=active]:border-blue-600
                              data-[state=active]:shadow-none data-[state=active]:after:absolute
                              data-[state=active]:after:bottom-0 data-[state=active]:after:left-0
                              data-[state=active]:after:right-0 data-[state=active]:after:h-0.5
                            `}
                          >
                            {formatSlug === 'feed' && <Smartphone className="h-5 w-5 mr-2" />}
                            {formatSlug === 'stories' && <MonitorSmartphone className="h-5 w-5 mr-2" />}
                            {formatSlug === 'web-banner' && <ScreenShare className="h-5 w-5 mr-2" />}
                            {formatSlug === 'capa-fan-page' && <Image className="h-5 w-5 mr-2" />}
                            {formatSlug === 'cartaz' && <BookImage className="h-5 w-5 mr-2" />}
                            {formatSlug === 'carrocel' && <LayoutTemplate className="h-5 w-5 mr-2" />}
                            <span>{getFormatName(formatSlug) || formatSlug}</span>
                            {formatsComplete[formatSlug] && (
                              <Check className="h-3.5 w-3.5 text-green-500 ml-2" />
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                    
                    {(step1Form.getValues().selectedFormats || []).map((formatSlug) => (
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
                              <Label htmlFor={`${formatSlug}-fileType`}>Tipo de Arquivo <span className="text-red-500">*</span></Label>
                              <Select
                                value={formatDetails[formatSlug]?.fileType || step1Form.getValues().globalFileType}
                                onValueChange={(value) => saveFormatDetails(formatSlug, { fileType: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um tipo de arquivo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fileTypes && Array.isArray(fileTypes) && fileTypes.map((fileType: any) => (
                                    <SelectItem key={fileType.id} value={fileType.slug}>
                                      {fileType.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                            
                            {/* Campo de URL de pré-visualização removido conforme solicitado */}
                          </div>
                          
                          <div className="space-y-6">
                            <Label>Upload de Imagem <span className="text-red-500">*</span></Label>
                            <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center bg-blue-50/30 transition-all hover:border-blue-300">
                              {images[formatSlug] ? (
                                <div className="space-y-4">
                                  <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg border border-gray-200 shadow-md">
                                    <img
                                      src={images[formatSlug]}
                                      alt={`Preview de ${getFormatName(formatSlug)}`}
                                      className="h-auto w-full object-cover"
                                    />
                                  </div>
                                  <div className="flex justify-center space-x-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center px-4"
                                      asChild
                                    >
                                      <a href={images[formatSlug]} target="_blank" rel="noopener noreferrer">
                                        <Eye className="mr-2 h-4 w-4" /> Visualizar
                                      </a>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 px-4"
                                      onClick={() => {
                                        setImages(prev => {
                                          const newImages = { ...prev };
                                          delete newImages[formatSlug];
                                          return newImages;
                                        });
                                        saveFormatDetails(formatSlug, { imageUrl: '' });
                                      }}
                                    >
                                      <Trash className="mr-2 h-4 w-4" /> Remover
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full bg-blue-50 border-2 border-dashed border-blue-200">
                                    <Upload className="h-12 w-12 text-blue-400" />
                                    <div className="mt-2 text-sm font-medium text-blue-600">Upload de imagem</div>
                                  </div>
                                  <div className="flex justify-center">
                                    <Label
                                      htmlFor={`upload-${formatSlug}`}
                                      className="cursor-pointer inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
                                    >
                                      <UploadCloud className="h-4 w-4 mr-2" />
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
                                    <div className="flex justify-center items-center mt-2 bg-blue-50 rounded-md p-2">
                                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                      <span className="ml-2 text-sm text-blue-600">Enviando arquivo...</span>
                                    </div>
                                  )}
                                  {uploadError[`image-${formatSlug}`] && (
                                    <div className="flex justify-center items-center mt-2 bg-red-50 rounded-md p-2 text-sm text-red-600">
                                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <span>{uploadError[`image-${formatSlug}`]}</span>
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
                
                <div className="pt-6 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={goToPreviousStep}
                    className="px-5"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={goToStep3} 
                    disabled={!Object.values(formatsComplete).every(Boolean)}
                    className={`px-6 ${
                      Object.values(formatsComplete).every(Boolean) 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : ''
                    }`}
                  >
                    Continuar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Etapa 3: Publicação */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center mb-5">
                    <h3 className="text-xl font-semibold text-blue-800">Publicação</h3>
                    <div className="ml-3 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Etapa Final
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Card de informações gerais */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 overflow-hidden">
                      <div className="px-5 py-4 bg-blue-100/70 border-b border-blue-200 flex items-center">
                        <FolderOpen className="h-5 w-5 text-blue-700 mr-2.5" />
                        <h4 className="font-medium text-blue-800 text-lg">Informações</h4>
                      </div>
                      
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-lg bg-white p-3 border border-blue-100 shadow-sm">
                            <div className="flex items-center mb-2">
                              <FolderOpen className="h-4 w-4 text-blue-500 mr-1.5" />
                              <div className="font-medium text-gray-700">Categoria</div>
                            </div>
                            <div className="text-gray-800 font-medium">
                              {categories.find((cat: any) => cat.id.toString() === step1Form.getValues().categoryId)?.name || 'Não selecionada'}
                            </div>
                          </div>
                          
                          <div className="rounded-lg bg-white p-3 border border-blue-100 shadow-sm">
                            <div className="flex items-center mb-2">
                              <TypeIcon className="h-4 w-4 text-blue-500 mr-1.5" />
                              <div className="font-medium text-gray-700">Tipo de Arquivo</div>
                            </div>
                            <div className="text-gray-800 font-medium">
                              {getFileTypeName(step1Form.getValues().globalFileType)}
                            </div>
                          </div>
                          
                          <div className="rounded-lg bg-white p-3 border border-blue-100 shadow-sm">
                            <div className="flex items-center mb-2">
                              <TypeIcon className="h-4 w-4 text-blue-500 mr-1.5" />
                              <div className="font-medium text-gray-700">Título da Arte</div>
                            </div>
                            <div className="text-gray-800 font-medium">
                              {step1Form.getValues().globalTitle || 'Não definido'}
                            </div>
                          </div>
                          
                          <div className="rounded-lg bg-white p-3 border border-blue-100 shadow-sm">
                            <div className="flex items-center mb-2">
                              <BadgePlus className="h-4 w-4 text-blue-500 mr-1.5" />
                              <div className="font-medium text-gray-700">Arte Premium</div>
                            </div>
                            <div className={step1Form.getValues().isPremium ? 
                              "text-blue-600 font-medium flex items-center" : 
                              "text-gray-600 font-medium flex items-center"
                            }>
                              {step1Form.getValues().isPremium ? 
                                <><Check className="h-4 w-4 mr-1.5" /> Sim</> : 
                                <><X className="h-4 w-4 mr-1.5" /> Não</>
                              }
                            </div>
                          </div>
                          
                          {step1Form.getValues().globalDescription && (
                            <div className="rounded-lg bg-white p-3 border border-blue-100 shadow-sm col-span-1 md:col-span-2">
                              <div className="flex items-center mb-2">
                                <AlignLeft className="h-4 w-4 text-blue-500 mr-1.5" />
                                <div className="font-medium text-gray-700">Descrição da Arte</div>
                              </div>
                              <div className="text-gray-800">
                                {step1Form.getValues().globalDescription || 'Não definida'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Card de formatos */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 overflow-hidden">
                      <div className="px-5 py-4 bg-blue-100/70 border-b border-blue-200 flex items-center justify-between">
                        <div className="flex items-center">
                          <LayoutGrid className="h-5 w-5 text-blue-700 mr-2.5" />
                          <h4 className="font-medium text-blue-800 text-lg">Formatos ({Object.keys(formatDetails).length})</h4>
                        </div>
                        <div className="bg-blue-700 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                          Multi-formato
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="grid grid-cols-1 gap-4">
                          {Object.entries(formatDetails).map(([formatSlug, details]) => (
                            <div key={formatSlug} 
                              className="rounded-lg overflow-hidden border border-blue-100 bg-white shadow-sm hover:shadow-md transition-all"
                            >
                              <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                                <div className="flex items-center">
                                  {formatSlug === 'feed' && <Smartphone className="h-4 w-4 text-blue-600 mr-2" />}
                                  {formatSlug === 'stories' && <MonitorSmartphone className="h-4 w-4 text-blue-600 mr-2" />}
                                  {formatSlug === 'web-banner' && <ScreenShare className="h-4 w-4 text-blue-600 mr-2" />}
                                  {formatSlug === 'capa-fan-page' && <Image className="h-4 w-4 text-blue-600 mr-2" />}
                                  {formatSlug === 'cartaz' && <BookImage className="h-4 w-4 text-blue-600 mr-2" />}
                                  {formatSlug === 'carrocel' && <LayoutTemplate className="h-4 w-4 text-blue-600 mr-2" />}
                                  <h5 className="font-semibold text-gray-800">{getFormatName(formatSlug)}</h5>
                                </div>
                                
                                {formatsComplete[formatSlug] && (
                                  <div className="flex items-center text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                                    <Check className="h-3 w-3 mr-1" />
                                    <span>Completo</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                                {/* Imagem preview */}
                                <div className="md:col-span-1 order-last md:order-first flex justify-center">
                                  {images[formatSlug] ? (
                                    <div className="relative shadow-md rounded-md overflow-hidden border border-gray-200 hover:border-blue-300 transition-all group">
                                      <img
                                        src={images[formatSlug]}
                                        alt={`Imagem para ${getFormatName(formatSlug)}`}
                                        className="h-auto w-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-blue-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a 
                                          href={images[formatSlug]} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-white bg-blue-600 hover:bg-blue-700 rounded-full p-2"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                                      <Image className="h-8 w-8 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Detalhes do formato */}
                                <div className="md:col-span-5 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center text-gray-700">
                                        <TypeIcon className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                        <span className="text-sm font-medium">Título</span>
                                      </div>
                                      <div className="text-gray-900 font-medium">{details.title || 'Não definido'}</div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <div className="flex items-center text-gray-700">
                                        <FileType className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                        <span className="text-sm font-medium">Tipo de Arquivo</span>
                                      </div>
                                      <div className="text-gray-900 font-medium">{getFileTypeName(details.fileType)}</div>
                                    </div>
                                    
                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                      <div className="flex items-center text-gray-700">
                                        <Link2 className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                        <span className="text-sm font-medium">URL de Edição</span>
                                      </div>
                                      <div className="bg-gray-50 px-3 py-2 rounded border border-gray-100 text-sm">
                                        <a 
                                          href={details.editUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                        >
                                          {details.editUrl || 'Não definida'}
                                          <ScreenShare className="h-3.5 w-3.5 ml-1.5 flex-shrink-0" />
                                        </a>
                                      </div>
                                    </div>
                                    
                                    {details.previewUrl && (
                                      <div className="space-y-1 col-span-1 md:col-span-2">
                                        <div className="flex items-center text-gray-700">
                                          <Eye className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                          <span className="text-sm font-medium">URL de Pré-visualização</span>
                                        </div>
                                        <div className="bg-gray-50 px-3 py-2 rounded border border-gray-100 text-sm">
                                          <a 
                                            href={details.previewUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                          >
                                            {details.previewUrl}
                                            <ScreenShare className="h-3.5 w-3.5 ml-1.5 flex-shrink-0" />
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {details.description && (
                                      <div className="space-y-1 col-span-1 md:col-span-2">
                                        <div className="flex items-center text-gray-700">
                                          <AlignLeft className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                          <span className="text-sm font-medium">Descrição</span>
                                        </div>
                                        <div className="bg-gray-50 px-3 py-2 rounded border border-gray-100">
                                          {details.description}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={goToPreviousStep}
                    className="px-5 border-gray-300"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para uploads
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={handleSubmit} 
                    className="bg-green-600 hover:bg-green-700 px-6 shadow-sm"
                  >
                    <SaveIcon className="mr-2 h-5 w-5" />
                    <span className="font-medium">{isEditing ? 'Salvar Alterações' : 'Finalizar e Criar Arte'}</span>
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