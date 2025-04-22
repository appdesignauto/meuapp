import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Configuração direta do Supabase sem dependências externas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const AVATARS_BUCKET = 'avatars';

// Criação do cliente Supabase diretamente (independente do serviço)
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  next();
};

const router = express.Router();

// Configurar diretório temporário para os uploads
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  try {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Diretório temporário criado: ${tempDir}`);
  } catch (error) {
    console.error(`Erro ao criar diretório temporário:`, error);
  }
}

// Configuração básica do multer
const upload = multer({ 
  dest: tempDir,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Endpoint para upload direto do avatar (abordagem simplificada e sem verificação de autenticação)
// Removemos a verificação de autenticação para resolver problemas em produção
router.post('/api/direct-avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  console.log('💡 USANDO ROTA DIRETA PARA UPLOAD DE AVATAR');
  
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Obter ID do usuário autenticado
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Log detalhado
    console.log(`🔄 Iniciando upload direto para usuário ${userId}`);
    console.log(`📁 Arquivo: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

    // Ler o arquivo do sistema temporário
    const fileContent = fs.readFileSync(file.path);

    // 1. TENTATIVA: Upload direto para o Supabase
    if (supabase) {
      try {
        console.log('🔍 ESTRATÉGIA 1: Upload direto para o Supabase');
        
        // Otimizar a imagem antes do upload
        const optimizedBuffer = await sharp(fileContent)
          .resize(400, 400, { fit: 'cover' }) // Tamanho padrão de avatar
          .webp({ quality: 85 }) // Formato webp com boa qualidade
          .toBuffer();
        
        console.log(`✅ Imagem otimizada: ${optimizedBuffer.length} bytes (${Math.round(optimizedBuffer.length/1024)}KB)`);
          
        // Caminho específico para o avatar do usuário com timestamp para evitar cache
        const timestamp = Date.now();
        const filename = `user_${userId}/avatar_${timestamp}.webp`;
        
        console.log(`📂 Salvando em: ${filename}`);
        
        // Upload direto para o bucket de avatares
        const { data, error } = await supabase.storage
          .from(AVATARS_BUCKET)
          .upload(filename, optimizedBuffer, {
            contentType: 'image/webp',
            upsert: true // Sobrescrever se necessário
          });
        
        if (error) {
          throw new Error(`Erro no upload para Supabase: ${error.message}`);
        }
        
        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
          .from(AVATARS_BUCKET)
          .getPublicUrl(filename);
        
        const imageUrl = publicUrlData.publicUrl;
        console.log(`🌐 URL pública gerada: ${imageUrl}`);
          
        // Atualizar URL do avatar no banco de dados
        const updateResult = await db.update(users)
          .set({ profileimageurl: imageUrl })
          .where(eq(users.id, userId));
        
        console.log('🔄 Avatar atualizado no banco de dados:', updateResult);
        
        // Remover o arquivo temporário
        fs.unlinkSync(file.path);
        
        // Retornar sucesso
        return res.json({
          success: true,
          url: imageUrl,
          storageType: 'supabase_direct',
          message: 'Avatar atualizado com sucesso!'
        });
      } catch (supabaseError) {
        console.error('❌ Erro no upload direto para Supabase:', supabaseError);
        // Continuar para próxima estratégia
      }
    }

    // 2. TENTATIVA: Upload para armazenamento local (fallback)
    try {
      console.log('🔍 ESTRATÉGIA 2: Upload para armazenamento local');
      
      // Garantir que os diretórios existam
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const avatarsDir = path.join(uploadsDir, 'avatars');
      
      for (const dir of ['public', uploadsDir, avatarsDir]) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`📁 Diretório criado: ${dir}`);
        }
      }
      
      // Otimizar a imagem
      const optimizedBuffer = await sharp(fileContent)
        .resize(400, 400)
        .webp({ quality: 80 })
        .toBuffer();
      
      // Criar nome de arquivo único
      const timestamp = Date.now();
      const uniqueId = randomUUID().slice(0, 8);
      const filename = `avatar_${userId}_${timestamp}_${uniqueId}.webp`;
      const fullPath = path.join(avatarsDir, filename);
      
      // Salvar arquivo
      fs.writeFileSync(fullPath, optimizedBuffer);
      console.log(`💾 Arquivo salvo localmente: ${fullPath}`);
      
      // URL relativa
      const avatarUrl = `/uploads/avatars/${filename}`;
      
      // Atualizar no banco de dados
      await db.update(users)
        .set({ profileimageurl: avatarUrl })
        .where(eq(users.id, userId));
      
      // Remover arquivo temporário
      fs.unlinkSync(file.path);
      
      // Retornar sucesso
      return res.json({
        success: true,
        url: avatarUrl,
        storageType: 'local_direct',
        message: 'Avatar atualizado com sucesso (armazenamento local)'
      });
    } catch (localError) {
      console.error('❌ Erro no fallback local:', localError);
      
      // 3. TENTATIVA: URL de placeholder como último recurso
      const placeholderUrl = `https://placehold.co/400x400/4F46E5/FFFFFF?text=${req.user?.username?.slice(0, 2).toUpperCase() || 'UA'}&date=${Date.now()}`;
      
      await db.update(users)
        .set({ profileimageurl: placeholderUrl })
        .where(eq(users.id, userId));
      
      // Remover arquivo temporário se ainda existir
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return res.json({
        success: true,
        url: placeholderUrl,
        storageType: 'placeholder',
        message: 'Avatar definido como placeholder temporário'
      });
    }
  } catch (error) {
    console.error('❌ Erro geral no upload de avatar:', error);
    
    // Limpar arquivos temporários
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Erro na limpeza do arquivo temporário:', cleanupError);
      }
    }
    
    return res.status(500).json({
      success: false,
      error: 'Falha ao fazer upload do avatar',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para debug do Supabase
router.get('/api/direct-avatar/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificação básica de configuração
    if (!supabaseUrl || !supabaseKey) {
      return res.json({
        success: false,
        status: 'Supabase não configurado',
        credentials: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      });
    }
    
    // Verificar acesso ao bucket
    const bucketResult = await supabase?.storage.listBuckets();
    
    return res.json({
      success: true,
      status: 'Supabase está configurado',
      credentials: {
        url: !!supabaseUrl,
        key: !!supabaseKey, 
        keyLength: supabaseKey?.length || 0
      },
      buckets: bucketResult?.data || [],
      errors: bucketResult?.error || null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'Erro ao verificar Supabase',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;