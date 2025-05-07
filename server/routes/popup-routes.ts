import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { popups, popupViews, insertPopupSchema, insertPopupViewSchema } from '@shared/schema';
import { eq, and, gte, lte, desc, or, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/popups';
    
    // Criar o diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Apenas imagens permitidas
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos (jpg, jpeg, png, gif, webp)'));
    }
  }
});

// Middleware para verificar se o usuário é admin
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  const user = req.user as Express.User;
  if (user.nivelacesso !== 'admin' && user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  
  next();
};

// Obter popups ativos para exibir para o usuário
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const sessionId = req.query.sessionId as string || uuidv4();
    
    // Para usuários autenticados, verificamos as regras específicas para eles
    if (req.isAuthenticated()) {
      const user = req.user as Express.User;
      const isPremium = user.nivelacesso === 'premium' || user.acessovitalicio || 
                        user.dataexpiracao ? new Date(user.dataexpiracao) > now : false;
      
      // Buscar popups ativos para o usuário logado, considerando restrições
      const activePopups = await db.select()
        .from(popups)
        .where(
          and(
            eq(popups.isActive, true),
            lte(popups.startDate, now),
            gte(popups.endDate, now),
            eq(popups.showToLoggedUsers, true),
            or(
              eq(popups.showToPremiumUsers, true),
              eq(isPremium, false)
            )
          )
        )
        .orderBy(desc(popups.createdAt))
        .limit(1);
      
      if (activePopups.length === 0) {
        return res.status(200).json({ hasActivePopup: false });
      }
      
      const popup = activePopups[0];
      
      // Verificar se o popup já foi visualizado, caso seja showOnce
      if (popup.showOnce) {
        const viewedCount = await db.select({ count: sql`count(*)` })
          .from(popupViews)
          .where(
            and(
              eq(popupViews.popupId, popup.id),
              eq(popupViews.userId, user.id)
            )
          );
        
        if (parseInt(viewedCount[0].count) > 0) {
          return res.status(200).json({ hasActivePopup: false });
        }
      }
      
      // Verificar a frequência de exibição
      if (popup.frequency > 1) {
        const viewCount = await db.select({ count: sql`count(*)` })
          .from(popupViews)
          .where(
            and(
              eq(popupViews.popupId, popup.id),
              eq(popupViews.userId, user.id)
            )
          );
          
        const count = parseInt(viewCount[0].count);
        if (count % popup.frequency !== 0) {
          return res.status(200).json({ hasActivePopup: false });
        }
      }
      
      return res.status(200).json({ 
        hasActivePopup: true, 
        popup,
        sessionId
      });
    }
    // Para usuários não autenticados (visitantes)
    else {
      // Buscar popups ativos para visitantes
      const activePopups = await db.select()
        .from(popups)
        .where(
          and(
            eq(popups.isActive, true),
            lte(popups.startDate, now),
            gte(popups.endDate, now),
            eq(popups.showToGuestUsers, true)
          )
        )
        .orderBy(desc(popups.createdAt))
        .limit(1);
      
      if (activePopups.length === 0) {
        return res.status(200).json({ hasActivePopup: false });
      }
      
      const popup = activePopups[0];
      
      // Verificar se o popup já foi visualizado, caso seja showOnce
      if (popup.showOnce) {
        const viewedCount = await db.select({ count: sql`count(*)` })
          .from(popupViews)
          .where(
            and(
              eq(popupViews.popupId, popup.id),
              eq(popupViews.sessionId, sessionId)
            )
          );
        
        if (parseInt(viewedCount[0].count) > 0) {
          return res.status(200).json({ hasActivePopup: false });
        }
      }
      
      // Verificar a frequência de exibição
      if (popup.frequency > 1) {
        const viewCount = await db.select({ count: sql`count(*)` })
          .from(popupViews)
          .where(
            and(
              eq(popupViews.popupId, popup.id),
              eq(popupViews.sessionId, sessionId)
            )
          );
          
        const count = parseInt(viewCount[0].count);
        if (count % popup.frequency !== 0) {
          return res.status(200).json({ hasActivePopup: false });
        }
      }
      
      return res.status(200).json({ 
        hasActivePopup: true, 
        popup,
        sessionId
      });
    }
  } catch (error) {
    console.error('Erro ao buscar popups ativos:', error);
    return res.status(500).json({ message: 'Erro ao buscar popups ativos' });
  }
});

