import { Router } from 'express';
import { db } from '../db';
import { popups, popupViews } from '../../shared/schema';
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
    
    // Fallback to working popup logic
    const allActivePopups = await db.query.popups.findMany({
      where: eq(popups.isActive, true),
      orderBy: [desc(popups.createdAt)],
    });
    
    const validPopup = { rows: [] };
    
    if (validPopup.rows.length > 0) {
      return res.json({
        hasActivePopup: true,
        popup: validPopup.rows[0],
        sessionId: currentSessionId
      });
    }
    
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
    
    // Verificar se popup existe
    const existingPopup = await db.query.popups.findFirst({
      where: eq(popups.id, popupId),
    });
    
    if (!existingPopup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    // Registrar visualização
    await db.insert(popupViews).values({
      popupId,
      userId,
      sessionId,
      action: action || 'view',
    });
    
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