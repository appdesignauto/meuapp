import React from 'react';
import { Link } from 'wouter';
import { useSiteSettings } from '@/hooks/use-site-settings';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { isLoading, settings } = useSiteSettings();
  
  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Formulário - Lado esquerdo */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/">
              <a className="inline-block">
                {isLoading ? (
                  <div className="h-10 w-36 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <img 
                    src={settings?.logoUrl || '/placeholder-logo.png'} 
                    alt="Design Auto Logo" 
                    className="h-10 inline-block"
                  />
                )}
              </a>
            </Link>
          </div>
          
          {/* Formulário */}
          {children}
        </div>
      </div>
      
      {/* Hero section - Lado direito */}
      <div className="hidden md:flex md:w-1/2 bg-primary-50 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">
            Design Auto
          </h1>
          <p className="text-gray-700 mb-6">
            Tenha acesso a mais de 3.000 artes editáveis para personalizar e utilizar em sua loja ou oficina automotiva.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700 text-left">
                Mais de 3.000 artes para diversos segmentos automotivos
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700 text-left">
                Artes editáveis com Canva, totalmente personalizáveis
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700 text-left">
                Diversos formatos para redes sociais e mídias impressas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}