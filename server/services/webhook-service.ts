import { db } from '../db';
import { failedWebhooks, webhookLogs, InsertFailedWebhook } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

class WebhookService {
  /**
   * Registra um webhook que falhou durante o processamento
   * @param {number} webhookLogId - ID do log do webhook relacionado
   * @param {string} source - Origem do webhook ('hotmart', 'doppus', etc)
   * @param {object} payload - Conteúdo completo do webhook que falhou
   * @param {string} errorMessage - Mensagem de erro que causou a falha
   * @returns {Promise<number>} ID do webhook falho registrado
   */
  async registerFailedWebhook(
    webhookLogId: number,
    source: string,
    payload: object,
    errorMessage: string
  ): Promise<number> {
    try {
      console.log(`[WebhookService] Registrando webhook falho. Source: ${source}, Error: ${errorMessage}`);
      
      const data: InsertFailedWebhook = {
        webhookLogId,
        source,
        payload,
        errorMessage,
        status: 'pending'
      };

      const [result] = await db.insert(failedWebhooks).values(data).returning({ id: failedWebhooks.id });
      
      console.log(`[WebhookService] Webhook falho registrado com ID: ${result.id}`);
      return result.id;
    } catch (error) {
      console.error('[WebhookService] Erro ao registrar webhook falho:', error);
      throw error;
    }
  }

  /**
   * Lista todos os webhooks falhos
   * @param {object} options - Opções de filtragem
   * @returns {Promise<FailedWebhook[]>} Lista de webhooks falhos
   */
  async listFailedWebhooks(options: { 
    status?: string, 
    source?: string,
    limit?: number,
    offset?: number
  } = {}) {
    try {
      const { status, source, limit = 100, offset = 0 } = options;
      
      let query = db.select().from(failedWebhooks);
      
      if (status) {
        query = query.where(eq(failedWebhooks.status, status));
      }
      
      if (source) {
        query = query.where(eq(failedWebhooks.source, source));
      }
      
      const webhooks = await query
        .orderBy(desc(failedWebhooks.createdAt))
        .limit(limit)
        .offset(offset);
      
      return webhooks;
    } catch (error) {
      console.error('[WebhookService] Erro ao listar webhooks falhos:', error);
      throw error;
    }
  }

  /**
   * Obtém um webhook falho pelo ID
   * @param {number} id - ID do webhook falho
   * @returns {Promise<FailedWebhook | null>} Webhook falho encontrado ou null
   */
  async getFailedWebhook(id: number) {
    try {
      const [webhook] = await db
        .select()
        .from(failedWebhooks)
        .where(eq(failedWebhooks.id, id));
      
      if (!webhook) {
        return null;
      }
      
      return webhook;
    } catch (error) {
      console.error(`[WebhookService] Erro ao obter webhook falho ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um webhook falho
   * @param {number} id - ID do webhook falho
   * @param {string} status - Novo status ('pending', 'processing', 'resolved', 'failed')
   * @returns {Promise<boolean>} Se a atualização foi bem sucedida
   */
  async updateFailedWebhookStatus(id: number, status: string): Promise<boolean> {
    try {
      await db
        .update(failedWebhooks)
        .set({ 
          status, 
          updatedAt: new Date() 
        })
        .where(eq(failedWebhooks.id, id));
      
      return true;
    } catch (error) {
      console.error(`[WebhookService] Erro ao atualizar status do webhook falho ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Marca um webhook falho como em processamento e incrementa o contador de tentativas
   * @param {number} id - ID do webhook falho
   * @returns {Promise<boolean>} Se a atualização foi bem sucedida
   */
  async markWebhookAsProcessing(id: number): Promise<boolean> {
    try {
      await db
        .update(failedWebhooks)
        .set({ 
          status: 'processing', 
          lastRetryAt: new Date(),
          retryCount: db.raw('retry_count + 1'),
          updatedAt: new Date() 
        })
        .where(eq(failedWebhooks.id, id));
      
      return true;
    } catch (error) {
      console.error(`[WebhookService] Erro ao marcar webhook como em processamento ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Marca um webhook falho como resolvido
   * @param {number} id - ID do webhook falho
   * @returns {Promise<boolean>} Se a atualização foi bem sucedida
   */
  async markWebhookAsResolved(id: number): Promise<boolean> {
    try {
      await db
        .update(failedWebhooks)
        .set({ 
          status: 'resolved', 
          updatedAt: new Date() 
        })
        .where(eq(failedWebhooks.id, id));
      
      return true;
    } catch (error) {
      console.error(`[WebhookService] Erro ao marcar webhook como resolvido ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Obtém estatísticas dos webhooks falhos
   * @returns {Promise<object>} Estatísticas dos webhooks falhos
   */
  async getFailedWebhooksStats() {
    try {
      const allWebhooks = await db.select().from(failedWebhooks);
      
      const pendingCount = allWebhooks.filter(w => w.status === 'pending').length;
      const processingCount = allWebhooks.filter(w => w.status === 'processing').length;
      const resolvedCount = allWebhooks.filter(w => w.status === 'resolved').length;
      const failedCount = allWebhooks.filter(w => w.status === 'failed').length;
      
      const bySource = allWebhooks.reduce((acc, webhook) => {
        const source = webhook.source;
        if (!acc[source]) {
          acc[source] = 0;
        }
        acc[source]++;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        total: allWebhooks.length,
        pending: pendingCount,
        processing: processingCount,
        resolved: resolvedCount,
        failed: failedCount,
        bySource
      };
    } catch (error) {
      console.error('[WebhookService] Erro ao obter estatísticas de webhooks falhos:', error);
      throw error;
    }
  }
}

export const webhookService = new WebhookService();