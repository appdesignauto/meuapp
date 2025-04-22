import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração direta do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const avatarsBucket = 'avatars';
const mainBucket = 'designauto-images';

// Criação do cliente Supabase diretamente
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const router = express.Router();

// Verificar se o usuário é administrador
const isAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }
  
  const user = req.user as any;
  if (!user || user.nivelacesso !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
  }
  
  next();
};

// Rota para diagnóstico geral do Supabase Storage
router.get('/api/diagnostics/supabase', isAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.json({
        success: false,
        message: 'Supabase não configurado',
        credentials: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      });
    }
    
    // Verificar configuração
    const diagnostics = {
      credentials: {
        url: !!supabaseUrl,
        key: !!supabaseKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseKey?.length || 0,
        urlFirstChars: supabaseUrl?.substring(0, 15) + '...' || '',
        keyFirstChars: supabaseKey?.substring(0, 10) + '...' || ''
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    return res.json({
      success: true,
      diagnostics
    });
  } catch (error) {
    console.error('Erro no diagnóstico Supabase:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para listar buckets e verificar acesso
router.get('/api/diagnostics/supabase/buckets', isAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase não configurado'
      });
    }
    
    // Listar buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar buckets',
        error: bucketsError
      });
    }
    
    // Verificar cada bucket
    const bucketResults = [];
    
    for (const bucket of buckets) {
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list();
          
        bucketResults.push({
          name: bucket.name,
          accessible: !filesError,
          files: filesError ? null : files?.length || 0,
          error: filesError ? filesError.message : null
        });
      } catch (bucketError) {
        bucketResults.push({
          name: bucket.name,
          accessible: false,
          error: bucketError instanceof Error ? bucketError.message : 'Erro desconhecido'
        });
      }
    }
    
    return res.json({
      success: true,
      buckets: bucketResults
    });
  } catch (error) {
    console.error('Erro no diagnóstico de buckets:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para testar upload de avatar
router.post('/api/diagnostics/supabase/test-avatar', isAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase não configurado'
      });
    }
    
    // Criar um arquivo de teste simples
    const testImagePath = path.join(process.cwd(), 'temp', 'test-avatar.png');
    const testDir = path.dirname(testImagePath);
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Criar um PNG de 1x1 pixel transparente
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEDQIHq4C2fAAAAABJRU5ErkJggg==',
      'base64'
    );
    
    fs.writeFileSync(testImagePath, transparentPixel);
    console.log(`Arquivo de teste criado: ${testImagePath}`);
    
    // Fazer upload para o bucket de avatares
    const timestamp = Date.now();
    const filename = `test/test_avatar_${timestamp}.png`;
    
    console.log(`Tentando upload para ${avatarsBucket}/${filename}`);
    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from(avatarsBucket)
      .upload(filename, fs.readFileSync(testImagePath), {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`Erro no upload: ${uploadError.message}`);
      return res.status(500).json({
        success: false,
        stage: 'upload',
        error: uploadError.message
      });
    }
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(avatarsBucket)
      .getPublicUrl(filename);
    
    // Limpar
    try {
      fs.unlinkSync(testImagePath);
    } catch (cleanupError) {
      console.warn('Erro ao limpar arquivo temporário:', cleanupError);
    }
    
    // Excluir do bucket após o teste
    await supabase.storage
      .from(avatarsBucket)
      .remove([filename]);
    
    return res.json({
      success: true,
      message: 'Teste de upload concluído com sucesso',
      result: {
        uploadPath: `${avatarsBucket}/${filename}`,
        publicUrl: urlData.publicUrl,
        fileSize: transparentPixel.length
      }
    });
  } catch (error) {
    console.error('Erro no teste de upload:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;