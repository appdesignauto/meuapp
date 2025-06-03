import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { cacheManager } from "@/lib/cacheManager";

export function CacheIssueHandler() {
  const [showCacheAlert, setShowCacheAlert] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    // Verificar problemas de cache após um pequeno delay para permitir inicialização
    const checkTimer = setTimeout(() => {
      if (cacheManager.detectCacheIssues()) {
        setShowCacheAlert(true);
      }
    }, 2000);

    return () => clearTimeout(checkTimer);
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await cacheManager.clearAllCaches();
      cacheManager.forceRefreshMode();
      setCacheCleared(true);
      setShowCacheAlert(false);
      
      // Recarregar a página após limpar o cache
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDismiss = () => {
    setShowCacheAlert(false);
    // Não mostrar novamente nesta sessão
    sessionStorage.setItem('cache_alert_dismissed', 'true');
  };

  // Não mostrar se já foi dispensado nesta sessão
  if (sessionStorage.getItem('cache_alert_dismissed')) {
    return null;
  }

  if (cacheCleared) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            Cache limpo com sucesso. Recarregando...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!showCacheAlert) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-sm text-yellow-800 space-y-3">
          <p>
            Problema de cache detectado. Isso pode causar funcionamento incorreto do site.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleClearCache}
              disabled={isClearing}
              className="flex items-center gap-1"
            >
              {isClearing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {isClearing ? 'Limpando...' : 'Limpar Cache'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDismiss}
            >
              Dispensar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}