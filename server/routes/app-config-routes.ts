/**
 * Rotas para gerenciar a configuração do Progressive Web App (PWA)
 * Permite que os administradores personalizem o manifest.json e outras configurações do PWA
 */

import express from 'express';
import { db } from '../db';
import { appConfig, insertAppConfigSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { checkAdmin } from '../middlewares/check-admin';

const router = express.Router();

// Configuração para upload dos ícones
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Diretório onde os ícones serão salvos
    const iconDir = './public/icons';
    
    // Verificar se o diretório existe, se não, criar
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }
    
    // Diretório temporário para processamento
    const tempDir = './temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    cb(null, tempDir); // Salvar primeiro em um diretório temporário
  },
  filename: function (req, file, cb) {
    // Gerar um nome único para evitar colisões
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Apenas imagens são permitidas (.png, .jpg, .webp, .svg)'));
    }
    cb(null, true);
  }
});

// Rota para buscar a configuração atual do PWA
router.get('/app-config', async (req, res) => {
  try {
    const configs = await db.select().from(appConfig);
    const config = configs.length > 0 ? configs[0] : null;
    
    return res.json({ success: true, config });
  } catch (error) {
    console.error('Erro ao buscar configuração do PWA:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar configuração do PWA' });
  }
});

// Rota para atualizar a configuração do PWA (exceto ícones)
router.post('/app-config', checkAdmin, async (req, res) => {
  try {
    const { name, short_name, theme_color, background_color } = req.body;
    
    if (!name || !short_name || !theme_color || !background_color) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos os campos são obrigatórios' 
      });
    }
    
    const configs = await db.select().from(appConfig);
    
    const userId = req.user?.id;
    
    if (configs.length === 0) {
      // Criar nova configuração
      await db.insert(appConfig).values({
        name,
        short_name,
        theme_color,
        background_color,
        updated_by: userId
      });
    } else {
      // Atualizar configuração existente
      await db.update(appConfig)
        .set({
          name,
          short_name,
          theme_color,
          background_color,
          updated_by: userId,
          updated_at: new Date()
        })
        .where(eq(appConfig.id, configs[0].id));
    }
    
    return res.json({ 
      success: true, 
      message: 'Configuração do PWA atualizada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração do PWA:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar configuração do PWA' 
    });
  }
});

// Função auxiliar para processar a imagem
async function processImage(file, size, targetPath) {
  try {
    // Importar sharp dinamicamente (apenas quando necessário)
    const sharp = await import('sharp');
    
    // Processar a imagem para o tamanho correto
    await sharp.default(file.path)
      .resize(size, size)
      .png() // Converter para PNG
      .toFile(targetPath);
      
    // Remover o arquivo temporário
    fs.unlinkSync(file.path);
    
    return true;
  } catch (error) {
    console.error(`Erro ao processar imagem para tamanho ${size}x${size}:`, error);
    // Se falhar o processamento, copiar o arquivo diretamente
    fs.copyFileSync(file.path, targetPath);
    fs.unlinkSync(file.path);
    return false;
  }
}

// Rota para fazer upload do ícone 192x192
router.post('/app-config/icon-192', checkAdmin, upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo foi enviado' 
      });
    }
    
    // Caminho de destino para o ícone
    const iconPath = './public/icons/icon-192.png';
    
    // Processar e salvar o ícone com o tamanho correto
    await processImage(req.file, 192, iconPath);
    
    const configs = await db.select().from(appConfig);
    const userId = req.user?.id;
    
    if (configs.length === 0) {
      // Criar nova configuração
      await db.insert(appConfig).values({
        icon_192: '/icons/icon-192.png',
        updated_by: userId
      });
    } else {
      // Atualizar configuração existente
      await db.update(appConfig)
        .set({
          icon_192: '/icons/icon-192.png',
          updated_by: userId,
          updated_at: new Date()
        })
        .where(eq(appConfig.id, configs[0].id));
    }
    
    return res.json({ 
      success: true, 
      message: 'Ícone 192x192 atualizado com sucesso',
      iconPath: '/icons/icon-192.png'
    });
  } catch (error) {
    console.error('Erro ao fazer upload do ícone 192x192:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao fazer upload do ícone 192x192' 
    });
  }
});

// Rota para fazer upload do ícone 512x512
router.post('/app-config/icon-512', checkAdmin, upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo foi enviado' 
      });
    }
    
    // Caminho de destino para o ícone
    const iconPath = './public/icons/icon-512.png';
    
    // Processar e salvar o ícone com o tamanho correto
    await processImage(req.file, 512, iconPath);
    
    const configs = await db.select().from(appConfig);
    const userId = req.user?.id;
    
    if (configs.length === 0) {
      // Criar nova configuração
      await db.insert(appConfig).values({
        icon_512: '/icons/icon-512.png',
        updated_by: userId
      });
    } else {
      // Atualizar configuração existente
      await db.update(appConfig)
        .set({
          icon_512: '/icons/icon-512.png',
          updated_by: userId,
          updated_at: new Date()
        })
        .where(eq(appConfig.id, configs[0].id));
    }
    
    return res.json({ 
      success: true, 
      message: 'Ícone 512x512 atualizado com sucesso',
      iconPath: '/icons/icon-512.png' 
    });
  } catch (error) {
    console.error('Erro ao fazer upload do ícone 512x512:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao fazer upload do ícone 512x512' 
    });
  }
});

export default router;