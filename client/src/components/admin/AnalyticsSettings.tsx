import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Save, AlertCircle, Facebook, Chrome, BarChart3, Settings, Target } from 'lucide-react';
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

      <Tabs defaultValue="meta" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Meta Ads
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Chrome className="h-4 w-4" />
            Google
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            TikTok Ads
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="others" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Outros
          </TabsTrigger>
        </TabsList>

        {/* Meta Ads */}
        <TabsContent value="meta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="h-5 w-5 text-blue-600" />
                Meta Ads & Facebook Pixel
              </CardTitle>
              <CardDescription>Configure o Meta Pixel e Facebook Ads API para rastreamento e conversões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaPixelId" className="text-sm font-medium">Meta Pixel ID</Label>
                <Input
                  id="metaPixelId"
                  value={analytics?.metaPixelId || ''}
                  onChange={(e) => handleInputChange('metaPixelId', e.target.value)}
                  placeholder="123456789012345"
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

              <div className="space-y-2">
                <Label htmlFor="metaAdAccountId" className="text-sm font-medium">ID da Conta de Anúncios</Label>
                <Input
                  id="metaAdAccountId"
                  value={analytics?.metaAdAccountId || ''}
                  onChange={(e) => handleInputChange('metaAdAccountId', e.target.value)}
                  placeholder="act_123456789"
                  className="bg-gray-50"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metaPixelEnabled"
                    checked={analytics?.metaPixelEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('metaPixelEnabled', checked)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="metaPixelEnabled" className="text-sm font-medium">Ativar Meta Pixel</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metaAdsEnabled"
                    checked={analytics?.metaAdsEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('metaAdsEnabled', checked)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="metaAdsEnabled" className="text-sm font-medium">Ativar Conversions API</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google */}
        <TabsContent value="google" className="space-y-6">
          <div className="grid gap-6">
            {/* Google Analytics 4 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Google Analytics 4
                </CardTitle>
                <CardDescription>Configure o Google Analytics 4 para análise de dados do site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ga4MeasurementId" className="text-sm font-medium">Measurement ID</Label>
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
                    className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                  <Label htmlFor="ga4Enabled" className="text-sm font-medium">Ativar Google Analytics 4</Label>
                </div>
              </CardContent>
            </Card>

            {/* Google Tag Manager */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Google Tag Manager
                </CardTitle>
                <CardDescription>Configure o GTM para gerenciamento centralizado de tags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gtmContainerId" className="text-sm font-medium">Container ID</Label>
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
                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <Label htmlFor="gtmEnabled" className="text-sm font-medium">Ativar Google Tag Manager</Label>
                </div>
              </CardContent>
            </Card>

            {/* Google Ads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Google Ads
                </CardTitle>
                <CardDescription>Configure o Google Ads para rastreamento de conversões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="googleAdsCustomerId" className="text-sm font-medium">Customer ID</Label>
                  <Input
                    id="googleAdsCustomerId"
                    value={analytics?.googleAdsCustomerId || ''}
                    onChange={(e) => handleInputChange('googleAdsCustomerId', e.target.value)}
                    placeholder="123-456-7890"
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleAdsConversionId" className="text-sm font-medium">Conversion ID</Label>
                  <Input
                    id="googleAdsConversionId"
                    value={analytics?.googleAdsConversionId || ''}
                    onChange={(e) => handleInputChange('googleAdsConversionId', e.target.value)}
                    placeholder="AW-123456789"
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleAdsConversionLabel" className="text-sm font-medium">Conversion Label</Label>
                  <Input
                    id="googleAdsConversionLabel"
                    value={analytics?.googleAdsConversionLabel || ''}
                    onChange={(e) => handleInputChange('googleAdsConversionLabel', e.target.value)}
                    placeholder="abcdefghijk"
                    className="bg-gray-50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="googleAdsEnabled"
                    checked={analytics?.googleAdsEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('googleAdsEnabled', checked)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <Label htmlFor="googleAdsEnabled" className="text-sm font-medium">Ativar Google Ads</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TikTok Ads */}
        <TabsContent value="tiktok" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-black" />
                TikTok Ads
              </CardTitle>
              <CardDescription>Configure o TikTok Pixel para rastreamento de conversões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tiktokPixelId" className="text-sm font-medium">TikTok Pixel ID</Label>
                <Input
                  id="tiktokPixelId"
                  value={analytics?.tiktokPixelId || ''}
                  onChange={(e) => handleInputChange('tiktokPixelId', e.target.value)}
                  placeholder="C4A7C8B8F6..."
                  className="bg-gray-50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tiktokEnabled"
                  checked={analytics?.tiktokEnabled || false}
                  onCheckedChange={(checked) => handleInputChange('tiktokEnabled', checked)}
                  className="data-[state=checked]:bg-black data-[state=checked]:border-black"
                />
                <Label htmlFor="tiktokEnabled" className="text-sm font-medium">Ativar TikTok Pixel</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            {/* Microsoft Clarity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="h-5 w-5 text-blue-400" />
                  Microsoft Clarity
                </CardTitle>
                <CardDescription>Configure o Microsoft Clarity para análise de comportamento de usuários</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clarityProjectId" className="text-sm font-medium">Project ID</Label>
                  <Input
                    id="clarityProjectId"
                    value={analytics?.clarityProjectId || ''}
                    onChange={(e) => handleInputChange('clarityProjectId', e.target.value)}
                    placeholder="abcdefghij"
                    className="bg-gray-50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="clarityEnabled"
                    checked={analytics?.clarityEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('clarityEnabled', checked)}
                    className="data-[state=checked]:bg-blue-400 data-[state=checked]:border-blue-400"
                  />
                  <Label htmlFor="clarityEnabled" className="text-sm font-medium">Ativar Microsoft Clarity</Label>
                </div>
              </CardContent>
            </Card>

            {/* Hotjar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-500" />
                  Hotjar
                </CardTitle>
                <CardDescription>Configure o Hotjar para heatmaps e gravações de sessão</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hotjarSiteId" className="text-sm font-medium">Site ID</Label>
                  <Input
                    id="hotjarSiteId"
                    value={analytics?.hotjarSiteId || ''}
                    onChange={(e) => handleInputChange('hotjarSiteId', e.target.value)}
                    placeholder="1234567"
                    className="bg-gray-50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hotjarEnabled"
                    checked={analytics?.hotjarEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('hotjarEnabled', checked)}
                    className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <Label htmlFor="hotjarEnabled" className="text-sm font-medium">Ativar Hotjar</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Outros */}
        <TabsContent value="others" className="space-y-6">
          <div className="grid gap-6">
            {/* LinkedIn */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="h-5 w-5 text-blue-700" />
                  LinkedIn Insight Tag
                </CardTitle>
                <CardDescription>Configure o LinkedIn Insight Tag para rastreamento de campanhas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinPartnerId" className="text-sm font-medium">Partner ID</Label>
                  <Input
                    id="linkedinPartnerId"
                    value={analytics?.linkedinPartnerId || ''}
                    onChange={(e) => handleInputChange('linkedinPartnerId', e.target.value)}
                    placeholder="123456"
                    className="bg-gray-50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="linkedinEnabled"
                    checked={analytics?.linkedinEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('linkedinEnabled', checked)}
                    className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-700"
                  />
                  <Label htmlFor="linkedinEnabled" className="text-sm font-medium">Ativar LinkedIn Insight Tag</Label>
                </div>
              </CardContent>
            </Card>

            {/* Amplitude */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Amplitude
                </CardTitle>
                <CardDescription>Configure o Amplitude para análise de eventos de produto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amplitudeApiKey" className="text-sm font-medium">API Key</Label>
                  <Input
                    id="amplitudeApiKey"
                    type="password"
                    value={analytics?.amplitudeApiKey || ''}
                    onChange={(e) => handleInputChange('amplitudeApiKey', e.target.value)}
                    placeholder="Digite a API Key do Amplitude"
                    className="bg-gray-50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="amplitudeEnabled"
                    checked={analytics?.amplitudeEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('amplitudeEnabled', checked)}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor="amplitudeEnabled" className="text-sm font-medium">Ativar Amplitude</Label>
                </div>
              </CardContent>
            </Card>

            {/* Mixpanel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-pink-600" />
                  Mixpanel
                </CardTitle>
                <CardDescription>Configure o Mixpanel para análise de eventos de usuário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mixpanelToken" className="text-sm font-medium">Project Token</Label>
                  <Input
                    id="mixpanelToken"
                    type="password"
                    value={analytics?.mixpanelToken || ''}
                    onChange={(e) => handleInputChange('mixpanelToken', e.target.value)}
                    placeholder="Digite o token do projeto Mixpanel"
                    className="bg-gray-50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mixpanelEnabled"
                    checked={analytics?.mixpanelEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('mixpanelEnabled', checked)}
                    className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                  />
                  <Label htmlFor="mixpanelEnabled" className="text-sm font-medium">Ativar Mixpanel</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botão de Salvar Global */}
      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
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