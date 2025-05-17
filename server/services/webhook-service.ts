import { db } from '../db';
import { failedWebhooks, webhookLogs, insertFailedWebhookSchema, type FailedWebhook } from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

export class WebhookService {
  // Armazena um webhook que falhou durante o processamento
  async storeFailedWebhook(webhookLogId: number, source: string, payload: any, errorMessage: string): Promise<FailedWebhook> {
    try {
      const [webhook] = await db
        .insert(failedWebhooks)
        .values({
          webhookLogId,
          source,
          payload,
          errorMessage,
          status: 'pending',
          retryCount: 0
        })
        .returning();
      
      console.log(`Webhook falho armazenado com sucesso, ID: ${webhook.id}`);
      return webhook;
    } catch (error) {
      console.error('Erro ao armazenar webhook falho:', error);
      throw new Error(`Erro ao armazenar webhook falho: ${error.message}`);
    }
  }

  // Busca webhooks falhos com opção de filtros
  async getFailedWebhooks(options: { 
    status?: string, 
    source?: string,
    limit?: number, 
    offset?: number 
  } = {}): Promise<{ webhooks: FailedWebhook[], stats: any }> {
    try {
      const { status, source, limit = 100, offset = 0 } = options;
      
      // Construir condições de filtro
      let conditions = [];
      
      if (status && status !== 'all') {
        conditions.push(eq(failedWebhooks.status, status));
      }
      
      if (source && source !== 'all') {
        conditions.push(eq(failedWebhooks.source, source));
      }
      
      // Consulta com filtros aplicados
      const webhooks = await db
        .select()
        .from(failedWebhooks)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(failedWebhooks.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Buscar estatísticas
      const stats = await this.getWebhookStats();
      
      return { webhooks, stats };
    } catch (error) {
      console.error('Erro ao buscar webhooks falhos:', error);
      throw new Error(`Erro ao buscar webhooks falhos: ${error.message}`);
    }
  }

  // Obter estatísticas de webhooks falhos
  async getWebhookStats() {
    try {
      // Total de webhooks por status
      const statusCounts = await db
        .select({
          status: failedWebhooks.status,
          count: sql<number>`count(*)`,
        })
        .from(failedWebhooks)
        .groupBy(failedWebhooks.status);
      
      // Total de webhooks por origem
      const sourceCounts = await db
        .select({
          source: failedWebhooks.source,
          count: sql<number>`count(*)`,
        })
        .from(failedWebhooks)
        .groupBy(failedWebhooks.source);
      
      // Calcular totais
      const stats = {
        total: 0,
        pending: 0,
        processing: 0,
        resolved: 0,
        failed: 0,
        bySource: {}
      };
      
      statusCounts.forEach(item => {
        stats[item.status] = item.count;
        stats.total += item.count;
      });
      
      sourceCounts.forEach(item => {
        stats.bySource[item.source] = item.count;
      });
      
      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de webhooks:', error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        resolved: 0,
        failed: 0,
        bySource: {}
      };
    }
  }

  // Obtém um webhook falho pelo ID
  async getFailedWebhookById(id: number): Promise<FailedWebhook | undefined> {
    try {
      const [webhook] = await db
        .select()
        .from(failedWebhooks)
        .where(eq(failedWebhooks.id, id));
      
      return webhook;
    } catch (error) {
      console.error(`Erro ao buscar webhook falho ID ${id}:`, error);
      throw new Error(`Erro ao buscar webhook falho: ${error.message}`);
    }
  }

  // Atualiza o status de um webhook falho
  async updateFailedWebhookStatus(id: number, status: string, additionalData: any = {}): Promise<FailedWebhook> {
    try {
      const [webhook] = await db
        .update(failedWebhooks)
        .set({
          status,
          updatedAt: new Date(),
          ...additionalData
        })
        .where(eq(failedWebhooks.id, id))
        .returning();
      
      console.log(`Status do webhook ${id} atualizado para ${status}`);
      return webhook;
    } catch (error) {
      console.error(`Erro ao atualizar status do webhook ${id}:`, error);
      throw new Error(`Erro ao atualizar status do webhook: ${error.message}`);
    }
  }

  // Incrementa a contagem de tentativas e atualiza o timestamp da última tentativa
  async incrementRetryCount(id: number): Promise<FailedWebhook> {
    try {
      const webhook = await this.getFailedWebhookById(id);
      if (!webhook) {
        throw new Error(`Webhook ID ${id} não encontrado`);
      }
      
      const retryCount = (webhook.retryCount || 0) + 1;
      
      const [updatedWebhook] = await db
        .update(failedWebhooks)
        .set({
          retryCount,
          lastRetryAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(failedWebhooks.id, id))
        .returning();
      
      return updatedWebhook;
    } catch (error) {
      console.error(`Erro ao incrementar contador de tentativas para webhook ${id}:`, error);
      throw new Error(`Erro ao atualizar contador de tentativas: ${error.message}`);
    }
  }

  // Marca um webhook como resolvido
  async markAsResolved(id: number, message: string = 'Processado com sucesso'): Promise<FailedWebhook> {
    return this.updateFailedWebhookStatus(id, 'resolved', { errorMessage: message });
  }

  // Marca um webhook como em processamento
  async markAsProcessing(id: number): Promise<FailedWebhook> {
    return this.updateFailedWebhookStatus(id, 'processing');
  }

  // Marca um webhook como falho após tentativa de reprocessamento
  async markAsFailed(id: number, errorMessage: string): Promise<FailedWebhook> {
    return this.updateFailedWebhookStatus(id, 'failed', { errorMessage });
  }
}

export const webhookService = new WebhookService();