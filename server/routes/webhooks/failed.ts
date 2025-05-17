import { Router } from 'express';
import { webhookService } from '../../services/webhook-service';
import { hotmartService } from '../../services/hotmart-service';
import { z } from 'zod';

const router = Router();

// Obter lista de webhooks falhos com filtros opcionais
router.get('/', async (req, res) => {
  try {
    // Verificar se o usuário tem permissão
    if (!req.isAuthenticated() || !['admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Parsear e validar os parâmetros da query
    const querySchema = z.object({
      status: z.string().optional(),
      source: z.string().optional(),
      limit: z.coerce.number().optional(),
      offset: z.coerce.number().optional()
    });

    const validationResult = querySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Parâmetros inválidos', 
        details: validationResult.error.errors 
      });
    }

    const options = validationResult.data;
    
    // Buscar webhooks falhos com os filtros fornecidos
    const result = await webhookService.getFailedWebhooks(options);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar webhooks falhos:', error);
    res.status(500).json({ error: 'Erro ao listar webhooks falhos', message: error.message });
  }
});

// Obter detalhes de um webhook falho específico
router.get('/:id', async (req, res) => {
  try {
    // Verificar se o usuário tem permissão
    if (!req.isAuthenticated() || !['admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

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
    console.error(`Erro ao buscar webhook falho ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro ao buscar webhook falho', message: error.message });
  }
});

// Reprocessar um webhook falho
router.post('/:id/retry', async (req, res) => {
  try {
    // Verificar se o usuário tem permissão
    if (!req.isAuthenticated() || !['admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Buscar o webhook falho
    const webhook = await webhookService.getFailedWebhookById(id);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    
    // Verificar se o webhook já está em processamento ou resolvido
    if (webhook.status === 'processing') {
      return res.status(400).json({ 
        error: 'Webhook já está em processamento',
        message: 'Este webhook já está sendo reprocessado' 
      });
    }
    
    if (webhook.status === 'resolved') {
      return res.status(400).json({ 
        error: 'Webhook já foi resolvido',
        message: 'Este webhook já foi processado com sucesso' 
      });
    }
    
    // Marcar webhook como em processamento
    await webhookService.markAsProcessing(id);
    
    // Incrementar contador de tentativas
    await webhookService.incrementRetryCount(id);
    
    // Reprocessar o webhook de acordo com a fonte
    let result;
    
    try {
      if (webhook.source === 'hotmart') {
        // Reprocessar webhook da Hotmart
        // Chamar o serviço da Hotmart para processar o webhook
        result = await hotmartService.processWebhook(webhook.payload);
        
        // Se chegou aqui, foi processado com sucesso
        await webhookService.markAsResolved(id, 'Webhook processado com sucesso no reprocessamento');
        
        return res.json({ 
          success: true, 
          message: 'Webhook reprocessado com sucesso',
          result 
        });
      } 
      else if (webhook.source === 'doppus') {
        // TODO: Implementar reprocessamento de webhooks do Doppus
        throw new Error('Reprocessamento de webhooks do Doppus ainda não implementado');
      } 
      else {
        throw new Error(`Fonte desconhecida: ${webhook.source}`);
      }
    } catch (error) {
      // Em caso de erro, marcar como falho e retornar o erro
      await webhookService.markAsFailed(id, `Erro no reprocessamento: ${error.message}`);
      
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao reprocessar webhook', 
        message: error.message 
      });
    }
  } catch (error) {
    console.error(`Erro ao reprocessar webhook falho ID ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao reprocessar webhook falho', 
      message: error.message 
    });
  }
});

export default router;