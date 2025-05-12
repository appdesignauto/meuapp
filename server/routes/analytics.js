import express from 'express';
import { db, pool } from '../db.js';
import { eq } from 'drizzle-orm';
import { analyticsSettings } from '../../shared/schema.js';
import { isAuthenticated, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/analytics - Obter configurações de analytics
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Busca as configurações 
    const settings = await db.select().from(analyticsSettings).limit(1);
    
    if (settings.length === 0) {
      // Se não houver configurações, criar uma configuração padrão
      const [newSettings] = await db.insert(analyticsSettings).values({
        metaPixelEnabled: false,
        ga4Enabled: false,
        gtmEnabled: false,
        clarityEnabled: false,
        hotjarEnabled: false,
        linkedinEnabled: false,
        tiktokEnabled: false,
        amplitudeEnabled: false,
        mixpanelEnabled: false,
        trackPageviews: true,
        trackClicks: false,
        trackFormSubmissions: false,
        trackArtsViewed: true,
        trackArtsDownloaded: true,
        updatedBy: req.user?.username || 'system'
      }).returning();
      
      return res.json(newSettings);
    }
    
    return res.json(settings[0]);
  } catch (error) {
    console.error('Erro ao buscar configurações de analytics:', error);
    return res.status(500).json({ message: 'Erro ao buscar configurações de analytics' });
  }
});

// PUT /api/analytics - Atualizar configurações de analytics
router.put('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'ID é obrigatório para atualização' });
    }
    
    // Adiciona informações de auditoria
    updateData.updatedAt = new Date();
    updateData.updatedBy = req.user?.username || 'system';
    
    // Atualiza as configurações
    const [updatedSettings] = await db.update(analyticsSettings)
      .set(updateData)
      .where(eq(analyticsSettings.id, id))
      .returning();
    
    return res.json(updatedSettings);
  } catch (error) {
    console.error('Erro ao atualizar configurações de analytics:', error);
    return res.status(500).json({ message: 'Erro ao atualizar configurações de analytics' });
  }
});

// GET /api/analytics/public - Obter configurações públicas para uso no cliente
router.get('/public', async (req, res) => {
  try {
    // Busca as configurações 
    const settings = await db.select().from(analyticsSettings).limit(1);
    
    if (settings.length === 0) {
      return res.json({
        metaPixelEnabled: false,
        metaPixelId: null,
        ga4Enabled: false,
        ga4MeasurementId: null,
        gtmEnabled: false,
        gtmContainerId: null,
        clarityEnabled: false,
        clarityProjectId: null,
        hotjarEnabled: false,
        hotjarSiteId: null,
        linkedinEnabled: false,
        linkedinPartnerId: null,
        tiktokEnabled: false,
        tiktokPixelId: null,
        amplitudeEnabled: false,
        amplitudeApiKey: null,
        mixpanelEnabled: false,
        mixpanelToken: null,
        trackPageviews: true,
        trackClicks: false,
        trackFormSubmissions: false,
        trackArtsViewed: true,
        trackArtsDownloaded: true
      });
    }
    
    // Filtrar apenas os campos que o cliente precisa ter acesso
    // Não retornar tokens secretos como metaAdsAccessToken e ga4ApiSecret
    const publicSettings = {
      metaPixelEnabled: settings[0].metaPixelEnabled,
      metaPixelId: settings[0].metaPixelId,
      ga4Enabled: settings[0].ga4Enabled,
      ga4MeasurementId: settings[0].ga4MeasurementId,
      gtmEnabled: settings[0].gtmEnabled,
      gtmContainerId: settings[0].gtmContainerId,
      clarityEnabled: settings[0].clarityEnabled,
      clarityProjectId: settings[0].clarityProjectId,
      hotjarEnabled: settings[0].hotjarEnabled,
      hotjarSiteId: settings[0].hotjarSiteId,
      linkedinEnabled: settings[0].linkedinEnabled,
      linkedinPartnerId: settings[0].linkedinPartnerId,
      tiktokEnabled: settings[0].tiktokEnabled,
      tiktokPixelId: settings[0].tiktokPixelId,
      amplitudeEnabled: settings[0].amplitudeEnabled,
      amplitudeApiKey: settings[0].amplitudeApiKey,
      mixpanelEnabled: settings[0].mixpanelEnabled,
      mixpanelToken: settings[0].mixpanelToken,
      trackPageviews: settings[0].trackPageviews,
      trackClicks: settings[0].trackClicks,
      trackFormSubmissions: settings[0].trackFormSubmissions,
      trackArtsViewed: settings[0].trackArtsViewed,
      trackArtsDownloaded: settings[0].trackArtsDownloaded
    };
    
    return res.json(publicSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações públicas de analytics:', error);
    return res.status(500).json({ message: 'Erro ao buscar configurações públicas de analytics' });
  }
});

export default router;