// Registrar visualização de popup
router.post('/view', async (req, res) => {
  try {
    const { popupId, sessionId, action } = req.body;
    
    if (!popupId) {
      return res.status(400).json({ message: 'PopupId é obrigatório' });
    }
    
    const viewData: any = {
      popupId,
      action: action || 'view'
    };
    
    if (req.isAuthenticated()) {
      const user = req.user as Express.User;
      viewData.userId = user.id;
    } else if (sessionId) {
      viewData.sessionId = sessionId;
    } else {
      return res.status(400).json({ message: 'SessionId é obrigatório para usuários não autenticados' });
    }
    
    await db.insert(popupViews).values(viewData);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar visualização de popup:', error);
    return res.status(500).json({ message: 'Erro ao registrar visualização de popup' });
  }
});

// ADMIN: Listar todos os popups
router.get('/', isAdmin, async (req, res) => {
  try {
    const allPopups = await db.select()
      .from(popups)
      .orderBy(desc(popups.createdAt));
    
    return res.status(200).json(allPopups);
  } catch (error) {
    console.error('Erro ao listar popups:', error);
    return res.status(500).json({ message: 'Erro ao listar popups' });
  }
});

// ADMIN: Obter um popup específico
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const popupId = parseInt(req.params.id);
    
    if (isNaN(popupId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const [popup] = await db.select()
      .from(popups)
      .where(eq(popups.id, popupId));
    
    if (!popup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    return res.status(200).json(popup);
  } catch (error) {
    console.error('Erro ao buscar popup:', error);
    return res.status(500).json({ message: 'Erro ao buscar popup' });
  }
});

// ADMIN: Criar novo popup
router.post('/', isAdmin, upload.single('image'), async (req, res) => {
  try {
    const user = req.user as Express.User;
    let popupData = JSON.parse(req.body.data);
    
    // Validar os dados usando o schema
    const validationResult = insertPopupSchema.safeParse(popupData);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: validationResult.error.errors 
      });
    }
    
    // Processar a imagem, se existir
    if (req.file) {
      const filePath = req.file.path;
      const webpPath = `${filePath.slice(0, filePath.lastIndexOf('.'))}.webp`;
      
      // Otimizar a imagem e converter para webp
      await sharp(filePath)
        .resize(800) // Largura máxima
        .webp({ quality: 85 })
        .toFile(webpPath);
      
      // Remover o arquivo original
      fs.unlinkSync(filePath);
      
      // Atualizar o caminho da imagem
      const imageUrl = `/uploads/popups/${path.basename(webpPath)}`;
      popupData.imageUrl = imageUrl;
    }
    
    // Adicionar o ID do usuário criador
    popupData.createdBy = user.id;
    
    // Criar o popup
    const [newPopup] = await db.insert(popups)
      .values(popupData)
      .returning();
    
    return res.status(201).json(newPopup);
  } catch (error) {
    console.error('Erro ao criar popup:', error);
    return res.status(500).json({ message: 'Erro ao criar popup' });
  }
});

