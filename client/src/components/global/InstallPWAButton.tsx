import { useState, useEffect } from 'react';
import { DownloadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isRunningAsPWA } from '@/lib/pwa-utils';

/**
 * Botão para instalação do PWA
 * Este componente exibe um botão para instalar o aplicativo como PWA
 * O botão só é exibido quando o aplicativo não está sendo executado como PWA
 * e há um evento "beforeinstallprompt" disponível
 */
export function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Verifica se o app já está instalado como PWA
  useEffect(() => {
    const checkIfPWA = () => {
      const isPWA = isRunningAsPWA();
      setIsInstalled(isPWA);
    };
    
    checkIfPWA();
    window.addEventListener('appinstalled', checkIfPWA);
    
    return () => {
      window.removeEventListener('appinstalled', checkIfPWA);
    };
  }, []);
  
  // Captura o evento beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne que o navegador mostre o prompt automaticamente
      e.preventDefault();
      
      // Armazena o evento para uso posterior
      setInstallPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Função para instalar o PWA quando o botão é clicado
  const handleInstallClick = () => {
    if (!installPrompt) return;
    
    // Mostrar o prompt de instalação
    installPrompt.prompt();
    
    // Esperar pela escolha do usuário
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA');
        setIsInstalled(true);
      } else {
        console.log('Usuário recusou instalar o PWA');
      }
      
      // Limpa o prompt armazenado, já que só pode ser usado uma vez
      setInstallPrompt(null);
    });
  };
  
  // Não renderiza nada se o app já estiver instalado ou não tiver o prompt disponível
  if (isInstalled || !installPrompt) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleInstallClick}
            className="relative"
          >
            <DownloadCloud className="h-5 w-5" />
            <span className="sr-only">Instalar aplicativo</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Instalar DesignAuto</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}