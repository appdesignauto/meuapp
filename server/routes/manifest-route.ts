/**
 * Rota para o manifest.json do PWA que é gerado dinamicamente
 * com base nas configurações feitas no painel de administração
 */

import express from 'express';
import { db } from '../db';
import { appConfig } from '@shared/schema';

const router = express.Router();

// Rota para obter o manifest.json
router.get('/manifest.json', async (req, res) => {
  try {
    // Buscar configurações do PWA
    const configs = await db.select().from(appConfig);
    
    // Se não houver configuração, usar valores padrão
    const defaultConfig = {
      name: 'DesignAuto',
      short_name: 'DesignAuto',
      theme_color: '#1e40af',
      background_color: '#ffffff',
      icon_192: '/icons/icon-192.png',
      icon_512: '/icons/icon-512.png'
    };
    
    // Mapeando os nomes de campo do banco para o manifest
    const config = configs.length > 0 ? {
      name: configs[0].name,
      short_name: configs[0].short_name,
      theme_color: configs[0].theme_color,
      background_color: configs[0].background_color,
      icon_192: configs[0].icon_192,
      icon_512: configs[0].icon_512
    } : defaultConfig;
    
    // Adicionar timestamp nos ícones para evitar cache
    const timestamp = Date.now();
    const icon192WithTimestamp = `${config.icon_192}?t=${timestamp}`;
    const icon512WithTimestamp = `${config.icon_512}?t=${timestamp}`;
    
    console.log('Gerando manifest.json com ícones:');
    console.log('- Ícone 192x192:', icon192WithTimestamp);
    console.log('- Ícone 512x512:', icon512WithTimestamp);
    
    // Construir o objeto manifest
    const manifest = {
      name: config.name,
      short_name: config.short_name,
      start_url: '/',
      display: 'standalone',
      theme_color: config.theme_color,
      background_color: config.background_color,
      icons: [
        {
          src: icon192WithTimestamp,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: icon192WithTimestamp,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: icon512WithTimestamp,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: icon512WithTimestamp,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      id: '/',
      orientation: 'any',
      scope: '/',
      screenshots: [
        {
          src: '/screenshots/home.png?t=' + timestamp,
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide'
        },
        {
          src: '/screenshots/mobile.png?t=' + timestamp,
          sizes: '540x1080',
          type: 'image/png',
          form_factor: 'narrow'
        }
      ],
      description: "Plataforma de artes automobilísticas editáveis para profissionais de vendas."
    };
    
    // Definir cabeçalhos corretos para o manifest
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Enviar o manifest como JSON
    return res.json(manifest);
  } catch (error) {
    console.error('Erro ao gerar manifest.json:', error);
    return res.status(500).json({ error: 'Erro ao gerar manifest.json' });
  }
});

export default router;