// ADMIN: Atualizar popup
router.put('/:id', isAdmin, upload.single('image'), async (req, res) => {
  try {
    const popupId = parseInt(req.params.id);
    
    if (isNaN(popupId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    // Verificar se o popup existe
    const [existingPopup] = await db.select()
      .from(popups)
      .where(eq(popups.id, popupId));
    
    if (!existingPopup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    let popupData = JSON.parse(req.body.data);
    
    // Processar a imagem, se existir
    if (req.file) {
      const filePath = req.file.path;
      const webpPath = `${filePath.slice(0, filePath.lastIndexOf('.'))}.webp`;
      
      // Otimizar a imagem e converter para webp
      await sharp(filePath)
        .resize(800) // Largura máxima
        .webp({ quality: 85 })
        .toFile(webpPath);
      
      // Remover o arquivo original
      fs.unlinkSync(filePath);
      
      // Atualizar o caminho da imagem
      const imageUrl = `/uploads/popups/${path.basename(webpPath)}`;
      popupData.imageUrl = imageUrl;
      
      // Remover a imagem anterior, se existir
      if (existingPopup.imageUrl) {
        const oldImagePath = path.join('public', existingPopup.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    // Atualizar o popup
    const [updatedPopup] = await db.update(popups)
      .set({
        ...popupData,
        updatedAt: new Date()
      })
      .where(eq(popups.id, popupId))
      .returning();
    
    return res.status(200).json(updatedPopup);
  } catch (error) {
    console.error('Erro ao atualizar popup:', error);
    return res.status(500).json({ message: 'Erro ao atualizar popup' });
  }
});

// ADMIN: Excluir popup
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const popupId = parseInt(req.params.id);
    
    if (isNaN(popupId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    // Verificar se o popup existe
    const [existingPopup] = await db.select()
      .from(popups)
      .where(eq(popups.id, popupId));
    
    if (!existingPopup) {
      return res.status(404).json({ message: 'Popup não encontrado' });
    }
    
    // Remover a imagem, se existir
    if (existingPopup.imageUrl) {
      const imagePath = path.join('public', existingPopup.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Excluir as visualizações associadas
    await db.delete(popupViews)
      .where(eq(popupViews.popupId, popupId));
    
    // Excluir o popup
    await db.delete(popups)
      .where(eq(popups.id, popupId));
    
    return res.status(200).json({ message: 'Popup excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir popup:', error);
    return res.status(500).json({ message: 'Erro ao excluir popup' });
  }
});

// ADMIN: Obter estatísticas de popup
router.get('/:id/stats', isAdmin, async (req, res) => {
  try {
    const popupId = parseInt(req.params.id);
    
    if (isNaN(popupId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    // Total de visualizações
    const viewsResult = await db.select({ count: sql`count(*)` })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, popupId),
          eq(popupViews.action, 'view')
        )
      );
    
    // Total de cliques
    const clicksResult = await db.select({ count: sql`count(*)` })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, popupId),
          eq(popupViews.action, 'click')
        )
      );
    
    // Total de dismisses (fechamentos)
    const dismissesResult = await db.select({ count: sql`count(*)` })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, popupId),
          eq(popupViews.action, 'dismiss')
        )
      );
    
    // Usuários únicos
    const uniqueUsersResult = await db.select({ count: sql`count(distinct "userId")` })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, popupId),
          sql`"userId" is not null`
        )
      );
    
    // Sessões únicas
    const uniqueSessionsResult = await db.select({ count: sql`count(distinct "sessionId")` })
      .from(popupViews)
      .where(
        and(
          eq(popupViews.popupId, popupId),
          sql`"sessionId" is not null`
        )
      );
    
    // Taxa de conversão (cliques/visualizações)
    const totalViews = parseInt(viewsResult[0].count);
    const totalClicks = parseInt(clicksResult[0].count);
    const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    
    return res.status(200).json({
      totalViews,
      totalClicks,
      totalDismisses: parseInt(dismissesResult[0].count),
      uniqueUsers: parseInt(uniqueUsersResult[0].count),
      uniqueSessions: parseInt(uniqueSessionsResult[0].count),
      conversionRate: Math.round(conversionRate * 100) / 100 // Arredondar para 2 casas decimais
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do popup:', error);
    return res.status(500).json({ message: 'Erro ao buscar estatísticas do popup' });
  }
});

export default router;