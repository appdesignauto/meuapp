import { Router } from 'express';
import { db } from '../db';
import { popups, popupViews, users } from '../../shared/schema';
import { eq, and, or, inArray, gte, lte, desc, count, sql } from 'drizzle-orm';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/popups';
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `popup-${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Apenas imagens JPG, PNG, WebP e GIF são permitidas.'));
    }
  },
});

// Endpoint para registrar visualização de popup com controle de duplicação
router.post('/track-view/:id', async (req, res) => {
  try {
    const popupId = parseInt(req.params.id);
    const sessionId = req.body.sessionId || 'anonymous';
    const userAgent = req.headers['user-agent'] || 'Desconhecido';
    const ip = req.ip || req.connection.remoteAddress || 'IP não identificado';
    
    console.log(`[POPUP VIEW] ID: ${popupId}, Session: ${sessionId}, IP: ${ip}`);
    
    // Verificar se o popup existe e está ativo
    const popup = await db
      .select()
      .from(popups)
      .where(and(eq(popups.id, popupId), eq(popups.isActive, true)))
      .limit(1);

    if (popup.length === 0) {
      console.log(`[POPUP VIEW] Popup ${popupId} não encontrado ou inativo`);
      return res.status(404).json({ error: 'Popup não encontrado ou inativo' });
    }

    // Deduplicação por sessão - Evita contagem excessiva (5 minutos)
    const trackingKey = `${popupId}_${sessionId}`;
    const currentTime = Date.now();
    
    // Cache de sessão para controle de visualizações
    if (!global.popupSessionCache) {
      global.popupSessionCache = new Map();
    }
    
    const lastView = global.popupSessionCache.get(trackingKey);
    if (lastView && (currentTime - lastView) < 300000) { // 5 minutos
      console.log(`[POPUP VIEW] Duplicata por sessão detectada para ${trackingKey}, ignorando`);
      return res.json({ success: true, message: 'Visualização já registrada nesta sessão' });
    }
    
    // Registrar timestamp atual
    global.popupSessionCache.set(trackingKey, currentTime);
    
    // Limpar cache antigo (manter apenas últimos 30 minutos)
    for (const [key, timestamp] of global.popupSessionCache.entries()) {
      if (currentTime - timestamp > 1800000) { // 30 minutos
        global.popupSessionCache.delete(key);
      }
    }

    // Buscar views atual antes do update
    const currentViews = popup[0].views || 0;
    console.log(`[POPUP VIEW] Views antes: ${currentViews}, incrementando para: ${currentViews + 1}`);

    // Incrementar contador de visualizações
    await db
      .update(popups)
      .set({ 
        views: sql`${popups.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(popups.id, popupId));

    // Registrar na tabela de visualizações para controle de duplicação
    await db.insert(popupViews).values({
      popupId,
      userId: req.isAuthenticated() ? req.user.id : null,
      sessionId,
      action: 'view',
    });

    console.log(`[POPUP VIEW] Visualização registrada com sucesso para popup ${popupId}`);
    res.json({ success: true, message: 'Visualização registrada' });
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para registrar clique no botão do popup
router.post('/track-click/:id', async (req, res) => {
  try {
    const popupId = parseInt(req.params.id);
    
    // Verificar se o popup existe e está ativo
    const popup = await db
      .select()
      .from(popups)
      .where(and(eq(popups.id, popupId), eq(popups.isActive, true)))
      .limit(1);

    if (popup.length === 0) {
      return res.status(404).json({ error: 'Popup não encontrado ou inativo' });
    }

    // Incrementar contador de cliques
    await db
      .update(popups)
      .set({ 
        clicks: sql`${popups.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(popups.id, popupId));

    res.json({ success: true, message: 'Clique registrado' });
  } catch (error) {
    console.error('Erro ao registrar clique:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para zerar estatísticas de todos os popups
router.post('/reset-stats', async (req, res) => {
  try {
    // Verificar se o usuário é admin
    if (!req.user || req.user.nivelacesso !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Zerar views e clicks de todos os popups
    await db
      .update(popups)
      .set({ 
        views: 0,
        clicks: 0,
        updatedAt: new Date()
      });

    res.json({ success: true, message: 'Estatísticas zeradas com sucesso' });
  } catch (error) {
    console.error('Erro ao zerar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter estatísticas dos popups para analytics
router.get('/analytics', async (req, res) => {
  try {
    // Buscar popups ativos
    const activePopupsCount = await db
      .select({ count: count() })
      .from(popups)
      .where(eq(popups.isActive, true));

    // Buscar total de visualizações e cliques reais das colunas da tabela popups
    const totalsResult = await db
      .select({
        totalViews: sql`SUM(${popups.views})`,
        totalClicks: sql`SUM(${popups.clicks})`
      })
      .from(popups);

    const totalViews = totalsResult[0]?.totalViews || 0;
    const totalClicks = totalsResult[0]?.totalClicks || 0;

    // Buscar contagem de usuários por tipo (apenas premium e free users reais)
    const freeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(inArray(users.nivelacesso, ['visitante', 'usuario']));

    const premiumUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(inArray(users.nivelacesso, ['premium']));

    // Calcular taxa de conversão real
    const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    const analytics = {
      activePopups: activePopupsCount[0]?.count || 0,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalViews: Number(totalViews),
      totalClicks: Number(totalClicks),
      averageClickRate: Math.round(conversionRate * 10) / 10,
      freeUsers: freeUsersResult[0]?.count || 0,
      premiumUsers: premiumUsersResult[0]?.count || 0
    };

    res.json(analytics);
  } catch (error) {
    console.error('Erro ao obter estatísticas dos popups:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas dos popups' });
  }
});

// Obter estatísticas individuais por popup
router.get('/individual-stats', async (req, res) => {
  try {
    // Buscar todos os popups com suas estatísticas reais do banco
    const popupsList = await db
      .select({
        id: popups.id,
        title: popups.title,
        views: popups.views,
        clicks: popups.clicks,
        isActive: popups.isActive,
        createdAt: popups.createdAt,
        position: popups.position,
        size: popups.size
      })
      .from(popups)
      .orderBy(desc(popups.createdAt));

    // Calcular estatísticas com dados reais
    const individualStats = popupsList.map((popup) => {
      const viewCount = popup.views || 0;
      const clickCount = popup.clicks || 0;
      const conversionRate = viewCount > 0 ? (clickCount / viewCount) * 100 : 0;

      return {
        id: popup.id,
        title: popup.title || `Popup #${popup.id}`,
        views: viewCount,
        clicks: clickCount,
        conversionRate: Math.round(conversionRate * 10) / 10,
        isActive: popup.isActive,
        createdAt: popup.createdAt.toISOString(),
        position: popup.position,
        size: popup.size
      };
    });

    res.json(individualStats);
  } catch (error) {
    console.error('Erro ao obter estatísticas individuais dos popups:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas individuais dos popups' });
  }
});

