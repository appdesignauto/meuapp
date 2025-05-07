import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, ChevronDown, Eye, EyeOff, Edit, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HexColorPicker } from 'react-colorful';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Popup } from '@/components/Popup';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Popup {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'small' | 'medium' | 'large';
  animation: 'fade' | 'slide' | 'zoom';
  delay: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  frequency: number | null;
  pages: string[] | null;
  userRoles: string[] | null;
  sessionId?: string;
}

interface PopupFormValues {
  title: string;
  content: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'small' | 'medium' | 'large';
  animation: 'fade' | 'slide' | 'zoom';
  delay: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  frequency: number | null;
  pages: string[];
  userRoles: string[];
}

const defaultFormValues: PopupFormValues = {
  title: '',
  content: '',
  imageUrl: '',
  buttonText: '',
  buttonUrl: '',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  buttonColor: '#4F46E5',
  buttonTextColor: '#FFFFFF',
  position: 'center',
  size: 'medium',
  animation: 'fade',
  delay: 2,
  startDate: null,
  endDate: null,
  isActive: true,
  frequency: null,
  pages: [],
  userRoles: []
};

const availablePages = [
  { id: 'home', name: 'Página inicial' },
  { id: 'arts', name: 'Galeria de artes' },
  { id: 'categories', name: 'Categorias' },
  { id: 'designers', name: 'Designers' },
  { id: 'planos', name: 'Planos' },
  { id: 'videoaulas', name: 'Videoaulas' }
];

const availableRoles = [
  { id: 'free', name: 'Usuários gratuitos' },
  { id: 'premium', name: 'Usuários premium' },
  { id: 'designer', name: 'Designers' },
  { id: 'admin', name: 'Administradores' }
];

