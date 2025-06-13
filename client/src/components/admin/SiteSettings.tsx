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
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do PWA:', error);
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
                    onChange={(e) => setPwaConfig(prev => prev ? {...prev, name: e.target.value} : null)}
                    placeholder="Nome do aplicativo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pwaShortName">Nome Curto</Label>
                  <Input
                    id="pwaShortName"
                    value={pwaConfig?.short_name || ''}
                    onChange={(e) => setPwaConfig(prev => prev ? {...prev, short_name: e.target.value} : null)}
                    placeholder="Nome abreviado"
                    maxLength={12}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pwaThemeColor">Cor do Tema</Label>
                  <Input
                    id="pwaThemeColor"
                    type="color"
                    value={pwaConfig?.theme_color || '#000000'}
                    onChange={(e) => setPwaConfig(prev => prev ? {...prev, theme_color: e.target.value} : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pwaBackgroundColor">Cor de Fundo</Label>
                  <Input
                    id="pwaBackgroundColor"
                    type="color"
                    value={pwaConfig?.background_color || '#ffffff'}
                    onChange={(e) => setPwaConfig(prev => prev ? {...prev, background_color: e.target.value} : null)}
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
                    <Input
                      id="pwaIcon192"
                      value={pwaConfig?.icon_192 || ''}
                      onChange={(e) => setPwaConfig(prev => prev ? {...prev, icon_192: e.target.value} : null)}
                      placeholder="https://exemplo.com/icon-192.png"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pwaIcon512">Ícone 512x512</Label>
                    <Input
                      id="pwaIcon512"
                      value={pwaConfig?.icon_512 || ''}
                      onChange={(e) => setPwaConfig(prev => prev ? {...prev, icon_512: e.target.value} : null)}
                      placeholder="https://exemplo.com/icon-512.png"
                    />
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
                Acesso rápido a outras configurações importantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin?tab=app-config">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Configurações Avançadas PWA
                  </Button>
                </Link>
                <Link href="/admin?tab=upload-config">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Configurações de Upload
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserPermissionGuard>
  );
};

export default SiteSettings;