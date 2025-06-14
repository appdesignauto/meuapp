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
import { Separator } from '@/components/ui/separator';
import { Save, AlertCircle, Facebook, Chrome, BarChart3, Zap, Settings, Check, Loader2 } from 'lucide-react';
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

// Component para salvar configurações individuais
const ConfigurationCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSave: () => void;
  isLoading: boolean;
  isSaved: boolean;
  children: React.ReactNode;
}> = ({ title, description, icon, enabled, onToggle, onSave, isLoading, isSaved, children }) => {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <CardDescription className="text-sm text-gray-600">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-green-500"
            />
            {enabled && (
              <Badge variant={isSaved ? "default" : "secondary"} className={isSaved ? "bg-green-100 text-green-700" : ""}>
                {isSaved ? "Configurado" : "Pendente"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {enabled && (
        <>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-4">
              {children}
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={onSave}
                  disabled={isLoading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : isSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Salvo
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

const AnalyticsSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [analytics, setAnalytics] = useState<AnalyticsSettings | null>(null);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (analyticsData) {
      console.log('Dados carregados do analytics:', analyticsData);
      setAnalytics(analyticsData);
      
      // Marcar como salvos os campos que já tem dados válidos
      const initialSavedStates: Record<string, boolean> = {};
      
      // Meta Pixel
      if (analyticsData.metaPixelId && analyticsData.metaPixelId.trim() !== '') {
        initialSavedStates.metaPixel = true;
      }
      
      // Meta Ads
      if (analyticsData.metaAdsAccessToken && analyticsData.metaAdsAccessToken.trim() !== '') {
        initialSavedStates.metaAds = true;
      }
      
      // GA4
      if (analyticsData.ga4MeasurementId && analyticsData.ga4MeasurementId.trim() !== '') {
        initialSavedStates.ga4 = true;
      }
      
      // GTM
      if (analyticsData.gtmContainerId && analyticsData.gtmContainerId.trim() !== '') {
        initialSavedStates.gtm = true;
      }
      
      // Google Ads
      if (analyticsData.googleAdsConversionId && analyticsData.googleAdsConversionId.trim() !== '') {
        initialSavedStates.googleAds = true;
      }
      
      // TikTok
      if (analyticsData.tiktokPixelId && analyticsData.tiktokPixelId.trim() !== '') {
        initialSavedStates.tiktok = true;
      }
      
      // Clarity
      if (analyticsData.clarityProjectId && analyticsData.clarityProjectId.trim() !== '') {
        initialSavedStates.clarity = true;
      }
      
      // Hotjar
      if (analyticsData.hotjarSiteId && analyticsData.hotjarSiteId.trim() !== '') {
        initialSavedStates.hotjar = true;
      }
      
      console.log('Estados salvos detectados:', initialSavedStates);
      setSavedStates(initialSavedStates);
    }
  }, [analyticsData]);

  const handleInputChange = (field: keyof AnalyticsSettings, value: any) => {
    setAnalytics(prev => prev ? { ...prev, [field]: value } : null);
    // Marcar como não salvo quando há mudança
    const configKey = getConfigKey(field);
    if (configKey) {
      setSavedStates(prev => ({ ...prev, [configKey]: false }));
    }
  };

  const getConfigKey = (field: keyof AnalyticsSettings): string | null => {
    if (field.includes('metaPixel')) return 'metaPixel';
    if (field.includes('metaAds')) return 'metaAds';
    if (field.includes('ga4')) return 'ga4';
    if (field.includes('gtm')) return 'gtm';
    if (field.includes('googleAds')) return 'googleAds';
    if (field.includes('tiktok')) return 'tiktok';
    if (field.includes('clarity')) return 'clarity';
    if (field.includes('hotjar')) return 'hotjar';
    return null;
  };

  const saveIndividualConfig = async (configType: string, data: Partial<AnalyticsSettings>) => {
    setSavingStates(prev => ({ ...prev, [configType]: true }));
    
    try {
      console.log('Salvando configuração:', configType, data);
      
      const response = await fetch('/api/analytics/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...analytics, ...data }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar configurações');
      }
      
      const result = await response.json();
      console.log('Resultado do salvamento:', result);
      
      // Forçar reload dos dados após salvamento
      await queryClient.invalidateQueries({ queryKey: ['/api/analytics/settings'] });
      await queryClient.refetchQueries({ queryKey: ['/api/analytics/settings'] });
      
      setSavedStates(prev => ({ ...prev, [configType]: true }));
      
      toast({
        title: 'Configuração salva',
        description: `Configurações de ${configType} foram atualizadas com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [configType]: false }));
    }
  };

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
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações de Analytics</h1>
        <p className="text-gray-600">Configure suas plataformas de rastreamento individualmente com salvamento automático</p>
      </div>

      {/* Aviso de Conformidade */}
      <Alert className="border-amber-200 bg-amber-50 max-w-4xl mx-auto">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Importante:</strong> Certifique-se de que seu site esteja em conformidade com LGPD e GDPR 
          antes de ativar o rastreamento de usuários.
        </AlertDescription>
      </Alert>

      {/* Meta & Facebook Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Facebook className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Meta & Facebook</h2>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <ConfigurationCard
            title="Meta Pixel"
            description="Rastreamento básico de eventos no Facebook"
            icon={<Facebook className="h-5 w-5" />}
            enabled={analytics?.metaPixelEnabled || false}
            onToggle={(enabled) => handleInputChange('metaPixelEnabled', enabled)}
            onSave={() => saveIndividualConfig('metaPixel', {
              metaPixelEnabled: analytics?.metaPixelEnabled,
              metaPixelId: analytics?.metaPixelId
            })}
            isLoading={savingStates.metaPixel || false}
            isSaved={savedStates.metaPixel || false}
          >
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
          </ConfigurationCard>

          <ConfigurationCard
            title="Conversions API"
            description="API para melhor rastreamento de conversões"
            icon={<Zap className="h-5 w-5" />}
            enabled={analytics?.metaAdsEnabled || false}
            onToggle={(enabled) => handleInputChange('metaAdsEnabled', enabled)}
            onSave={() => saveIndividualConfig('metaAds', {
              metaAdsEnabled: analytics?.metaAdsEnabled,
              metaAdsAccessToken: analytics?.metaAdsAccessToken,
              metaAdAccountId: analytics?.metaAdAccountId
            })}
            isLoading={savingStates.metaAds || false}
            isSaved={savedStates.metaAds || false}
          >
            <div className="space-y-4">
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
            </div>
          </ConfigurationCard>
        </div>
      </div>

      <Separator />

      {/* Google Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Chrome className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Google</h2>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <ConfigurationCard
            title="Google Analytics 4"
            description="Análise completa do site"
            icon={<BarChart3 className="h-5 w-5" />}
            enabled={analytics?.ga4Enabled || false}
            onToggle={(enabled) => handleInputChange('ga4Enabled', enabled)}
            onSave={() => saveIndividualConfig('ga4', {
              ga4Enabled: analytics?.ga4Enabled,
              ga4MeasurementId: analytics?.ga4MeasurementId
            })}
            isLoading={savingStates.ga4 || false}
            isSaved={savedStates.ga4 || false}
          >
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
          </ConfigurationCard>

          <ConfigurationCard
            title="Tag Manager"
            description="Gerenciamento de tags"
            icon={<Settings className="h-5 w-5" />}
            enabled={analytics?.gtmEnabled || false}
            onToggle={(enabled) => handleInputChange('gtmEnabled', enabled)}
            onSave={() => saveIndividualConfig('gtm', {
              gtmEnabled: analytics?.gtmEnabled,
              gtmContainerId: analytics?.gtmContainerId
            })}
            isLoading={savingStates.gtm || false}
            isSaved={savedStates.gtm || false}
          >
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
          </ConfigurationCard>

          <ConfigurationCard
            title="Google Ads"
            description="Rastreamento de conversões"
            icon={<Zap className="h-5 w-5" />}
            enabled={analytics?.googleAdsEnabled || false}
            onToggle={(enabled) => handleInputChange('googleAdsEnabled', enabled)}
            onSave={() => saveIndividualConfig('googleAds', {
              googleAdsEnabled: analytics?.googleAdsEnabled,
              googleAdsConversionId: analytics?.googleAdsConversionId,
              googleAdsConversionLabel: analytics?.googleAdsConversionLabel
            })}
            isLoading={savingStates.googleAds || false}
            isSaved={savedStates.googleAds || false}
          >
            <div className="space-y-4">
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
              <div>
                <Label htmlFor="googleAdsConversionLabel" className="text-sm font-medium">Conversion Label</Label>
                <Input
                  id="googleAdsConversionLabel"
                  value={analytics?.googleAdsConversionLabel || ''}
                  onChange={(e) => handleInputChange('googleAdsConversionLabel', e.target.value)}
                  placeholder="conversion_label"
                  className="mt-1"
                />
              </div>
            </div>
          </ConfigurationCard>
        </div>
      </div>

      <Separator />

      {/* Other Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Outras Plataformas</h2>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <ConfigurationCard
            title="TikTok Pixel"
            description="Rastreamento TikTok Ads"
            icon={<div className="h-5 w-5 bg-black rounded"></div>}
            enabled={analytics?.tiktokEnabled || false}
            onToggle={(enabled) => handleInputChange('tiktokEnabled', enabled)}
            onSave={() => saveIndividualConfig('tiktok', {
              tiktokEnabled: analytics?.tiktokEnabled,
              tiktokPixelId: analytics?.tiktokPixelId
            })}
            isLoading={savingStates.tiktok || false}
            isSaved={savedStates.tiktok || false}
          >
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
          </ConfigurationCard>

          <ConfigurationCard
            title="Microsoft Clarity"
            description="Heatmaps e sessões"
            icon={<Chrome className="h-5 w-5" />}
            enabled={analytics?.clarityEnabled || false}
            onToggle={(enabled) => handleInputChange('clarityEnabled', enabled)}
            onSave={() => saveIndividualConfig('clarity', {
              clarityEnabled: analytics?.clarityEnabled,
              clarityProjectId: analytics?.clarityProjectId
            })}
            isLoading={savingStates.clarity || false}
            isSaved={savedStates.clarity || false}
          >
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
          </ConfigurationCard>

          <ConfigurationCard
            title="Hotjar"
            description="Gravações de sessão"
            icon={<BarChart3 className="h-5 w-5" />}
            enabled={analytics?.hotjarEnabled || false}
            onToggle={(enabled) => handleInputChange('hotjarEnabled', enabled)}
            onSave={() => saveIndividualConfig('hotjar', {
              hotjarEnabled: analytics?.hotjarEnabled,
              hotjarSiteId: analytics?.hotjarSiteId
            })}
            isLoading={savingStates.hotjar || false}
            isSaved={savedStates.hotjar || false}
          >
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
          </ConfigurationCard>
        </div>
      </div>

      <Separator />

      {/* Advanced Settings */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Configurações Avançadas</h2>
        </div>
        
        <ConfigurationCard
          title="Rastreamento de Eventos"
          description="Configure quais eventos devem ser rastreados automaticamente"
          icon={<Settings className="h-5 w-5" />}
          enabled={true}
          onToggle={() => {}}
          onSave={() => saveIndividualConfig('tracking', {
            trackPageviews: analytics?.trackPageviews,
            trackClicks: analytics?.trackClicks,
            trackArtsViewed: analytics?.trackArtsViewed,
            trackArtsDownloaded: analytics?.trackArtsDownloaded
          })}
          isLoading={savingStates.tracking || false}
          isSaved={savedStates.tracking || false}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="trackPageviews" className="text-sm font-medium">Visualizações de Página</Label>
              <Switch
                id="trackPageviews"
                checked={analytics?.trackPageviews || false}
                onCheckedChange={(checked) => handleInputChange('trackPageviews', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="trackClicks" className="text-sm font-medium">Cliques em Elementos</Label>
              <Switch
                id="trackClicks"
                checked={analytics?.trackClicks || false}
                onCheckedChange={(checked) => handleInputChange('trackClicks', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="trackArtsViewed" className="text-sm font-medium">Visualização de Artes</Label>
              <Switch
                id="trackArtsViewed"
                checked={analytics?.trackArtsViewed || false}
                onCheckedChange={(checked) => handleInputChange('trackArtsViewed', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="trackArtsDownloaded" className="text-sm font-medium">Download de Artes</Label>
              <Switch
                id="trackArtsDownloaded"
                checked={analytics?.trackArtsDownloaded || false}
                onCheckedChange={(checked) => handleInputChange('trackArtsDownloaded', checked)}
              />
            </div>
          </div>
        </ConfigurationCard>
      </div>
    </div>
  );
};

export default AnalyticsSettings;