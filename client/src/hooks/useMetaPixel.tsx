import { useEffect } from 'react';

interface MetaPixelProps {
  trackArtView?: (artData: any) => void;
  trackArtDownload?: (artData: any) => void;
  trackFormSubmit?: (formData: any) => void;
  trackPurchase?: (purchaseData: any) => void;
  trackSignUp?: (userData: any) => void;
  trackCustomEvent?: (eventName: string, data?: any) => void;
  isActive?: () => boolean;
}

declare global {
  interface Window {
    DesignAutoPixel: MetaPixelProps;
    fbq: any;
  }
}

export const useMetaPixel = () => {
  useEffect(() => {
    // Script já está carregado via HTML, apenas aguardar inicialização
    const checkPixel = setInterval(() => {
      if (window.DesignAutoPixel) {
        clearInterval(checkPixel);
      }
    }, 100);

    return () => clearInterval(checkPixel);
  }, []);

  const trackArtView = (artData: {
    id: string;
    title?: string;
    category?: string;
    value?: number;
  }) => {
    if (window.DesignAutoPixel?.trackArtView) {
      window.DesignAutoPixel.trackArtView(artData);
    }
  };

  const trackArtDownload = (artData: {
    id: string;
    title?: string;
    category?: string;
    value?: number;
  }) => {
    if (window.DesignAutoPixel?.trackArtDownload) {
      window.DesignAutoPixel.trackArtDownload(artData);
    }
  };

  const trackFormSubmit = (formData: {
    form_name?: string;
    value?: number;
    [key: string]: any;
  }) => {
    if (window.DesignAutoPixel?.trackFormSubmit) {
      window.DesignAutoPixel.trackFormSubmit(formData);
    }
  };

  const trackPurchase = (purchaseData: {
    product_name?: string;
    value: number;
    transaction_id?: string;
  }) => {
    if (window.DesignAutoPixel?.trackPurchase) {
      window.DesignAutoPixel.trackPurchase(purchaseData);
    }
  };

  const trackSignUp = (userData: {
    status?: string;
    method?: string;
  }) => {
    if (window.DesignAutoPixel?.trackSignUp) {
      window.DesignAutoPixel.trackSignUp(userData);
    }
  };

  const trackCustomEvent = (eventName: string, data?: any) => {
    if (window.DesignAutoPixel?.trackCustomEvent) {
      window.DesignAutoPixel.trackCustomEvent(eventName, data);
    }
  };

  const isActive = () => {
    return window.DesignAutoPixel?.isActive?.() || false;
  };

  return {
    trackArtView,
    trackArtDownload,
    trackFormSubmit,
    trackPurchase,
    trackSignUp,
    trackCustomEvent,
    isActive
  };
};

export default useMetaPixel;