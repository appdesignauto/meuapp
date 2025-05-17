import { Router } from 'express';
import { webhookService } from '../../services/webhook-service';
import { HotmartService } from '../../services/hotmart-service';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Middleware seguro para verificar se o usuário é admin
// Verifica através de múltiplos métodos para evitar problemas com req.isAuthenticated()
const checkAdminSafely = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Método 1: Verificar pelo método padrão req.isAuthenticated()
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.nivelacesso === 'admin') {
      return next();
    }
    
    // Método 2: Verificar diretamente pela sessão se o método 1 falhar
    if (req.session && req.session.passport && req.session.passport.user) {
      const userId = req.session.passport.user;
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (userRecord && userRecord.nivelacesso === 'admin') {
        return next();
      }
    }
    
    // Se nenhum método funcionar, retornar 401
    return res.status(401).json({ error: 'Não autorizado. Apenas administradores podem acessar este recurso.' });
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

const router = Router();

// Schema para validação de parâmetros de paginação e filtros
const listParamsSchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

/**
 * @route GET /api/webhooks/failed/stats
 * @description Retorna estatísticas sobre webhooks falhos
 * @access Admin
 */
router.get('/stats', checkAdminSafely, async (req, res) => {
  try {
    const stats = await webhookService.getWebhookStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de webhooks:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/webhooks/failed
 * @description Lista todos os webhooks que falharam durante o processamento
 * @access Admin
 */
router.get('/', checkAdminSafely, async (req, res) => {
  try {
    // Validar e converter parâmetros de consulta
    const validation = listParamsSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Parâmetros de consulta inválidos',
        details: validation.error.format() 
      });
    }
    
    // Extrair parâmetros validados
    const { status, source, limit, offset } = validation.data;
    
    // Buscar webhooks falhos com os filtros aplicados
    const result = await webhookService.getFailedWebhooks({
      status,
      source,
      limit,
      offset
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar webhooks falhos:', error);
    res.status(500).json({ 
      error: 'Erro ao listar webhooks falhos',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/webhooks/failed/:id
 * @description Busca detalhes de um webhook falho específico
 * @access Admin
 */
router.get('/:id', checkAdminSafely, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const webhook = await webhookService.getFailedWebhookById(id);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    
    res.json(webhook);
  } catch (error) {
    console.error(`Erro ao buscar webhook ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Erro ao buscar webhook',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/webhooks/failed/:id/retry
 * @description Tenta reprocessar um webhook que falhou anteriormente
 * @access Admin
 */
router.post('/:id/retry', checkAdminSafely, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Buscar o webhook falho
    const webhook = await webhookService.getFailedWebhookById(id);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    
    // Verificar se o webhook já está sendo processado
    if (webhook.status === 'processing') {
      return res.status(409).json({ error: 'Este webhook já está sendo reprocessado' });
    }
    
    // Verificar se o webhook já foi resolvido
    if (webhook.status === 'resolved') {
      return res.status(409).json({ error: 'Este webhook já foi processado com sucesso' });
    }
    
    // Atualizar status para processando
    await webhookService.markAsProcessing(id);
    
    // Incrementar contador de tentativas
    await webhookService.incrementRetryCount(id);
    
    let result;
    
    try {
      // Processar o webhook de acordo com sua origem
      if (webhook.source === 'hotmart') {
        // Chamar o serviço da Hotmart para processar o webhook
        result = await HotmartService.processWebhook(webhook.payload);
        
        // Se chegou aqui, foi processado com sucesso
        await webhookService.markAsResolved(id, 'Webhook processado com sucesso no reprocessamento');
        
        res.json({ 
          success: true, 
          message: 'Webhook reprocessado com sucesso',
          result 
        });
      } else if (webhook.source === 'doppus') {
        // Para implementação futura
        // result = await DoppusService.processWebhook(webhook.payload);
        
        // Enquanto não implementado
        await webhookService.markAsFailed(id, 'Reprocessamento de webhooks Doppus ainda não implementado');
        
        res.status(501).json({ 
          success: false, 
          message: 'Reprocessamento de webhooks Doppus ainda não implementado' 
        });
      } else {
        // Origem desconhecida
        await webhookService.markAsFailed(id, `Origem desconhecida: ${webhook.source}`);
        
        res.status(400).json({ 
          success: false, 
          message: `Origem de webhook não suportada: ${webhook.source}` 
        });
      }
    } catch (error) {
      // Em caso de erro no reprocessamento
      console.error(`Erro ao reprocessar webhook ID ${id}:`, error);
      
      // Atualizar status para falha
      await webhookService.markAsFailed(id, `Erro no reprocessamento: ${error.message}`);
      
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao reprocessar webhook',
        error: error.message 
      });
    }
  } catch (error) {
    console.error(`Erro ao processar tentativa de reprocessamento para ID ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao processar tentativa de reprocessamento',
      error: error.message 
    });
  }
});

export default router;