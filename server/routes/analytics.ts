/**
 * Rotas para gerenciamento das configurações de analytics
 */

import express from 'express';
import { db } from '../db';
import { analyticsSettings } from "../../shared/schema";
import { eq } from 'drizzle-orm';

const router = express.Router();

// Middleware para verificar se o usuário é admin
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated() || req.user.nivelacesso !== 'admin') {
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
      gaId: settings.ga4MeasurementId,
      gtmId: settings.gtmContainerId,
      clarityId: settings.clarityProjectId,
      hotjarId: settings.hotjarSiteId,
      linkedinId: settings.linkedinPartnerId,
      tiktokId: settings.tiktokPixelId
    };
    
    res.json(clientSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações de analytics:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar configurações de analytics' });
  }
});

// Rota para obter as configurações de analytics (COMPLETAS para admin)
router.get('/settings', async (req, res) => {
  try {
    console.log('🔍 [Analytics Router /settings] Chamada recebida');
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      console.log('⚠️ [Analytics Router] Nenhuma configuração encontrada');
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    console.log('✅ [Analytics Router] Configurações completas encontradas:', {
      metaPixelId: settings.metaPixelId,
      ga4MeasurementId: settings.ga4MeasurementId,
      gtmContainerId: settings.gtmContainerId
    });
    
    // Retorna TODAS as configurações para o admin
    res.json(settings);
  } catch (error) {
    console.error('❌ [Analytics Router] Erro ao buscar configurações:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar configurações de analytics' });
  }
});



