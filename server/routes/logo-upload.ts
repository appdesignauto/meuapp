import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Configuração de armazenamento local simplificada
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Caminho absoluto para o diretório de logos público
    const logoDir = path.join(process.cwd(), 'public/images/logos');
    
    // Garantir que o diretório existe
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }
    
    cb(null, logoDir);
  },
  filename: function (req, file, cb) {
    // Criando um nome de arquivo único com timestamp e extensão original
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname) || '.png';
    
    const filename = `logo_${timestamp}_${randomId}${extension}`;
    cb(null, filename);
  }
});

// Configuração de upload
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    // Verificar se é uma imagem
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'));
    }
    cb(null, true);
  }
});

// Endpoint para upload do logo
router.post('/', upload.single('logo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo enviado' 
      });
    }
    
    // Log para depuração
    console.log('Arquivo recebido:', req.file);
    console.log('Arquivo salvo em:', req.file.path);
    
    // Construir a URL relativa para o logo
    const logoRelativePath = `/images/logos/${req.file.filename}`;
    
    // Atualizar no banco de dados
    // Buscar a configuração existente
    const existingSettings = await db.select().from(siteSettings).limit(1);
    
    if (existingSettings.length === 0) {
      // Se não existe, criar uma nova configuração
      const [newSettings] = await db.insert(siteSettings).values({
        logoUrl: logoRelativePath,
        faviconUrl: '/favicon.ico',
        siteName: 'DesignAuto',
        primaryColor: '#1e40af',
        footerText: '© DesignAuto App. Todos os direitos reservados.',
        metaDescription: 'Plataforma de designs automotivos personalizáveis',
        contactEmail: 'contato@designauto.app',
        updatedBy: (req.user as any)?.id || null
      }).returning();
      
      return res.json({ 
        success: true, 
        message: 'Logo carregado com sucesso', 
        logoUrl: logoRelativePath,
        settings: newSettings
      });
    } else {
      // Se existe, atualizar a configuração existente
      const [updatedSettings] = await db.update(siteSettings)
        .set({
          logoUrl: logoRelativePath,
          updatedAt: new Date(),
          updatedBy: (req.user as any)?.id || null
        })
        .where(eq(siteSettings.id, existingSettings[0].id))
        .returning();
      
      return res.json({ 
        success: true, 
        message: 'Logo atualizado com sucesso', 
        logoUrl: logoRelativePath,
        settings: updatedSettings
      });
    }
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar o upload do logo',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;