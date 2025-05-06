import express, { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseStorageService } from '../services/supabase-storage';
import { randomUUID } from 'crypto';

const router = express.Router();

// Configuração Multer para upload temporário em memória
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Apenas imagens no formato JPEG, PNG ou WEBP são permitidas'));
  },
});

// Inicializando serviço Supabase Storage
const supabaseStorage = new SupabaseStorageService();

// Otimiza a imagem usando sharp
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    // Usar sharp para converter para WebP com boa compressão
    const optimizedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
    
    return optimizedBuffer;
  } catch (error) {
    console.error('Erro ao otimizar imagem:', error);
    return buffer; // Retorna o buffer original em caso de erro
  }
}

// Garante que o bucket do módulo exista
async function ensureBucket() {
  try {
    // O método initBucket() do SupabaseStorageService já tenta criar buckets necessários
    await supabaseStorage.initBucket();
    return true;
  } catch (error) {
    console.error('Erro ao inicializar buckets:', error);
    return false;
  }
}

// Upload para pasta local em caso de fallback
async function localUpload(buffer: Buffer, filename: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'modules');
  
  // Garantir que o diretório exista
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const localPath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(localPath, buffer);
  
  return `/uploads/modules/${filename}`;
}

// Rota para upload de thumbnails de módulos
router.post('/module-thumbnail', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  try {
    // Otimiza a imagem
    const optimizedBuffer = await optimizeImage(req.file.buffer);
    
    // Gera um nome de arquivo único
    const fileExtension = '.webp'; // Sempre salvamos como WebP após otimização
    const uniqueFileName = `${randomUUID()}${fileExtension}`;
    
    // Define a estrutura de pastas: module-thumbnails/YYYY-MM
    const currentDate = new Date();
    const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const filePath = `${yearMonth}/${uniqueFileName}`;
    
    // Garante que o bucket exista
    await ensureBucket();
    
    // Tenta fazer upload para o Supabase
    let fileUrl = '';
    try {
      // Cria um objeto multer-like para compatibilidade com o método uploadImage
      const multerCompatFile = {
        buffer: optimizedBuffer,
        originalname: uniqueFileName,
        mimetype: 'image/webp',
        size: optimizedBuffer.length
      };

      // Usa o método uploadImage do SupabaseStorageService
      const result = await supabaseStorage.uploadImage(
        multerCompatFile,
        {
          width: 800,  // Largura máxima para thumbnails de módulos
          quality: 85, // Qualidade da imagem
          format: 'webp' // Formato WebP
        },
        'module-thumbnails', // Pasta/bucket para os thumbnails
        null // Sem designer ID específico
      );
      
      if (result && result.imageUrl) {
        fileUrl = result.imageUrl;
      } else {
        throw new Error('Falha no upload para o Supabase Storage');
      }
    } catch (error) {
      console.error('Erro no upload para Supabase, tentando local:', error);
      // Fallback para salvar localmente se o Supabase falhar
      fileUrl = await localUpload(optimizedBuffer, uniqueFileName);
    }
    
    // Retorna a URL do arquivo
    res.status(200).json({
      success: true,
      fileUrl: fileUrl,
      fileName: uniqueFileName,
      fileSize: optimizedBuffer.length,
      mimeType: 'image/webp'
    });
    
  } catch (error) {
    console.error('Erro no processamento do upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar o upload da imagem'
    });
  }
});

export default router;