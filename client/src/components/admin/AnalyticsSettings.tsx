import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsSettings {
  id?: number;
  metaPixelId: string;
  metaAdsAccessToken: string;
  metaAdAccountId: string;
  metaPixelEnabled: boolean;
  metaAdsEnabled: boolean;
  ga4MeasurementId: string;
  ga4Enabled: boolean;
  gtmContainerId: string;
  gtmEnabled: boolean;
  clarityProjectId: string;
  clarityEnabled: boolean;
  hotjarSiteId: string;
  hotjarEnabled: boolean;
  linkedinPartnerId: string;
  linkedinEnabled: boolean;
  tiktokPixelId: string;
  tiktokEnabled: boolean;
  amplitudeApiKey: string;
  amplitudeEnabled: boolean;
  mixpanelToken: string;
  mixpanelEnabled: boolean;
  trackPageviews: boolean;
  trackClicks: boolean;
  trackFormSubmissions: boolean;
  trackArtsViewed: boolean;
  trackArtsDownloaded: boolean;
  customScriptHead: string;
  customScriptBody: string;
  customScriptEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: number;
}

const AnalyticsSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [analytics, setAnalytics] = useState<AnalyticsSettings | null>(null);
  const [activeTab, setActiveTab] = useState('meta-pixel');

  // Buscar configurações existentes
  const { data: analyticsData, isLoading: isLoadingData } = useQuery({
    queryKey: ['/api/analytics/settings'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/settings');
      if (!response.ok) {
        throw new Error('Erro ao buscar configurações de analytics');
      }
      return response.json();
    }
  });

  // Mutation para salvar configurações
  const saveAnalyticsMutation = useMutation({
    mutationFn: async (data: AnalyticsSettings) => {
      const response = await fetch('/api/analytics/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar configurações');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Atualizar o cache imediatamente com os dados salvos
      queryClient.setQueryData(['/api/analytics/settings'], data);
      // Invalidar para garantir sincronia
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/settings'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de analytics foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    if (analyticsData) {
      setAnalytics(analyticsData);
    }
  }, [analyticsData]);

  // Resetar o estado local quando os dados são recarregados, mas manter a aba ativa
  useEffect(() => {
    if (analyticsData && !saveAnalyticsMutation.isPending) {
      setAnalytics(analyticsData);
    }
  }, [analyticsData, saveAnalyticsMutation.isPending]);

  const handleInputChange = (field: keyof AnalyticsSettings, value: any) => {
    setAnalytics(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (analytics) {
      console.log('Salvando configurações:', analytics);
      saveAnalyticsMutation.mutate(analytics);
    }
  };

  const isLoading = saveAnalyticsMutation.isPending;

  if (isLoadingData) {
    return (
      <div className="space-y-6">
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

  if (!analytics) {
    return (
      <Alert>
        <AlertDescription>
          Erro ao carregar configurações de analytics. Tente recarregar a página.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso de Conformidade */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription className="text-sm">
          Estas configurações afetam como o site rastreia as atividades dos usuários. 
          Certifique-se de que seu site esteja em conformidade com leis de privacidade aplicáveis, 
          como LGPD e GDPR, e de que sua Política de Privacidade reflita o uso dessas tecnologias.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="meta-pixel">Meta Pixel</TabsTrigger>
          <TabsTrigger value="google-tag-manager">Google Tag Manager</TabsTrigger>
          <TabsTrigger value="google-analytics">Google Analytics 4</TabsTrigger>
        </TabsList>

        {/* Aba Meta Pixel */}
        <TabsContent value="meta-pixel">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Meta Pixel</CardTitle>
              <CardDescription>Configure o Meta Pixel e o Facebook Ads API para rastreamento de eventos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaPixelId" className="text-sm font-medium">Meta Pixel ID</Label>
                <Input
                  id="metaPixelId"
                  value={analytics?.metaPixelId || ''}
                  onChange={(e) => handleInputChange('metaPixelId', e.target.value)}
                  placeholder="12312315456"
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaAccessToken" className="text-sm font-medium">Token de Acesso da API</Label>
                <Input
                  id="metaAccessToken"
                  type="password"
                  value={analytics?.metaAdsAccessToken || ''}
                  onChange={(e) => handleInputChange('metaAdsAccessToken', e.target.value)}
                  placeholder="Digite o token de acesso da API"
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metaPixelEnabled"
                    checked={analytics?.metaPixelEnabled ?? true}
                    onCheckedChange={(checked) => handleInputChange('metaPixelEnabled', checked)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="metaPixelEnabled" className="text-sm font-medium">Ativar Meta Pixel</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metaAdsEnabled"
                    checked={analytics?.metaAdsEnabled ?? true}
                    onCheckedChange={(checked) => handleInputChange('metaAdsEnabled', checked)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="metaAdsEnabled" className="text-sm font-medium">Ativar Conversions API</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Google Tag Manager */}
        <TabsContent value="google-tag-manager">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Google Tag Manager</CardTitle>
              <CardDescription>Configure o GTM para gerenciar tags e scripts de rastreamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gtmContainerId" className="text-sm font-medium">ID do Container GTM</Label>
                <Input
                  id="gtmContainerId"
                  value={analytics?.gtmContainerId || ''}
                  onChange={(e) => handleInputChange('gtmContainerId', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                  className="bg-gray-50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gtmEnabled"
                  checked={analytics?.gtmEnabled || false}
                  onCheckedChange={(checked) => handleInputChange('gtmEnabled', checked)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="gtmEnabled" className="text-sm font-medium">Ativar Google Tag Manager</Label>
              </div>

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Instruções de Configuração</AlertTitle>
                <AlertDescription>
                  1. Acesse o Google Tag Manager e crie um container para seu site<br/>
                  2. Copie o ID do container (formato: GTM-XXXXXXX)<br/>
                  3. Cole aqui e ative o rastreamento<br/>
                  4. Configure suas tags no painel do GTM
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Google Analytics 4 */}
        <TabsContent value="google-analytics">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Google Analytics 4</CardTitle>
              <CardDescription>Configure o GA4 para análise detalhada de comportamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ga4MeasurementId" className="text-sm font-medium">ID de Medição GA4</Label>
                <Input
                  id="ga4MeasurementId"
                  value={analytics?.ga4MeasurementId || ''}
                  onChange={(e) => handleInputChange('ga4MeasurementId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="bg-gray-50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ga4Enabled"
                  checked={analytics?.ga4Enabled || false}
                  onCheckedChange={(checked) => handleInputChange('ga4Enabled', checked)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="ga4Enabled" className="text-sm font-medium">Ativar Google Analytics 4</Label>
              </div>

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Como obter o ID de Medição</AlertTitle>
                <AlertDescription>
                  1. Acesse Google Analytics 4<br/>
                  2. Vá em Administrador → Propriedade → Fluxos de dados<br/>
                  3. Selecione seu fluxo da web<br/>
                  4. Copie o ID de medição (formato: G-XXXXXXXXXX)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de Salvar Global */}
      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md"
        >
          {isLoading ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsSettings;