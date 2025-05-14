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

// Obter um popup ativo para o usuário/sessão atual
router.get('/active', async (req, res) => {
  try {
    const { sessionId, currentPath } = req.query;
    const userId = req.isAuthenticated() ? req.user?.id : undefined;
    const userRole = req.isAuthenticated() ? req.user?.nivelacesso : 'visitante';
    
    // Criar sessionId para visitantes se não existir
    const currentSessionId = sessionId || uuidv4();
    
    // Obter data atual
    const now = new Date();
    
    console.log('DEBUG - Verificando popups ativos:');
    console.log('- Data atual:', now);
    console.log('- Usuário logado:', userId ? 'Sim' : 'Não', 'ID:', userId);
    console.log('- Nível de acesso:', userRole);
    console.log('- Página atual:', currentPath);
    
    // Primeiro, buscar todos os popups ativos no banco
    const allActivePopups = await db.query.popups.findMany({
      where: eq(popups.isActive, true),
      orderBy: [desc(popups.createdAt)],
    });
    
    console.log('- Total de popups ativos no banco:', allActivePopups.length);
    
    if (allActivePopups.length > 0) {
      // Verificar condições de data e segmentação para cada popup
      allActivePopups.forEach(popup => {
        console.log('Popup ID:', popup.id, 'Título:', popup.title);
        console.log('- É ativo:', popup.isActive);
        console.log('- Data de início:', popup.startDate, popup.startDate <= now ? 'VÁLIDA' : 'INVÁLIDA');
        console.log('- Data de término:', popup.endDate, popup.endDate >= now ? 'VÁLIDA' : 'INVÁLIDA');
        console.log('- Mostra para usuários logados:', popup.showToLoggedUsers);
        console.log('- Mostra para visitantes:', popup.showToGuestUsers);
        console.log('- Mostra para usuários premium:', popup.showToPremiumUsers);
        console.log('- Páginas permitidas:', popup.pages ? popup.pages.join(', ') : 'Todas');
        console.log('- Funções de usuário permitidas:', popup.userRoles ? popup.userRoles.join(', ') : 'Todas');
      });
    }
    
    // Construir condições de filtro para seleção de popups
    const conditions = and(
      eq(popups.isActive, true),
      lte(popups.startDate, now),
      gte(popups.endDate, now),
      // Verificar segmentação por tipo de usuário
      or(
        // Para usuários logados
        userId ? eq(popups.showToLoggedUsers, true) : undefined,
        // Para visitantes (não logados)
        !userId ? eq(popups.showToGuestUsers, true) : undefined,
        // Para usuários premium
        userId && userRole === 'premium' ? eq(popups.showToPremiumUsers, true) : undefined
      )
    );
    
    // Buscar popups adequados para o usuário atual
    const availablePopups = await db.query.popups.findMany({
      where: conditions,
      orderBy: [desc(popups.createdAt)],
    });
    
    console.log('- Popups que passaram em todas as condições iniciais:', availablePopups.length);
    
    if (availablePopups.length === 0) {
      return res.json({ hasActivePopup: false, sessionId: currentSessionId });
    }
    
    // Filtrar ainda mais com base na página atual
    const pageFilteredPopups = availablePopups.filter(popup => {
      // Se o campo pages estiver vazio ou for null, mostrar em todas as páginas
      if (!popup.pages || popup.pages.length === 0) {
        return true;
      }
      
      // Converter currentPath para string para comparação segura
      const pathToCheck = currentPath?.toString() || 'home';
      
      // Verificar se a página atual está na lista de páginas permitidas
      return popup.pages.includes(pathToCheck);
    });
    
    console.log('- Popups que passaram no filtro de páginas:', pageFilteredPopups.length);
    
    if (pageFilteredPopups.length === 0) {
      return res.json({ hasActivePopup: false, sessionId: currentSessionId });
    }
    
    // Para cada popup disponível, verificar regras adicionais
    for (const popup of pageFilteredPopups) {
      // 1. Se popup é para ser mostrado apenas uma vez, verificar se já foi visto
      if (popup.showOnce) {
        if (userId) {
          // Verificar se o usuário já viu este popup
          const viewCount = await db
            .select({ count: count() })
            .from(popupViews)
            .where(
              and(
                eq(popupViews.popupId, popup.id),
                eq(popupViews.userId, userId)
              )
            );
            
          if (viewCount[0].count > 0) {
            // Usuário já viu este popup, verificar próximo
            continue;
          }
        } else if (sessionId) {
          // Verificar se esta sessão já viu este popup
          const viewCount = await db
            .select({ count: count() })
            .from(popupViews)
            .where(
              and(
                eq(popupViews.popupId, popup.id),
                eq(popupViews.sessionId, sessionId as string)
              )
            );
            
          if (viewCount[0].count > 0) {
            // Esta sessão já viu este popup, verificar próximo
            continue;
          }
        }
      }
      
      // 2. Verificar frequência (se frequency > 1)
      if (popup.frequency && popup.frequency > 1) {
        let viewCount = 0;
        
        if (userId) {
          // Contar visualizações do usuário
          const result = await db
            .select({ count: count() })
            .from(popupViews)
            .where(eq(popupViews.userId, userId));
            
          viewCount = result[0].count;
        } else if (sessionId) {
          // Contar visualizações da sessão
          const result = await db
            .select({ count: count() })
            .from(popupViews)
            .where(eq(popupViews.sessionId, sessionId as string));
            
          viewCount = result[0].count;
        }
        
        // Verificar se é a vez de mostrar este popup com base na frequência
        const frequency = popup.frequency || 1; // Fallback para 1 se for null
        if (viewCount % frequency !== 0) {
          continue;
        }
      }
      
      // Popup válido para exibição, retornar
      return res.json({
        hasActivePopup: true,
        popup,
        sessionId: currentSessionId
      });
    }
    
    // Nenhum popup adequado encontrado
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
    
    // Log para verificar se o status está sendo alterado
    console.log('Status atual do popup no DB:', existingPopup.isActive);
    console.log('Status recebido do cliente:', jsonData.isActive);
    
    // Atualizar popup - Não alteramos mais o status isActive aqui
    // Em vez disso, usamos a rota específica de toggle
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
        // Mantemos o status atual em vez de usar o recebido do cliente
        isActive: existingPopup.isActive,
        updatedAt: new Date(),
        pages: jsonData.pages || [], // Lista de páginas onde o popup será exibido
        userRoles: jsonData.userRoles || [], // Lista de funções de usuário que podem ver o popup
      })
      .where(eq(popups.id, parseInt(id)))
      .returning();
    
    console.log(`Popup ID ${id} atualizado. Status: ${updatedPopup.isActive}`);
    
    // Limpeza de cache para garantir estado correto
    // Remover todas as entradas de visualização para esse popup
    await db.delete(popupViews)
      .where(eq(popupViews.popupId, parseInt(id)));
    
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

// Toggle ativo/inativo de um popup
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    // Ignoramos o valor enviado pelo cliente
    
    // Verificar usuário autenticado
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    // Verificar se o usuário é administrador
    if (req.user.nivelacesso !== 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem alterar o status de popups' });
    }
    
    // Verificar se popup existe e obter seu status atual
    const existingPopup = await db.query.popups.findFirst({
      where: eq(popups.id, parseInt(id)),
    });
    
    if (!existingPopup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    // Inverter o status atual do popup
    const novoStatus = !existingPopup.isActive;
    
    console.log(`Invertendo status do popup ${id}: de ${existingPopup.isActive} para ${novoStatus}`);
    
    // Atualizar o status com o valor INVERSO ao atual
    const [updatedPopup] = await db.update(popups)
      .set({
        isActive: novoStatus,
        updatedAt: new Date(),
      })
      .where(eq(popups.id, parseInt(id)))
      .returning();
    
    // Limpeza de cache: Remover todas as entradas de visualização para esse popup
    // Isso garante que o popup será reavaliado na próxima vez
    await db.delete(popupViews)
      .where(eq(popupViews.popupId, parseInt(id)));
    
    console.log(`Popup ID ${id} atualizado: isActive=${novoStatus}`);
    console.log(`Cache de visualizações limpo para o popup ID ${id}`);
    
    res.json(updatedPopup);
  } catch (error) {
    console.error('Erro ao alterar status do popup:', error);
    res.status(500).json({ message: 'Erro ao alterar status do popup' });
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

export default router;