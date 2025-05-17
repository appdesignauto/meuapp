import express from 'express';
import { db } from '../db';
import { sql, eq, and, desc } from 'drizzle-orm';
import { failedWebhooks } from '@shared/schema';
import { WebhookService } from '../services/webhook-service';

const router = express.Router();

// Middleware de verificação manual de admin sem depender do Passport
function checkAdminManually(req, res, next) {
  // Verificar a sessão manualmente para autenticação
  if (!req.session || !req.session.passport || !req.session.passport.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Buscar o usuário pelo ID da sessão
  db.execute(sql`
    SELECT id, nivelacesso FROM users WHERE id = ${req.session.passport.user}
  `).then(result => {
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    if (user.nivelacesso !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta área.' });
    }

    // Usuário é administrador, prosseguir
    next();
  }).catch(error => {
    console.error('Erro ao verificar administrador:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  });
}

// Obter todos os webhooks com falha com filtros opcionais
router.get('/', checkAdminManually, async (req, res) => {
  try {
    const { status = 'all', source = 'all' } = req.query;
    
    let query = db.select().from(failedWebhooks);
    
    // Aplicar filtros se fornecidos
    if (status !== 'all') {
      query = query.where(eq(failedWebhooks.status, status as string));
    }
    
    if (source !== 'all') {
      query = query.where(eq(failedWebhooks.source, source as string));
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    const webhooks = await query.orderBy(desc(failedWebhooks.createdAt)).limit(100);
    
    // Obter estatísticas
    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      resolved: 0,
      failed: 0,
      bySource: {}
    };
    
    // Contar totais
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM "failedWebhooks"
    `);
    stats.total = parseInt(totalResult.rows[0].total);
    
    // Contar por status
    const statusCounts = await db.execute(sql`
      SELECT status, COUNT(*) as count FROM "failedWebhooks" GROUP BY status
    `);
    
    statusCounts.rows.forEach(row => {
      if (row.status === 'pending') stats.pending = parseInt(row.count);
      else if (row.status === 'processing') stats.processing = parseInt(row.count);
      else if (row.status === 'resolved') stats.resolved = parseInt(row.count);
      else if (row.status === 'failed') stats.failed = parseInt(row.count);
    });
    
    // Contar por origem
    const sourceCounts = await db.execute(sql`
      SELECT source, COUNT(*) as count FROM "failedWebhooks" GROUP BY source
    `);
    
    sourceCounts.rows.forEach(row => {
      stats.bySource[row.source] = parseInt(row.count);
    });
    
    res.json({ webhooks, stats });
  } catch (error) {
    console.error('Erro ao obter webhooks com falha:', error);
    res.status(500).json({ error: 'Erro ao buscar webhooks com falha' });
  }
});

// Reprocessar um webhook com falha
router.post('/:id/retry', checkAdminManually, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Localizar o webhook com falha
    const [failedWebhook] = await db
      .select()
      .from(failedWebhooks)
      .where(eq(failedWebhooks.id, parseInt(id)))
      .limit(1);
    
    if (!failedWebhook) {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    
    // Verificar se o webhook não está já sendo processado
    if (failedWebhook.status === 'processing') {
      return res.status(400).json({ error: 'Este webhook já está sendo processado' });
    }
    
    // Verificar se o webhook já foi resolvido
    if (failedWebhook.status === 'resolved') {
      return res.status(400).json({ error: 'Este webhook já foi resolvido' });
    }
    
    // Marcar o webhook como em processamento
    await db
      .update(failedWebhooks)
      .set({
        status: 'processing',
        retryCount: (failedWebhook.retryCount || 0) + 1,
        lastRetryAt: new Date()
      })
      .where(eq(failedWebhooks.id, parseInt(id)));
    
    // Criar instância do serviço de webhook
    const webhookService = new WebhookService();
    
    // Tentar reprocessar o webhook
    try {
      // Chamar método de reprocessamento no serviço
      await webhookService.reprocessFailedWebhook(failedWebhook);
      
      // Se chegou aqui, o reprocessamento foi bem-sucedido
      await db
        .update(failedWebhooks)
        .set({
          status: 'resolved',
          updatedAt: new Date()
        })
        .where(eq(failedWebhooks.id, parseInt(id)));
      
      res.json({ success: true, message: 'Webhook reprocessado com sucesso' });
    } catch (error) {
      console.error(`Erro ao reprocessar webhook ${id}:`, error);
      
      // Atualizar o registro com o novo erro
      await db
        .update(failedWebhooks)
        .set({
          status: 'failed',
          errorMessage: `Erro no reprocessamento: ${error.message}`,
          updatedAt: new Date()
        })
        .where(eq(failedWebhooks.id, parseInt(id)));
      
      res.status(500).json({ 
        error: 'Falha ao reprocessar webhook',
        message: error.message
      });
    }
  } catch (error) {
    console.error('Erro ao reprocessar webhook:', error);
    res.status(500).json({ error: 'Erro ao reprocessar webhook' });
  }
});

export default router;