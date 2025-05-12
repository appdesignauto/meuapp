import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Save, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AnalyticsSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('meta-pixel');
  const [error, setError] = useState<string | null>(null);

  // Estado para todas as configurações de analytics
  const [metaPixelSettings, setMetaPixelSettings] = useState({
    metaPixelId: '',
    metaPixelEnabled: false,
    metaAdsAccessToken: ''
  });

  const [googleAnalyticsSettings, setGoogleAnalyticsSettings] = useState({
    ga4MeasurementId: '',
    ga4ApiSecret: '',
    ga4Enabled: false
  });

  const [googleTagManagerSettings, setGoogleTagManagerSettings] = useState({
    gtmContainerId: '',
    gtmEnabled: false
  });

  const [microsoftClaritySettings, setMicrosoftClaritySettings] = useState({
    clarityProjectId: '',
    clarityEnabled: false
  });

  const [pinterestSettings, setPinterestSettings] = useState({
    pinterestTagId: '',
    pinterestEnabled: false
  });

  const [tiktokSettings, setTiktokSettings] = useState({
    tiktokPixelId: '',
    tiktokEnabled: false
  });

  const [customScriptsSettings, setCustomScriptsSettings] = useState({
    customScriptHead: '',
    customScriptBody: '',
    customScriptEnabled: false
  });

  const [trackingSettings, setTrackingSettings] = useState({
    trackPageviews: true,
    trackClicks: false,
    trackFormSubmissions: false,
    trackArtsViewed: true,
    trackArtsDownloaded: true
  });

  // Buscar configurações atuais
  const { isLoading, isError, data } = useQuery({
    queryKey: ['/api/analytics/admin'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/admin');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar configurações de analytics');
      }
      return response.json();
    },
  });

  // Atualizar estados quando os dados forem carregados
  useEffect(() => {
    if (data) {
      setMetaPixelSettings({
        metaPixelId: data.metaPixelId || '',
        metaPixelEnabled: !!data.metaPixelEnabled,
        metaAdsAccessToken: data.metaAdsAccessToken || ''
      });

      setGoogleAnalyticsSettings({
        ga4MeasurementId: data.ga4MeasurementId || '',
        ga4ApiSecret: data.ga4ApiSecret || '',
        ga4Enabled: !!data.ga4Enabled
      });

      setGoogleTagManagerSettings({
        gtmContainerId: data.gtmContainerId || '',
        gtmEnabled: !!data.gtmEnabled
      });

      setMicrosoftClaritySettings({
        clarityProjectId: data.clarityProjectId || '',
        clarityEnabled: !!data.clarityEnabled
      });

      setPinterestSettings({
        pinterestTagId: data.pinterestTagId || '',
        pinterestEnabled: !!data.pinterestEnabled
      });

      setTiktokSettings({
        tiktokPixelId: data.tiktokPixelId || '',
        tiktokEnabled: !!data.tiktokEnabled
      });

      setCustomScriptsSettings({
        customScriptHead: data.customScriptHead || '',
        customScriptBody: data.customScriptBody || '',
        customScriptEnabled: !!data.customScriptEnabled
      });

      setTrackingSettings({
        trackPageviews: data.trackPageviews !== false,
        trackClicks: !!data.trackClicks,
        trackFormSubmissions: !!data.trackFormSubmissions,
        trackArtsViewed: data.trackArtsViewed !== false,
        trackArtsDownloaded: data.trackArtsDownloaded !== false
      });
    }
  }, [data]);

  // Atualizações para cada tipo de configuração
  const updateMetaPixelMutation = useMutation({
    mutationFn: async (data: typeof metaPixelSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/meta-pixel', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações do Meta Pixel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do Meta Pixel foram atualizadas com sucesso',
      });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setError(error.message);
    }
  });

  const updateGoogleAnalyticsMutation = useMutation({
    mutationFn: async (data: typeof googleAnalyticsSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/google-analytics', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações do Google Analytics');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do Google Analytics foram atualizadas com sucesso',
      });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setError(error.message);
    }
  });

  const updateGoogleTagManagerMutation = useMutation({
    mutationFn: async (data: typeof googleTagManagerSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/google-tag-manager', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações do Google Tag Manager');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do Google Tag Manager foram atualizadas com sucesso',
      });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setError(error.message);
    }
  });

  const updateClarityMutation = useMutation({
    mutationFn: async (data: typeof microsoftClaritySettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/clarity', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações do Microsoft Clarity');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do Microsoft Clarity foram atualizadas com sucesso',
      });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setError(error.message);
    }
  });
  
  const updatePinterestMutation = useMutation({
    mutationFn: async (data: typeof pinterestSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/pinterest', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações do Pinterest Tag');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do Pinterest Tag foram atualizadas com sucesso',
      });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setError(error.message);
    }
  });

  const updateTiktokMutation = useMutation({
    mutationFn: async (data: typeof tiktokSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/tiktok', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações do TikTok Pixel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do TikTok Pixel foram atualizadas com sucesso',
      });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setError(error.message);
    }
  });

  const updateCustomScriptsMutation = useMutation({
    mutationFn: async (data: typeof customScriptsSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/custom-scripts', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações de scripts personalizados');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de scripts personalizados foram atualizadas com sucesso',
      });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setError(error.message);
    }
  });

  const updateTrackingSettingsMutation = useMutation({
    mutationFn: async (data: typeof trackingSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/tracking', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações de rastreamento');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de rastreamento foram atualizadas com sucesso',
      });
      setError(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
      setError(error.message);
    }
  });

  // Handlers para salvar cada tipo de configuração
  const handleSaveMetaPixel = () => {
    updateMetaPixelMutation.mutate({
      metaPixelId: metaPixelSettings.metaPixelId,
      metaPixelEnabled: metaPixelSettings.metaPixelEnabled,
      metaAdsAccessToken: metaPixelSettings.metaAdsAccessToken
    });
  };

  const handleSaveGoogleAnalytics = () => {
    updateGoogleAnalyticsMutation.mutate({
      ga4MeasurementId: googleAnalyticsSettings.ga4MeasurementId,
      ga4ApiSecret: googleAnalyticsSettings.ga4ApiSecret,
      ga4Enabled: googleAnalyticsSettings.ga4Enabled
    });
  };

  const handleSaveGoogleTagManager = () => {
    updateGoogleTagManagerMutation.mutate({
      gtmContainerId: googleTagManagerSettings.gtmContainerId,
      gtmEnabled: googleTagManagerSettings.gtmEnabled
    });
  };

  const handleSaveClarity = () => {
    updateClarityMutation.mutate({
      clarityProjectId: microsoftClaritySettings.clarityProjectId,
      clarityEnabled: microsoftClaritySettings.clarityEnabled
    });
  };
  
  const handleSavePinterest = () => {
    updatePinterestMutation.mutate({
      pinterestTagId: pinterestSettings.pinterestTagId,
      pinterestEnabled: pinterestSettings.pinterestEnabled
    });
  };

  const handleSaveTiktok = () => {
    updateTiktokMutation.mutate({
      tiktokPixelId: tiktokSettings.tiktokPixelId,
      tiktokEnabled: tiktokSettings.tiktokEnabled
    });
  };

  const handleSaveCustomScripts = () => {
    updateCustomScriptsMutation.mutate({
      customScriptHead: customScriptsSettings.customScriptHead,
      customScriptBody: customScriptsSettings.customScriptBody,
      customScriptEnabled: customScriptsSettings.customScriptEnabled
    });
  };

  const handleSaveTrackingSettings = () => {
    updateTrackingSettingsMutation.mutate({
      trackPageviews: trackingSettings.trackPageviews,
      trackClicks: trackingSettings.trackClicks,
      trackFormSubmissions: trackingSettings.trackFormSubmissions,
      trackArtsViewed: trackingSettings.trackArtsViewed,
      trackArtsDownloaded: trackingSettings.trackArtsDownloaded
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Não foi possível carregar as configurações de analytics. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 mb-6 justify-start">
          <TabsTrigger value="meta-pixel" className="flex-grow sm:flex-grow-0">Meta Pixel</TabsTrigger>
          <TabsTrigger value="google-analytics" className="flex-grow sm:flex-grow-0">Google Analytics</TabsTrigger>
          <TabsTrigger value="gtm" className="flex-grow sm:flex-grow-0">GTM</TabsTrigger>
          <TabsTrigger value="clarity" className="flex-grow sm:flex-grow-0">Clarity</TabsTrigger>
          <TabsTrigger value="pinterest" className="flex-grow sm:flex-grow-0">Pinterest</TabsTrigger>
          <TabsTrigger value="tiktok" className="flex-grow sm:flex-grow-0">TikTok</TabsTrigger>
          <TabsTrigger value="custom-scripts" className="flex-grow sm:flex-grow-0">Scripts</TabsTrigger>
          <TabsTrigger value="tracking-options" className="flex-grow sm:flex-grow-0">Rastreamento</TabsTrigger>
        </TabsList>

        {/* Meta Pixel */}
        <TabsContent value="meta-pixel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Meta Pixel</CardTitle>
              <CardDescription>Configure o Meta Pixel e o Facebook Ads API para rastreamento de eventos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaPixelId">Meta Pixel ID</Label>
                <Input
                  id="metaPixelId"
                  placeholder="Exemplo: 123456789012345"
                  value={metaPixelSettings.metaPixelId}
                  onChange={(e) => setMetaPixelSettings(prev => ({ ...prev, metaPixelId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  O ID do Meta Pixel pode ser encontrado no Gerenciador de Eventos do Meta Business.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaAdsAccessToken">Access Token da API do Facebook Ads (opcional)</Label>
                <Input
                  id="metaAdsAccessToken"
                  placeholder="Access Token para Facebook Ads API (opcional)"
                  value={metaPixelSettings.metaAdsAccessToken}
                  onChange={(e) => setMetaPixelSettings(prev => ({ ...prev, metaAdsAccessToken: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Este token é necessário apenas para enviar eventos de conversão avançados.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="metaPixelEnabled"
                  checked={metaPixelSettings.metaPixelEnabled}
                  onCheckedChange={(checked) => setMetaPixelSettings(prev => ({ ...prev, metaPixelEnabled: checked }))}
                />
                <Label htmlFor="metaPixelEnabled">Ativar Meta Pixel</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveMetaPixel}
                disabled={updateMetaPixelMutation.isPending}
              >
                {updateMetaPixelMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Google Analytics */}
        <TabsContent value="google-analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Google Analytics 4</CardTitle>
              <CardDescription>Configure o Google Analytics 4 para rastreamento de eventos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ga4MeasurementId">Measurement ID do GA4</Label>
                <Input
                  id="ga4MeasurementId"
                  placeholder="Exemplo: G-XXXXXXXXXX"
                  value={googleAnalyticsSettings.ga4MeasurementId}
                  onChange={(e) => setGoogleAnalyticsSettings(prev => ({ ...prev, ga4MeasurementId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre nas configurações do seu fluxo de dados no GA4.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ga4ApiSecret">API Secret do GA4 (opcional)</Label>
                <Input
                  id="ga4ApiSecret"
                  placeholder="API Secret para envio de eventos avançados (opcional)"
                  value={googleAnalyticsSettings.ga4ApiSecret}
                  onChange={(e) => setGoogleAnalyticsSettings(prev => ({ ...prev, ga4ApiSecret: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Necessário apenas para eventos no lado do servidor.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="ga4Enabled"
                  checked={googleAnalyticsSettings.ga4Enabled}
                  onCheckedChange={(checked) => setGoogleAnalyticsSettings(prev => ({ ...prev, ga4Enabled: checked }))}
                />
                <Label htmlFor="ga4Enabled">Ativar Google Analytics 4</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveGoogleAnalytics}
                disabled={updateGoogleAnalyticsMutation.isPending}
              >
                {updateGoogleAnalyticsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Google Tag Manager */}
        <TabsContent value="gtm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Google Tag Manager</CardTitle>
              <CardDescription>Configure o GTM para gerenciamento centralizado de tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gtmContainerId">Container ID do GTM</Label>
                <Input
                  id="gtmContainerId"
                  placeholder="Exemplo: GTM-XXXXXXX"
                  value={googleTagManagerSettings.gtmContainerId}
                  onChange={(e) => setGoogleTagManagerSettings(prev => ({ ...prev, gtmContainerId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre na interface do Google Tag Manager.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="gtmEnabled"
                  checked={googleTagManagerSettings.gtmEnabled}
                  onCheckedChange={(checked) => setGoogleTagManagerSettings(prev => ({ ...prev, gtmEnabled: checked }))}
                />
                <Label htmlFor="gtmEnabled">Ativar Google Tag Manager</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveGoogleTagManager}
                disabled={updateGoogleTagManagerMutation.isPending}
              >
                {updateGoogleTagManagerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Microsoft Clarity */}
        <TabsContent value="clarity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Microsoft Clarity</CardTitle>
              <CardDescription>Configure o Microsoft Clarity para análise de comportamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clarityProjectId">Project ID do Clarity</Label>
                <Input
                  id="clarityProjectId"
                  placeholder="Exemplo: abcdefghij"
                  value={microsoftClaritySettings.clarityProjectId}
                  onChange={(e) => setMicrosoftClaritySettings(prev => ({ ...prev, clarityProjectId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre nas configurações do seu projeto no Microsoft Clarity.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="clarityEnabled"
                  checked={microsoftClaritySettings.clarityEnabled}
                  onCheckedChange={(checked) => setMicrosoftClaritySettings(prev => ({ ...prev, clarityEnabled: checked }))}
                />
                <Label htmlFor="clarityEnabled">Ativar Microsoft Clarity</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveClarity}
                disabled={updateClarityMutation.isPending}
              >
                {updateClarityMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pinterest */}
        <TabsContent value="pinterest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Pinterest Tag</CardTitle>
              <CardDescription>Configure o Pinterest Tag para rastreamento de conversões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pinterestTagId">Tag ID do Pinterest</Label>
                <Input
                  id="pinterestTagId"
                  placeholder="Exemplo: 1234567890123"
                  value={pinterestSettings.pinterestTagId}
                  onChange={(e) => setPinterestSettings(prev => ({ ...prev, pinterestTagId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre nas configurações do Pinterest Ads Manager.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="pinterestEnabled"
                  checked={pinterestSettings.pinterestEnabled}
                  onCheckedChange={(checked) => setPinterestSettings(prev => ({ ...prev, pinterestEnabled: checked }))}
                />
                <Label htmlFor="pinterestEnabled">Ativar Pinterest Tag</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSavePinterest}
                disabled={updatePinterestMutation.isPending}
              >
                {updatePinterestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TikTok */}
        <TabsContent value="tiktok" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do TikTok Pixel</CardTitle>
              <CardDescription>Configure o TikTok Pixel para rastreamento de eventos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tiktokPixelId">Pixel ID do TikTok</Label>
                <Input
                  id="tiktokPixelId"
                  placeholder="Exemplo: XXXXXXXXXXXXXXXXXX"
                  value={tiktokSettings.tiktokPixelId}
                  onChange={(e) => setTiktokSettings(prev => ({ ...prev, tiktokPixelId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre nas configurações do TikTok Ads Manager.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="tiktokEnabled"
                  checked={tiktokSettings.tiktokEnabled}
                  onCheckedChange={(checked) => setTiktokSettings(prev => ({ ...prev, tiktokEnabled: checked }))}
                />
                <Label htmlFor="tiktokEnabled">Ativar TikTok Pixel</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveTiktok}
                disabled={updateTiktokMutation.isPending}
              >
                {updateTiktokMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Scripts Personalizados */}
        <TabsContent value="custom-scripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scripts Personalizados</CardTitle>
              <CardDescription>Adicione scripts personalizados para funcionalidades adicionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customScriptHead">Scripts para o &lt;head&gt;</Label>
                <Textarea
                  id="customScriptHead"
                  placeholder="Cole aqui os scripts para o <head>"
                  value={customScriptsSettings.customScriptHead}
                  onChange={(e) => setCustomScriptsSettings(prev => ({ ...prev, customScriptHead: e.target.value }))}
                  className="h-32 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Inseridos no final da tag &lt;head&gt;.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customScriptBody">Scripts para o final do &lt;body&gt;</Label>
                <Textarea
                  id="customScriptBody"
                  placeholder="Cole aqui os scripts para o final do <body>"
                  value={customScriptsSettings.customScriptBody}
                  onChange={(e) => setCustomScriptsSettings(prev => ({ ...prev, customScriptBody: e.target.value }))}
                  className="h-32 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Inseridos no final da tag &lt;body&gt;.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="customScriptEnabled"
                  checked={customScriptsSettings.customScriptEnabled}
                  onCheckedChange={(checked) => setCustomScriptsSettings(prev => ({ ...prev, customScriptEnabled: checked }))}
                />
                <Label htmlFor="customScriptEnabled">Ativar Scripts Personalizados</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveCustomScripts}
                disabled={updateCustomScriptsMutation.isPending}
              >
                {updateCustomScriptsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Opções de Rastreamento */}
        <TabsContent value="tracking-options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Opções de Rastreamento</CardTitle>
              <CardDescription>Configure quais eventos serão rastreados automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackPageviews"
                    checked={trackingSettings.trackPageviews}
                    onCheckedChange={(checked) => setTrackingSettings(prev => ({ ...prev, trackPageviews: checked === true }))}
                  />
                  <Label htmlFor="trackPageviews">Rastrear visualizações de página</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackClicks"
                    checked={trackingSettings.trackClicks}
                    onCheckedChange={(checked) => setTrackingSettings(prev => ({ ...prev, trackClicks: checked === true }))}
                  />
                  <Label htmlFor="trackClicks">Rastrear cliques em elementos</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackFormSubmissions"
                    checked={trackingSettings.trackFormSubmissions}
                    onCheckedChange={(checked) => setTrackingSettings(prev => ({ ...prev, trackFormSubmissions: checked === true }))}
                  />
                  <Label htmlFor="trackFormSubmissions">Rastrear envios de formulários</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackArtsViewed"
                    checked={trackingSettings.trackArtsViewed}
                    onCheckedChange={(checked) => setTrackingSettings(prev => ({ ...prev, trackArtsViewed: checked === true }))}
                  />
                  <Label htmlFor="trackArtsViewed">Rastrear visualizações de artes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackArtsDownloaded"
                    checked={trackingSettings.trackArtsDownloaded}
                    onCheckedChange={(checked) => setTrackingSettings(prev => ({ ...prev, trackArtsDownloaded: checked === true }))}
                  />
                  <Label htmlFor="trackArtsDownloaded">Rastrear downloads de artes</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveTrackingSettings}
                disabled={updateTrackingSettingsMutation.isPending}
              >
                {updateTrackingSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsSettings;