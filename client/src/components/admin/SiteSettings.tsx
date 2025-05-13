import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle, Loader2, RefreshCw, ExternalLink, Smartphone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'wouter';

// Definição da interface para o tipo de dados SiteSettings
interface SiteSettings {
  id: number;
  logoUrl: string;
  faviconUrl: string;
  siteName: string;
  primaryColor: string;
  footerText: string;
  metaDescription: string;
  contactEmail: string;
  updatedAt: string;
  updatedBy: number;
}

// Componente principal
const SiteSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Estado para armazenar as configurações do PWA
  const [pwaConfig, setPwaConfig] = useState<{
    name: string;
    short_name: string;
    theme_color: string;
    background_color: string;
    icon_192?: string;
    icon_512?: string;
  } | null>(null);
  const [pwaLoading, setPwaLoading] = useState(true);
  
  // Função para carregar as configurações do site
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Adicionar parâmetro de timestamp para evitar cache
      const timestamp = Date.now();
      const response = await fetch(`/api/site-settings?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar configurações do site');
      }
      
      const data = await response.json();
      console.log('Configurações carregadas:', data);
      setSettings(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para carregar as configurações do PWA
  const loadPwaConfig = async () => {
    try {
      setPwaLoading(true);
      const response = await fetch('/api/app-config');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar configurações do PWA');
      }
      
      const data = await response.json();
      console.log('Configurações PWA carregadas:', data);
      
      if (data.config) {
        setPwaConfig(data.config);
      }
    } catch (err: any) {
      console.error('Erro ao carregar configurações do PWA:', err);
      // Não exibimos o erro visualmente, apenas no console
    } finally {
      setPwaLoading(false);
    }
  };
  
  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
    loadPwaConfig();
  }, []);

  // Função para atualizar as configurações do site
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings) return;
    
    try {
      setUpdating(true);
      
      toast({
        title: 'Salvando configurações...',
        description: 'Aguarde enquanto as configurações são atualizadas.',
        variant: 'default',
      });
      
      const response = await fetch('/api/site-settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({
          siteName: settings.siteName,
          primaryColor: settings.primaryColor,
          footerText: settings.footerText,
          metaDescription: settings.metaDescription,
          contactEmail: settings.contactEmail
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar configurações');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Configurações atualizadas',
        description: 'As configurações do site foram salvas com sucesso.',
        variant: 'default',
      });
      
      // Recarregar as configurações
      loadSettings();
      
    } catch (error: any) {
      console.error('Erro ao atualizar configurações:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Ocorreu um erro ao atualizar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Falha ao carregar as configurações do site. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Configurações do Site</h2>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Seção de gerenciamento do logo */}
            <Card>
              <CardHeader>
                <CardTitle>Logo do Site</CardTitle>
                <CardDescription>
                  Personalize o logo exibido no cabeçalho do site.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="border rounded-lg p-6 flex items-center justify-center bg-gray-50">
                    {settings?.logoUrl ? (
                      <div className="h-32 flex items-center justify-center">
                        <img 
                          src={`${settings.logoUrl}?v=${Date.now()}&r=${Math.random()}`}
                          alt="Logo Atual" 
                          key={`logo-preview-${Date.now()}_${Math.random()}`}
                          className="h-full max-w-full object-contain" 
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          style={{
                            transform: `translateZ(0)` // Hack CSS para forçar renderização que é mais compatível
                          }}
                          onError={(e) => {
                            console.error('Erro ao carregar logo:', e);
                            const target = e.target as HTMLImageElement;
                            target.src = `/images/logo.png?v=${Date.now()}`;
                            target.onerror = null;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Upload className="mx-auto h-12 w-12 mb-2" />
                        <p>Nenhum logo configurado</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 mb-3">
                    Para alterar o logo do site, use a página dedicada de upload de logo que oferece uma experiência aprimorada e mais confiável.
                  </p>
                  <Link href="/admin/logo-upload">
                    <Button className="w-full" variant="default">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ir para página de Upload de Logo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Seção de gerenciamento do favicon */}
            <Card>
              <CardHeader>
                <CardTitle>Favicon do Site</CardTitle>
                <CardDescription>
                  Personalize o ícone que aparece na aba do navegador.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="border rounded-lg p-6 flex items-center justify-center bg-gray-50">
                    {settings?.faviconUrl ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="border border-gray-200 rounded-lg p-2 bg-white mb-3">
                          <img 
                            src={`${settings.faviconUrl}?v=${Date.now()}&r=${Math.random()}`}
                            alt="Favicon Atual" 
                            key={`favicon-preview-${Date.now()}_${Math.random()}`}
                            className="h-10 w-10 object-contain" 
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error('Erro ao carregar favicon:', e);
                              const target = e.target as HTMLImageElement;
                              target.src = `/favicon.ico?v=${Date.now()}`;
                              target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          Visualização da aba do navegador:
                        </div>
                        <div className="mt-2 border rounded bg-gray-200 p-2 flex items-center w-44">
                          <img 
                            src={`${settings.faviconUrl}?v=${Date.now()}&r=${Math.random()}`}
                            alt="Tab Favicon" 
                            className="h-4 w-4 mr-2" 
                          />
                          <span className="text-xs truncate">DesignAuto</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Upload className="mx-auto h-12 w-12 mb-2" />
                        <p>Nenhum favicon personalizado</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <form 
                  action="/api/site-settings/favicon"
                  method="POST" 
                  encType="multipart/form-data"
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    
                    if (!formData.get('favicon') || !(formData.get('favicon') as File).size) {
                      toast({
                        title: 'Nenhum arquivo selecionado',
                        description: 'Por favor, selecione um arquivo de imagem para o favicon.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    try {
                      setUpdating(true);
                      
                      toast({
                        title: 'Enviando favicon...',
                        description: 'Aguarde enquanto o favicon é processado.',
                        variant: 'default',
                      });
                      
                      const response = await fetch('/api/site-settings/favicon', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      if (!response.ok) {
                        throw new Error('Falha ao fazer upload do favicon');
                      }
                      
                      const data = await response.json();
                      
                      toast({
                        title: 'Favicon atualizado com sucesso',
                        description: 'O novo favicon foi configurado para o site.',
                        variant: 'default',
                      });
                      
                      // Recarregar as configurações
                      loadSettings();
                      
                      // Limpar o campo de arquivo
                      form.reset();
                      
                    } catch (error: any) {
                      console.error('Erro ao enviar favicon:', error);
                      toast({
                        title: 'Erro ao enviar favicon',
                        description: error.message || 'Ocorreu um erro ao processar o arquivo.',
                        variant: 'destructive',
                      });
                    } finally {
                      setUpdating(false);
                    }
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="favicon">Selecione um novo favicon</Label>
                    <Input
                      id="favicon"
                      name="favicon"
                      type="file"
                      accept=".ico,.png,.jpg,.jpeg,.svg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos recomendados: .ico, .png (quadrado). Tamanho ideal: 32x32 ou 64x64 pixels.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar Novo Favicon
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Card para outras configurações de aparência */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações Visuais</CardTitle>
                <CardDescription>
                  Personalize a aparência e o estilo do site.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Nome do Site</Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={settings?.siteName || ''}
                      onChange={handleInputChange}
                      placeholder="ex: DesignAuto"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        name="primaryColor"
                        value={settings?.primaryColor || '#1e40af'}
                        onChange={handleInputChange}
                        placeholder="ex: #1e40af"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: settings?.primaryColor || '#1e40af' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Descrição do Site (SEO)</Label>
                    <Input
                      id="metaDescription"
                      name="metaDescription"
                      value={settings?.metaDescription || ''}
                      onChange={handleInputChange}
                      placeholder="ex: Plataforma de designs automotivos personalizáveis"
                    />
                  </div>
                
                  <Button 
                    type="submit" 
                    disabled={updating}
                    className="w-full mt-4"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Configurações'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-6">
          <div className="space-y-6">
            {/* Section para PWA - integrado diretamente */}
            <div className="border rounded-md p-4 bg-blue-50 border-blue-100">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-blue-100 text-blue-700 p-3 rounded-full">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Configurações do Progressive Web App (PWA)</h4>
                  <p className="text-sm text-gray-500">
                    Personalize cores, ícones e informações do aplicativo móvel para melhorar a experiência de instalação
                  </p>
                </div>
              </div>
              
              {pwaLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pwaConfig ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pwaName">Nome do Aplicativo</Label>
                      <Input
                        id="pwaName"
                        name="pwaName"
                        value={pwaConfig.name || ''}
                        placeholder="ex: Design Auto"
                        disabled
                      />
                      <p className="text-xs text-gray-500">
                        Nome exibido após a instalação do app
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pwaThemeColor">Cor do Tema</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={pwaConfig.theme_color || '#FE9017'}
                          className="w-12 h-10 p-1"
                          disabled
                        />
                        <Input 
                          value={pwaConfig.theme_color || ''}
                          placeholder="#FE9017"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Prévia dos ícones */}
                  <div className="mt-4 border-t pt-4 border-blue-100">
                    <h4 className="text-sm font-medium mb-3">Ícones do Aplicativo</h4>
                    <div className="flex items-center gap-4">
                      {pwaConfig.icon_192 && (
                        <div className="text-center">
                          <div className="border rounded-md p-2 inline-block">
                            <img 
                              src={pwaConfig.icon_192} 
                              alt="Ícone 192x192" 
                              className="w-16 h-16 object-contain"
                            />
                          </div>
                          <p className="text-xs mt-1">192x192</p>
                        </div>
                      )}
                      
                      {pwaConfig.icon_512 && (
                        <div className="text-center">
                          <div className="border rounded-md p-2 inline-block">
                            <img 
                              src={pwaConfig.icon_512} 
                              alt="Ícone 512x512" 
                              className="w-16 h-16 object-contain"
                            />
                          </div>
                          <p className="text-xs mt-1">512x512</p>
                        </div>
                      )}
                      
                      {!pwaConfig.icon_192 && !pwaConfig.icon_512 && (
                        <p className="text-sm text-gray-500 italic">Nenhum ícone configurado</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Configurações do PWA não encontradas
                </div>
              )}
              
              <div className="mt-6 flex gap-2">
                <Link href="/admin/app-config">
                  <Button variant="default">
                    <Smartphone className="mr-2 h-4 w-4" />
                    {pwaConfig ? 'Editar Configurações PWA' : 'Configurar PWA'}
                  </Button>
                </Link>
              </div>
            </div>
            
            <h3 className="text-lg font-medium">Configurações Avançadas</h3>
            <p className="text-gray-500">Configurações avançadas do sistema em desenvolvimento.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteSettings;