import React from 'react';
import { Link } from 'wouter';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { Loader2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { data: siteSettings, isLoading } = useSiteSettings();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="flex flex-col space-y-2 text-center">
          <Link href="/" className="mx-auto mb-6">
            {isLoading ? (
              <div className="h-16 w-16 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <img
                src={siteSettings?.logoUrl || '/images/logos/logo_default.png'}
                alt={siteSettings?.siteName || 'DesignAuto'}
                className="h-16 object-contain"
              />
            )}
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}