import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, AlertCircle, Facebook, Chrome, BarChart3, Zap, Settings } from 'lucide-react';
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
  googleAdsCustomerId: string;
  googleAdsConversionId: string;
  googleAdsConversionLabel: string;
  googleAdsEnabled: boolean;
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

  // Query para buscar configurações
  const { data: analyticsData, isLoading: isLoadingData } = useQuery({
    queryKey: ['/api/analytics/settings'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/settings');
      if (!response.ok) {
        throw new Error('Erro ao buscar configurações');
      }
      return response.json();
    }
  });

  // Mutation para salvar configurações
  const saveAnalyticsMutation = useMutation({
    mutationFn: async (data: AnalyticsSettings) => {
      const response = await fetch('/api/analytics/admin/settings', {
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
    onSuccess: () => {
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

  const handleInputChange = (field: keyof AnalyticsSettings, value: any) => {
    setAnalytics(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (analytics) {
      saveAnalyticsMutation.mutate(analytics);
    }
  };

  const isLoading = saveAnalyticsMutation.isPending;

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar configurações de analytics. Tente recarregar a página.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Analytics</h1>
          <p className="text-gray-600 mt-1">Configure suas plataformas de rastreamento e análise</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Todas
            </>
          )}
        </Button>
      </div>

      {/* Aviso de Conformidade */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Importante:</strong> Certifique-se de que seu site esteja em conformidade com LGPD e GDPR 
          antes de ativar o rastreamento de usuários.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="meta" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="meta" className="flex items-center gap-2 text-sm">
            <Facebook className="h-4 w-4" />
            Meta & Facebook
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2 text-sm">
            <Chrome className="h-4 w-4" />
            Google
          </TabsTrigger>
          <TabsTrigger value="others" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Meta & Facebook */}
        <TabsContent value="meta" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Meta Pixel */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Meta Pixel</CardTitle>
                  </div>
                  <Switch
                    checked={analytics?.metaPixelEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('metaPixelEnabled', checked)}
                  />
                </div>
                <CardDescription>Rastreamento básico de eventos no Facebook</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaPixelId" className="text-sm font-medium">Pixel ID</Label>
                  <Input
                    id="metaPixelId"
                    value={analytics?.metaPixelId || ''}
                    onChange={(e) => handleInputChange('metaPixelId', e.target.value)}
                    placeholder="123456789012345"
                    className="mt-1"
                  />
                </div>
                {analytics?.metaPixelEnabled && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Ativo
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Meta Ads API */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Conversions API</CardTitle>
                  </div>
                  <Switch
                    checked={analytics?.metaAdsEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('metaAdsEnabled', checked)}
                  />
                </div>
                <CardDescription>API para melhor rastreamento de conversões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaAccessToken" className="text-sm font-medium">Access Token</Label>
                  <Input
                    id="metaAccessToken"
                    type="password"
                    value={analytics?.metaAdsAccessToken || ''}
                    onChange={(e) => handleInputChange('metaAdsAccessToken', e.target.value)}
                    placeholder="Digite o token de acesso"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="metaAdAccountId" className="text-sm font-medium">Ad Account ID</Label>
                  <Input
                    id="metaAdAccountId"
                    value={analytics?.metaAdAccountId || ''}
                    onChange={(e) => handleInputChange('metaAdAccountId', e.target.value)}
                    placeholder="act_123456789"
                    className="mt-1"
                  />
                </div>
                {analytics?.metaAdsEnabled && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Ativo
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Google */}
        <TabsContent value="google" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Google Analytics 4 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">Analytics 4</CardTitle>
                  </div>
                  <Switch
                    checked={analytics?.ga4Enabled || false}
                    onCheckedChange={(checked) => handleInputChange('ga4Enabled', checked)}
                  />
                </div>
                <CardDescription>Análise completa do site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ga4MeasurementId" className="text-sm font-medium">Measurement ID</Label>
                  <Input
                    id="ga4MeasurementId"
                    value={analytics?.ga4MeasurementId || ''}
                    onChange={(e) => handleInputChange('ga4MeasurementId', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Google Tag Manager */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Tag Manager</CardTitle>
                  </div>
                  <Switch
                    checked={analytics?.gtmEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('gtmEnabled', checked)}
                  />
                </div>
                <CardDescription>Gerenciamento de tags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gtmContainerId" className="text-sm font-medium">Container ID</Label>
                  <Input
                    id="gtmContainerId"
                    value={analytics?.gtmContainerId || ''}
                    onChange={(e) => handleInputChange('gtmContainerId', e.target.value)}
                    placeholder="GTM-XXXXXXX"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Google Ads */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Google Ads</CardTitle>
                  </div>
                  <Switch
                    checked={analytics?.googleAdsEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('googleAdsEnabled', checked)}
                  />
                </div>
                <CardDescription>Rastreamento de conversões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="googleAdsConversionId" className="text-sm font-medium">Conversion ID</Label>
                  <Input
                    id="googleAdsConversionId"
                    value={analytics?.googleAdsConversionId || ''}
                    onChange={(e) => handleInputChange('googleAdsConversionId', e.target.value)}
                    placeholder="AW-123456789"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="others" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* TikTok */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-black rounded"></div>
                    <CardTitle className="text-lg">TikTok Pixel</CardTitle>
                  </div>
                  <Switch
                    checked={analytics?.tiktokEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('tiktokEnabled', checked)}
                  />
                </div>
                <CardDescription>Rastreamento TikTok Ads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tiktokPixelId" className="text-sm font-medium">Pixel ID</Label>
                  <Input
                    id="tiktokPixelId"
                    value={analytics?.tiktokPixelId || ''}
                    onChange={(e) => handleInputChange('tiktokPixelId', e.target.value)}
                    placeholder="C4A7C8B8F6..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Microsoft Clarity */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Chrome className="h-5 w-5 text-blue-400" />
                    <CardTitle className="text-lg">MS Clarity</CardTitle>
                  </div>
                  <Switch
                    checked={analytics?.clarityEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('clarityEnabled', checked)}
                  />
                </div>
                <CardDescription>Heatmaps e sessões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clarityProjectId" className="text-sm font-medium">Project ID</Label>
                  <Input
                    id="clarityProjectId"
                    value={analytics?.clarityProjectId || ''}
                    onChange={(e) => handleInputChange('clarityProjectId', e.target.value)}
                    placeholder="abcdefghij"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hotjar */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">Hotjar</CardTitle>
                  </div>
                  <Switch
                    checked={analytics?.hotjarEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('hotjarEnabled', checked)}
                  />
                </div>
                <CardDescription>Gravações de sessão</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hotjarSiteId" className="text-sm font-medium">Site ID</Label>
                  <Input
                    id="hotjarSiteId"
                    value={analytics?.hotjarSiteId || ''}
                    onChange={(e) => handleInputChange('hotjarSiteId', e.target.value)}
                    placeholder="1234567"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Avançado */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
          <div className="grid gap-6">
            {/* Configurações de Rastreamento */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Rastreamento</CardTitle>
                <CardDescription>Configure quais eventos devem ser rastreados automaticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trackPageviews">Visualizações de Página</Label>
                    <Switch
                      id="trackPageviews"
                      checked={analytics?.trackPageviews || false}
                      onCheckedChange={(checked) => handleInputChange('trackPageviews', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trackClicks">Cliques em Elementos</Label>
                    <Switch
                      id="trackClicks"
                      checked={analytics?.trackClicks || false}
                      onCheckedChange={(checked) => handleInputChange('trackClicks', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trackArtsViewed">Visualização de Artes</Label>
                    <Switch
                      id="trackArtsViewed"
                      checked={analytics?.trackArtsViewed || false}
                      onCheckedChange={(checked) => handleInputChange('trackArtsViewed', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trackArtsDownloaded">Download de Artes</Label>
                    <Switch
                      id="trackArtsDownloaded"
                      checked={analytics?.trackArtsDownloaded || false}
                      onCheckedChange={(checked) => handleInputChange('trackArtsDownloaded', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsSettings;