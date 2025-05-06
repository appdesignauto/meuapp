import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

// Verificação de variáveis de ambiente
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias');
}

// Inicialização do cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Constantes para buckets e pastas
const BUCKET_NAME = 'designautoimages';
const MODULE_FOLDER = 'module-thumbnails';

// Configuração do multer para armazenar em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (acceptedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato não suportado. Use apenas JPEG, PNG ou WEBP.'));
    }
  }
});

// Função para otimizar imagem
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    // Redimensiona para um tamanho padrão adequado para miniaturas de módulos
    // e converte para webp para otimização
    return await sharp(buffer)
      .resize(800, 450, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Erro ao otimizar imagem:', error);
    return buffer; // Retorna o buffer original em caso de erro
  }
}

// Função para garantir que o bucket existe
async function ensureBucket() {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error: getBucketError } = await supabase.storage.listBuckets();
    
    if (getBucketError) {
      console.error('Erro ao listar buckets:', getBucketError);
      return false;
    }
    
    // Se o bucket não existir, tentar criar
    if (!buckets?.find(b => b.name === BUCKET_NAME)) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB em bytes
      });
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Exceção ao verificar/criar bucket:', error);
    return false;
  }
}

// Implementar fallback para upload local quando necessário
async function localUpload(buffer: Buffer, filename: string): Promise<string> {
  try {
    // Criar diretório se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', MODULE_FOLDER);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Salvar arquivo
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    // Retornar URL relativa
    return `/uploads/${MODULE_FOLDER}/${filename}`;
  } catch (error) {
    console.error('Erro no upload local:', error);
    throw error;
  }
}

// Rota para upload de imagem de módulo
router.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  console.log('📂 Processando upload para miniatura de módulo');
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo enviado' 
      });
    }
    
    // Verificar se o usuário está autenticado (opcional, dependendo da configuração)
    const userId = req.user?.id;
    const username = req.user?.username;
    
    console.log(`📤 Upload recebido: ${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})`);
    console.log(`👤 Usuário: ${userId || 'desconhecido'} (${username || 'sem username'})`);
    
    // Otimizar imagem
    const optimizedBuffer = await optimizeImage(req.file.buffer);
    
    // Gerar nome de arquivo único
    const uniqueId = randomUUID();
    const filename = `module_${userId ? `user${userId}_` : ''}${uniqueId}.webp`;
    const filePath = `${MODULE_FOLDER}/${filename}`;
    
    // Tentativa 1: Upload para Supabase
    try {
      // Verificar bucket
      const bucketReady = await ensureBucket();
      
      if (bucketReady) {
        // Fazer upload para Supabase Storage
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, optimizedBuffer, {
            contentType: 'image/webp',
            upsert: true
          });
          
        if (error) {
          throw error;
        }
        
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);
          
        console.log(`✅ Upload para Supabase concluído: ${urlData.publicUrl}`);
        
        return res.status(200).json({
          success: true,
          message: 'Upload bem-sucedido',
          fileUrl: urlData.publicUrl,
          storageType: 'supabase'
        });
      } else {
        throw new Error('Bucket não disponível');
      }
    } catch (supabaseError) {
      console.error('❌ Erro no upload para Supabase:', supabaseError);
      console.log('⚠️ Tentando fallback para armazenamento local...');
      
      // Tentativa 2: Fallback para armazenamento local
      try {
        const localUrl = await localUpload(optimizedBuffer, filename);
        
        console.log(`✅ Upload local concluído: ${localUrl}`);
        
        return res.status(200).json({
          success: true,
          message: 'Upload realizado com fallback para armazenamento local',
          fileUrl: localUrl,
          storageType: 'local',
          originalError: String(supabaseError)
        });
      } catch (localError) {
        console.error('❌ Erro no fallback para upload local:', localError);
        throw new Error(`Falha em ambas as estratégias de upload: ${supabaseError} / ${localError}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro no processamento do upload:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar o upload da imagem',
      error: String(error)
    });
  }
});

export default router;