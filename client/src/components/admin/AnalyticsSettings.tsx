import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

      {/* Meta Pixel */}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsSettings;