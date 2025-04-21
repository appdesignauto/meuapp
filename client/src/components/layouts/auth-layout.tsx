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
    <div className="flex min-h-screen flex-col">
      <div className="container flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
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
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/10 to-zinc-900/60" />
            <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundImage: 'url(/images/auth-background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25 }} />
          </div>
          <div className="relative z-20 flex items-center text-lg font-medium">
            <img
              src="/images/logos/logo_white.png"
              alt="DesignAuto"
              className="h-12 mr-2"
            />
            {siteSettings?.siteName || 'DesignAuto'}
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                Mais de 3.000 artes automotivas editáveis para impulsionar seu negócio. 
                Personalize facilmente e destaque sua empresa no mercado.
              </p>
              <footer className="text-sm">Design Auto - Sua Solução em Artes Automotivas</footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}