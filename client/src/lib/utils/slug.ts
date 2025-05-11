import slugify from 'slugify';

/**
 * Cria um slug amigável para SEO a partir de um texto
 * 
 * @param text O texto a ser convertido em slug
 * @returns O slug formatado
 */
export function createSlug(text: string): string {
  return slugify(text, {
    lower: true,           // Converte para minúsculas
    strict: true,          // Remove caracteres especiais
    locale: 'pt',          // Tratamento específico para português
    trim: true,            // Remove espaços no início e fim
    remove: /[*+~.()\[\]'"!:@]/g, // Remove caracteres problemáticos adicionais
  });
}

/**
 * Cria uma URL amigável para SEO combinando ID e título
 * 
 * @param id O ID do recurso
 * @param title O título do recurso
 * @returns A URL formatada como "id-slug"
 */
export function createSeoUrl(id: number | string, title: string): string {
  return `${id}-${createSlug(title)}`;
}

/**
 * Extrai o ID de uma URL amigável para SEO
 * 
 * @param seoUrl A URL no formato "id-slug"
 * @returns O ID extraído da URL
 */
export function extractIdFromSeoUrl(seoUrl: string): string {
  // Pega apenas o número antes do primeiro hífen
  const idMatch = seoUrl.match(/^(\d+)/);
  return idMatch ? idMatch[1] : seoUrl;
}