// Rota específica para configurações do Meta Pixel (para o script dinâmico)
router.get('/meta-pixel', async (req, res) => {
  try {
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    // Retorna configurações completas do Meta Pixel para o script
    const pixelSettings = {
      metaPixelId: settings.metaPixelId,
      metaPixelEnabled: settings.metaPixelEnabled,
      trackPageviews: settings.trackPageviews,
      trackClicks: settings.trackClicks,
      trackFormSubmissions: settings.trackFormSubmissions,
      trackArtsViewed: settings.trackArtsViewed,
      trackArtsDownloaded: settings.trackArtsDownloaded
    };
    
    res.json(pixelSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações do Meta Pixel:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar configurações do Meta Pixel' });
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
        ga4MeasurementId: gaId, 
        ga4Enabled: !!gaEnabled,
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
        gtmContainerId: gtmId, 
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
        clarityProjectId: clarityId, 
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
        hotjarSiteId: hotjarId, 
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
        linkedinPartnerId: linkedinId, 
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
        tiktokPixelId: tiktokId, 
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

// Rota unificada para atualizar todas as configurações de analytics
router.put('/admin/settings', isAdmin, async (req, res) => {
  try {
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    // Extract and validate only the allowed fields
    const {
      metaPixelId,
      metaPixelEnabled,
      metaAdsAccessToken,
      metaAdAccountId,
      metaAdsEnabled,
      ga4MeasurementId,
      ga4Enabled,
      ga4ApiSecret,
      gtmContainerId,
      gtmEnabled,
      googleAdsCustomerId,
      googleAdsConversionId,
      googleAdsConversionLabel,
      googleAdsEnabled,
      clarityProjectId,
      clarityEnabled,
      hotjarSiteId,
      hotjarEnabled,
      linkedinPartnerId,
      linkedinEnabled,
      tiktokPixelId,
      tiktokEnabled,
      amplitudeApiKey,
      amplitudeEnabled,
      mixpanelToken,
      mixpanelEnabled,
      trackPageviews,
      trackClicks,
      trackFormSubmissions,
      trackArtsViewed,
      trackArtsDownloaded,
      customScriptHead,
      customScriptBody,
      customScriptEnabled
    } = req.body;
    
    // Build update object with only defined values - no manual updatedAt since Drizzle handles it
    const updateData: any = {};
    
    // Only include fields that are explicitly provided
    if (metaPixelId !== undefined) updateData.metaPixelId = metaPixelId || '';
    if (metaPixelEnabled !== undefined) updateData.metaPixelEnabled = !!metaPixelEnabled;
    if (metaAdsAccessToken !== undefined) updateData.metaAdsAccessToken = metaAdsAccessToken || null;
    if (metaAdAccountId !== undefined) updateData.metaAdAccountId = metaAdAccountId || '';
    if (metaAdsEnabled !== undefined) updateData.metaAdsEnabled = !!metaAdsEnabled;
    if (ga4MeasurementId !== undefined) updateData.ga4MeasurementId = ga4MeasurementId || '';
    if (ga4Enabled !== undefined) updateData.ga4Enabled = !!ga4Enabled;
    if (ga4ApiSecret !== undefined) updateData.ga4ApiSecret = ga4ApiSecret || null;
    if (gtmContainerId !== undefined) updateData.gtmContainerId = gtmContainerId || '';
    if (gtmEnabled !== undefined) updateData.gtmEnabled = !!gtmEnabled;
    if (googleAdsCustomerId !== undefined) updateData.googleAdsCustomerId = googleAdsCustomerId || '';
    if (googleAdsConversionId !== undefined) updateData.googleAdsConversionId = googleAdsConversionId || '';
    if (googleAdsConversionLabel !== undefined) updateData.googleAdsConversionLabel = googleAdsConversionLabel || '';
    if (googleAdsEnabled !== undefined) updateData.googleAdsEnabled = !!googleAdsEnabled;
    if (clarityProjectId !== undefined) updateData.clarityProjectId = clarityProjectId || null;
    if (clarityEnabled !== undefined) updateData.clarityEnabled = !!clarityEnabled;
    if (hotjarSiteId !== undefined) updateData.hotjarSiteId = hotjarSiteId || null;
    if (hotjarEnabled !== undefined) updateData.hotjarEnabled = !!hotjarEnabled;
    if (linkedinPartnerId !== undefined) updateData.linkedinPartnerId = linkedinPartnerId || null;
    if (linkedinEnabled !== undefined) updateData.linkedinEnabled = !!linkedinEnabled;
    if (tiktokPixelId !== undefined) updateData.tiktokPixelId = tiktokPixelId || null;
    if (tiktokEnabled !== undefined) updateData.tiktokEnabled = !!tiktokEnabled;
    if (amplitudeApiKey !== undefined) updateData.amplitudeApiKey = amplitudeApiKey || null;
    if (amplitudeEnabled !== undefined) updateData.amplitudeEnabled = !!amplitudeEnabled;
    if (mixpanelToken !== undefined) updateData.mixpanelToken = mixpanelToken || null;
    if (mixpanelEnabled !== undefined) updateData.mixpanelEnabled = !!mixpanelEnabled;
    if (trackPageviews !== undefined) updateData.trackPageviews = !!trackPageviews;
    if (trackClicks !== undefined) updateData.trackClicks = !!trackClicks;
    if (trackFormSubmissions !== undefined) updateData.trackFormSubmissions = !!trackFormSubmissions;
    if (trackArtsViewed !== undefined) updateData.trackArtsViewed = !!trackArtsViewed;
    if (trackArtsDownloaded !== undefined) updateData.trackArtsDownloaded = !!trackArtsDownloaded;
    if (customScriptHead !== undefined) updateData.customScriptHead = customScriptHead || null;
    if (customScriptBody !== undefined) updateData.customScriptBody = customScriptBody || null;
    if (customScriptEnabled !== undefined) updateData.customScriptEnabled = !!customScriptEnabled;
    
    console.log('🔄 Atualizando configurações de analytics:', updateData);
    
    await db.update(analyticsSettings)
      .set(updateData)
      .where(eq(analyticsSettings.id, settings.id));
    
    console.log('✅ Configurações de analytics atualizadas com sucesso');
    res.json({ success: true, message: 'Configurações de analytics atualizadas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações de analytics:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações de analytics' });
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

// Rota para atualizar configurações de rastreamento
router.put('/admin/tracking-settings', isAdmin, async (req, res) => {
  try {
    const { trackPageviews, trackClicks, trackFormSubmissions, trackArtsViewed, trackArtsDownloaded } = req.body;
    
    const [settings] = await db.select().from(analyticsSettings);
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configurações de analytics não encontradas' });
    }
    
    await db.update(analyticsSettings)
      .set({ 
        trackPageviews: !!trackPageviews,
        trackClicks: !!trackClicks,
        trackFormSubmissions: !!trackFormSubmissions,
        trackArtsViewed: !!trackArtsViewed,
        trackArtsDownloaded: !!trackArtsDownloaded,
        updatedAt: new Date()
      })
      .where(eq(analyticsSettings.id, settings.id));
    
    res.json({ success: true, message: 'Configurações de rastreamento atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações de rastreamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações de rastreamento' });
  }
});

export default router;