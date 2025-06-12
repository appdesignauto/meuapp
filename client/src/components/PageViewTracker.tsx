import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMetaPixel } from '@/hooks/useMetaPixel';

const PageViewTracker = () => {
  const [location] = useLocation();
  const { trackCustomEvent } = useMetaPixel();

  useEffect(() => {
    // Track page view on route change
    trackCustomEvent('PageView', {
      page: location,
      timestamp: new Date().toISOString()
    });
  }, [location, trackCustomEvent]);

  return null; // This component doesn't render anything
};

export default PageViewTracker;