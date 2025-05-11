import { Router } from 'express';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { pipeline } from 'stream/promises';

const router = Router();

// Constantes do proxy
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dcodfuzoxmddmpvowhap.supabase.co';
const SUPABASE_STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public`;
const CACHE_DIR = path.join('.', 'temp', 'image-cache');

// Garantir que o diretório de cache exista
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Sanitiza o caminho para evitar path traversal
 */
function sanitizePath(urlPath: string): string {
  // Remover caracteres perigosos e normalizar
  const sanitized = urlPath
    .replace(/\.\./g, '') // Remover '../' para evitar directory traversal
    .replace(/[^\w\s\-._/]/gi, '') // Manter apenas caracteres alfanuméricos, espaços, traços, pontos e barras
    .trim();
  
  return sanitized;
}

/**
 * Cria um nome de arquivo de cache único baseado na URL
 */
function createCacheFilename(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const ext = path.extname(url) || '.webp'; // Default para webp se não houver extensão
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
    // Extrair o caminho relativo da URL da solicitação
    const relativePath = sanitizePath(req.path.replace('/imgs/', ''));
    
    // Construir o URL completo do Supabase
    const supabaseImageUrl = `${SUPABASE_STORAGE_URL}/${relativePath}`;
    
    // Criar nome de arquivo para armazenamento em cache
    const cacheFilename = createCacheFilename(supabaseImageUrl);
    const cachePath = path.join(CACHE_DIR, cacheFilename);
    
    // Verificar se a imagem já está em cache
    if (fs.existsSync(cachePath)) {
      // Log para debug
      console.log(`[Image Proxy] Servindo imagem do cache: ${req.path}`);
      
      // Definir tipo de conteúdo com base na extensão
      const ext = path.extname(relativePath).toLowerCase();
      const contentType = 
        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
        ext === '.png' ? 'image/png' :
        ext === '.webp' ? 'image/webp' :
        ext === '.gif' ? 'image/gif' :
        ext === '.svg' ? 'image/svg+xml' :
        'application/octet-stream';
      
      // Servir do cache
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24h
      return fs.createReadStream(cachePath).pipe(res);
    }
    
    // Se não estiver em cache, buscar do Supabase
    console.log(`[Image Proxy] Buscando imagem do Supabase: ${relativePath}`);
    
    const response = await fetch(supabaseImageUrl);
    
    // Verificar se a resposta do Supabase foi bem-sucedida
    if (!response.ok) {
      console.error(`[Image Proxy] Erro ao buscar imagem do Supabase: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(response.statusText);
    }
    
    // Definir o tipo de conteúdo com base na resposta
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24h
    
    // Criar um arquivo temporário para o download
    const tempPath = `${cachePath}.download`;
    const writeStream = fs.createWriteStream(tempPath);
    
    try {
      // Baixar a imagem para o arquivo temporário e simultaneamente enviar para o cliente
      if (response.body) {
        // Criar um fluxo duplicado para salvar no cache e enviar ao cliente
        const responseBody = response.body as any; // Uso 'any' devido a tipos incompatíveis com node-fetch/stream
        
        // Usar pipeline para gerenciar streams
        await pipeline(responseBody, writeStream);
        
        // Após o download completo, renomear o arquivo temporário para o cache final
        fs.renameSync(tempPath, cachePath);
        
        // Enviar o arquivo para o cliente
        fs.createReadStream(cachePath).pipe(res);
      } else {
        throw new Error('Resposta vazia do Supabase');
      }
    } catch (error) {
      console.error(`[Image Proxy] Erro ao processar imagem: ${error}`);
      
      // Limpar arquivo temporário em caso de erro
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      
      res.status(500).send('Erro ao processar imagem');
    }
  } catch (error) {
    console.error(`[Image Proxy] Erro no proxy de imagem: ${error}`);
    res.status(500).send('Erro no servidor de imagens');
  }
});

export default router;