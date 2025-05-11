import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';

const router = express.Router();

// Configurar diretório para favicons
const faviconDir = path.join(process.cwd(), 'public/images/favicons');
if (!fs.existsSync(faviconDir)) {
  fs.mkdirSync(faviconDir, { recursive: true });
}

// Configuração de armazenamento em memória para processamento
const storage = multer.memoryStorage();

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

// Endpoint para upload do favicon
router.post('/', upload.single('favicon'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo enviado' 
      });
    }
    
    // Log para depuração
    console.log('Arquivo de favicon recebido:', req.file.originalname, 'tipo:', req.file.mimetype, 'tamanho:', req.file.size, 'bytes');
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(req.file.originalname) || '.png';
    
    const filename = `favicon_${timestamp}_${randomId}${extension}`;
    const outputPath = path.join(faviconDir, filename);
    
    // Processamento da imagem com Sharp
    // Se for um SVG, apenas salvar diretamente
    if (req.file.mimetype === 'image/svg+xml') {
      fs.writeFileSync(outputPath, req.file.buffer);
    } else {
      // Para outros formatos, redimensionar para tamanho padrão (32x32)
      await sharp(req.file.buffer)
        .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFile(outputPath);
    }
    
    // Caminho relativo para o banco de dados
    const faviconRelativePath = `/images/favicons/${filename}`;
    
    // Atualizar no banco de dados
    try {
      // Buscar a configuração existente
      const existingSettings = await db.select().from(siteSettings).limit(1);
      
      if (existingSettings.length === 0) {
        // Se não existe, criar uma nova configuração
        const [newSettings] = await db.insert(siteSettings).values({
          faviconUrl: faviconRelativePath,
          logoUrl: '/images/logo.png',
          siteName: 'DesignAuto',
          primaryColor: '#1e40af',
          footerText: '© DesignAuto App. Todos os direitos reservados.',
          metaDescription: 'Plataforma de designs automotivos personalizáveis',
          contactEmail: 'contato@designauto.app',
          updatedBy: (req.user as any)?.id || null
        }).returning();
        
        return res.json({ 
          success: true, 
          message: 'Favicon carregado com sucesso', 
          faviconUrl: faviconRelativePath,
          settings: newSettings
        });
      } else {
        // Se existe, atualizar a configuração
        const [updatedSettings] = await db.update(siteSettings)
          .set({
            faviconUrl: faviconRelativePath,
            updatedAt: new Date(),
            updatedBy: (req.user as any)?.id || null
          })
          .where(eq(siteSettings.id, existingSettings[0].id))
          .returning();
        
        return res.json({ 
          success: true, 
          message: 'Favicon atualizado com sucesso', 
          faviconUrl: faviconRelativePath,
          settings: updatedSettings
        });
      }
    } catch (dbError) {
      console.error('Erro ao atualizar o favicon no banco de dados:', dbError);
      
      // Tentar remover o arquivo se houve problema no banco
      try {
        fs.unlinkSync(outputPath);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo temporário:', unlinkError);
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao atualizar o favicon no banco de dados',
        error: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro no upload do favicon:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar o upload do favicon',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;