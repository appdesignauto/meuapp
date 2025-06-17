import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle, Loader2, RefreshCw, ExternalLink, Smartphone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'wouter';
import { UserPermissionGuard } from '@/components/admin/UserPermissionGuard';

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

interface PwaConfig {
  id?: number;
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  icon_192?: string;
  icon_512?: string;
  updated_at?: string;
  updated_by?: number;
}

const SiteSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [pwaConfig, setPwaConfig] = useState<PwaConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchPwaConfig();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPwaConfig = async () => {
    try {
      const response = await fetch('/api/pwa-config');
      if (response.ok) {
        const data = await response.json();
        setPwaConfig(data);
      } else {
        // Se não há configuração, inicializar com valores padrão
        setPwaConfig({
          name: 'DesignAuto',
          short_name: 'DesignAuto',
          description: 'Plataforma de artes automobilísticas editáveis para profissionais de vendas.',
          theme_color: '#1e3b61',
          background_color: '#ffffff',
          icon_192: '/icons/icon-192-new.png',
          icon_512: '/icons/icon-512-new.png'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do PWA:', error);
      // Inicializar com valores padrão em caso de erro
      setPwaConfig({
        name: 'DesignAuto',
        short_name: 'DesignAuto',
        description: 'Plataforma de artes automobilísticas editáveis para profissionais de vendas.',
        theme_color: '#1e3b61',
        background_color: '#ffffff',
        icon_192: '/icons/icon-192-new.png',
        icon_512: '/icons/icon-512-new.png'
      });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/site-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Configurações salvas com sucesso.",
        });
      } else {
        throw new Error('Falha ao salvar configurações');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const savePwaConfig = async () => {
    if (!pwaConfig) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/pwa-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pwaConfig),
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Configurações do PWA salvas com sucesso.",
        });
      } else {
        throw new Error('Falha ao salvar configurações do PWA');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do PWA",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateDefaultIcons = async () => {
    setIsGeneratingIcons(true);
    try {
      const response = await fetch('/api/generate-default-icons', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        
        if (pwaConfig) {
          setPwaConfig({
            ...pwaConfig,
            icon_192: result.icon192Url,
            icon_512: result.icon512Url,
          });
        }

        toast({
          title: "Sucesso!",
          description: "Ícones padrão gerados com sucesso.",
        });
      } else {
        throw new Error('Falha ao gerar ícones');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar ícones padrão",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIcons(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Configurações do Site</h2>
            <p className="text-muted-foreground">
              Carregando configurações...
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <UserPermissionGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Configurações do Site</h2>
            <p className="text-muted-foreground">
              Gerencie as configurações gerais do site e PWA
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas do site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input
                    id="siteName"
                    value={settings?.siteName || ''}
                    onChange={(e) => setSettings(prev => prev ? {...prev, siteName: e.target.value} : null)}
                    placeholder="Nome do site"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contato</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings?.contactEmail || ''}
                    onChange={(e) => setSettings(prev => prev ? {...prev, contactEmail: e.target.value} : null)}
                    placeholder="contato@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Descrição Meta</Label>
                <Input
                  id="metaDescription"
                  value={settings?.metaDescription || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, metaDescription: e.target.value} : null)}
                  placeholder="Descrição do site para SEO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Texto do Rodapé</Label>
                <Input
                  id="footerText"
                  value={settings?.footerText || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, footerText: e.target.value} : null)}
                  placeholder="© 2024 Seu Site. Todos os direitos reservados."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">URL do Logo</Label>
                  <Input
                    id="logoUrl"
                    value={settings?.logoUrl || ''}
                    onChange={(e) => setSettings(prev => prev ? {...prev, logoUrl: e.target.value} : null)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">URL do Favicon</Label>
                  <Input
                    id="faviconUrl"
                    value={settings?.faviconUrl || ''}
                    onChange={(e) => setSettings(prev => prev ? {...prev, faviconUrl: e.target.value} : null)}
                    placeholder="https://exemplo.com/favicon.ico"
                  />
                </div>
              </div>

              {/* Preview do Favicon Ativo */}
              <div className="space-y-3">
                <Label>Preview do Favicon Ativo</Label>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <img 
                        src="/favicon.ico" 
                        alt="Favicon 16x16" 
                        className="w-4 h-4"
                        onError={(e) => {
                          e.currentTarget.src = '/favicons/favicon-16x16.png';
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">16x16 (aba do navegador)</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <img 
                        src="/favicons/favicon-32x32.png" 
                        alt="Favicon 32x32" 
                        className="w-8 h-8"
                        onError={(e) => {
                          e.currentTarget.src = '/favicon.ico';
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">32x32 (favoritos)</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <img 
                        src="/favicons/favicon-48x48.png" 
                        alt="Favicon 48x48" 
                        className="w-10 h-10"
                        onError={(e) => {
                          e.currentTarget.src = '/favicons/favicon-32x32.png';
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">48x48 (desktop)</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200 flex-1">
                    <strong>Dica:</strong> Se você atualizou o favicon e não vê as mudanças, pressione Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac) para forçar a atualização do cache do navegador.
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="ml-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar Página
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings?.primaryColor || '#000000'}
                  onChange={(e) => setSettings(prev => prev ? {...prev, primaryColor: e.target.value} : null)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Configurações PWA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Progressive Web App (PWA)
              </CardTitle>
              <CardDescription>
                Configure as opções para transformar o site em um aplicativo web progressivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pwaName">Nome do App</Label>
                  <Input
                    id="pwaName"
                    value={pwaConfig?.name || ''}
                    onChange={(e) => setPwaConfig(prev => ({
                      ...prev,
                      name: e.target.value,
                      short_name: prev?.short_name || 'DesignAuto',
                      description: prev?.description || 'Plataforma de artes automobilísticas editáveis para profissionais de vendas.',
                      theme_color: prev?.theme_color || '#1e3b61',
                      background_color: prev?.background_color || '#ffffff',
                      icon_192: prev?.icon_192 || '/icons/icon-192-new.png',
                      icon_512: prev?.icon_512 || '/icons/icon-512-new.png'
                    }))}
                    placeholder="Nome do aplicativo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pwaShortName">Nome Curto</Label>
                  <Input
                    id="pwaShortName"
                    value={pwaConfig?.short_name || ''}
                    onChange={(e) => setPwaConfig(prev => ({
                      ...prev,
                      short_name: e.target.value,
                      name: prev?.name || 'DesignAuto',
                      description: prev?.description || 'Plataforma de artes automobilísticas editáveis para profissionais de vendas.',
                      theme_color: prev?.theme_color || '#1e3b61',
                      background_color: prev?.background_color || '#ffffff',
                      icon_192: prev?.icon_192 || '/icons/icon-192-new.png',
                      icon_512: prev?.icon_512 || '/icons/icon-512-new.png'
                    }))}
                    placeholder="Nome abreviado"
                    maxLength={12}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pwaDescription">Descrição do App</Label>
                <textarea
                  id="pwaDescription"
                  value={pwaConfig?.description || ''}
                  onChange={(e) => setPwaConfig(prev => ({
                    ...prev,
                    description: e.target.value,
                    name: prev?.name || 'DesignAuto',
                    short_name: prev?.short_name || 'DesignAuto',
                    theme_color: prev?.theme_color || '#1e3b61',
                    background_color: prev?.background_color || '#ffffff',
                    icon_192: prev?.icon_192 || '/icons/icon-192-new.png',
                    icon_512: prev?.icon_512 || '/icons/icon-512-new.png'
                  }))}
                  placeholder="Descrição que aparecerá na instalação do PWA"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none h-20"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500">
                  {pwaConfig?.description?.length || 0}/160 caracteres
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pwaThemeColor">Cor do Tema</Label>
                  <Input
                    id="pwaThemeColor"
                    type="color"
                    value={pwaConfig?.theme_color || '#1e3b61'}
                    onChange={(e) => setPwaConfig(prev => ({
                      ...prev,
                      theme_color: e.target.value,
                      name: prev?.name || 'DesignAuto',
                      short_name: prev?.short_name || 'DesignAuto',
                      description: prev?.description || 'Plataforma de artes automobilísticas editáveis para profissionais de vendas.',
                      background_color: prev?.background_color || '#ffffff',
                      icon_192: prev?.icon_192 || '/icons/icon-192-new.png',
                      icon_512: prev?.icon_512 || '/icons/icon-512-new.png'
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pwaBackgroundColor">Cor de Fundo</Label>
                  <Input
                    id="pwaBackgroundColor"
                    type="color"
                    value={pwaConfig?.background_color || '#ffffff'}
                    onChange={(e) => setPwaConfig(prev => ({
                      ...prev,
                      background_color: e.target.value,
                      name: prev?.name || 'DesignAuto',
                      short_name: prev?.short_name || 'DesignAuto',
                      description: prev?.description || 'Plataforma de artes automobilísticas editáveis para profissionais de vendas.',
                      theme_color: prev?.theme_color || '#1e3b61',
                      icon_192: prev?.icon_192 || '/icons/icon-192-new.png',
                      icon_512: prev?.icon_512 || '/icons/icon-512-new.png'
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ícones do PWA</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateDefaultIcons}
                    disabled={isGeneratingIcons}
                  >
                    {isGeneratingIcons ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Gerar Ícones Padrão
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pwaIcon192">Ícone 192x192</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="pwaIcon192"
                        value={pwaConfig?.icon_192 || ''}
                        onChange={(e) => setPwaConfig(prev => prev ? {...prev, icon_192: e.target.value} : null)}
                        placeholder="/icons/icon-192-new.png"
                        className="flex-1"
                      />
                      {pwaConfig?.icon_192 && (
                        <div className="flex-shrink-0">
                          <img 
                            src={pwaConfig.icon_192} 
                            alt="Ícone 192x192"
                            className="w-12 h-12 rounded-lg border bg-white object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pwaIcon512">Ícone 512x512</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="pwaIcon512"
                        value={pwaConfig?.icon_512 || ''}
                        onChange={(e) => setPwaConfig(prev => prev ? {...prev, icon_512: e.target.value} : null)}
                        placeholder="/icons/icon-512-new.png"
                        className="flex-1"
                      />
                      {pwaConfig?.icon_512 && (
                        <div className="flex-shrink-0">
                          <img 
                            src={pwaConfig.icon_512} 
                            alt="Ícone 512x512"
                            className="w-12 h-12 rounded-lg border bg-white object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status PWA Atual */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-2">Status do PWA</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>PWA ativo com logos "design auto APP"</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Service Worker configurado para conteúdo dinâmico</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Instalação disponível em dispositivos móveis e desktop</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={savePwaConfig} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações PWA'
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Links Úteis */}
          <Card>
            <CardHeader>
              <CardTitle>Links Úteis</CardTitle>
              <CardDescription>
                Acesso rápido a outras configurações importantes e recursos do PWA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Link href="/admin?tab=app-config">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Configurações Avançadas PWA
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => window.open('/manifest.json', '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Manifest.json
                </Button>
              </div>
              
              {/* Recursos PWA Ativos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Recursos Implementados</h5>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>• Service Worker inteligente</div>
                    <div>• Proteção de conteúdo dinâmico</div>
                    <div>• Botões de instalação desktop/mobile</div>
                    <div>• Cache otimizado para performance</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Compatibilidade</h5>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>• iOS Safari (instalação via "Adicionar à Tela Inicial")</div>
                    <div>• Android Chrome (instalação automática)</div>
                    <div>• Desktop Chrome, Edge, Firefox</div>
                    <div>• Todos os navegadores modernos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserPermissionGuard>
  );
};

export default SiteSettings;