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
  return useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}