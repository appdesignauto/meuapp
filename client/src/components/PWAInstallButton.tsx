import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] Install prompt disponível');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App instalado com sucesso');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalling(false);
    };

    // Verificar se já está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstallable(false);
        return;
      }
      
      // Verificar se é iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = (window.navigator as any).standalone;
      
      if (isIOS && isInStandaloneMode) {
        setIsInstallable(false);
      }
    };

    checkIfInstalled();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Usuário aceitou a instalação');
      } else {
        console.log('[PWA] Usuário recusou a instalação');
      }
    } catch (error) {
      console.error('[PWA] Erro durante instalação:', error);
    } finally {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalling(false);
    }
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      disabled={isInstalling}
      variant="outline"
      size="sm"
      className="hidden md:flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200"
    >
      {isInstalling ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          Instalando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Instalar App
        </>
      )}
    </Button>
  );
}

// Componente para dispositivos móveis (fica no footer ou flutuante)
export function PWAInstallButtonMobile() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Mostrar banner apenas após alguma interação do usuário
      setTimeout(() => setShowBanner(true), 3000);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalling(false);
      setShowBanner(false);
    };

    // Verificar se já está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstallable(false);
        return;
      }
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = (window.navigator as any).standalone;
      
      if (isIOS && isInStandaloneMode) {
        setIsInstallable(false);
      }
    };

    checkIfInstalled();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Usuário aceitou a instalação');
      }
    } catch (error) {
      console.error('[PWA] Erro durante instalação:', error);
    } finally {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalling(false);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!isInstallable || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Instalar DesignAuto</p>
            <p className="text-xs text-gray-600">Acesso rápido às suas artes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-gray-500 text-xs"
          >
            Agora não
          </Button>
          <Button
            onClick={handleInstallClick}
            disabled={isInstalling}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            {isInstalling ? (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
            ) : (
              'Instalar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}