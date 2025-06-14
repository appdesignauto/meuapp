import { useEffect } from 'react';

interface GA4Props {
  trackPageView?: (pagePath?: string) => void;
  trackEvent?: (eventName: string, parameters?: Record<string, any>) => void;
  trackArtView?: (artData: any) => void;
  trackArtDownload?: (artData: any) => void;
  trackFormSubmit?: (formData: any) => void;
  trackPurchase?: (purchaseData: any) => void;
  isActive?: () => boolean;
}

declare global {
  interface Window {
    DesignAutoGA4: GA4Props;
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const useGA4 = () => {
  useEffect(() => {
    // Script já está carregado via HTML, apenas aguardar inicialização
    const checkGA4 = setInterval(() => {
      if (window.DesignAutoGA4) {
        clearInterval(checkGA4);
      }
    }, 100);

    return () => clearInterval(checkGA4);
  }, []);

  const trackPageView = (pagePath?: string) => {
    if (window.DesignAutoGA4?.trackPageView) {
      window.DesignAutoGA4.trackPageView(pagePath);
    }
  };

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (window.DesignAutoGA4?.trackEvent) {
      window.DesignAutoGA4.trackEvent(eventName, parameters);
    }
  };

  const trackArtView = (artData: {
    id: string;
    title?: string;
    category?: string;
    value?: number;
  }) => {
    if (window.DesignAutoGA4?.trackArtView) {
      window.DesignAutoGA4.trackArtView(artData);
    }
  };

  const trackArtDownload = (artData: {
    id: string;
    title?: string;
    category?: string;
    value?: number;
  }) => {
    if (window.DesignAutoGA4?.trackArtDownload) {
      window.DesignAutoGA4.trackArtDownload(artData);
    }
  };

  const trackFormSubmit = (formData: {
    form_name?: string;
    value?: number;
    [key: string]: any;
  }) => {
    if (window.DesignAutoGA4?.trackFormSubmit) {
      window.DesignAutoGA4.trackFormSubmit(formData);
    }
  };

  const trackPurchase = (purchaseData: {
    product_name?: string;
    value: number;
    transaction_id?: string;
  }) => {
    if (window.DesignAutoGA4?.trackPurchase) {
      window.DesignAutoGA4.trackPurchase(purchaseData);
    }
  };

  const isActive = () => {
    return window.DesignAutoGA4?.isActive?.() || false;
  };

  return {
    trackPageView,
    trackEvent,
    trackArtView,
    trackArtDownload,
    trackFormSubmit,
    trackPurchase,
    isActive
  };
};