import { useEffect } from 'react';

interface GTMProps {
  trackEvent?: (eventName: string, parameters?: any) => void;
  trackConversion?: (conversionData: any) => void;
  trackArtView?: (artData: any) => void;
  trackArtDownload?: (artData: any) => void;
  isActive?: () => boolean;
  push?: (data: any) => void;
}

declare global {
  interface Window {
    DesignAutoGTM: GTMProps;
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const useGoogleTagManager = () => {
  useEffect(() => {
    // Script já está carregado via HTML, apenas aguardar inicialização
    const checkGTM = setInterval(() => {
      if (window.DesignAutoGTM) {
        clearInterval(checkGTM);
      }
    }, 100);

    return () => clearInterval(checkGTM);
  }, []);

  const trackEvent = (eventName: string, parameters: any = {}) => {
    if (window.DesignAutoGTM?.trackEvent) {
      window.DesignAutoGTM.trackEvent(eventName, parameters);
    }
  };

  const trackConversion = (conversionData: {
    type?: string;
    value?: number;
    transaction_id?: string;
    [key: string]: any;
  }) => {
    if (window.DesignAutoGTM?.trackConversion) {
      window.DesignAutoGTM.trackConversion(conversionData);
    }
  };

  const trackArtView = (artData: {
    id: string;
    title?: string;
    category?: string;
    value?: number;
  }) => {
    if (window.DesignAutoGTM?.trackArtView) {
      window.DesignAutoGTM.trackArtView(artData);
    }
  };

  const trackArtDownload = (artData: {
    id: string;
    title?: string;
    category?: string;
    value?: number;
  }) => {
    if (window.DesignAutoGTM?.trackArtDownload) {
      window.DesignAutoGTM.trackArtDownload(artData);
    }
  };

  const push = (data: any) => {
    if (window.DesignAutoGTM?.push) {
      window.DesignAutoGTM.push(data);
    }
  };

  const isActive = () => {
    return window.DesignAutoGTM?.isActive?.() || false;
  };

  return {
    trackEvent,
    trackConversion,
    trackArtView,
    trackArtDownload,
    push,
    isActive
  };
};

export default useGoogleTagManager;