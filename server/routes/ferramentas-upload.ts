import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { isAdmin } from '../middleware';
import { SupabaseStorageService } from '../services/supabase-storage-service';

const router = Router();
const storageService = new SupabaseStorageService();

// Configurar armazenamento temporário para o multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Configurar upload
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Rota para upload de imagem de ferramenta
router.post('/api/admin/ferramentas/upload-imagem', isAdmin, upload.single('imagem'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada' });
    }
    
    const localFilePath = req.file.path;
    const fileId = uuidv4();
    const outputFilename = `ferramentas/tools/${fileId}.webp`;
    const outputPath = path.join(process.cwd(), 'uploads', 'temp', `${fileId}.webp`);
    
    // Processar a imagem com sharp - ajustando para melhor proporção 16:9
    await sharp(localFilePath)
      .resize({ width: 640, height: 360, fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    // Fazer upload para o Supabase Storage
    const result = await storageService.uploadFile({
      bucketName: 'designautoimages',
      filePath: outputFilename,
      localFilePath: outputPath,
      contentType: 'image/webp',
      metadata: {
        originalFilename: req.file.originalname
      }
    });
    
    // Limpar arquivos temporários
    try {
      fs.unlinkSync(localFilePath);
      fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.error('Erro ao limpar arquivos temporários:', cleanupError);
    }
    
    if (!result.success) {
      return res.status(500).json({ 
        message: 'Erro ao fazer upload da imagem', 
        error: result.error,
        logs: result.logs
      });
    }
    
    res.json({
      imageUrl: result.imageUrl,
      success: true,
      storageType: result.storageType
    });
    
  } catch (error) {
    console.error('Erro no upload:', error);
    return res.status(500).json({ 
      message: 'Erro ao processar upload da imagem',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Rota alternativa para upload direto (sem processamento Sharp)
// Útil para troubleshooting ou quando o processamento de imagem falha
router.post('/api/admin/ferramentas/upload-imagem-direto', isAdmin, upload.single('imagem'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada' });
    }
    
    const file = {
      buffer: fs.readFileSync(req.file.path),
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    };
    
    // Upload direto para o Supabase sem processamento
    const result = await storageService.testUploadDirectNoSharp(file as Express.Multer.File);
    
    // Limpar arquivo temporário
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Erro ao limpar arquivo temporário:', cleanupError);
    }
    
    if (!result.success) {
      return res.status(500).json({ 
        message: 'Erro ao fazer upload direto da imagem', 
        error: result.error,
        logs: result.logs
      });
    }
    
    res.json({
      imageUrl: result.imageUrl,
      success: true,
      storageType: result.storageType
    });
    
  } catch (error) {
    console.error('Erro no upload direto:', error);
    return res.status(500).json({ 
      message: 'Erro ao processar upload direto da imagem',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;