import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGA4 } from '@/hooks/useAnalytics';

const PageViewTracker = () => {
  const [location] = useLocation();
  const { trackPageView } = useGA4();

  useEffect(() => {
    // Track page view on route change for both GA4 and Meta Pixel
    setTimeout(() => {
      // GA4 tracking
      trackPageView(location);
      
      // Meta Pixel tracking
      if ((window as any).DesignAutoMetaPixel?.trackPageView) {
        (window as any).DesignAutoMetaPixel.trackPageView();
      }

      console.log('📊 Page view tracked:', location);
    }, 100); // Small delay to ensure scripts are loaded
  }, [location, trackPageView]);

  return null; // This component doesn't render anything
};

export default PageViewTracker;