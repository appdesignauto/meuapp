import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AnalyticsStatus {
  ga4: {
    loaded: boolean;
    id: string;
    active: boolean;
  };
  metaPixel: {
    loaded: boolean;
    id: string;
    active: boolean;
  };
  gtm: {
    loaded: boolean;
    id: string;
    active: boolean;
  };
  clarity: {
    loaded: boolean;
    id: string;
    active: boolean;
  };
  scripts: {
    count: number;
    details: string[];
  };
}

const AnalyticsDebugger = () => {
  const [status, setStatus] = useState<AnalyticsStatus | null>(null);
  
  const { data: config } = useQuery({
    queryKey: ['/api/analytics/settings'],
    refetchOnWindowFocus: false,
  });

  const checkAnalyticsStatus = () => {
    const ga4Loaded = !!(window as any).gtag && !!(window as any).DesignAutoGA4;
    const metaPixelLoaded = !!(window as any).fbq && !!(window as any).DesignAutoMetaPixel;
    const gtmLoaded = !!(window as any).dataLayer;
    
    const scripts = document.querySelectorAll('[data-analytics-script]');
    const scriptDetails = Array.from(scripts).map(script => 
      script.getAttribute('data-analytics-script') || 'unknown'
    );

    setStatus({
      ga4: {
        loaded: ga4Loaded,
        id: (config as any)?.ga4MeasurementId || 'N/A',
        active: ga4Loaded && (config as any)?.ga4Enabled
      },
      metaPixel: {
        loaded: metaPixelLoaded,
        id: (config as any)?.metaPixelId || 'N/A',
        active: metaPixelLoaded && (config as any)?.metaPixelEnabled
      },
      gtm: {
        loaded: gtmLoaded,
        id: (config as any)?.gtmContainerId || 'N/A',
        active: gtmLoaded && (config as any)?.gtmEnabled
      },
      scripts: {
        count: scripts.length,
        details: scriptDetails
      }
    });
  };

  useEffect(() => {
    if (config) {
      // Check status after a short delay to allow scripts to load
      const timer = setTimeout(checkAnalyticsStatus, 1000);
      return () => clearTimeout(timer);
    }
  }, [config]);

  const StatusIcon = ({ active }: { active: boolean }) => {
    if (active) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const testGA4Tracking = () => {
    if ((window as any).DesignAutoGA4?.trackEvent) {
      (window as any).DesignAutoGA4.trackEvent('test_event', {
        test_parameter: 'admin_debug',
        timestamp: new Date().toISOString()
      });
      console.log('✅ Evento de teste GA4 enviado');
    } else {
      console.log('❌ GA4 não está disponível');
    }
  };

  const testMetaPixelTracking = () => {
    if ((window as any).DesignAutoMetaPixel?.trackCustomEvent) {
      (window as any).DesignAutoMetaPixel.trackCustomEvent('TestEvent', {
        test_parameter: 'admin_debug',
        timestamp: new Date().toISOString()
      });
      console.log('✅ Evento de teste Meta Pixel enviado');
    } else {
      console.log('❌ Meta Pixel não está disponível');
    }
  };

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Verificando Analytics...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Status dos Analytics</CardTitle>
          <CardDescription>
            Verificação em tempo real dos códigos de rastreamento carregados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Analytics 4 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon active={status.ga4.active} />
              <div>
                <p className="font-medium">Google Analytics 4</p>
                <p className="text-sm text-muted-foreground">ID: {status.ga4.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={status.ga4.loaded ? "default" : "destructive"}>
                {status.ga4.loaded ? "Carregado" : "Não Carregado"}
              </Badge>
              {status.ga4.active && (
                <Button size="sm" variant="outline" onClick={testGA4Tracking}>
                  Testar
                </Button>
              )}
            </div>
          </div>

          {/* Meta Pixel */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon active={status.metaPixel.active} />
              <div>
                <p className="font-medium">Meta Pixel (Facebook)</p>
                <p className="text-sm text-muted-foreground">ID: {status.metaPixel.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={status.metaPixel.loaded ? "default" : "destructive"}>
                {status.metaPixel.loaded ? "Carregado" : "Não Carregado"}
              </Badge>
              {status.metaPixel.active && (
                <Button size="sm" variant="outline" onClick={testMetaPixelTracking}>
                  Testar
                </Button>
              )}
            </div>
          </div>

          {/* Google Tag Manager */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon active={status.gtm.active} />
              <div>
                <p className="font-medium">Google Tag Manager</p>
                <p className="text-sm text-muted-foreground">ID: {status.gtm.id}</p>
              </div>
            </div>
            <Badge variant={status.gtm.loaded ? "default" : "destructive"}>
              {status.gtm.loaded ? "Carregado" : "Não Carregado"}
            </Badge>
          </div>

          {/* Scripts Debug */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <p className="font-medium mb-2">Scripts Injetados ({status.scripts.count})</p>
            <div className="flex flex-wrap gap-1">
              {status.scripts.details.map((script, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {script}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={checkAnalyticsStatus} className="w-full" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDebugger;