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
  language?: string; // Idioma da página (padrão: pt-BR)
  alternateUrls?: { [lang: string]: string }; // URLs alternativas para diferentes idiomas
  publishedAt?: string; // Data de publicação (para artigos)
  modifiedAt?: string; // Data de modificação (para artigos)
  keywords?: string[]; // Palavras-chave para meta tags
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  image,
  type = 'website',
  schemaMarkup,
  children,
  language = 'pt-BR',
  alternateUrls,
  publishedAt,
  modifiedAt,
  keywords,
}) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '');
  const imageUrl = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : undefined;
  
  return (
    <Helmet>
      {/* Título base e descrição */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* URLs canônicas e alternativas */}
      <link rel="canonical" href={url} />
      
      {/* Tags de idioma para SEO internacional */}
      <html lang={language.split('-')[0]} />
      <meta property="og:locale" content={language} />
      <link rel="alternate" hrefLang={language} href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />
      
      {/* Adiciona URLs alternativas para outros idiomas, se fornecidas */}
      {alternateUrls && Object.entries(alternateUrls).map(([lang, langUrl]) => (
        <React.Fragment key={lang}>
          <link rel="alternate" hrefLang={lang} href={langUrl} />
          <meta property="og:locale:alternate" content={lang} />
        </React.Fragment>
      ))}
      
      {/* Meta tags para artigos */}
      {type === 'article' && publishedAt && (
        <>
          <meta property="article:published_time" content={publishedAt} />
          {modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}
        </>
      )}
      
      {/* Meta tags para palavras-chave */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Tags Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Design Auto" />
      {imageUrl && (
        <>
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:secure_url" content={imageUrl.replace('http:', 'https:')} />
          <meta property="og:image:alt" content={title} />
        </>
      )}
      
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