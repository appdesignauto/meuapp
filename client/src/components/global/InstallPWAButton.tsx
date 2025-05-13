import { DownloadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Botão para instalação do PWA
 * Este componente exibe um botão para instalar o aplicativo como PWA
 * Este botão está inicialmente escondido e só será exibido quando 
 * o evento beforeinstallprompt for disparado pelo script install-pwa.js
 */
export function InstallPWAButton() {
  const handleInstallClick = () => {
    // Esta função está declarada no arquivo public/js/install-pwa.js
    if (typeof window !== 'undefined' && 'installPWA' in window) {
      // Chamamos a função global de instalação
      (window as any).installPWA();
    }
  };
  
  // O botão é inicialmente escondido e só será exibido pelo script quando o PWA for instalável
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            id="pwa-install-btn"
            variant="outline" 
            size="sm" 
            onClick={handleInstallClick}
            className="relative flex items-center gap-1 px-3 hidden"
            style={{ display: 'none' }} // Escondido inicialmente
          >
            <DownloadCloud className="h-4 w-4" />
            <span className="text-xs">Instalar App</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Instalar DesignAuto como aplicativo</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}