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
    
    cb(null, iconDir);
  },
  filename: function (req, file, cb) {
    // Nome padronizado para os ícones (icon-192.png ou icon-512.png)
    const size = req.body.size || '192';
    cb(null, `icon-${size}.png`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Apenas imagens são permitidas (.png, .jpg, .webp)'));
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

// Rota para fazer upload do ícone 192x192
router.post('/app-config/icon-192', checkAdmin, upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo foi enviado' 
      });
    }
    
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