// Obter todos os popups
router.get('/', async (req, res) => {
  try {
    const popupsList = await db.query.popups.findMany({
      orderBy: [desc(popups.createdAt)],
    });
    
    res.json(popupsList);
  } catch (error) {
    console.error('Erro ao obter popups:', error);
    res.status(500).json({ message: 'Erro ao obter popups' });
  }
});

// Optimized popup active endpoint - single query approach
router.get('/active', async (req, res) => {
  try {
    const { sessionId, currentPath } = req.query;
    const userId = req.isAuthenticated() ? req.user?.id : undefined;
    const userRole = req.isAuthenticated() ? req.user?.nivelacesso : 'visitante';
    const currentSessionId = sessionId || uuidv4();
    const now = new Date();
    
    console.log(`[POPUP DEBUG] Buscando popups ativos para usuário ${userId || 'visitante'}, página: ${currentPath}`);
    
    // Buscar todos os popups ativos
    const allActivePopups = await db.query.popups.findMany({
      where: and(
        eq(popups.isActive, true),
        lte(popups.startDate, now),
        gte(popups.endDate, now)
      ),
      orderBy: [desc(popups.createdAt)],
    });
    
    console.log(`[POPUP DEBUG] Encontrados ${allActivePopups.length} popups ativos no período válido`);
    
    if (allActivePopups.length > 0) {
      // Filtrar por páginas específicas se configurado
      let validPopups = allActivePopups.filter(popup => {
        // Se não há páginas específicas configuradas, mostrar em todas as páginas
        if (!popup.pages || popup.pages.length === 0) {
          return true;
        }
        
        // Se há páginas específicas, verificar se a página atual está incluída
        const currentPageNormalized = currentPath || 'home';
        return popup.pages.includes(currentPageNormalized);
      });
      
      console.log(`[POPUP DEBUG] ${validPopups.length} popups válidos após filtro de páginas`);
      
      // Filtrar por tipo de usuário
      validPopups = validPopups.filter(popup => {
        if (userId) {
          // Usuário logado
          if (userRole === 'premium' && !popup.showToPremiumUsers) return false;
          if (userRole !== 'premium' && !popup.showToLoggedUsers) return false;
        } else {
          // Usuário visitante
          if (!popup.showToGuestUsers) return false;
        }
        return true;
      });
      
      console.log(`[POPUP DEBUG] ${validPopups.length} popups válidos após filtro de usuários`);
      
      if (validPopups.length > 0) {
        const selectedPopup = validPopups[0];
        console.log(`[POPUP DEBUG] Popup selecionado: ${selectedPopup.title} (ID: ${selectedPopup.id})`);
        
        return res.json({
          hasActivePopup: true,
          popup: selectedPopup,
          sessionId: currentSessionId
        });
      }
    }
    
    console.log(`[POPUP DEBUG] Nenhum popup válido encontrado`);
    res.json({ hasActivePopup: false, sessionId: currentSessionId });
  } catch (error) {
    console.error('Erro ao buscar popups ativos:', error);
    res.status(500).json({ message: 'Erro ao buscar popups ativos' });
  }
});

