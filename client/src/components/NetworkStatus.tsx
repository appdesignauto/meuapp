import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { performanceMonitor } from "@/lib/performanceMonitor";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [connectionIssues, setConnectionIssues] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Esconder após 3 segundos
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    // Verificar saúde da conexão a cada 30 segundos
    const healthCheck = setInterval(() => {
      const healthy = performanceMonitor.checkConnectionHealth();
      if (!healthy && isOnline) {
        setConnectionIssues(true);
        setShowStatus(true);
        setTimeout(() => {
          setConnectionIssues(false);
          setShowStatus(false);
        }, 5000);
      }
    }, 30000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheck);
    };
  }, [isOnline]);

  if (!showStatus) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Alert className="border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-sm text-red-800">
            Sem conexão com a internet. Algumas funcionalidades podem não funcionar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (connectionIssues) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-800">
            Conexão lenta detectada. Recarregue a página se os problemas persistirem.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-green-200 bg-green-50">
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-800">
          Conexão restaurada
        </AlertDescription>
      </Alert>
    </div>
  );
}