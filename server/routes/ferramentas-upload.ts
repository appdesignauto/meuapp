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
    
    // Caso o upload falhe no Supabase, usamos o sistema de arquivos local
    if (!result.success) {
      try {
        console.log('Upload no Supabase falhou. Usando sistema de arquivos local como fallback.', result.error);
        
        // Criar diretório para armazenamento permanente se não existir
        const uploadDir = path.join(process.cwd(), 'uploads', 'designautoimages', 'ferramentas', 'tools');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Copiar o arquivo para o armazenamento permanente
        const permanentPath = path.join(uploadDir, `${fileId}.webp`);
        fs.copyFileSync(outputPath, permanentPath);
        
        // Gerar URL relativa para o arquivo
        const imageUrl = `/uploads/designautoimages/ferramentas/tools/${fileId}.webp`;
        
        // Definir resultado de fallback
        result.success = true;
        result.imageUrl = imageUrl;
        result.storageType = 'local';
      } catch (fallbackError) {
        console.error('Erro no fallback de armazenamento local:', fallbackError);
        // Manteremos o erro original do Supabase se o fallback também falhar
      }
    }
    
    // Limpar arquivos temporários
    try {
      fs.unlinkSync(localFilePath);
      // Não excluir outputPath se estivermos usando armazenamento local e o arquivo for o mesmo
      if (result.storageType !== 'local' || result.success) {
        fs.unlinkSync(outputPath);
      }
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
    
    // Caso o upload falhe no Supabase, usamos o sistema de arquivos local
    if (!result.success) {
      try {
        console.log('Upload direto no Supabase falhou. Usando sistema de arquivos local como fallback.', result.error);
        
        // Criar diretório para armazenamento permanente se não existir
        const uploadDir = path.join(process.cwd(), 'uploads', 'designautoimages', 'ferramentas', 'tools');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Gerar nome único para o arquivo
        const fileId = uuidv4();
        const fileExt = path.extname(req.file.originalname) || '.jpg';
        const outputFilename = `${fileId}${fileExt}`;
        
        // Copiar o arquivo para o armazenamento permanente
        const permanentPath = path.join(uploadDir, outputFilename);
        fs.copyFileSync(req.file.path, permanentPath);
        
        // Gerar URL relativa para o arquivo
        const imageUrl = `/uploads/designautoimages/ferramentas/tools/${outputFilename}`;
        
        // Definir resultado de fallback
        result.success = true;
        result.imageUrl = imageUrl;
        result.storageType = 'local';
      } catch (fallbackError) {
        console.error('Erro no fallback de armazenamento local:', fallbackError);
        // Manteremos o erro original do Supabase se o fallback também falhar
      }
    }
    
    // Limpar arquivo temporário se não estamos usando ele como arquivo final
    try {
      if (result.storageType !== 'local' || result.success) {
        fs.unlinkSync(req.file.path);
      }
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