export default function PopupManagement() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formValues, setFormValues] = useState<PopupFormValues>(defaultFormValues);
  const [currentPopupId, setCurrentPopupId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar popups existentes
  useEffect(() => {
    const fetchPopups = async () => {
      try {
        const response = await apiRequest('GET', '/api/popups');
        const data = await response.json();
        setPopups(data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar popups:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os popups.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchPopups();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormValues(prev => ({ ...prev, [name]: checked }));
  };

  const handleColorChange = (name: string, color: string) => {
    setFormValues(prev => ({ ...prev, [name]: color }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFormValues(prev => ({ ...prev, [name]: date }));
  };

  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setFormValues(prev => {
      const currentValues = [...(prev[name as keyof PopupFormValues] as string[])];
      
      if (checked) {
        return { ...prev, [name]: [...currentValues, value] };
      } else {
        return { ...prev, [name]: currentValues.filter(val => val !== value) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar dados para envio
    const formattedData = {
      ...formValues,
      startDate: formValues.startDate ? format(formValues.startDate, 'yyyy-MM-dd') : null,
      endDate: formValues.endDate ? format(formValues.endDate, 'yyyy-MM-dd') : null,
      frequency: formValues.frequency === 0 ? null : formValues.frequency
    };

    try {
      setLoading(true);
      
      if (isEditMode && currentPopupId) {
        // Atualizar popup existente
        await apiRequest('PUT', `/api/popups/${currentPopupId}`, formattedData);
        toast({
          title: 'Sucesso',
          description: 'Popup atualizado com sucesso.',
        });
      } else {
        // Criar novo popup
        await apiRequest('POST', '/api/popups', formattedData);
        toast({
          title: 'Sucesso',
          description: 'Popup criado com sucesso.',
        });
      }
      
      // Recarregar a lista
      const response = await apiRequest('GET', '/api/popups');
      const data = await response.json();
      setPopups(data);
      
      // Fechar formulário e resetar
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar popup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o popup.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (popup: Popup) => {
    // Converter formato de data da API para o usado no formulário
    setFormValues({
      title: popup.title,
      content: popup.content,
      imageUrl: popup.imageUrl || '',
      buttonText: popup.buttonText || '',
      buttonUrl: popup.buttonUrl || '',
      backgroundColor: popup.backgroundColor,
      textColor: popup.textColor,
      buttonColor: popup.buttonColor,
      buttonTextColor: popup.buttonTextColor,
      position: popup.position,
      size: popup.size,
      animation: popup.animation,
      delay: popup.delay,
      startDate: popup.startDate ? new Date(popup.startDate) : null,
      endDate: popup.endDate ? new Date(popup.endDate) : null,
      isActive: popup.isActive,
      frequency: popup.frequency,
      pages: popup.pages || [],
      userRoles: popup.userRoles || []
    });
    
    setCurrentPopupId(popup.id);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await apiRequest('PUT', `/api/popups/${id}/toggle`, { isActive: !isActive });
      setPopups(popups.map(popup => 
        popup.id === id ? { ...popup, isActive: !isActive } : popup
      ));
      
      toast({
        title: 'Status atualizado',
        description: `Popup ${!isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status do popup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do popup.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este popup?')) {
      return;
    }
    
    try {
      await apiRequest('DELETE', `/api/popups/${id}`);
      setPopups(popups.filter(popup => popup.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Popup excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir popup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o popup.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormValues(defaultFormValues);
    setIsFormOpen(false);
    setIsEditMode(false);
    setCurrentPopupId(null);
    setPreviewOpen(false);
  };

  const handlePreviewToggle = () => {
    setPreviewOpen(!previewOpen);
  };

  if (loading && popups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Popups Promocionais</h2>
        <Button 
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1"
        >
          <Plus size={18} /> Novo Popup
        </Button>
      </div>
      
      {/* Lista de popups */}
      {!isFormOpen && (
        <div className="grid gap-4">
          {popups.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              Nenhum popup cadastrado. Clique em "Novo Popup" para criar.
            </p>
          ) : (
            popups.map(popup => (
              <Card key={popup.id} className={cn(
                "border-l-4",
                popup.isActive ? "border-l-green-500" : "border-l-gray-300"
              )}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="font-bold">{popup.title}</CardTitle>
                    <CardDescription>
                      {popup.startDate ? (
                        <>
                          Exibição: {new Date(popup.startDate).toLocaleDateString('pt-BR')} 
                          {popup.endDate ? ` até ${new Date(popup.endDate).toLocaleDateString('pt-BR')}` : ' (sem data de término)'}
                        </>
                      ) : (
                        'Sem período definido'
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2 items-center">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleToggleActive(popup.id, popup.isActive)}
                      title={popup.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {popup.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(popup)}
                      title="Editar"
                    >
                      <Edit size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(popup.id)}
                      title="Excluir"
                      className="hover:text-destructive"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex flex-col sm:flex-row text-sm gap-4">
                    <div className="flex-1">
                      <p>
                        <span className="font-semibold">Posição:</span> {popup.position.replace('-', ' ')}
                      </p>
                      <p>
                        <span className="font-semibold">Tamanho:</span> {popup.size}
                      </p>
                      <p>
                        <span className="font-semibold">Animação:</span> {popup.animation}
                      </p>
                    </div>
                    <div className="flex-1">
                      {popup.pages && popup.pages.length > 0 ? (
                        <p>
                          <span className="font-semibold">Páginas:</span> {popup.pages.map(p => {
                            const page = availablePages.find(ap => ap.id === p);
                            return page ? page.name : p;
                          }).join(', ')}
                        </p>
                      ) : (
                        <p><span className="font-semibold">Páginas:</span> Todas</p>
                      )}
                      
                      {popup.userRoles && popup.userRoles.length > 0 ? (
                        <p>
                          <span className="font-semibold">Usuários:</span> {popup.userRoles.map(r => {
                            const role = availableRoles.find(ar => ar.id === r);
                            return role ? role.name : r;
                          }).join(', ')}
                        </p>
                      ) : (
                        <p><span className="font-semibold">Usuários:</span> Todos</p>
                      )}
                      
                      <p>
                        <span className="font-semibold">Frequência:</span> {popup.frequency === null ? 'Sempre' : `A cada ${popup.frequency} dias`}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between border-t pt-4">
                  <div className="flex gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: popup.backgroundColor }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: popup.textColor }}></div>
                    {popup.buttonText && (
                      <>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: popup.buttonColor }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: popup.buttonTextColor }}></div>
                      </>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    ID: {popup.id}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
      
      {/* Formulário */}
      {isFormOpen && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              {isEditMode ? 'Editar Popup' : 'Novo Popup'}
            </h3>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={resetForm}
            >
              <X size={18} />
            </Button>
          </div>
          
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="appearance">Aparência</TabsTrigger>
              <TabsTrigger value="targeting">Segmentação</TabsTrigger>
              <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit}>
              <TabsContent value="content" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formValues.title}
                      onChange={handleInputChange}
                      placeholder="Digite o título do popup"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formValues.content}
                      onChange={handleInputChange}
                      placeholder="Digite o conteúdo do popup"
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="imageUrl">URL da imagem</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      value={formValues.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="buttonText">Texto do botão</Label>
                    <Input
                      id="buttonText"
                      name="buttonText"
                      value={formValues.buttonText}
                      onChange={handleInputChange}
                      placeholder="Ex: Saiba mais"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="buttonUrl">URL do botão</Label>
                    <Input
                      id="buttonUrl"
                      name="buttonUrl"
                      value={formValues.buttonUrl}
                      onChange={handleInputChange}
                      placeholder="https://exemplo.com/pagina"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Cores</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="backgroundColor" className="text-xs">Fundo</Label>
                        <div className="flex mt-1">
                          <div
                            className="w-10 h-10 border rounded-l flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: formValues.backgroundColor }}
                            onClick={() => setColorPickerOpen(colorPickerOpen === 'backgroundColor' ? null : 'backgroundColor')}
                          ></div>
                          <Input
                            id="backgroundColor"
                            name="backgroundColor"
                            value={formValues.backgroundColor}
                            onChange={handleInputChange}
                            className="rounded-l-none"
                          />
                        </div>
                        {colorPickerOpen === 'backgroundColor' && (
                          <div className="absolute z-10 mt-1">
                            <HexColorPicker
                              color={formValues.backgroundColor}
                              onChange={(color) => handleColorChange('backgroundColor', color)}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="textColor" className="text-xs">Texto</Label>
                        <div className="flex mt-1">
                          <div
                            className="w-10 h-10 border rounded-l flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: formValues.textColor }}
                            onClick={() => setColorPickerOpen(colorPickerOpen === 'textColor' ? null : 'textColor')}
                          ></div>
                          <Input
                            id="textColor"
                            name="textColor"
                            value={formValues.textColor}
                            onChange={handleInputChange}
                            className="rounded-l-none"
                          />
                        </div>
                        {colorPickerOpen === 'textColor' && (
                          <div className="absolute z-10 mt-1">
                            <HexColorPicker
                              color={formValues.textColor}
                              onChange={(color) => handleColorChange('textColor', color)}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="buttonColor" className="text-xs">Fundo do botão</Label>
                        <div className="flex mt-1">
                          <div
                            className="w-10 h-10 border rounded-l flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: formValues.buttonColor }}
                            onClick={() => setColorPickerOpen(colorPickerOpen === 'buttonColor' ? null : 'buttonColor')}
                          ></div>
                          <Input
                            id="buttonColor"
                            name="buttonColor"
                            value={formValues.buttonColor}
                            onChange={handleInputChange}
                            className="rounded-l-none"
                          />
                        </div>
                        {colorPickerOpen === 'buttonColor' && (
                          <div className="absolute z-10 mt-1">
                            <HexColorPicker
                              color={formValues.buttonColor}
                              onChange={(color) => handleColorChange('buttonColor', color)}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="buttonTextColor" className="text-xs">Texto do botão</Label>
                        <div className="flex mt-1">
                          <div
                            className="w-10 h-10 border rounded-l flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: formValues.buttonTextColor }}
                            onClick={() => setColorPickerOpen(colorPickerOpen === 'buttonTextColor' ? null : 'buttonTextColor')}
                          ></div>
                          <Input
                            id="buttonTextColor"
                            name="buttonTextColor"
                            value={formValues.buttonTextColor}
                            onChange={handleInputChange}
                            className="rounded-l-none"
                          />
                        </div>
                        {colorPickerOpen === 'buttonTextColor' && (
                          <div className="absolute z-10 mt-1">
                            <HexColorPicker
                              color={formValues.buttonTextColor}
                              onChange={(color) => handleColorChange('buttonTextColor', color)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="position">Posição</Label>
                      <Select
                        value={formValues.position}
                        onValueChange={(value) => handleSelectChange('position', value)}
                      >
                        <SelectTrigger id="position">
                          <SelectValue placeholder="Selecione a posição" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="top-left">Superior esquerdo</SelectItem>
                          <SelectItem value="top-right">Superior direito</SelectItem>
                          <SelectItem value="bottom-left">Inferior esquerdo</SelectItem>
                          <SelectItem value="bottom-right">Inferior direito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="size">Tamanho</Label>
                      <Select
                        value={formValues.size}
                        onValueChange={(value) => handleSelectChange('size', value)}
                      >
                        <SelectTrigger id="size">
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
                        onValueChange={(value) => handleSelectChange('animation', value)}
                      >
                        <SelectTrigger id="animation">
                          <SelectValue placeholder="Selecione a animação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fade">Fade (desvanecer)</SelectItem>
                          <SelectItem value="slide">Slide (deslizar)</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="delay">Atraso para exibição (segundos)</Label>
                      <Input
                        id="delay"
                        name="delay"
                        type="number"
                        min="0"
                        step="1"
                        value={formValues.delay}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="targeting" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Período de exibição</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="startDate">Data de início</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                {formValues.startDate ? (
                                  format(formValues.startDate, "PPP", { locale: ptBR })
                                ) : (
                                  <span className="text-muted-foreground">Selecione uma data</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={formValues.startDate || undefined}
                                onSelect={(date) => handleDateChange('startDate', date)}
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label htmlFor="endDate">Data de término</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                {formValues.endDate ? (
                                  format(formValues.endDate, "PPP", { locale: ptBR })
                                ) : (
                                  <span className="text-muted-foreground">Selecione uma data</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={formValues.endDate || undefined}
                                onSelect={(date) => handleDateChange('endDate', date)}
                                locale={ptBR}
                                disabled={(date) => 
                                  formValues.startDate ? 
                                    date < new Date(formValues.startDate) : 
                                    false
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="frequency">Frequência de exibição</Label>
                      <Select
                        value={formValues.frequency ? formValues.frequency.toString() : '0'}
                        onValueChange={(value) => handleSelectChange('frequency', value)}
                      >
                        <SelectTrigger id="frequency">
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Mostrar sempre</SelectItem>
                          <SelectItem value="1">Uma vez por dia</SelectItem>
                          <SelectItem value="3">Uma vez a cada 3 dias</SelectItem>
                          <SelectItem value="7">Uma vez por semana</SelectItem>
                          <SelectItem value="14">Uma vez a cada 2 semanas</SelectItem>
                          <SelectItem value="30">Uma vez por mês</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="isActive"
                        checked={formValues.isActive}
                        onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                      />
                      <Label htmlFor="isActive">Popup ativo</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Páginas (deixe em branco para todas)</Label>
                      <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                        {availablePages.map(page => (
                          <div key={page.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`page-${page.id}`}
                              checked={formValues.pages.includes(page.id)}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange('pages', page.id, checked === true)
                              }
                            />
                            <Label 
                              htmlFor={`page-${page.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {page.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Tipos de usuário (deixe em branco para todos)</Label>
                      <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                        {availableRoles.map(role => (
                          <div key={role.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`role-${role.id}`}
                              checked={formValues.userRoles.includes(role.id)}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange('userRoles', role.id, checked === true)
                              }
                            />
                            <Label 
                              htmlFor={`role-${role.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {role.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="pt-4">
                <div className="border rounded-lg p-6 relative">
                  {previewOpen ? (
                    <>
                      <Popup 
                        id={0}
                        title={formValues.title}
                        content={formValues.content}
                        imageUrl={formValues.imageUrl || undefined}
                        buttonText={formValues.buttonText || undefined}
                        buttonUrl={formValues.buttonUrl || undefined}
                        backgroundColor={formValues.backgroundColor}
                        textColor={formValues.textColor}
                        buttonColor={formValues.buttonColor}
                        buttonTextColor={formValues.buttonTextColor}
                        position={formValues.position}
                        size={formValues.size}
                        animation={formValues.animation}
                        delay={0}
                        onClose={() => setPreviewOpen(false)}
                        sessionId="preview"
                      />
                      <p className="text-center text-sm text-muted-foreground mt-4">
                        Clique fora do popup ou no botão X para fechar a visualização
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Clique no botão abaixo para visualizar como o popup vai aparecer
                      </p>
                      <Button onClick={handlePreviewToggle}>
                        Visualizar Popup
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Salvando...
                    </>
                  ) : (
                    isEditMode ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      )}
    </div>
  );
}