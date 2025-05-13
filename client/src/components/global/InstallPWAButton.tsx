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
  
  // Debug: verificar instalação PWA e prompt disponível
  useEffect(() => {
    console.log("InstallPWA Debug:", {
      isInstalled,
      hasPrompt: !!installPrompt,
      windowPrompt: !!window.deferredPrompt,
      isRunningAsPWA: isRunningAsPWA()
    });
  }, [isInstalled, installPrompt]);
  
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
      
      // Log para debug
      console.log('Evento beforeinstallprompt capturado!', e);
      
      // Armazena o evento para uso posterior
      setInstallPrompt(e);
    };
    
    // Log para confirmar que o listener foi configurado
    console.log('Configurando listener para beforeinstallprompt...');
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Se já houver um evento armazenado no deferredPrompt
    if (window.deferredPrompt) {
      console.log('Encontrado deferredPrompt existente!', window.deferredPrompt);
      setInstallPrompt(window.deferredPrompt);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
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
        }
        
        // Limpa o prompt armazenado, já que só pode ser usado uma vez
        setInstallPrompt(null);
      });
    } else {
      // Mostramos um toast ou indicação para o usuário sobre como instalar manualmente
      console.log('Sem evento beforeinstallprompt disponível');
      
      // Detecta o navegador para dar as instruções corretas
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (userAgent.includes('chrome')) {
        alert('Para instalar: Clique nos três pontos no canto superior direito e depois em "Instalar DesignAuto"');
      } else if (userAgent.includes('firefox')) {
        alert('Para instalar: Clique no ícone de casa no canto superior direito da barra de endereço');
      } else if (userAgent.includes('safari') && /iphone|ipad|ipod/.test(userAgent)) {
        alert('Para instalar: Toque no ícone de compartilhamento e depois em "Adicionar à Tela de Início"');
      } else {
        alert('Para instalar: Verifique as opções do seu navegador para adicionar aplicativos à tela inicial');
      }
    }
  };
  
  // Se o app já estiver instalado, não exibimos o botão
  if (isInstalled) {
    return null;
  }
  
  // Deixamos o botão visível mesmo sem o prompt, para fins de teste
  // Em produção, podemos ajustar isso depois
  
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