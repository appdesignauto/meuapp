import React from 'react';
import { Link } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export interface BreadcrumbItem {
  label: string;
  url: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  homeLabel?: string;
  homeUrl?: string;
  className?: string;
}

/**
 * Componente Breadcrumbs para navegação estruturada com suporte a dados estruturados JSON-LD para SEO
 * 
 * Este componente mostra uma trilha de navegação e adiciona dados estruturados
 * que ajudam os motores de busca a entender a estrutura do site.
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  homeLabel = 'Início',
  homeUrl = '/',
  className = '',
}) => {
  // Sempre inicia com a página inicial
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: homeLabel, url: homeUrl },
    ...items,
  ];

  // Gerar dados estruturados JSON-LD para os breadcrumbs
  const generateBreadcrumbSchema = () => {
    // Função segura para URLs que funciona tanto no cliente quanto no servidor
    const getFullUrl = (path: string) => {
      // Se o path já for uma URL completa, retorne-a
      if (path.startsWith('http')) return path;
      
      // Use o origin do window se disponível, ou um fallback seguro
      const origin = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://designauto.com.br';
      
      // Combine origin com path para formar URL completa
      return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
    };
    
    // Estrutura base do schema
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@id': getFullUrl(item.url),
          'name': item.label
        }
      }))
    };

    return schema;
  };

  return (
    <>
      {/* Dados estruturados JSON-LD para SEO */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(generateBreadcrumbSchema())}
        </script>
      </Helmet>

      {/* Componente visível de breadcrumbs */}
      <nav aria-label="Breadcrumb" className={`flex items-center text-sm py-2 ${className}`}>
        <ol className="flex items-center flex-wrap">
          {breadcrumbItems.map((item, idx) => (
            <li key={idx} className="flex items-center">
              {idx > 0 && (
                <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
              )}
              
              {idx === 0 && (
                <Home className="mr-1 h-4 w-4" />
              )}
              
              {item.isCurrentPage ? (
                <span className="font-medium text-primary" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.url}
                  className="text-gray-600 hover:text-primary hover:underline transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;