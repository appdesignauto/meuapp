import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  schemaMarkup?: Record<string, any>;
  children?: React.ReactNode;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  image,
  type = 'website',
  schemaMarkup,
  children,
}) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '');
  const imageUrl = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : undefined;
  
  return (
    <Helmet>
      {/* Título base e descrição */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* URLs canônicas e alternativas */}
      <link rel="canonical" href={url} />
      
      {/* Tags Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      
      {/* Dados estruturados JSON-LD */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
      
      {/* Outras tags e componentes filhos */}
      {children}
    </Helmet>
  );
};

export default SEO;