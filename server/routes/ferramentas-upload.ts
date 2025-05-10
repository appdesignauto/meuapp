import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { isAdmin } from "../middleware";
import { StorageService } from "../services/storage-service";
import { SupabaseStorageService } from "../services/supabase-storage-service";

const router = express.Router();

// Configuração para armazenamento temporário das imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads/temp");
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Configuração do multer para upload
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Apenas permitir imagens
    const allowedMimes = [
      'image/jpeg',
      'image/pjpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas imagens JPEG, PNG, GIF e WEBP são permitidas.'));
    }
  }
});

// Função para obter serviço de armazenamento
const getStorageService = (): StorageService => {
  return new SupabaseStorageService();
};

// Rota para upload de imagem de ferramenta
router.post(
  "/api/admin/upload/imagem-ferramenta",
  isAdmin,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
      }
      
      // Configurar o nome do bucket e o caminho dentro do bucket
      const bucketName = "designauto-images";
      const filePath = `ferramentas/${randomUUID()}${path.extname(file.filename)}`;
      
      // Processar a imagem com sharp
      const outputFilePath = path.join(path.dirname(file.path), `processed_${file.filename}`);
      
      // Otimizar a imagem de acordo com o tipo
      if (file.mimetype === 'image/gif') {
        // Para GIFs, apenas copiar o arquivo pois o sharp não processa GIFs animados corretamente
        fs.copyFileSync(file.path, outputFilePath);
      } else {
        // Para outras imagens, converter para WebP para melhor otimização
        await sharp(file.path)
          .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputFilePath);
      }
      
      // Fazer upload para o Storage (Supabase)
      const storageService = getStorageService();
      
      const uploadResult = await storageService.uploadFile({
        bucketName,
        filePath,
        localFilePath: outputFilePath,
        contentType: file.mimetype === 'image/gif' ? file.mimetype : 'image/webp',
        metadata: {
          originalName: file.originalname,
          uploadedBy: (req.user as any)?.username || 'admin'
        }
      });
      
      // Limpar arquivos temporários
      try {
        fs.unlinkSync(file.path);
        fs.unlinkSync(outputFilePath);
      } catch (cleanupError) {
        console.error("Erro ao limpar arquivos temporários:", cleanupError);
      }
      
      if (!uploadResult.success) {
        return res.status(500).json({
          message: "Erro ao fazer upload da imagem",
          error: uploadResult.error
        });
      }
      
      // Retornar URL da imagem
      res.status(200).json({
        message: "Upload concluído com sucesso",
        imageUrl: uploadResult.imageUrl,
        storageType: uploadResult.storageType
      });
      
    } catch (error) {
      console.error("Erro no upload de imagem:", error);
      res.status(500).json({
        message: "Erro no processamento do upload",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

export default router;