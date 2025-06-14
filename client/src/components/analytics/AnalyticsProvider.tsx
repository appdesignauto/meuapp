import React, { useEffect } from 'react';
import { useAnalyticsConfig, useGA4 } from '@/hooks/useAnalytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { data: analyticsConfig, isLoading } = useAnalyticsConfig();
  
  // Inicializar GA4 quando as configurações estiverem disponíveis
  const ga4Initialized = useGA4(analyticsConfig?.gaId);

  useEffect(() => {
    if (analyticsConfig?.gaId && ga4Initialized) {
      console.log('✅ GA4 Analytics ativo:', analyticsConfig.gaId);
    }
  }, [analyticsConfig?.gaId, ga4Initialized]);

  return <>{children}</>;
};