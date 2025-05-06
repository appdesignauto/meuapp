import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabaseStorageService } from '../services/supabase-storage';
import { courses } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

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

// Função para gerar placeholder com iniciais
async function generatePlaceholderImage(title: string, orientation: string): Promise<Buffer> {
  // Pegar as iniciais do título (até 2 caracteres)
  const initials = title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);

  // Definir cores aleatórias para o fundo
  const colors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#d35400', '#c0392b', '#2980b9', '#8e44ad'
  ];
  const bgColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Definir dimensões com base na orientação
  let width = 400;
  let height = 225;
  
  if (orientation === 'vertical') {
    width = 300;
    height = 450;
  }

  // Criar SVG com as iniciais
  const svgImage = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}" />
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${Math.floor(width/4)}px" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${initials}
      </text>
    </svg>
  `;

  // Converter SVG para Buffer de imagem
  return await sharp(Buffer.from(svgImage)).webp({ quality: 90 }).toBuffer();
}

// Rota para upload de thumbnail do curso - formato horizontal
router.post('/api/courses/thumbnail-upload-horizontal', isAuthenticated, isAdmin, upload.single('thumbnail'), 
  async (req: Request, res: Response) => {
    try {
      const courseId = req.body.courseId;
      
      if (!courseId) {
        return res.status(400).json({ 
          success: false,
          message: 'ID do curso não fornecido' 
        });
      }

      // Verificar se o curso existe
      const existingCourse = await db.select().from(courses).where(eq(courses.id, Number(courseId)));
      if (!existingCourse.length) {
        return res.status(404).json({
          success: false,
          message: 'Curso não encontrado'
        });
      }

      let imageBuffer;
      let contentType;
      let filename;

      // Se um arquivo foi enviado, usamos ele
      if (req.file) {
        imageBuffer = req.file.buffer;
        contentType = req.file.mimetype;
        filename = req.file.originalname;
      } else {
        // Caso contrário, geramos um placeholder com as iniciais do curso
        const courseTitle = existingCourse[0].title || 'CS';
        imageBuffer = await generatePlaceholderImage(courseTitle, 'horizontal');
        contentType = 'image/webp';
        filename = 'placeholder.webp';
      }

      // Configurar opções de otimização de imagem para formato horizontal (16:9)
      const options = {
        width: 640,
        height: 360,
        quality: 85,
        format: 'webp' as const
      };

      // Upload da imagem para o bucket 'coursethumbnails'
      const uploadResult = await supabaseStorageService.uploadImage(
        // Converter para o formato esperado pela função uploadImage
        {
          buffer: imageBuffer,
          originalname: filename,
          mimetype: contentType
        },
        options,
        'coursethumbnails/horizontal',
        Number(req.user?.id)
      );

      if (!uploadResult || !uploadResult.imageUrl) {
        return res.status(500).json({
          success: false,
          message: 'Falha ao fazer upload da imagem',
          error: 'Erro desconhecido'
        });
      }

      // Atualizar a URL da thumbnail no curso
      await db.update(courses)
        .set({ thumbnailUrl: uploadResult.imageUrl })
        .where(eq(courses.id, Number(courseId)));

      return res.status(200).json({
        success: true,
        thumbnailUrl: uploadResult.imageUrl,
        message: 'Thumbnail horizontal atualizada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload de thumbnail horizontal:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar upload de thumbnail horizontal',
        error: error.message
      });
    }
  }
);

// Rota para upload de imagem de destaque do curso - formato vertical
router.post('/api/courses/thumbnail-upload-vertical', isAuthenticated, isAdmin, upload.single('thumbnail'), 
  async (req: Request, res: Response) => {
    try {
      const courseId = req.body.courseId;
      
      if (!courseId) {
        return res.status(400).json({ 
          success: false,
          message: 'ID do curso não fornecido' 
        });
      }

      // Verificar se o curso existe
      const existingCourse = await db.select().from(courses).where(eq(courses.id, Number(courseId)));
      if (!existingCourse.length) {
        return res.status(404).json({
          success: false,
          message: 'Curso não encontrado'
        });
      }

      let imageBuffer;
      let contentType;
      let filename;

      // Se um arquivo foi enviado, usamos ele
      if (req.file) {
        imageBuffer = req.file.buffer;
        contentType = req.file.mimetype;
        filename = req.file.originalname;
      } else {
        // Caso contrário, geramos um placeholder com as iniciais do curso
        const courseTitle = existingCourse[0].title || 'CS';
        imageBuffer = await generatePlaceholderImage(courseTitle, 'vertical');
        contentType = 'image/webp';
        filename = 'placeholder.webp';
      }

      // Configurar opções de otimização de imagem para formato vertical (2:3)
      const options = {
        width: 400,
        height: 600,
        quality: 85,
        format: 'webp' as const
      };

      // Upload da imagem para o bucket 'coursethumbnails'
      const uploadResult = await supabaseStorageService.uploadImage(
        // Converter para o formato esperado pela função uploadImage
        {
          buffer: imageBuffer,
          originalname: filename,
          mimetype: contentType
        },
        options,
        'coursethumbnails/vertical',
        Number(req.user?.id)
      );

      if (!uploadResult || !uploadResult.imageUrl) {
        return res.status(500).json({
          success: false,
          message: 'Falha ao fazer upload da imagem',
          error: 'Erro desconhecido'
        });
      }

      // Atualizar a URL da imagem de destaque no curso
      await db.update(courses)
        .set({ featuredImage: uploadResult.imageUrl })
        .where(eq(courses.id, Number(courseId)));

      return res.status(200).json({
        success: true,
        featuredImage: uploadResult.imageUrl,
        message: 'Imagem vertical atualizada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload de imagem vertical:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar upload de imagem vertical',
        error: error.message
      });
    }
  }
);

export default router;