// Criar novo popup
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const jsonData = JSON.parse(req.body.data);
    
    // Verificar usuário autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    // Verificar datas
    const startDate = new Date(jsonData.startDate);
    const endDate = new Date(jsonData.endDate);
    
    if (startDate > endDate) {
      return res.status(400).json({ message: 'A data de início deve ser anterior à data de término' });
    }
    
    // Processar upload de imagem
    let imageUrl = jsonData.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/popups/${req.file.filename}`;
    }
    
    // Criar novo popup
    const [newPopup] = await db.insert(popups).values({
      title: jsonData.title,
      content: jsonData.content,
      imageUrl,
      buttonText: jsonData.buttonText,
      buttonUrl: jsonData.buttonUrl,
      backgroundColor: jsonData.backgroundColor || '#FFFFFF',
      textColor: jsonData.textColor || '#000000',
      buttonColor: jsonData.buttonColor || '#4F46E5',
      buttonTextColor: jsonData.buttonTextColor || '#FFFFFF',
      buttonRadius: jsonData.buttonRadius || 4,
      buttonWidth: jsonData.buttonWidth || 'auto',
      position: jsonData.position || 'center',
      size: jsonData.size || 'medium',
      animation: jsonData.animation || 'fade',
      startDate,
      endDate,
      showOnce: jsonData.showOnce || false,
      showToLoggedUsers: jsonData.showToLoggedUsers !== undefined ? jsonData.showToLoggedUsers : true,
      showToGuestUsers: jsonData.showToGuestUsers !== undefined ? jsonData.showToGuestUsers : true,
      showToPremiumUsers: jsonData.showToPremiumUsers !== undefined ? jsonData.showToPremiumUsers : true,
      frequency: jsonData.frequency || 1,
      delay: jsonData.delay || 2,
      isActive: jsonData.isActive !== undefined ? jsonData.isActive : true,
      createdBy: req.user.id,
      pages: jsonData.pages || [], // Lista de páginas onde o popup será exibido
      userRoles: jsonData.userRoles || [], // Lista de funções de usuário que podem ver o popup
    }).returning();
    
    res.status(201).json(newPopup);
  } catch (error) {
    console.error('Erro ao criar popup:', error);
    res.status(500).json({ message: 'Erro ao criar popup' });
  }
});

// Atualizar popup
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const jsonData = JSON.parse(req.body.data);
    
    // Verificar usuário autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    // Verificar se popup existe
    const existingPopup = await db.query.popups.findFirst({
      where: eq(popups.id, parseInt(id)),
    });
    
    if (!existingPopup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    // Verificar datas
    const startDate = new Date(jsonData.startDate);
    const endDate = new Date(jsonData.endDate);
    
    if (startDate > endDate) {
      return res.status(400).json({ message: 'A data de início deve ser anterior à data de término' });
    }
    
    // Processar upload de imagem
    let imageUrl = jsonData.imageUrl;
    if (req.file) {
      // Remover imagem antiga se existir
      if (existingPopup.imageUrl && existingPopup.imageUrl.startsWith('/uploads/popups/')) {
        const oldImagePath = path.join(process.cwd(), 'public', existingPopup.imageUrl);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error('Erro ao excluir imagem antiga:', err);
        }
      }
      
      imageUrl = `/uploads/popups/${req.file.filename}`;
    }
    
    // Atualizar popup
    const [updatedPopup] = await db.update(popups)
      .set({
        title: jsonData.title,
        content: jsonData.content,
        imageUrl,
        buttonText: jsonData.buttonText,
        buttonUrl: jsonData.buttonUrl,
        backgroundColor: jsonData.backgroundColor || '#FFFFFF',
        textColor: jsonData.textColor || '#000000',
        buttonColor: jsonData.buttonColor || '#4F46E5',
        buttonTextColor: jsonData.buttonTextColor || '#FFFFFF',
        buttonRadius: jsonData.buttonRadius || 4,
        buttonWidth: jsonData.buttonWidth || 'auto',
        position: jsonData.position || 'center',
        size: jsonData.size || 'medium',
        animation: jsonData.animation || 'fade',
        startDate,
        endDate,
        showOnce: jsonData.showOnce || false,
        showToLoggedUsers: jsonData.showToLoggedUsers !== undefined ? jsonData.showToLoggedUsers : true,
        showToGuestUsers: jsonData.showToGuestUsers !== undefined ? jsonData.showToGuestUsers : true,
        showToPremiumUsers: jsonData.showToPremiumUsers !== undefined ? jsonData.showToPremiumUsers : true,
        frequency: jsonData.frequency || 1,
        delay: jsonData.delay || 2,
        isActive: jsonData.isActive !== undefined ? jsonData.isActive : true,
        updatedAt: new Date(),
        pages: jsonData.pages || [], // Lista de páginas onde o popup será exibido
        userRoles: jsonData.userRoles || [], // Lista de funções de usuário que podem ver o popup
      })
      .where(eq(popups.id, parseInt(id)))
      .returning();
    
    res.json(updatedPopup);
  } catch (error) {
    console.error('Erro ao atualizar popup:', error);
    res.status(500).json({ message: 'Erro ao atualizar popup' });
  }
});

// Excluir popup
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar usuário autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    // Verificar se popup existe
    const existingPopup = await db.query.popups.findFirst({
      where: eq(popups.id, parseInt(id)),
    });
    
    if (!existingPopup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    // Remover imagem se existir
    if (existingPopup.imageUrl && existingPopup.imageUrl.startsWith('/uploads/popups/')) {
      const imagePath = path.join(process.cwd(), 'public', existingPopup.imageUrl);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error('Erro ao excluir imagem:', err);
      }
    }
    
    // Primeiro excluir as visualizações relacionadas
    await db.delete(popupViews).where(eq(popupViews.popupId, parseInt(id)));
    
    // Depois excluir o popup
    await db.delete(popups).where(eq(popups.id, parseInt(id)));
    
    res.json({ message: 'Popup excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir popup:', error);
    res.status(500).json({ message: 'Erro ao excluir popup' });
  }
});

// Registrar visualização/interação com popup
router.post('/view', async (req, res) => {
  try {
    const { popupId, sessionId, action } = req.body;
    const userId = req.isAuthenticated() ? req.user.id : null;
    const userAgent = req.headers['user-agent'] || 'Desconhecido';
    const ip = req.ip || req.connection.remoteAddress || 'IP não identificado';
    
    console.log(`[POPUP VIEW OLD] Chamada antiga detectada - ID: ${popupId}, IP: ${ip}, UserAgent: ${userAgent.substring(0, 50)}...`);
    
    // Verificar se popup existe e está ativo
    const existingPopup = await db.query.popups.findFirst({
      where: and(eq(popups.id, popupId), eq(popups.isActive, true)),
    });
    
    if (!existingPopup) {
      console.log(`[POPUP VIEW OLD] Popup ${popupId} não encontrado ou inativo`);
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    // Usar o novo sistema de contagem direta nas colunas
    console.log(`[POPUP VIEW OLD] Redirecionando para sistema novo - Views antes: ${existingPopup.views || 0}`);
    
    // Incrementar contador de visualizações diretamente
    await db
      .update(popups)
      .set({ 
        views: sql`${popups.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(popups.id, popupId));
    
    console.log(`[POPUP VIEW OLD] Sistema antigo processado - nova contagem: ${(existingPopup.views || 0) + 1}`);
    res.status(201).json({ message: 'Visualização registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
    res.status(500).json({ message: 'Erro ao registrar visualização' });
  }
});

