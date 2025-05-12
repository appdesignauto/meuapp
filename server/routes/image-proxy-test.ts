/**
 * Rota de teste para o proxy de imagens
 * 
 * Esta rota verifica se as URLs das imagens estão sendo convertidas corretamente
 */

import { Router } from 'express';
import { db } from '../db';
import { arts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { convertImageUrls } from './image-url-proxy';

const router = Router();

/**
 * Utilitário para converter URLs manualmente para comparação
 */
function convertToProxyUrl(supabaseUrl: string | null): string | null {
  if (!supabaseUrl) return supabaseUrl;
  
  // Se a URL já estiver no formato de proxy, retorná-la como está
  if (supabaseUrl.startsWith('/imgs/')) {
    return supabaseUrl;
  }
  
  // Se a URL for do Supabase, convertê-la para o formato de proxy
  const SUPABASE_DOMAIN = 'dcodfuzoxmddmpvowhap.supabase.co';
  const SUPABASE_URL_PATTERN = /https:\/\/dcodfuzoxmddmpvowhap\.supabase\.co\/storage\/v1\/object\/public\//;
  const LOCAL_IMAGE_PATH = '/imgs/';
  
  if (supabaseUrl.includes(SUPABASE_DOMAIN)) {
    // Extrair o caminho relativo da URL do Supabase
    const relativePath = supabaseUrl.replace(SUPABASE_URL_PATTERN, '');
    // Construir a nova URL com o caminho do proxy
    return `${LOCAL_IMAGE_PATH}${relativePath}`;
  }
  
  // Se for qualquer outra URL externa ou absoluta, não modificá-la
  return supabaseUrl;
}

/**
 * Rota para verificar a conversão de URLs para um ID específico
 */
router.get('/test/:id', async (req, res) => {
  try {
    const artId = parseInt(req.params.id);
    
    if (isNaN(artId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Buscar a arte no banco de dados
    const [art] = await db.select().from(arts).where(eq(arts.id, artId));
    
    if (!art) {
      return res.status(404).json({ error: 'Arte não encontrada' });
    }
    
    // Criar uma cópia para verificar conversão manual
    const artCopy = JSON.parse(JSON.stringify(art));
    
    // Verificar conversão manual
    const manuallyConverted = {
      imageUrl: convertToProxyUrl(art.imageUrl),
      thumbnailUrl: convertToProxyUrl(art.thumbnailUrl)
    };
    
    // Aplicar conversão automática (como feita pelo middleware)
    const convertedData = {
      original: {
        imageUrl: art.imageUrl,
        thumbnailUrl: art.thumbnailUrl
      },
      converted: convertImageUrls(JSON.parse(JSON.stringify(art)))
    };
    
    // Verificar se as URLs já estão no formato de proxy
    const isImageUrlProxied = art.imageUrl && art.imageUrl.startsWith('/imgs/');
    const isThumbnailUrlProxied = art.thumbnailUrl && art.thumbnailUrl.startsWith('/imgs/');
    
    res.json({
      id: art.id,
      title: art.title,
      proxied: {
        imageUrl: isImageUrlProxied,
        thumbnailUrl: isThumbnailUrlProxied,
      },
      urls: {
        original: {
          imageUrl: convertedData.original.imageUrl,
          thumbnailUrl: convertedData.original.thumbnailUrl,
        },
        middleware: {
          imageUrl: convertedData.converted.imageUrl,
          thumbnailUrl: convertedData.converted.thumbnailUrl,
        },
        manual: {
          imageUrl: manuallyConverted.imageUrl,
          thumbnailUrl: manuallyConverted.thumbnailUrl,
        }
      },
      success: isImageUrlProxied && isThumbnailUrlProxied,
    });
  } catch (error) {
    console.error('Erro ao testar proxy de imagem:', error);
    res.status(500).json({ error: 'Erro ao testar proxy de imagem' });
  }
});

export default router;