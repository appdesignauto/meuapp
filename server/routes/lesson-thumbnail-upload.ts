import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabaseStorageService } from '../services/supabase-storage';
import { courseLessons } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Configuração do multer para armazenar o upload em memória temporariamente
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limite de 5MB
  },
});

// Middlewares para verificar autenticação
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  next();
};

// Middleware para verificar se é admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  if (req.user.nivelacesso !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso não autorizado' });
  }

  next();
};

// Rota para upload de thumbnail da aula
router.post('/api/courses/lessons/thumbnail-upload', isAuthenticated, isAdmin, upload.single('thumbnail'), 
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'Nenhum arquivo enviado' 
        });
      }

      const lessonId = req.body.lessonId;
      if (!lessonId) {
        return res.status(400).json({ 
          success: false,
          message: 'ID da aula não fornecido' 
        });
      }

      // Verificar se a aula existe
      const existingLesson = await db.select().from(courseLessons).where(eq(courseLessons.id, Number(lessonId)));
      if (!existingLesson.length) {
        return res.status(404).json({
          success: false,
          message: 'Aula não encontrada'
        });
      }

      // Configurar opções de otimização de imagem
      const options = {
        width: 640, // Largura adequada para thumbnails de vídeo
        height: 360, // Altura proporcional para uma relação de aspecto 16:9
        quality: 85,
        format: 'webp' as const
      };

      // Upload da imagem para o bucket 'lessonthumbnails'
      const uploadResult = await supabaseStorageService.uploadImage(
        req.file,
        options,
        'lessonthumbnails',
        Number(req.user?.id)
      );

      if (!uploadResult || !uploadResult.imageUrl) {
        return res.status(500).json({
          success: false,
          message: 'Falha ao fazer upload da imagem',
          error: 'Erro desconhecido'
        });
      }

      // Atualizar a URL da thumbnail na aula
      await db.update(courseLessons)
        .set({ thumbnailUrl: uploadResult.imageUrl })
        .where(eq(courseLessons.id, Number(lessonId)));

      return res.status(200).json({
        success: true,
        thumbnailUrl: uploadResult.imageUrl,
        message: 'Thumbnail atualizada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload de thumbnail:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar upload de thumbnail',
        error: error.message
      });
    }
  }
);

export default router;