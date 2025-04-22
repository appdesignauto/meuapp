import React from 'react';
import { useSiteSettings } from '@/hooks/use-site-settings';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-lg mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}