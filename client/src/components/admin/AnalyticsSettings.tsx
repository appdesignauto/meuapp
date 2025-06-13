import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsSettings {
  metaPixelId: string;
  metaAccessToken: string;
  metaAdAccountId: string;
  metaPixelEnabled: boolean;
  metaConversionsApiEnabled: boolean;
  ga4MeasurementId: string;
  ga4Enabled: boolean;
  gtmContainerId: string;
  gtmEnabled: boolean;
  clarityProjectId: string;
  clarityEnabled: boolean;
  pinterestTagId: string;
  pinterestEnabled: boolean;
  tiktokPixelId: string;
  tiktokEnabled: boolean;
  customScripts: string;
  customScriptsEnabled: boolean;
  trackingEnabled: boolean;
  trackingConsentEnabled: boolean;
  trackingCookieExpiry: number;
}

const AnalyticsSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [analytics, setAnalytics] = useState<AnalyticsSettings | null>(null);

  const { data: analyticsData, isLoading: isLoadingData } = useQuery({
    queryKey: ['/api/analytics/settings'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/settings');
      if (!response.ok) {
        throw new Error('Falha ao carregar configurações de analytics');
      }
      return await response.json();
    }
  });

  const saveAnalyticsMutation = useMutation({
    mutationFn: async (data: AnalyticsSettings) => {
      const response = await fetch('/api/analytics/settings', {
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
        description: "Configurações de analytics salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/settings'] });
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
      {/* Meta Pixel */}
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
              value={analytics?.metaPixelId || ''}
              onChange={(e) => handleInputChange('metaPixelId', e.target.value)}
              placeholder="Digite o ID do Meta Pixel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaAccessToken">Token de Acesso da API</Label>
            <Input
              id="metaAccessToken"
              type="password"
              value={analytics?.metaAccessToken || ''}
              onChange={(e) => handleInputChange('metaAccessToken', e.target.value)}
              placeholder="Digite o token de acesso da API"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaAdAccountId">ID da Conta de Anúncios</Label>
            <Input
              id="metaAdAccountId"
              value={analytics?.metaAdAccountId || ''}
              onChange={(e) => handleInputChange('metaAdAccountId', e.target.value)}
              placeholder="Digite o ID da conta de anúncios"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="metaPixelEnabled"
              checked={analytics?.metaPixelEnabled || false}
              onCheckedChange={(checked) => handleInputChange('metaPixelEnabled', checked)}
            />
            <Label htmlFor="metaPixelEnabled">Ativar Meta Pixel</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="metaConversionsApiEnabled"
              checked={analytics?.metaConversionsApiEnabled || false}
              onCheckedChange={(checked) => handleInputChange('metaConversionsApiEnabled', checked)}
            />
            <Label htmlFor="metaConversionsApiEnabled">Ativar Conversions API</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
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
    </div>
  );
};

export default AnalyticsSettings;