import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, MonitorSmartphone, ScreenShare, Image, 
         LayoutPanelTop, FileType, CreditCard, Youtube, File, X, 
         Check, Mail, BookImage, LayoutTemplate } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Tipo para definir uma arte individual
interface ArtItem {
  id: number;
  format: string;
  title: string;
  imageUrl: string;
  fileType: string;
  description?: string;
  editUrl: string;
  groupId: string | null;
  [key: string]: any;
}

// Propriedades do componente
interface MultiArtTabsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  artId: number | null;
  onEditComplete?: () => void;
}

// Componente principal para exibir abas de formatos de arte dentro do mesmo grupo
export default function MultiArtTabsDialog({ 
  isOpen, 
  onClose, 
  artId, 
  onEditComplete 
}: MultiArtTabsDialogProps) {
  // Estados
  const [loading, setLoading] = useState(false);
  const [artsGroup, setArtsGroup] = useState<ArtItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [currentArtId, setCurrentArtId] = useState<number | null>(null);
  const { toast } = useToast();

  // Funções utilitárias para obter nome amigável do formato
  const getFormatName = (formatSlug: string): string => {
    const formatMap: Record<string, string> = {
      'feed': 'Feed',
      'stories': 'Stories',
      'web-banner': 'Banner Web',
      'capa-fan-page': 'Capa de Facebook',
      'poster': 'Pôster',
      'flyer': 'Flyer',
      'cartao-visita': 'Cartão de Visita',
      'youtube-thumbnail': 'Miniatura YouTube',
      'email-banner': 'Banner de Email',
      'carrocel': 'Carrossel'
    };
    
    return formatMap[formatSlug] || formatSlug;
  };

  // Efeito para carregar as artes do grupo quando o diálogo abre
  useEffect(() => {
    if (isOpen && artId) {
      loadArtGroupData(artId);
    } else {
      // Limpar estado quando o diálogo fecha
      setArtsGroup([]);
      setActiveTab('');
    }
  }, [isOpen, artId]);

  // Função para carregar os dados das artes do grupo
  const loadArtGroupData = async (artId: number) => {
    try {
      setLoading(true);
      setCurrentArtId(artId);
      
      console.log(`[MultiArtTabs] Carregando dados para arte ID ${artId}`);
      
      // 1. Primeiro verificar se a arte pertence a um grupo
      const groupCheckResponse = await apiRequest('GET', `/api/admin/artes/${artId}/check-group`);
      const groupCheckData = await groupCheckResponse.json();
      
      const groupId = groupCheckData.groupId;
      
      if (!groupId) {
        console.log(`[MultiArtTabs] Arte ${artId} não pertence a nenhum grupo`);
        toast({
          title: "Aviso",
          description: "Esta arte não faz parte de um grupo.",
          variant: "default"
        });
        setLoading(false);
        onClose();
        return;
      }
      
      console.log(`[MultiArtTabs] Arte ${artId} pertence ao grupo ${groupId}, buscando artes relacionadas`);
      
      // 2. Buscar todas as artes do grupo
      const groupResponse = await apiRequest('GET', `/api/admin/artes/group/${groupId}`);
      const groupData = await groupResponse.json();
      
      if (!groupData.arts || !Array.isArray(groupData.arts) || groupData.arts.length === 0) {
        console.warn(`[MultiArtTabs] Nenhuma arte encontrada no grupo`);
        toast({
          title: "Grupo vazio",
          description: "Não há artes associadas a este grupo.",
          variant: "destructive"
        });
        setLoading(false);
        onClose();
        return;
      }
      
      // 3. Processar dados recebidos
      const artes = groupData.arts;
      console.log(`[MultiArtTabs] ${artes.length} artes encontradas no grupo ${groupId}`);
      
      // Armazenar as artes no estado
      setArtsGroup(artes);
      
      // Determinar qual aba deve ser ativa inicialmente
      const currentArtData = artes.find((art: ArtItem) => art.id === artId);
      if (currentArtData && currentArtData.format) {
        setActiveTab(currentArtData.format);
        console.log(`[MultiArtTabs] Definindo aba ativa como: ${currentArtData.format}`);
      } else if (artes.length > 0 && artes[0].format) {
        setActiveTab(artes[0].format);
        console.log(`[MultiArtTabs] Definindo primeira aba como ativa: ${artes[0].format}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("[MultiArtTabs] Erro ao carregar artes do grupo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as artes do grupo.",
        variant: "destructive"
      });
      setLoading(false);
      onClose();
    }
  };

  // Agrupar artes por formato para garantir apenas uma arte de cada formato
  const getUniqueFormats = (): string[] => {
    const formatosUnicos = new Set<string>();
    
    artsGroup.forEach(art => {
      if (art.format && typeof art.format === 'string') {
        formatosUnicos.add(art.format);
      }
    });
    
    return Array.from(formatosUnicos);
  };
  
  // Obter a arte para um formato específico
  const getArtByFormat = (format: string): ArtItem | undefined => {
    return artsGroup.find(art => art.format === format);
  };

  // Renderizar o diálogo com as abas
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        <DialogTitle className="flex items-center justify-between text-xl font-semibold">
          <span>Editar Arte Multi-Formato</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogTitle>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Carregando artes do grupo...</span>
          </div>
        ) : (
          <div className="mt-4">
            <h3 className="text-base font-medium mb-3">Formatos disponíveis neste grupo:</h3>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full flex overflow-x-auto flex-wrap bg-transparent border-b border-gray-200 p-0 mb-1 h-auto">
                {getUniqueFormats().map((format) => (
                  <TabsTrigger
                    key={format}
                    value={format}
                    className={`
                      flex items-center min-w-[140px] rounded-none px-4 py-3 
                      font-medium relative bg-transparent text-gray-700 border-0
                      hover:bg-gray-50 hover:text-blue-600 transition-colors
                      data-[state=active]:text-blue-600 data-[state=active]:bg-transparent
                      data-[state=active]:border-b-2 data-[state=active]:border-blue-600
                    `}
                  >
                    {format === 'feed' && <Smartphone className="h-5 w-5 mr-2" />}
                    {format === 'stories' && <MonitorSmartphone className="h-5 w-5 mr-2" />}
                    {format === 'web-banner' && <ScreenShare className="h-5 w-5 mr-2" />}
                    {format === 'capa-fan-page' && <Image className="h-5 w-5 mr-2" />}
                    {format === 'poster' && <LayoutPanelTop className="h-5 w-5 mr-2" />}
                    {format === 'flyer' && <FileType className="h-5 w-5 mr-2" />}
                    {format === 'cartao-visita' && <CreditCard className="h-5 w-5 mr-2" />}
                    {format === 'youtube-thumbnail' && <Youtube className="h-5 w-5 mr-2" />}
                    {format === 'email-banner' && <Mail className="h-5 w-5 mr-2" />}
                    {format === 'carrocel' && <LayoutTemplate className="h-5 w-5 mr-2" />}
                    {format !== 'feed' && 
                      format !== 'stories' && 
                      format !== 'web-banner' && 
                      format !== 'capa-fan-page' && 
                      format !== 'poster' && 
                      format !== 'flyer' && 
                      format !== 'cartao-visita' && 
                      format !== 'youtube-thumbnail' && 
                      format !== 'email-banner' && 
                      format !== 'carrocel' && 
                      <File className="h-5 w-5 mr-2" />}
                    <span>{getFormatName(format)}</span>
                    <Check className="h-3.5 w-3.5 text-green-500 ml-2" />
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {getUniqueFormats().map((format) => {
                const art = getArtByFormat(format);
                
                return (
                  <TabsContent key={format} value={format} className="mt-4 space-y-4">
                    {art ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-1">Título:</h3>
                            <p>{art.title || 'Sem título'}</p>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-1">Formato:</h3>
                            <p>{getFormatName(art.format)}</p>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-1">Tipo de Arquivo:</h3>
                            <p className="capitalize">{art.fileType || 'Não definido'}</p>
                          </div>
                          
                          {art.description && (
                            <div>
                              <h3 className="font-semibold mb-1">Descrição:</h3>
                              <p className="text-sm text-gray-600">{art.description}</p>
                            </div>
                          )}
                          
                          <div className="pt-3">
                            <Button 
                              onClick={() => {
                                onClose();
                                // Redirecionar para a edição normal da arte
                                window.location.hash = `edit-art-${art.id}`;
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              Editar {getFormatName(art.format)}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border rounded overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                          {art.imageUrl ? (
                            <img 
                              src={art.imageUrl} 
                              alt={art.title || 'Imagem da arte'} 
                              className="max-w-full max-h-[300px] object-contain"
                            />
                          ) : (
                            <div className="text-center text-gray-400 p-8">
                              <BookImage className="mx-auto h-16 w-16 mb-2" />
                              <p>Imagem não disponível</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <p>Nenhuma arte disponível para este formato.</p>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}