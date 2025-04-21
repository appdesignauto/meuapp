import { useQuery } from '@tanstack/react-query';

interface SiteSettings {
  id: number;
  logoUrl: string;
  faviconUrl: string;
  siteName: string;
  primaryColor: string;
  footerText: string;
  metaDescription: string;
  contactEmail: string;
}

export function useSiteSettings() {
  const { 
    data: settings,
    isLoading,
    error
  } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });

  return {
    settings,
    isLoading,
    error
  };
}