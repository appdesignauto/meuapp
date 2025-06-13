import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { UserPermissionGuard } from '@/components/admin/UserPermissionGuard';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AppConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: string;
  orientation: string;
  startUrl: string;
  scope: string;
  enableNotifications: boolean;
  icon192: string;
  icon512: string;
}

const AppConfigPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AppConfig | null>(null);

  const { data: appConfig, isLoading } = useQuery({
    queryKey: ['/api/app-config'],
    queryFn: async () => {
      const response = await fetch('/api/app-config');
      if (!response.ok) {
        throw new Error('Falha ao carregar configurações do PWA');
      }
      return await response.json();
    }
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: AppConfig) => {
      const response = await fetch('/api/app-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Falha ao salvar configurações');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Configurações do PWA salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (appConfig) {
      setConfig(appConfig);
    }
  }, [appConfig]);

  const handleInputChange = (field: keyof AppConfig, value: any) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (config) {
      saveConfigMutation.mutate(config);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Configurações do PWA</h2>
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

  if (!config) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Erro ao carregar configurações do PWA. Tente recarregar a página.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <UserPermissionGuard requiredLevel="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Configurações do PWA</h2>
            <p className="text-muted-foreground">
              Personalize as configurações do Progressive Web App para a experiência mobile
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais do PWA</CardTitle>
              <CardDescription>
                Configure as informações básicas do Progressive Web App
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do App</Label>
                  <Input
                    id="name"
                    value={config.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo do aplicativo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shortName">Nome Curto</Label>
                  <Input
                    id="shortName"
                    value={config.shortName || ''}
                    onChange={(e) => handleInputChange('shortName', e.target.value)}
                    placeholder="Nome abreviado (12 caracteres max)"
                    maxLength={12}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={config.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o propósito do aplicativo"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="themeColor">Cor do Tema</Label>
                  <Input
                    id="themeColor"
                    type="color"
                    value={config.themeColor || '#000000'}
                    onChange={(e) => handleInputChange('themeColor', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={config.backgroundColor || '#ffffff'}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startUrl">URL Inicial</Label>
                  <Input
                    id="startUrl"
                    value={config.startUrl || '/'}
                    onChange={(e) => handleInputChange('startUrl', e.target.value)}
                    placeholder="/"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scope">Escopo</Label>
                  <Input
                    id="scope"
                    value={config.scope || '/'}
                    onChange={(e) => handleInputChange('scope', e.target.value)}
                    placeholder="/"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableNotifications"
                  checked={config.enableNotifications || false}
                  onCheckedChange={(checked) => handleInputChange('enableNotifications', checked)}
                />
                <Label htmlFor="enableNotifications">Habilitar Notificações Push</Label>
              </div>
            </CardContent>
          </Card>

          {/* Ícones */}
          <Card>
            <CardHeader>
              <CardTitle>Ícones do PWA</CardTitle>
              <CardDescription>
                Configure os ícones que serão exibidos na tela inicial do dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="icon192">Ícone 192x192 (URL)</Label>
                <Input
                  id="icon192"
                  value={config.icon192 || ''}
                  onChange={(e) => handleInputChange('icon192', e.target.value)}
                  placeholder="https://exemplo.com/icon-192.png"
                />
                <p className="text-sm text-muted-foreground">
                  Recomendado: PNG 192x192 pixels
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon512">Ícone 512x512 (URL)</Label>
                <Input
                  id="icon512"
                  value={config.icon512 || ''}
                  onChange={(e) => handleInputChange('icon512', e.target.value)}
                  placeholder="https://exemplo.com/icon-512.png"
                />
                <p className="text-sm text-muted-foreground">
                  Recomendado: PNG 512x512 pixels
                </p>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={saveConfigMutation.isPending}
            className="w-full md:w-auto"
          >
            {saveConfigMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      </div>
    </UserPermissionGuard>
  );
};

export default AppConfigPage;