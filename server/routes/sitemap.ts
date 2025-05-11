import express from 'express';
import { storage } from '../storage';
import slugify from 'slugify';
import { db } from '../db';
import { categories } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Função auxiliar para criar slugs consistentes
const createSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'pt',
    trim: true
  });
};

/**
 * Gera e serve o sitemap.xml dinâmico com todas as páginas e artes
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // URL base do site
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Data atual formatada para o padrão de sitemap
    const now = new Date().toISOString();
    
    // Iniciar o XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Adicionar páginas principais
    const mainPages = [
      '/',
      '/categorias',
      '/designers',
      '/planos',
      '/videoaulas',
      '/ferramentas',
      '/suporte',
      '/login',
    ];
    
    // Adicionar páginas principais
    mainPages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // Buscar todas as categorias
    const categoriesList = await db.select().from(categories);
    
    // Adicionar páginas de categorias
    categoriesList.forEach(category => {
      const categorySlug = category.slug || createSlug(category.name);
      
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/categorias/${categorySlug}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // Buscar todas as artes
    const arts = await storage.getAllArtsForSitemap();
    
    // Adicionar artes com a nova estrutura de URL /artes/categoria-slug/arte-slug
    arts.forEach(art => {
      if (!art.isVisible) return; // Pular artes não visíveis
      
      const artSlug = createSlug(art.title);
      const categorySlug = art.category?.slug || createSlug(art.category?.name || 'sem-categoria');
      
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/artes/${categorySlug}/${artSlug}</loc>\n`;
      xml += `    <lastmod>${new Date(art.updatedAt || art.createdAt).toISOString()}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
      
      // Manter a URL antiga por compatibilidade
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/artes/${art.id}</loc>\n`;
      xml += `    <lastmod>${new Date(art.updatedAt || art.createdAt).toISOString()}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.5</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // Finalizar o XML
    xml += '</urlset>';
    
    // Configurar cabeçalhos e enviar resposta
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
});

/**
 * Gera e serve o robots.txt
 */
router.get('/robots.txt', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const robotsTxt = `User-agent: *
Allow: /
Allow: /artes/
Allow: /categorias/
Allow: /designers/
Allow: /planos/
Allow: /videoaulas/
Allow: /ferramentas/
Allow: /suporte/

Disallow: /painel/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/reset-password
Disallow: /auth/verificar-email

Sitemap: ${baseUrl}/sitemap.xml
`;
  
  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

export default router;