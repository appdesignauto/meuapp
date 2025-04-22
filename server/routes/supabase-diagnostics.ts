import express, { Request, Response } from 'express';
import { supabaseStorageService } from '../services/supabase-storage';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Middleware para verificar se é administrador
const isAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  if (!req.isAuthenticated() || req.user?.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Esta área é restrita a administradores do sistema'
    });
  }
  next();
};

// Teste de conexão com Supabase
router.get('/api/diagnostics/supabase', isAdmin, async (req: Request, res: Response) => {
  try {
    // Verificar status da conexão
    const connectionStatus = await supabaseStorageService.checkConnection();
    
    // Variáveis de ambiente (mascaradas)
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    
    const envStatus = {
      SUPABASE_URL: url ? `${url.substring(0, 15)}...` : 'não definido',
      SUPABASE_ANON_KEY: key ? `${key.substring(0, 5)}...${key.substring(key.length - 3)}` : 'não definido',
      KEY_LENGTH: key ? key.length : 0
    };
    
    res.json({
      connection: connectionStatus,
      environment: envStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na diagnóstico do Supabase:', error);
    res.status(500).json({ 
      error: 'Falha ao executar diagnóstico',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

// Teste de upload para o Supabase Storage
router.post('/api/diagnostics/supabase/test-upload', isAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: 'URL de imagem não fornecida' });
    }
    
    const imageUrl = req.body.imageUrl;
    console.log(`Iniciando teste com imagem: ${imageUrl}`);
    
    // Buscar a imagem da URL fornecida
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ error: `Falha ao buscar imagem: ${response.statusText}` });
    }
    
    // Converter para buffer
    const buffer = await response.arrayBuffer();
    
    // Enviar para o serviço de diagnóstico do Supabase
    const result = await supabaseStorageService.testUploadDirectNoSharp({
      buffer: Buffer.from(buffer),
      originalname: 'test-image.jpg',
      mimetype: response.headers.get('content-type') || 'image/jpeg',
      size: buffer.byteLength
    } as Express.Multer.File);
    
    res.json(result);
  } catch (error) {
    console.error('Erro no teste de upload para Supabase:', error);
    res.status(500).json({ 
      error: 'Falha no teste de upload',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Teste específico para avatar upload
router.post('/api/diagnostics/supabase/test-avatar', isAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: 'URL de imagem não fornecida' });
    }
    
    const imageUrl = req.body.imageUrl;
    const userId = req.body.userId || 'test-user';
    console.log(`Iniciando teste de avatar com imagem: ${imageUrl}`);
    console.log(`ID do usuário para teste: ${userId}`);
    
    // Buscar a imagem da URL fornecida
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ error: `Falha ao buscar imagem: ${response.statusText}` });
    }
    
    // Converter para buffer
    const buffer = await response.arrayBuffer();
    
    // Opções de otimização de avatar
    const options = {
      width: 250,
      height: 250,
      quality: 90,
      format: 'webp' as const
    };
    
    // Enviar para o serviço de upload de avatar
    const result = await supabaseStorageService.uploadAvatar({
      buffer: Buffer.from(buffer),
      originalname: 'test-avatar.jpg',
      mimetype: response.headers.get('content-type') || 'image/jpeg',
      size: buffer.byteLength
    } as Express.Multer.File, options, userId);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no teste de upload de avatar:', error);
    res.status(500).json({ 
      success: false,
      error: 'Falha no teste de upload de avatar',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

// Lista buckets disponíveis
router.get('/api/diagnostics/supabase/buckets', isAdmin, async (req: Request, res: Response) => {
  try {
    // Acessar diretamente o Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Credenciais do Supabase não configuradas' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Obter lista de buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return res.status(500).json({ 
        success: false,
        error: `Erro ao listar buckets: ${error.message}`
      });
    }
    
    // Para cada bucket, tentar listar alguns arquivos
    const bucketsWithFiles = await Promise.all(
      (buckets || []).map(async (bucket) => {
        try {
          const { data: files, error: listError } = await supabase.storage
            .from(bucket.name)
            .list();
          
          return {
            ...bucket,
            files: files && files.length > 0 ? files.slice(0, 5) : [], // limitar a 5 arquivos
            totalFiles: files ? files.length : 0,
            error: listError ? listError.message : null,
            accessible: !listError
          };
        } catch (err) {
          return {
            ...bucket,
            files: [],
            totalFiles: 0,
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            accessible: false
          };
        }
      })
    );
    
    res.json({
      success: true,
      buckets: bucketsWithFiles,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao listar buckets do Supabase:', error);
    res.status(500).json({ 
      success: false,
      error: 'Falha ao listar buckets',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;