// Obter estatísticas de um popup
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar usuário autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    // Verificar se popup existe
    const existingPopup = await db.query.popups.findFirst({
      where: eq(popups.id, parseInt(id)),
    });
    
    if (!existingPopup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    // Total de visualizações
    const totalViewsResult = await db
      .select({ count: count() })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, parseInt(id)),
          eq(popupViews.action, 'view')
        )
      );
    
    const totalViews = totalViewsResult[0].count;
    
    // Total de cliques
    const totalClicksResult = await db
      .select({ count: count() })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, parseInt(id)),
          eq(popupViews.action, 'click')
        )
      );
    
    const totalClicks = totalClicksResult[0].count;
    
    // Total de fechamentos
    const totalDismissesResult = await db
      .select({ count: count() })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, parseInt(id)),
          eq(popupViews.action, 'dismiss')
        )
      );
    
    const totalDismisses = totalDismissesResult[0].count;
    
    // Usuários únicos
    const uniqueUsersResult = await db
      .select({ count: sql<number>`count(distinct ${popupViews.userId})` })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, parseInt(id)),
          sql`${popupViews.userId} is not null`
        )
      );
    
    const uniqueUsers = uniqueUsersResult[0].count;
    
    // Sessões únicas
    const uniqueSessionsResult = await db
      .select({ count: sql<number>`count(distinct ${popupViews.sessionId})` })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, parseInt(id)),
          sql`${popupViews.sessionId} is not null`
        )
      );
    
    const uniqueSessions = uniqueSessionsResult[0].count;
    
    // Taxa de conversão (cliques / visualizações)
    const conversionRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;
    
    res.json({
      totalViews,
      totalClicks,
      totalDismisses,
      uniqueUsers,
      uniqueSessions,
      conversionRate
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
});

// Alternar status de ativo/inativo do popup (toggle)
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    // Verificar usuário autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    // Verificar se popup existe
    const existingPopup = await db.query.popups.findFirst({
      where: eq(popups.id, parseInt(id)),
    });
    
    if (!existingPopup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    // Atualizar somente o status de ativo/inativo
    const [updatedPopup] = await db.update(popups)
      .set({
        isActive: isActive,
        updatedAt: new Date(),
      })
      .where(eq(popups.id, parseInt(id)))
      .returning();
    
    res.json(updatedPopup);
  } catch (error) {
    console.error('Erro ao alterar status do popup:', error);
    res.status(500).json({ message: 'Erro ao alterar status do popup' });
  }
});

export default router;