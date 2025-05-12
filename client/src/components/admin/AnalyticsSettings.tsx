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

  const [hotjarSettings, setHotjarSettings] = useState({
    hotjarSiteId: '',
    hotjarEnabled: false
  });

  const [linkedinSettings, setLinkedinSettings] = useState({
    linkedinPartnerId: '',
    linkedinEnabled: false
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

      setHotjarSettings({
        hotjarSiteId: data.hotjarSiteId || '',
        hotjarEnabled: !!data.hotjarEnabled
      });

      setLinkedinSettings({
        linkedinPartnerId: data.linkedinPartnerId || '',
        linkedinEnabled: !!data.linkedinEnabled
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

  // Mutations para salvar as configurações
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

  const updateHotjarMutation = useMutation({
    mutationFn: async (data: typeof hotjarSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/hotjar', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações do Hotjar');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do Hotjar foram atualizadas com sucesso',
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

  const updateLinkedinMutation = useMutation({
    mutationFn: async (data: typeof linkedinSettings) => {
      const response = await apiRequest('PUT', '/api/analytics/admin/linkedin', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar configurações do LinkedIn Insight Tag');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do LinkedIn Insight Tag foram atualizadas com sucesso',
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
        throw new Error(errorData.message || 'Erro ao atualizar scripts personalizados');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: 'Configurações salvas',
        description: 'Os scripts personalizados foram atualizados com sucesso',
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
      const response = await apiRequest('PUT', '/api/analytics/admin/tracking-settings', data);
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

  // Handlers para salvar cada seção
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

  const handleSaveHotjar = () => {
    updateHotjarMutation.mutate({
      hotjarSiteId: hotjarSettings.hotjarSiteId,
      hotjarEnabled: hotjarSettings.hotjarEnabled
    });
  };

  const handleSaveLinkedin = () => {
    updateLinkedinMutation.mutate({
      linkedinPartnerId: linkedinSettings.linkedinPartnerId,
      linkedinEnabled: linkedinSettings.linkedinEnabled
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
        <TabsList className="grid grid-cols-3 md:grid-cols-9 mb-6">
          <TabsTrigger value="meta-pixel">Meta Pixel</TabsTrigger>
          <TabsTrigger value="google-analytics">Google Analytics</TabsTrigger>
          <TabsTrigger value="gtm">Google Tag Manager</TabsTrigger>
          <TabsTrigger value="clarity">Microsoft Clarity</TabsTrigger>
          <TabsTrigger value="hotjar">Hotjar</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
          <TabsTrigger value="custom-scripts">Scripts Personalizados</TabsTrigger>
          <TabsTrigger value="tracking-options">Opções de Rastreamento</TabsTrigger>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="meta-pixel-enabled">Ativar Meta Pixel</Label>
                  <Switch
                    id="meta-pixel-enabled"
                    checked={metaPixelSettings.metaPixelEnabled}
                    onCheckedChange={(checked) => setMetaPixelSettings({...metaPixelSettings, metaPixelEnabled: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta-pixel-id">ID do Meta Pixel</Label>
                <Input
                  id="meta-pixel-id"
                  placeholder="Ex: 123456789012345"
                  value={metaPixelSettings.metaPixelId}
                  onChange={(e) => setMetaPixelSettings({...metaPixelSettings, metaPixelId: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  ID do seu Meta Pixel. Você pode encontrá-lo no <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="underline">Gerenciador de Eventos</a> do Meta.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta-ads-token">Token de Acesso do Meta Ads API (opcional)</Label>
                <Input
                  id="meta-ads-token"
                  placeholder="Token de acesso"
                  value={metaPixelSettings.metaAdsAccessToken}
                  onChange={(e) => setMetaPixelSettings({...metaPixelSettings, metaAdsAccessToken: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  Token de acesso à API do Facebook Ads para conversões avançadas.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('google-analytics')}>
                Próximo
              </Button>
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
                    Salvar
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
              <CardTitle>Configurações do Google Analytics</CardTitle>
              <CardDescription>Configure o Google Analytics 4 para análise de tráfego</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ga-enabled">Ativar Google Analytics</Label>
                  <Switch
                    id="ga-enabled"
                    checked={googleAnalyticsSettings.ga4Enabled}
                    onCheckedChange={(checked) => setGoogleAnalyticsSettings({...googleAnalyticsSettings, ga4Enabled: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ga-measurement-id">ID de Medição do GA4</Label>
                <Input
                  id="ga-measurement-id"
                  placeholder="Ex: G-XXXXXXXXXX"
                  value={googleAnalyticsSettings.ga4MeasurementId}
                  onChange={(e) => setGoogleAnalyticsSettings({...googleAnalyticsSettings, ga4MeasurementId: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  O ID de Medição do GA4 começa com "G-".
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ga-api-secret">API Secret do GA4 (opcional)</Label>
                <Input
                  id="ga-api-secret"
                  placeholder="Segredo da API"
                  value={googleAnalyticsSettings.ga4ApiSecret}
                  onChange={(e) => setGoogleAnalyticsSettings({...googleAnalyticsSettings, ga4ApiSecret: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  Utilizado para envio de eventos do servidor para o GA4.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('meta-pixel')}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('gtm')}>
                  Próximo
                </Button>
              </div>
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
                    Salvar
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
              <CardDescription>Configure o GTM para gerenciar tags de rastreamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gtm-enabled">Ativar Google Tag Manager</Label>
                  <Switch
                    id="gtm-enabled"
                    checked={googleTagManagerSettings.gtmEnabled}
                    onCheckedChange={(checked) => setGoogleTagManagerSettings({...googleTagManagerSettings, gtmEnabled: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gtm-container-id">ID do Container GTM</Label>
                <Input
                  id="gtm-container-id"
                  placeholder="Ex: GTM-XXXXXXX"
                  value={googleTagManagerSettings.gtmContainerId}
                  onChange={(e) => setGoogleTagManagerSettings({...googleTagManagerSettings, gtmContainerId: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  O ID do Container do Google Tag Manager geralmente começa com "GTM-".
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('google-analytics')}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('clarity')}>
                  Próximo
                </Button>
              </div>
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
                    Salvar
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
              <CardDescription>Configure o Microsoft Clarity para mapas de calor e gravações de sessão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clarity-enabled">Ativar Microsoft Clarity</Label>
                  <Switch
                    id="clarity-enabled"
                    checked={microsoftClaritySettings.clarityEnabled}
                    onCheckedChange={(checked) => setMicrosoftClaritySettings({...microsoftClaritySettings, clarityEnabled: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clarity-project-id">ID do Projeto Clarity</Label>
                <Input
                  id="clarity-project-id"
                  placeholder="Ex: abcdefghij"
                  value={microsoftClaritySettings.clarityProjectId}
                  onChange={(e) => setMicrosoftClaritySettings({...microsoftClaritySettings, clarityProjectId: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  Você pode encontrar este ID no painel do Microsoft Clarity ao configurar seu site.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('gtm')}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('hotjar')}>
                  Próximo
                </Button>
              </div>
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
                    Salvar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Hotjar */}
        <TabsContent value="hotjar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Hotjar</CardTitle>
              <CardDescription>Configure o Hotjar para mapas de calor, gravações e feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hotjar-enabled">Ativar Hotjar</Label>
                  <Switch
                    id="hotjar-enabled"
                    checked={hotjarSettings.hotjarEnabled}
                    onCheckedChange={(checked) => setHotjarSettings({...hotjarSettings, hotjarEnabled: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hotjar-site-id">ID do Site Hotjar</Label>
                <Input
                  id="hotjar-site-id"
                  placeholder="Ex: 1234567"
                  value={hotjarSettings.hotjarSiteId}
                  onChange={(e) => setHotjarSettings({...hotjarSettings, hotjarSiteId: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  Você pode encontrar o ID do site no código de instalação do Hotjar.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('clarity')}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('linkedin')}>
                  Próximo
                </Button>
              </div>
              <Button 
                onClick={handleSaveHotjar} 
                disabled={updateHotjarMutation.isPending}
              >
                {updateHotjarMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* LinkedIn */}
        <TabsContent value="linkedin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do LinkedIn Insight Tag</CardTitle>
              <CardDescription>Configure o LinkedIn para rastreamento de conversões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="linkedin-enabled">Ativar LinkedIn Insight Tag</Label>
                  <Switch
                    id="linkedin-enabled"
                    checked={linkedinSettings.linkedinEnabled}
                    onCheckedChange={(checked) => setLinkedinSettings({...linkedinSettings, linkedinEnabled: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin-partner-id">ID do Parceiro LinkedIn</Label>
                <Input
                  id="linkedin-partner-id"
                  placeholder="Ex: 123456"
                  value={linkedinSettings.linkedinPartnerId}
                  onChange={(e) => setLinkedinSettings({...linkedinSettings, linkedinPartnerId: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  Você pode encontrar este ID na sua conta do LinkedIn Campaign Manager.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('hotjar')}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('tiktok')}>
                  Próximo
                </Button>
              </div>
              <Button 
                onClick={handleSaveLinkedin} 
                disabled={updateLinkedinMutation.isPending}
              >
                {updateLinkedinMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
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
              <CardDescription>Configure o TikTok Pixel para rastreamento de conversões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tiktok-enabled">Ativar TikTok Pixel</Label>
                  <Switch
                    id="tiktok-enabled"
                    checked={tiktokSettings.tiktokEnabled}
                    onCheckedChange={(checked) => setTiktokSettings({...tiktokSettings, tiktokEnabled: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tiktok-pixel-id">ID do Pixel TikTok</Label>
                <Input
                  id="tiktok-pixel-id"
                  placeholder="Ex: CNNNNNNC"
                  value={tiktokSettings.tiktokPixelId}
                  onChange={(e) => setTiktokSettings({...tiktokSettings, tiktokPixelId: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  Você pode encontrar este ID no painel de Eventos do TikTok Ads Manager.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('linkedin')}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('custom-scripts')}>
                  Próximo
                </Button>
              </div>
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
                    Salvar
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
              <CardDescription>Adicione scripts de rastreamento personalizados ao site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-scripts-enabled">Ativar Scripts Personalizados</Label>
                  <Switch
                    id="custom-scripts-enabled"
                    checked={customScriptsSettings.customScriptEnabled}
                    onCheckedChange={(checked) => setCustomScriptsSettings({...customScriptsSettings, customScriptEnabled: checked})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-script-head">Script para o &lt;head&gt;</Label>
                <Textarea
                  id="custom-script-head"
                  placeholder="<!-- Código para inserir no head -->"
                  value={customScriptsSettings.customScriptHead}
                  onChange={(e) => setCustomScriptsSettings({...customScriptsSettings, customScriptHead: e.target.value})}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Este código será inserido na seção &lt;head&gt; de todas as páginas.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-script-body">Script para o final do &lt;body&gt;</Label>
                <Textarea
                  id="custom-script-body"
                  placeholder="<!-- Código para inserir no final do body -->"
                  value={customScriptsSettings.customScriptBody}
                  onChange={(e) => setCustomScriptsSettings({...customScriptsSettings, customScriptBody: e.target.value})}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Este código será inserido no final da seção &lt;body&gt; de todas as páginas.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('tiktok')}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('tracking-options')}>
                  Próximo
                </Button>
              </div>
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
                    Salvar
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
              <CardDescription>Configure quais tipos de eventos serão rastreados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="track-pageviews"
                    checked={trackingSettings.trackPageviews}
                    onCheckedChange={(checked) => setTrackingSettings({...trackingSettings, trackPageviews: !!checked})}
                  />
                  <Label
                    htmlFor="track-pageviews"
                    className="font-normal"
                  >
                    Rastrear visualizações de página
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="track-clicks"
                    checked={trackingSettings.trackClicks}
                    onCheckedChange={(checked) => setTrackingSettings({...trackingSettings, trackClicks: !!checked})}
                  />
                  <Label
                    htmlFor="track-clicks"
                    className="font-normal"
                  >
                    Rastrear cliques em botões e links
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="track-forms"
                    checked={trackingSettings.trackFormSubmissions}
                    onCheckedChange={(checked) => setTrackingSettings({...trackingSettings, trackFormSubmissions: !!checked})}
                  />
                  <Label
                    htmlFor="track-forms"
                    className="font-normal"
                  >
                    Rastrear envio de formulários
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="track-arts-viewed"
                    checked={trackingSettings.trackArtsViewed}
                    onCheckedChange={(checked) => setTrackingSettings({...trackingSettings, trackArtsViewed: !!checked})}
                  />
                  <Label
                    htmlFor="track-arts-viewed"
                    className="font-normal"
                  >
                    Rastrear visualizações de artes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="track-arts-downloaded"
                    checked={trackingSettings.trackArtsDownloaded}
                    onCheckedChange={(checked) => setTrackingSettings({...trackingSettings, trackArtsDownloaded: !!checked})}
                  />
                  <Label
                    htmlFor="track-arts-downloaded"
                    className="font-normal"
                  >
                    Rastrear downloads de artes
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('custom-scripts')}>
                Anterior
              </Button>
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
                    Salvar
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