/**
 * Rotas para gerenciamento das configurações de analytics
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { analyticsSettings } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

// Middleware para verificar se o usuário é admin
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || req.user.nivelAcesso !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso negado. Permissão de administrador necessária.' });
  }
  next();
};

// Rota para obter as configurações de analytics
router.get('/', async (req, res) => {
  try {
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    // Retorna somente os scripts/IDs necessários para os clientes
    // e não todas as configurações internas
    const clientSettings = {
      metaPixelId: settings.metaPixelId,
      gaId: settings.gaId,
      gtmId: settings.gtmId,
      clarityId: settings.clarityId,
      hotjarId: settings.hotjarId,
      linkedinId: settings.linkedinId,
      tiktokId: settings.tiktokId
    };
    
    res.json(clientSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações de analytics:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar configurações de analytics' });
  }
});

// Rotas administrativas abaixo
// Todas requerem autenticação de admin

// Rota para obter todas as configurações de analytics (para painel admin)
router.get('/admin', isAdmin, async (req, res) => {
  try {
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações de analytics (admin):', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar configurações de analytics' });
  }
});

// Rota para atualizar configurações de Meta Pixel
router.put('/admin/meta-pixel', isAdmin, async (req, res) => {
  try {
    const { metaPixelId, metaPixelEnabled } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        metaPixelId, 
        metaPixelEnabled: !!metaPixelEnabled,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Configurações do Meta Pixel atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações do Meta Pixel:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações do Meta Pixel' });
  }
});

// Rota para atualizar configurações de Google Analytics
router.put('/admin/google-analytics', isAdmin, async (req, res) => {
  try {
    const { gaId, gaEnabled } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        gaId, 
        gaEnabled: !!gaEnabled,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Configurações do Google Analytics atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações do Google Analytics:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações do Google Analytics' });
  }
});

// Rota para atualizar configurações do Google Tag Manager
router.put('/admin/google-tag-manager', isAdmin, async (req, res) => {
  try {
    const { gtmId, gtmEnabled } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        gtmId, 
        gtmEnabled: !!gtmEnabled,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Configurações do Google Tag Manager atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações do Google Tag Manager:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações do Google Tag Manager' });
  }
});

// Rota para atualizar configurações do Microsoft Clarity
router.put('/admin/clarity', isAdmin, async (req, res) => {
  try {
    const { clarityId, clarityEnabled } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        clarityId, 
        clarityEnabled: !!clarityEnabled,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Configurações do Microsoft Clarity atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações do Microsoft Clarity:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações do Microsoft Clarity' });
  }
});

// Rota para atualizar configurações do Hotjar
router.put('/admin/hotjar', isAdmin, async (req, res) => {
  try {
    const { hotjarId, hotjarEnabled } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        hotjarId, 
        hotjarEnabled: !!hotjarEnabled,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Configurações do Hotjar atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações do Hotjar:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações do Hotjar' });
  }
});

// Rota para atualizar configurações do LinkedIn Insight Tag
router.put('/admin/linkedin', isAdmin, async (req, res) => {
  try {
    const { linkedinId, linkedinEnabled } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        linkedinId, 
        linkedinEnabled: !!linkedinEnabled,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Configurações do LinkedIn Insight Tag atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações do LinkedIn Insight Tag:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações do LinkedIn Insight Tag' });
  }
});

// Rota para atualizar configurações do TikTok Pixel
router.put('/admin/tiktok', isAdmin, async (req, res) => {
  try {
    const { tiktokId, tiktokEnabled } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        tiktokId, 
        tiktokEnabled: !!tiktokEnabled,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Configurações do TikTok Pixel atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações do TikTok Pixel:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações do TikTok Pixel' });
  }
});

// Rota para atualizar configurações de custom scripts
router.put('/admin/custom-scripts', isAdmin, async (req, res) => {
  try {
    const { 
      customScriptHead, 
      customScriptBody, 
      customScriptEnabled 
    } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        customScriptHead: customScriptHead || '', 
        customScriptBody: customScriptBody || '',
        customScriptEnabled: !!customScriptEnabled,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Scripts personalizados atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar scripts personalizados:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar scripts personalizados' });
  }
});

module.exports = router;