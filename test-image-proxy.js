/**
 * Script para testar o proxy de URL de imagens
 * 
 * Este script irá:
 * 1. Verificar a conversão de URL de imagem para a arte com ID 73
 * 2. Mostrar as URLs originais e convertidas
 */

// Importar bibliotecas necessárias
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import 'dotenv/config';

// Criar app Express
const app = express();
app.use(cors());
app.use(express.json());

// Cliente Supabase para comparação
const supabaseUrl = process.env.SUPABASE_URL || 'https://dcodfuzoxmddmpvowhap.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Conexão com o banco de dados
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Utilitário para converter URLs do Supabase para formato de proxy
function convertToProxyUrl(supabaseUrl) {
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

// Rota de teste
app.get('/test-proxy', async (req, res) => {
  try {
    // Buscar a arte com ID específico
    const artId = 73;
    const result = await pool.query('SELECT id, title, "imageUrl", "thumbnailUrl" FROM arts WHERE id = $1', [artId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arte não encontrada' });
    }
    
    const art = result.rows[0];
    
    // Verificar se as URLs já estão no formato de proxy
    const isImageUrlProxied = art.imageUrl && art.imageUrl.startsWith('/imgs/');
    const isThumbnailUrlProxied = art.thumbnailUrl && art.thumbnailUrl.startsWith('/imgs/');
    
    // Convertir manualmente as URLs para comparação
    const convertedImageUrl = convertToProxyUrl(art.imageUrl);
    const convertedThumbnailUrl = convertToProxyUrl(art.thumbnailUrl);
    
    // Resultado do teste
    res.json({
      art: {
        id: art.id,
        title: art.title,
      },
      urls: {
        imageUrl: {
          original: art.imageUrl,
          proxied: isImageUrlProxied,
          converted: convertedImageUrl,
          match: art.imageUrl === convertedImageUrl,
        },
        thumbnailUrl: {
          original: art.thumbnailUrl,
          proxied: isThumbnailUrlProxied,
          converted: convertedThumbnailUrl,
          match: art.thumbnailUrl === convertedThumbnailUrl,
        }
      },
      success: isImageUrlProxied && isThumbnailUrlProxied,
    });
  } catch (error) {
    console.error('Erro ao testar proxy de imagem:', error);
    res.status(500).json({ error: 'Erro ao testar proxy de imagem' });
  }
});

// Iniciar servidor de teste
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor de teste rodando em http://localhost:${PORT}/test-proxy`);
});