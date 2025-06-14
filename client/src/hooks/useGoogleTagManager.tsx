import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface GTMSettings {
  gtmId: string;
  ga4Id: string;
  gtmEnabled: boolean;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    GTMTracker: {
      trackFormSubmit: (data: any) => void;
      trackButtonClick: (data: any) => void;
      trackPageView: (data: any) => void;
      trackConversion: (data: any) => void;
      trackArtDownload: (data: any) => void;
      trackCustomEvent: (name: string, data: any) => void;
      trackException: (data: any) => void;
      setUserData: (data: any) => void;
      debugDataLayer: () => any[];
    };
  }
}

export const useGoogleTagManager = () => {
  const { data: settings } = useQuery<GTMSettings>({
    queryKey: ['/api/analytics/settings']
  });

  useEffect(() => {
    if (!settings?.gtmEnabled || !settings.gtmId) {
      console.log('GTM não configurado ou desabilitado');
      return;
    }

    // Verificar se o script GTM já foi carregado
    const existingScript = document.querySelector(`script[src*="gtm-config.js"]`);
    if (existingScript && window.GTMTracker) {
      console.log('GTM já carregado via gtm-config.js');
      return;
    }

    // Carregar o arquivo de configuração GTM se não estiver carregado
    const configScript = document.createElement('script');
    configScript.src = '/js/gtm/gtm-config.js';
    configScript.async = true;
    document.head.appendChild(configScript);

    console.log('Carregando configuração GTM:', settings.gtmId);
  }, [settings]);

  // Funções de rastreamento usando GTMTracker
  const trackEvent = (eventName: string, parameters: Record<string, any>) => {
    if (window.GTMTracker) {
      window.GTMTracker.trackCustomEvent(eventName, parameters);
    } else if (window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  };

  const trackPageView = (pagePath: string, pageTitle?: string) => {
    if (window.GTMTracker) {
      window.GTMTracker.trackPageView({
        title: pageTitle || document.title,
        url: pagePath,
        category: 'page'
      });
    } else if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle || document.title
      });
    }
  };

  const trackFormSubmit = (formName: string, formData: Record<string, any>) => {
    if (window.GTMTracker) {
      window.GTMTracker.trackFormSubmit({
        formName,
        ...formData
      });
    } else if (window.gtag) {
      window.gtag('event', 'form_submit', {
        form_name: formName,
        ...formData
      });
    }
  };

  const trackArtDownload = (artData: {
    id: string;
    title?: string;
    category?: string;
    format?: string;
    userType?: string;
  }) => {
    if (window.GTMTracker) {
      window.GTMTracker.trackArtDownload(artData);
    } else if (window.gtag) {
      window.gtag('event', 'art_download', artData);
    }
  };

  const trackArtView = (artData: {
    id: string;
    title?: string;
    category?: string;
    value?: number;
  }) => {
    trackEvent('art_view', artData);
  };

  const trackButtonClick = (buttonData: Record<string, any>) => {
    if (window.GTMTracker) {
      window.GTMTracker.trackButtonClick(buttonData);
    } else if (window.gtag) {
      window.gtag('event', 'button_click', buttonData);
    }
  };

  const trackConversion = (conversionData: {
    type?: string;
    value?: number;
    transaction_id?: string;
    currency?: string;
    [key: string]: any;
  }) => {
    if (window.GTMTracker) {
      window.GTMTracker.trackConversion(conversionData);
    } else if (window.gtag) {
      window.gtag('event', 'conversion', conversionData);
    }
  };

  const setUserData = (userData: Record<string, any>) => {
    if (window.GTMTracker) {
      window.GTMTracker.setUserData(userData);
    }
  };

  const push = (data: any) => {
    if (window.dataLayer) {
      window.dataLayer.push(data);
    }
  };

  const isActive = () => {
    return settings?.gtmEnabled && !!settings?.gtmId && !!window.GTMTracker;
  };

  return {
    isEnabled: settings?.gtmEnabled && !!settings?.gtmId,
    trackEvent,
    trackPageView,
    trackFormSubmit,
    trackArtDownload,
    trackArtView,
    trackButtonClick,
    trackConversion,
    setUserData,
    push,
    isActive
  };
};

export default useGoogleTagManager;