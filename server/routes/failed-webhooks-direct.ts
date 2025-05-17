import { Router } from 'express';
import { db } from '../db';
import { users, failedWebhooks } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { webhookService } from '../services/webhook-service';

const router = Router();

// Middleware alternativo para verificar se o usuário é admin
// sem depender do req.isAuthenticated() do Passport
const checkAdminManually = async (req, res, next) => {
  try {
    // Verificar se existe uma sessão
    if (!req.session || !req.session.passport || !req.session.passport.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Buscar o usuário pelo ID na sessão
    const userId = req.session.passport.user;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || user.nivelacesso !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado, apenas administradores podem realizar esta ação' });
    }
    
    // Anexar o usuário à requisição para uso posterior
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro ao verificar administrador:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões de administrador' });
  }
};

// Rota para listar webhooks falhos (com paginação)
router.get('/', checkAdminManually, async (req, res) => {
  try {
    console.log('DEBUG /api/failed-webhooks - Endpoint chamado');
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Buscar webhooks falhos
    const failedWebhooksData = await db.select({
      id: failedWebhooks.id,
      payload: failedWebhooks.payload,
      errorMessage: failedWebhooks.errorMessage,
      errorStack: failedWebhooks.errorStack,
      createdAt: failedWebhooks.createdAt,
      source: failedWebhooks.source
    })
    .from(failedWebhooks)
    .orderBy(desc(failedWebhooks.createdAt))
    .limit(limit)
    .offset(offset);
    
    // Buscar contagem total
    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(failedWebhooks);
    
    res.json({
      success: true,
      data: failedWebhooksData,
      pagination: {
        page,
        limit,
        totalCount: Number(count),
        totalPages: Math.ceil(Number(count) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar webhooks falhos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar webhooks falhos', 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
});

// Rota para reprocessar um webhook falho específico
router.post('/reprocess/:id', checkAdminManually, async (req, res) => {
  try {
    const failedWebhookId = parseInt(req.params.id);
    
    // Buscar o webhook falho
    const [failedWebhook] = await db.select()
      .from(failedWebhooks)
      .where(eq(failedWebhooks.id, failedWebhookId));
    
    if (!failedWebhook) {
      return res.status(404).json({ 
        success: false,
        message: 'Webhook falho não encontrado' 
      });
    }
    
    // Reprocessar o webhook
    const result = await webhookService.reprocessFailedWebhook(failedWebhookId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Webhook reprocessado com sucesso',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao reprocessar webhook',
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Erro ao reprocessar webhook falho ID ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao reprocessar webhook falho', 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
});

export default router;