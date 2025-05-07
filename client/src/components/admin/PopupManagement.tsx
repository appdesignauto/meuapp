import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HexColorPicker } from 'react-colorful';
import { AlertTriangle, Edit, Eye, Trash2, CheckCircle, XCircle, FileImage, BarChart4 } from 'lucide-react';
import { Popup } from '@/components/Popup';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Popup {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: string;
  size: string;
  animation: string;
  startDate: string;
  endDate: string;
  showOnce: boolean;
  showToLoggedUsers: boolean;
  showToGuestUsers: boolean;
  showToPremiumUsers: boolean;
  frequency: number;
  delay: number;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface PopupFormValues {
  title: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: string;
  size: string;
  animation: string;
  startDate: Date;
  endDate: Date;
  showOnce: boolean;
  showToLoggedUsers: boolean;
  showToGuestUsers: boolean;
  showToPremiumUsers: boolean;
  frequency: number;
  delay: number;
  isActive: boolean;
}

interface PopupStatistics {
  totalViews: number;
  totalClicks: number;
  totalDismisses: number;
  uniqueUsers: number;
  uniqueSessions: number;
  conversionRate: number;
}

const defaultFormValues: PopupFormValues = {
  title: '',
  content: '',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  buttonColor: '#4F46E5',
  buttonTextColor: '#FFFFFF',
  position: 'center',
  size: 'medium',
  animation: 'fade',
  startDate: new Date(),
  endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 dias no futuro
  showOnce: false,
  showToLoggedUsers: true,
  showToGuestUsers: true,
  showToPremiumUsers: true,
  frequency: 1,
  delay: 2,
  isActive: true
};

export const PopupManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<PopupFormValues>(defaultFormValues);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPopupId, setCurrentPopupId] = useState<number | null>(null);
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [statsPopupId, setStatsPopupId] = useState<number | null>(null);

  // Buscar lista de popups
  const { data: popups, isLoading } = useQuery({
    queryKey: ['/api/popups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/popups');
      return res.json();
    }
  });

  // Buscar estatísticas do popup
  const { data: popupStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/popups/stats', statsPopupId],
    queryFn: async () => {
      if (!statsPopupId) return null;
      const res = await apiRequest('GET', `/api/popups/${statsPopupId}/stats`);
      return res.json();
    },
    enabled: !!statsPopupId
  });

  // Mutation para criar popup
  const createPopupMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest('POST', '/api/popups', undefined, { formData: true, body: formData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/popups'] });
      toast({
        title: 'Popup criado',
        description: 'O popup foi criado com sucesso.',
        variant: 'default'
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao criar popup: ${error.message || 'Tente novamente.'}`,
        variant: 'destructive'
      });
    }
  });

  // Mutation para atualizar popup
  const updatePopupMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number, formData: FormData }) => {
      const res = await apiRequest('PUT', `/api/popups/${id}`, undefined, { formData: true, body: formData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/popups'] });
      toast({
        title: 'Popup atualizado',
        description: 'O popup foi atualizado com sucesso.',
        variant: 'default'
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao atualizar popup: ${error.message || 'Tente novamente.'}`,
        variant: 'destructive'
      });
    }
  });

  // Mutation para excluir popup
  const deletePopupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/popups/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/popups'] });
      toast({
        title: 'Popup excluído',
        description: 'O popup foi excluído com sucesso.',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao excluir popup: ${error.message || 'Tente novamente.'}`,
        variant: 'destructive'
      });
    }
  });

  // Resetar formulário
  const resetForm = () => {
    setFormValues(defaultFormValues);
    setIsCreating(false);
    setIsEditing(false);
    setCurrentPopupId(null);
    setImageFile(null);
    setShowColorPicker(null);
  };

  // Carregar dados do popup para edição
  const loadPopupForEdit = (popup: Popup) => {
    setFormValues({
      title: popup.title,
      content: popup.content,
      imageUrl: popup.imageUrl,
      buttonText: popup.buttonText || '',
      buttonUrl: popup.buttonUrl || '',
      backgroundColor: popup.backgroundColor,
      textColor: popup.textColor,
      buttonColor: popup.buttonColor,
      buttonTextColor: popup.buttonTextColor,
      position: popup.position,
      size: popup.size,
      animation: popup.animation,
      startDate: new Date(popup.startDate),
      endDate: new Date(popup.endDate),
      showOnce: popup.showOnce,
      showToLoggedUsers: popup.showToLoggedUsers,
      showToGuestUsers: popup.showToGuestUsers,
      showToPremiumUsers: popup.showToPremiumUsers,
      frequency: popup.frequency,
      delay: popup.delay,
      isActive: popup.isActive
    });
    setCurrentPopupId(popup.id);
    setIsEditing(true);
    setIsCreating(true);
  };

  // Visualizar popup
  const handlePreview = () => {
    const previewData = {
      id: currentPopupId || 0,
      ...formValues,
      startDate: formValues.startDate.toISOString(),
      endDate: formValues.endDate.toISOString(),
      createdBy: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setPreviewPopup(previewData as Popup);
  };

  // Fechar visualização
  const closePreview = () => {
    setPreviewPopup(null);
  };

  // Verificar se as datas são válidas
  const validateDates = () => {
    if (formValues.startDate > formValues.endDate) {
      toast({
        title: 'Datas inválidas',
        description: 'A data de início deve ser anterior à data de término.',
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };

  // Preparar dados para submissão
  const prepareFormData = () => {
    if (!validateDates()) return null;

    const formData = new FormData();
    
    // Dados do formulário em JSON
    const jsonData = {
      ...formValues,
      startDate: formValues.startDate.toISOString(),
      endDate: formValues.endDate.toISOString()
    };
    
    formData.append('data', JSON.stringify(jsonData));
    
    // Adicionar imagem, se existir
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    return formData;
  };

  // Lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = prepareFormData();
    if (!formData) return;
    
    if (isEditing && currentPopupId) {
      updatePopupMutation.mutate({ id: currentPopupId, formData });
    } else {
      createPopupMutation.mutate(formData);
    }
  };

  // Lidar com o upload de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // Verificar status do popup (ativo/inativo)
  const isPopupActive = (popup: Popup) => {
    const now = new Date();
    const startDate = new Date(popup.startDate);
    const endDate = new Date(popup.endDate);
    
    return popup.isActive && startDate <= now && endDate >= now;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Popups</h2>
        <Button onClick={() => setIsCreating(true)}>Criar Novo Popup</Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Editar Popup' : 'Criar Novo Popup'}</CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Atualize as configurações do popup existente.' 
                : 'Configure um novo popup promocional para exibir aos usuários.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="content">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  <TabsTrigger value="appearance">Aparência</TabsTrigger>
                  <TabsTrigger value="timing">Tempo e Frequência</TabsTrigger>
                  <TabsTrigger value="targeting">Segmentação</TabsTrigger>
                </TabsList>
                
                {/* Aba de Conteúdo */}
                <TabsContent value="content" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input 
                        id="title" 
                        value={formValues.title} 
                        onChange={(e) => setFormValues({...formValues, title: e.target.value})} 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea 
                        id="content" 
                        value={formValues.content} 
                        onChange={(e) => setFormValues({...formValues, content: e.target.value})} 
                        required 
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="image">Imagem</Label>
                      <div className="flex items-center space-x-4">
                        <Input 
                          id="image" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                        />
                        {(formValues.imageUrl || imageFile) && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setFormValues({...formValues, imageUrl: undefined});
                              setImageFile(null);
                            }}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                      {formValues.imageUrl && !imageFile && (
                        <div className="mt-2">
                          <img 
                            src={formValues.imageUrl} 
                            alt="Preview" 
                            className="max-h-32 rounded-md" 
                          />
                        </div>
                      )}
                      {imageFile && (
                        <div className="mt-2">
                          <img 
                            src={URL.createObjectURL(imageFile)} 
                            alt="Preview" 
                            className="max-h-32 rounded-md" 
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="buttonText">Texto do Botão (opcional)</Label>
                      <Input 
                        id="buttonText" 
                        value={formValues.buttonText || ''} 
                        onChange={(e) => setFormValues({...formValues, buttonText: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="buttonUrl">URL do Botão (opcional)</Label>
                      <Input 
                        id="buttonUrl" 
                        value={formValues.buttonUrl || ''} 
                        onChange={(e) => setFormValues({...formValues, buttonUrl: e.target.value})} 
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {/* Aba de Aparência */}
                <TabsContent value="appearance" className="space-y-4">
                  <div className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cor de Fundo</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-10 h-10 rounded border cursor-pointer" 
                            style={{ backgroundColor: formValues.backgroundColor }}
                            onClick={() => setShowColorPicker(showColorPicker === 'background' ? null : 'background')}
                          />
                          <Input 
                            value={formValues.backgroundColor} 
                            onChange={(e) => setFormValues({...formValues, backgroundColor: e.target.value})} 
                          />
                        </div>
                        {showColorPicker === 'background' && (
                          <div className="mt-2 relative">
                            <div className="absolute z-10">
                              <HexColorPicker 
                                color={formValues.backgroundColor} 
                                onChange={(color) => setFormValues({...formValues, backgroundColor: color})} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label>Cor do Texto</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-10 h-10 rounded border cursor-pointer" 
                            style={{ backgroundColor: formValues.textColor }}
                            onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
                          />
                          <Input 
                            value={formValues.textColor} 
                            onChange={(e) => setFormValues({...formValues, textColor: e.target.value})} 
                          />
                        </div>
                        {showColorPicker === 'text' && (
                          <div className="mt-2 relative">
                            <div className="absolute z-10">
                              <HexColorPicker 
                                color={formValues.textColor} 
                                onChange={(color) => setFormValues({...formValues, textColor: color})} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cor do Botão</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-10 h-10 rounded border cursor-pointer" 
                            style={{ backgroundColor: formValues.buttonColor }}
                            onClick={() => setShowColorPicker(showColorPicker === 'button' ? null : 'button')}
                          />
                          <Input 
                            value={formValues.buttonColor} 
                            onChange={(e) => setFormValues({...formValues, buttonColor: e.target.value})} 
                          />
                        </div>
                        {showColorPicker === 'button' && (
                          <div className="mt-2 relative">
                            <div className="absolute z-10">
                              <HexColorPicker 
                                color={formValues.buttonColor} 
                                onChange={(color) => setFormValues({...formValues, buttonColor: color})} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label>Cor do Texto do Botão</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-10 h-10 rounded border cursor-pointer" 
                            style={{ backgroundColor: formValues.buttonTextColor }}
                            onClick={() => setShowColorPicker(showColorPicker === 'buttonText' ? null : 'buttonText')}
                          />
                          <Input 
                            value={formValues.buttonTextColor} 
                            onChange={(e) => setFormValues({...formValues, buttonTextColor: e.target.value})} 
                          />
                        </div>
                        {showColorPicker === 'buttonText' && (
                          <div className="mt-2 relative">
                            <div className="absolute z-10">
                              <HexColorPicker 
                                color={formValues.buttonTextColor} 
                                onChange={(color) => setFormValues({...formValues, buttonTextColor: color})} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="position">Posição</Label>
                        <Select 
                          value={formValues.position} 
                          onValueChange={(value) => setFormValues({...formValues, position: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a posição" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Centro</SelectItem>
                            <SelectItem value="top-left">Superior Esquerdo</SelectItem>
                            <SelectItem value="top-right">Superior Direito</SelectItem>
                            <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                            <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="size">Tamanho</Label>
                        <Select 
                          value={formValues.size} 
                          onValueChange={(value) => setFormValues({...formValues, size: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Pequeno</SelectItem>
                            <SelectItem value="medium">Médio</SelectItem>
                            <SelectItem value="large">Grande</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="animation">Animação</Label>
                        <Select 
                          value={formValues.animation} 
                          onValueChange={(value) => setFormValues({...formValues, animation: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a animação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fade">Aparecer (Fade)</SelectItem>
                            <SelectItem value="slide">Deslizar (Slide)</SelectItem>
                            <SelectItem value="zoom">Zoom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Aba de Tempo e Frequência */}
                <TabsContent value="timing" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data de Início</Label>
                        <DatePicker
                          date={formValues.startDate}
                          setDate={(date) => setFormValues({...formValues, startDate: date || new Date()})}
                        />
                      </div>
                      
                      <div>
                        <Label>Data de Término</Label>
                        <DatePicker
                          date={formValues.endDate}
                          setDate={(date) => setFormValues({...formValues, endDate: date || new Date()})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="frequency">Frequência de Exibição</Label>
                        <Select 
                          value={formValues.frequency.toString()} 
                          onValueChange={(value) => setFormValues({...formValues, frequency: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Sempre (cada visita)</SelectItem>
                            <SelectItem value="2">A cada 2 visitas</SelectItem>
                            <SelectItem value="3">A cada 3 visitas</SelectItem>
                            <SelectItem value="5">A cada 5 visitas</SelectItem>
                            <SelectItem value="10">A cada 10 visitas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="delay">Atraso para Exibição (segundos)</Label>
                        <Input 
                          id="delay" 
                          type="number" 
                          min="0" 
                          max="60" 
                          value={formValues.delay} 
                          onChange={(e) => setFormValues({...formValues, delay: parseInt(e.target.value) || 0})} 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox 
                        id="showOnce" 
                        checked={formValues.showOnce}
                        onCheckedChange={(checked) => 
                          setFormValues({...formValues, showOnce: checked === true})
                        }
                      />
                      <Label htmlFor="showOnce">Mostrar apenas uma vez por usuário</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isActive" 
                        checked={formValues.isActive}
                        onCheckedChange={(checked) => 
                          setFormValues({...formValues, isActive: checked === true})
                        }
                      />
                      <Label htmlFor="isActive">Popup Ativo</Label>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Aba de Segmentação */}
                <TabsContent value="targeting" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showToLoggedUsers" 
                        checked={formValues.showToLoggedUsers}
                        onCheckedChange={(checked) => 
                          setFormValues({...formValues, showToLoggedUsers: checked === true})
                        }
                      />
                      <Label htmlFor="showToLoggedUsers">Mostrar para usuários logados</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showToGuestUsers" 
                        checked={formValues.showToGuestUsers}
                        onCheckedChange={(checked) => 
                          setFormValues({...formValues, showToGuestUsers: checked === true})
                        }
                      />
                      <Label htmlFor="showToGuestUsers">Mostrar para visitantes (não logados)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showToPremiumUsers" 
                        checked={formValues.showToPremiumUsers}
                        onCheckedChange={(checked) => 
                          setFormValues({...formValues, showToPremiumUsers: checked === true})
                        }
                      />
                      <Label htmlFor="showToPremiumUsers">Mostrar para usuários premium</Label>
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção</AlertTitle>
                      <AlertDescription>
                        Se todas as opções de segmentação forem desmarcadas, o popup não será exibido para nenhum usuário.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createPopupMutation.isPending || updatePopupMutation.isPending}
            >
              {isEditing ? 'Atualizar' : 'Criar'} Popup
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Popups Existentes</h3>
        
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : popups && popups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {popups.map((popup: Popup) => (
              <Card key={popup.id} className={isPopupActive(popup) ? 'border-green-500' : ''}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{popup.title}</CardTitle>
                    <CardDescription>
                      {isPopupActive(popup) ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500">
                          <XCircle className="h-4 w-4 mr-1" />
                          Inativo
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadPopupForEdit(popup)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatsPopupId(popup.id)}
                    >
                      <BarChart4 className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Excluir Popup</DialogTitle>
                          <DialogDescription>
                            Tem certeza que deseja excluir o popup "{popup.title}"? Esta ação não pode ser desfeita.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {}}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deletePopupMutation.mutate(popup.id)}
                            disabled={deletePopupMutation.isPending}
                          >
                            Excluir
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div className="text-sm line-clamp-2">{popup.content}</div>
                    {popup.imageUrl && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <FileImage className="h-4 w-4" />
                        <span>Imagem incluída</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Exibição: {format(new Date(popup.startDate), 'dd/MM/yyyy', { locale: ptBR })} a {format(new Date(popup.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum popup cadastrado. Crie um novo popup para começar.</p>
          </div>
        )}
      </div>

      {/* Estatísticas de Popup */}
      {statsPopupId && (
        <Dialog open={!!statsPopupId} onOpenChange={(open) => { if (!open) setStatsPopupId(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Estatísticas do Popup</DialogTitle>
              <DialogDescription>
                Estatísticas de visualizações e interações para este popup.
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingStats ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : popupStats ? (
              <div className="grid grid-cols-2 gap-4 py-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Visualizações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{popupStats.totalViews}</div>
                    <div className="text-sm text-gray-500 mt-1">Total de exibições</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Cliques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{popupStats.totalClicks}</div>
                    <div className="text-sm text-gray-500 mt-1">Total de cliques no botão</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{popupStats.conversionRate}%</div>
                    <div className="text-sm text-gray-500 mt-1">Cliques / Visualizações</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Fechamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{popupStats.totalDismisses}</div>
                    <div className="text-sm text-gray-500 mt-1">Vezes que o popup foi fechado</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Usuários Únicos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{popupStats.uniqueUsers}</div>
                    <div className="text-sm text-gray-500 mt-1">Usuários logados que viram o popup</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sessões Únicas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{popupStats.uniqueSessions}</div>
                    <div className="text-sm text-gray-500 mt-1">Sessões de visitantes</div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma estatística disponível para este popup.</p>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setStatsPopupId(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Popup de Preview */}
      {previewPopup && (
        <Popup
          title={previewPopup.title}
          content={previewPopup.content}
          imageUrl={previewPopup.imageUrl || imageFile ? URL.createObjectURL(imageFile!) : undefined}
          buttonText={previewPopup.buttonText || undefined}
          buttonUrl={previewPopup.buttonUrl || undefined}
          backgroundColor={previewPopup.backgroundColor}
          textColor={previewPopup.textColor}
          buttonColor={previewPopup.buttonColor}
          buttonTextColor={previewPopup.buttonTextColor}
          position={previewPopup.position as any}
          size={previewPopup.size as any}
          animation={previewPopup.animation as any}
          sessionId="preview"
          popupId={previewPopup.id}
          onClose={closePreview}
        />
      )}
    </div>
  );
};