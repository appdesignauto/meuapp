import slugify from 'slugify';

/**
 * Gera um slug SEO-friendly a partir de um texto
 * @param text Texto para converter em slug
 * @returns Slug em formato URL-friendly
 */
export const createSlug = (text: string): string => {
  return slugify(text, {
    lower: true,       // Converter para minúsculas
    strict: true,      // Remover caracteres especiais
    locale: 'pt',      // Usar locale português para acentos
    trim: true         // Remover espaços extras no início e fim
  });
};

/**
 * Gera um título otimizado para SEO
 * @param title Título principal
 * @param category Categoria (opcional)
 * @param suffix Sufixo como nome do site (opcional)
 * @returns Título formatado para SEO
 */
export const formatSeoTitle = (
  title: string, 
  category?: string,
  suffix: string = 'DesignAuto'
): string => {
  if (category) {
    return `${title} | ${category} | ${suffix}`;
  }
  return `${title} | ${suffix}`;
};

/**
 * Gera uma descrição meta otimizada para SEO
 * @param title Título da arte
 * @param category Categoria da arte
 * @param format Formato da arte (Stories, Feed, etc)
 * @param fileType Tipo de arquivo (Canva, Photoshop, etc)
 * @returns Descrição formatada para SEO
 */
export const generateMetaDescription = (
  title: string,
  category?: string,
  format?: string,
  fileType?: string
): string => {
  let description = `Confira este modelo de ${title}`;
  
  if (category) {
    description += ` na categoria ${category}`;
  }
  
  if (format) {
    description += ` em formato ${format}`;
  }
  
  if (fileType) {
    description += ` para edição no ${fileType}`;
  }
  
  description += `. Baixe agora no DesignAuto e personalize para seu negócio automotivo.`;
  
  return description;
};

/**
 * Gera um objeto de dados estruturados para uma arte
 * @param art Objeto da arte
 * @param url URL canônica da página
 * @returns Objeto JSON-LD
 */
export const generateArtSchemaMarkup = (art: any, url: string): Record<string, any> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: art.title,
    description: art.description || generateMetaDescription(art.title, art.category?.name, art.format, art.fileType),
    contentUrl: art.imageUrl,
    thumbnailUrl: art.imageUrl,
    datePublished: art.createdAt || new Date().toISOString(),
    uploadDate: art.createdAt || new Date().toISOString(),
    url: url,
    ...(art.designer && {
      creator: {
        '@type': 'Person',
        name: art.designer?.name || 'DesignAuto'
      }
    }),
    ...(art.category && {
      keywords: `${art.category?.name || ''}, design automotivo, ${art.format || ''}, ${art.fileType || ''}`.trim(),
    })
  };
};

/**
 * Gera URL canônica com base na categoria e slug da arte
 * @param categorySlug slug da categoria
 * @param artSlug slug da arte
 * @returns URL canônica completa
 */
export const generateCanonicalUrl = (
  categorySlug: string,
  artSlug: string,
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): string => {
  return `${baseUrl}/artes/${categorySlug}/${artSlug}`;
};