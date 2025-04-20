import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { supabaseStorageService } from '../services/supabase-storage';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configurar o Multer para upload temporário
const upload = multer({ 
  dest: tempDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // limitar a 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Endpoint para upload de avatar
router.post('/api/user/avatar', isAuthenticated, upload.single('avatar'), async (req: Request, res: Response) => {
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

    // Log para debugging
    console.log(`Iniciando upload de avatar para usuário ${userId}`);
    console.log(`Arquivo recebido: ${file.originalname}, tamanho: ${file.size}, tipo: ${file.mimetype}`);

    // Ler o arquivo do sistema de arquivos temporário
    const fileContent = fs.readFileSync(file.path);

    // Fazer upload via serviço Supabase
    const uploadOptions = {
      width: 250,
      height: 250,
      quality: 90,
      format: 'webp'
    };
    
    const multerFile = {
      buffer: fileContent,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } as Express.Multer.File;
    
    const uploadResult = await supabaseStorageService.uploadAvatar(multerFile, uploadOptions);

    // Remover o arquivo temporário
    fs.unlinkSync(file.path);

    if (!uploadResult.success) {
      console.error(`Erro no upload de avatar: ${uploadResult.error}`);
      return res.status(500).json({ error: 'Falha ao fazer upload do avatar', details: uploadResult.error });
    }

    // Atualizar URL do avatar no banco de dados
    await db.update(users)
      .set({ profileimageurl: uploadResult.url })
      .where(eq(users.id, userId));

    // Retornar sucesso com a URL do avatar
    res.json({ 
      success: true, 
      url: uploadResult.url,
      message: 'Avatar atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no upload de avatar:', error);
    res.status(500).json({ error: 'Falha ao fazer upload do avatar', details: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
});

export default router;