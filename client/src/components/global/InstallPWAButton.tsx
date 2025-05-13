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

// Declaração para estender a interface Window
declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

/**
 * Botão para instalação do PWA
 * Este componente exibe um botão para instalar o aplicativo como PWA
 * O botão só é exibido quando o aplicativo não está sendo executado como PWA
 * e há um evento "beforeinstallprompt" disponível
 */
export function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  
  // Debug: verificar instalação PWA e prompt disponível
  useEffect(() => {
    console.log("InstallPWA Debug:", {
      isInstalled,
      hasPrompt: !!installPrompt,
      windowPrompt: !!window.deferredPrompt,
      isRunningAsPWA: isRunningAsPWA(),
      showManualInstructions
    });
  }, [isInstalled, installPrompt, showManualInstructions]);
  
  // Verifica se o app já está instalado como PWA
  useEffect(() => {
    const checkIfPWA = () => {
      const isPWA = isRunningAsPWA();
      setIsInstalled(isPWA);
    };
    
    // Verifica assim que o componente é montado
    checkIfPWA();
    
    // Verifica novamente quando a visibilidade da página muda
    // (útil quando o usuário volta de outra aba após instalar o PWA)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Visibilidade mudou para visível, verificando PWA novamente');
        checkIfPWA();
      }
    };
    
    // Escuta eventos relevantes
    window.addEventListener('appinstalled', checkIfPWA);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Verificar a cada 3 segundos também (para casos de iOS e outros)
    const intervalId = setInterval(checkIfPWA, 3000);
    
    return () => {
      window.removeEventListener('appinstalled', checkIfPWA);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);
  
  // Captura o evento beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne que o navegador mostre o prompt automaticamente
      e.preventDefault();
      
      // Log para debug
      console.log('Evento beforeinstallprompt capturado!', e);
      
      // Armazena o evento para uso posterior
      setInstallPrompt(e);
      
      // Garantimos que o usuário vê o botão normal, não o manual
      setShowManualInstructions(false);
    };
    
    // Log para confirmar que o listener foi configurado
    console.log('Configurando listener para beforeinstallprompt...');
    
    // Resolvendo o problema do evento não ser capturado em algumas situações
    // ao adicionar o listener com captura
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { capture: true });
    
    // Se já houver um evento armazenado no deferredPrompt
    if (window.deferredPrompt) {
      console.log('Encontrado deferredPrompt existente!', window.deferredPrompt);
      setInstallPrompt(window.deferredPrompt);
    }
    
    // Se depois de um tempo não tivermos o prompt e não estamos rodando como PWA,
    // exibimos instruções manuais
    const timeoutId = setTimeout(() => {
      if (!installPrompt && !isRunningAsPWA()) {
        console.log('Sem prompt após timeout, mostrando instruções manuais');
        setShowManualInstructions(true);
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { capture: true });
      clearTimeout(timeoutId);
    };
  }, [installPrompt]);
  
  // Função para instalar o PWA quando o botão é clicado
  const handleInstallClick = () => {
    // Se temos o prompt, usamos a instalação padrão
    if (installPrompt) {
      console.log('Usando evento beforeinstallprompt armazenado');
      
      // Mostrar o prompt de instalação
      installPrompt.prompt();
      
      // Esperar pela escolha do usuário
      installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuário aceitou instalar o PWA');
          setIsInstalled(true);
        } else {
          console.log('Usuário recusou instalar o PWA');
          // Se o usuário recusou, podemos mostrar instruções manuais
          setShowManualInstructions(true);
        }
        
        // Limpa o prompt armazenado, já que só pode ser usado uma vez
        setInstallPrompt(null);
        // Limpa também a variável global
        window.deferredPrompt = null;
      });
    } else {
      // Ativamos o modo de instruções manuais
      console.log('Sem evento beforeinstallprompt disponível, mostrando instruções manuais');
      setShowManualInstructions(true);
    }
  };
  
  // Função para detectar o navegador e gerar instruções específicas
  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return 'Clique nos três pontos no canto superior direito e depois em "Instalar DesignAuto"';
    } else if (userAgent.includes('firefox')) {
      return 'Clique no ícone de casa no canto superior direito da barra de endereço';
    } else if (userAgent.includes('safari') && /iphone|ipad|ipod/.test(userAgent)) {
      return 'Toque no ícone de compartilhamento e depois em "Adicionar à Tela de Início"';
    } else if (userAgent.includes('edge')) {
      return 'Clique nos três pontos no canto superior direito e depois em "Aplicativos" > "Instalar este site como aplicativo"';
    } else {
      return 'Verifique as opções do seu navegador para adicionar aplicativos à tela inicial';
    }
  };
  
  // Se o app já estiver instalado, não exibimos o botão
  if (isInstalled) {
    return null;
  }
  
  // Se estamos no modo de instruções manuais
  if (showManualInstructions) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowManualInstructions(false)}
              className="relative flex items-center gap-1 px-3 animated-background"
            >
              <DownloadCloud className="h-4 w-4" />
              <span className="text-xs">Instalar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="w-60 p-3">
            <p className="font-bold mb-2">Como instalar o DesignAuto:</p>
            <p className="text-sm">{getBrowserInstructions()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Botão padrão para quando temos o prompt
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
          <p>Instalar DesignAuto como aplicativo</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}