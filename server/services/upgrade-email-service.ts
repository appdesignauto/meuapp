/**
 * Serviço para envio de e-mails de upgrade para usuários orgânicos
 * Identifica usuários que se cadastraram sem vir de webhooks e oferece upgrade premium
 */

import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { EmailService } from './email-service';

export class UpgradeEmailService {
  private emailService: EmailService;
  private logMessages: string[] = [];

  constructor() {
    this.emailService = new EmailService();
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logEntry = `[${timestamp}] [UpgradeEmail] ${message}`;
    this.logMessages.push(logEntry);
    console.log(logEntry);
  }

  /**
   * Identifica usuários orgânicos elegíveis para e-mail de upgrade
   * Critérios:
   * - Não são premium (nivelacesso = 'usuario')
   * - Não vieram de webhook (origemassinatura is null ou 'nenhuma')
   * - Estão ativos (isactive = true)
   * - Se cadastraram nos últimos 30 dias
   * - Ainda não receberam e-mail de upgrade
   */
  async getEligibleUsers(): Promise<any[]> {
    try {
      // Data limite: 30 dias atrás
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const eligibleUsers = await db.execute(sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.username,
          u.criadoem,
          u.nivelacesso,
          u.origemassinatura,
          u.isactive
        FROM users u
        LEFT JOIN "emailLogs" el ON u.id = el."userId" AND el."templateKey" = 'upgrade_organico'
        WHERE 
          u."nivelacesso" = 'usuario'
          AND u."isactive" = true
          AND (u."origemassinatura" IS NULL OR u."origemassinatura" = 'nenhuma')
          AND u."criadoem" <= ${cutoffTime.toISOString()}
          AND el.id IS NULL
        ORDER BY u."criadoem" DESC
        LIMIT 50
      `);

      this.log(`Encontrados ${eligibleUsers.rows.length} usuários elegíveis para e-mail de upgrade`);
      return eligibleUsers.rows;
    } catch (error) {
      this.log(`Erro ao buscar usuários elegíveis: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Busca o template de upgrade no banco de dados
   */
  private async getUpgradeTemplate(): Promise<{ subject: string; htmlContent: string; textContent: string } | null> {
    try {
      const template = await db.execute(sql`
        SELECT subject, "htmlContent", "textContent"
        FROM "emailTemplates"
        WHERE "templateKey" = 'upgrade_organico' AND "isActive" = true
        LIMIT 1
      `);

      if (template.rows.length === 0) {
        this.log('Template de upgrade não encontrado no banco de dados');
        return null;
      }

      const row = template.rows[0] as any;
      return {
        subject: row.subject,
        htmlContent: row.htmlContent,
        textContent: row.textContent
      };
    } catch (error) {
      this.log(`Erro ao buscar template: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Substitui variáveis no conteúdo do template
   */
  private replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Envia e-mail de upgrade para um usuário específico
   */
  async sendUpgradeEmail(userId: number, userEmail: string, userName: string): Promise<boolean> {
    try {
      const template = await this.getUpgradeTemplate();
      if (!template) {
        this.log('Template de upgrade não disponível');
        return false;
      }

      const variables = {
        nome: userName || 'Cliente',
        email: userEmail
      };

      // Substituir variáveis no template
      const subject = this.replaceVariables(template.subject, variables);
      const htmlContent = this.replaceVariables(template.htmlContent, variables);
      const textContent = this.replaceVariables(template.textContent, variables);

      // Enviar e-mail usando EmailService
      const sender = { name: 'Design Auto', email: 'suporte@designauto.com.br' };
      const recipients = [{ email: userEmail, name: userName || 'Cliente' }];

      const result = await this.emailService.sendEmail(
        sender,
        recipients,
        subject,
        htmlContent,
        textContent
      );

      if (result.success) {
        // Registrar o envio para evitar duplicatas
        await this.logEmailSent(userId, userEmail, 'upgrade_organico');
        this.log(`E-mail de upgrade enviado com sucesso para ${userEmail} (${userName})`);
        return true;
      } else {
        this.log(`Falha ao enviar e-mail de upgrade para ${userEmail}: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.log(`Erro ao enviar e-mail de upgrade para ${userEmail}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Registra o envio do e-mail para evitar duplicatas
   */
  private async logEmailSent(userId: number, email: string, templateKey: string): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO "emailLogs" (
          "userId",
          "email", 
          "templateKey",
          "sentAt",
          "status"
        ) VALUES (
          ${userId},
          ${email},
          ${templateKey},
          NOW(),
          'sent'
        )
      `);
    } catch (error) {
      this.log(`Erro ao registrar log de e-mail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Processa envio em lote para todos os usuários elegíveis
   */
  async processBatchUpgradeEmails(): Promise<{
    total: number;
    sent: number;
    failed: number;
    details: string[];
  }> {
    this.logMessages = [];
    this.log('Iniciando processamento em lote de e-mails de upgrade');

    const eligibleUsers = await this.getEligibleUsers();
    const results = {
      total: eligibleUsers.length,
      sent: 0,
      failed: 0,
      details: this.logMessages
    };

    if (eligibleUsers.length === 0) {
      this.log('Nenhum usuário elegível encontrado para envio de e-mail de upgrade');
      results.details = this.logMessages;
      return results;
    }

    // Enviar e-mails com delay para evitar spam
    for (const user of eligibleUsers) {
      const success = await this.sendUpgradeEmail(
        user.id,
        user.email,
        user.name || user.username
      );

      if (success) {
        results.sent++;
      } else {
        results.failed++;
      }

      // Delay de 2 segundos entre envios
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.log(`Processamento concluído: ${results.sent} enviados, ${results.failed} falharam`);
    results.details = this.logMessages;
    return results;
  }

  /**
   * Processa um único usuário específico (para teste)
   */
  async sendUpgradeEmailToUser(userId: number): Promise<boolean> {
    try {
      const userResult = await db.execute(sql`
        SELECT id, name, email, username, nivelacesso, origemassinatura, isactive
        FROM users 
        WHERE id = ${userId}
      `);

      if (userResult.rows.length === 0) {
        this.log(`Usuário com ID ${userId} não encontrado`);
        return false;
      }

      const user = userResult.rows[0] as any;

      // Verificar se é elegível
      if (user.nivelacesso !== 'usuario' || !user.isactive) {
        this.log(`Usuário ${user.email} não é elegível (nível: ${user.nivelacesso}, ativo: ${user.isactive})`);
        return false;
      }

      return await this.sendUpgradeEmail(user.id, user.email, user.name || user.username);
    } catch (error) {
      this.log(`Erro ao processar usuário ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Obtém estatísticas dos e-mails de upgrade enviados
   */
  async getUpgradeEmailStats(): Promise<{
    totalSent: number;
    sentToday: number;
    sentThisWeek: number;
    sentThisMonth: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);

      const thisMonth = new Date();
      thisMonth.setDate(thisMonth.getDate() - 30);

      const stats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_sent,
          COUNT(*) FILTER (WHERE "sentAt" >= ${today.toISOString()}) as sent_today,
          COUNT(*) FILTER (WHERE "sentAt" >= ${thisWeek.toISOString()}) as sent_this_week,
          COUNT(*) FILTER (WHERE "sentAt" >= ${thisMonth.toISOString()}) as sent_this_month
        FROM "emailLogs"
        WHERE "templateKey" = 'upgrade_organico' AND "status" = 'sent'
      `);

      const result = stats.rows[0] as any;
      return {
        totalSent: parseInt(result.total_sent) || 0,
        sentToday: parseInt(result.sent_today) || 0,
        sentThisWeek: parseInt(result.sent_this_week) || 0,
        sentThisMonth: parseInt(result.sent_this_month) || 0
      };
    } catch (error) {
      this.log(`Erro ao obter estatísticas: ${error instanceof Error ? error.message : String(error)}`);
      return {
        totalSent: 0,
        sentToday: 0,
        sentThisWeek: 0,
        sentThisMonth: 0
      };
    }
  }
}

// Instância única do serviço
export const upgradeEmailService = new UpgradeEmailService();