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
  try {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Diretório temporário criado: ${tempDir}`);
  } catch (error) {
    console.error(`Erro ao criar diretório temporário:`, error);
    // Continuar mesmo com erro, o multer tentará criar o diretório novamente
  }
}

// Configurar o Multer para upload temporário (com manipulação de erro)
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
      format: 'webp' as const  // Especificando tipo literal para evitar erro de tipagem
    };
    
    const multerFile = {
      buffer: fileContent,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } as Express.Multer.File;
    
    // Chamar o método com o ID do usuário para melhor organização
    const uploadResult = await supabaseStorageService.uploadAvatar(multerFile, uploadOptions, userId);

    // Remover o arquivo temporário
    fs.unlinkSync(file.path);

    // O uploadResult agora retorna { imageUrl, storageType } em vez de { success, url, error }
    if (!uploadResult || !uploadResult.imageUrl) {
      console.error(`Erro no upload de avatar: resposta inválida`);
      return res.status(500).json({ error: 'Falha ao fazer upload do avatar', details: 'Resposta inválida do serviço de storage' });
    }

    // Log para debug
    console.log(`Avatar carregado com sucesso: ${uploadResult.imageUrl}`);
    console.log(`Tipo de armazenamento: ${uploadResult.storageType || 'não especificado'}`);

    // Atualizar URL do avatar no banco de dados
    await db.update(users)
      .set({ profileimageurl: uploadResult.imageUrl })
      .where(eq(users.id, userId));

    // Retornar sucesso com a URL do avatar
    res.json({ 
      success: true, 
      url: uploadResult.imageUrl, // Usando imageUrl em vez de url para corresponder ao retorno do serviço
      storageType: uploadResult.storageType,
      message: 'Avatar atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no upload de avatar:', error);
    res.status(500).json({ error: 'Falha ao fazer upload do avatar', details: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
});

export default router;