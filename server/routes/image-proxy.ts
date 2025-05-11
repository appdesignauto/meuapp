import { Router } from 'express';
import fetch from 'node-fetch';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

// Configuração do proxy de imagem
const SUPABASE_DOMAIN = 'dcodfuzoxmddmpvowhap.supabase.co';
const CACHE_DIRECTORY = './public/cached-images';
const CACHE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias em segundos

// Garantir que o diretório de cache exista
if (!fs.existsSync(CACHE_DIRECTORY)) {
  fs.mkdirSync(CACHE_DIRECTORY, { recursive: true });
}

// Função para limpar o caminho da URL (segurança)
function sanitizePath(urlPath: string): string {
  // Remover parâmetros de consulta
  const pathOnly = urlPath.split('?')[0];
  
  // Remover possíveis ataques de traversal
  return path.normalize(pathOnly).replace(/^(\.\.(\/|\\|$))+/, '');
}

// Função para criar um nome de arquivo hash baseado na URL completa
function createCacheFilename(url: string): string {
  const hash = createHash('md5').update(url).digest('hex');
  const ext = path.extname(url).toLowerCase() || '.webp'; // Usar extensão da URL ou .webp como padrão
  return `${hash}${ext}`;
}

/**
 * Middleware para proxy de imagens do Supabase Storage
 * 
 * Este middleware intercepta solicitações de imagem e:
 * 1. Verifica se a imagem está em cache
 * 2. Se estiver em cache, serve do cache
 * 3. Se não estiver, baixa do Supabase, armazena em cache e serve
 */
router.get('/imgs/*', async (req, res) => {
  try {
    // Obter o caminho da imagem a partir da URL
    const imagePath = req.url.replace('/imgs/', '');
    
    // Construir a URL completa do Supabase
    const supabaseUrl = `https://${SUPABASE_DOMAIN}/storage/v1/object/public/${imagePath}`;
    
    // Criar nome de arquivo para cache
    const cacheFilename = createCacheFilename(supabaseUrl);
    const cachePath = path.join(CACHE_DIRECTORY, cacheFilename);
    
    // Verificar se a imagem já está em cache
    if (fs.existsSync(cachePath)) {
      // Verificar idade do cache
      const stats = fs.statSync(cachePath);
      const fileAge = (Date.now() - stats.mtimeMs) / 1000; // idade em segundos
      
      if (fileAge < CACHE_MAX_AGE) {
        // Cache válido, servir do cache
        console.log(`Servindo imagem do cache: ${cachePath}`);
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache no navegador por 1 dia
        res.setHeader('X-Cache', 'HIT');
        return fs.createReadStream(cachePath).pipe(res);
      }
    }
    
    // Cache inválido ou inexistente, buscar do Supabase
    console.log(`Buscando imagem do Supabase: ${supabaseUrl}`);
    const response = await fetch(supabaseUrl);
    
    if (!response.ok) {
      console.error(`Erro ao buscar imagem do Supabase: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(response.statusText);
    }
    
    // Obter o buffer da imagem
    const imageBuffer = await response.buffer();
    
    // Processar e otimizar a imagem com sharp
    const processedImage = await sharp(imageBuffer)
      .webp({ quality: 85 }) // Converter para WebP com qualidade 85
      .toBuffer();
    
    // Salvar no cache
    fs.writeFileSync(cachePath, processedImage);
    
    // Enviar a imagem processada como resposta
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache no navegador por 1 dia
    res.setHeader('X-Cache', 'MISS');
    res.send(processedImage);
    
  } catch (error) {
    console.error('Erro no proxy de imagem:', error);
    res.status(500).send('Erro ao processar a imagem');
  }
});

export default router;