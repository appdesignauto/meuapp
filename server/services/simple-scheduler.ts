/**
 * Sistema de agendamento automático simplificado para e-mails de upgrade
 * Executa a cada 2 minutos verificando usuários cadastrados há mais de 10 minutos
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { EmailService } from './email-service.js';

export class SimpleScheduler {
  private static instance: SimpleScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private emailService: EmailService;

  private constructor() {
    this.emailService = new EmailService();
  }

  public static getInstance(): SimpleScheduler {
    if (!SimpleScheduler.instance) {
      SimpleScheduler.instance = new SimpleScheduler();
    }
    return SimpleScheduler.instance;
  }

  /**
   * Inicia o agendamento automático (executa a cada 2 minutos)
   */
  public start(): void {
    if (this.isRunning) {
      console.log('📧 Agendamento de e-mails já está em execução');
      return;
    }

    console.log('🚀 Iniciando agendamento automático de e-mails de upgrade');
    console.log('⏰ Verificações a cada 2 minutos para usuários cadastrados há mais de 10 minutos');

    this.intervalId = setInterval(async () => {
      await this.checkAndSendUpgradeEmails();
    }, 2 * 60 * 1000); // 2 minutos

    this.isRunning = true;

    // Executa uma vez imediatamente após 30 segundos
    setTimeout(() => {
      this.checkAndSendUpgradeEmails();
    }, 30000);
  }

  /**
   * Para o agendamento automático
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Agendamento automático parado');
    }
  }

  /**
   * Verifica e envia e-mails de upgrade para usuários elegíveis
   */
  private async checkAndSendUpgradeEmails(): Promise<void> {
    try {
      // Usuários cadastrados há mais de 10 minutos que não receberam e-mail ainda
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - 10);

      const eligibleUsers = await db.execute(sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.username,
          u.criadoem
        FROM users u
        LEFT JOIN "emailLogs" el ON u.id = el."userId" AND el."templateKey" = 'upgrade_organico'
        WHERE 
          u."nivelacesso" = 'usuario'
          AND u."isactive" = true
          AND (u."origemassinatura" IS NULL OR u."origemassinatura" = 'nenhuma')
          AND u."criadoem" <= ${cutoffTime.toISOString()}
          AND el.id IS NULL
        ORDER BY u."criadoem" DESC
        LIMIT 5
      `);

      if (eligibleUsers.rows.length === 0) {
        console.log('ℹ️ Nenhum usuário elegível para e-mail de upgrade nesta verificação');
        return;
      }

      console.log(`📊 ${eligibleUsers.rows.length} usuários elegíveis encontrados`);

      let sent = 0;
      let failed = 0;

      for (const user of eligibleUsers.rows) {
        try {
          const success = await this.sendUpgradeEmailToUser(
            Number(user.id), 
            String(user.email), 
            String(user.name || user.username)
          );
          if (success) {
            sent++;
            console.log(`✅ E-mail de upgrade enviado para: ${user.email}`);
          } else {
            failed++;
            console.log(`❌ Falha ao enviar e-mail para: ${user.email}`);
          }
        } catch (error) {
          failed++;
          console.error(`❌ Erro ao enviar e-mail para usuário ${user.id}:`, error);
        }
      }

      if (sent > 0) {
        console.log(`📧 Resumo: ${sent} e-mails enviados, ${failed} falharam`);
      }

    } catch (error) {
      console.error('❌ Erro na verificação automática de e-mails:', error);
    }
  }

  /**
   * Envia e-mail de upgrade para um usuário específico
   */
  private async sendUpgradeEmailToUser(userId: number, email: string, name: string): Promise<boolean> {
    try {
      // Busca o template de upgrade
      const template = await db.execute(sql`
        SELECT subject, "htmlContent", "textContent"
        FROM "emailTemplates"
        WHERE "templateKey" = 'upgrade_organico' AND "isActive" = true
        LIMIT 1
      `);

      if (template.rows.length === 0) {
        console.log('⚠️ Template de upgrade não encontrado');
        return false;
      }

      const templateData = template.rows[0];
      
      // Substitui variáveis no template
      const variables = {
        nome: name,
        email: email
      };

      let htmlContent = String(templateData.htmlContent);
      let subject = String(templateData.subject);

      // Substitui variáveis
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, value);
        subject = subject.replace(regex, value);
      });

      // Envia o e-mail
      const emailSent = await this.emailService.sendEmail(
        { name: 'DesignAuto', email: 'suporte@designauto.com.br' },
        [{ email: email, name: name }],
        subject,
        htmlContent,
        String(templateData.textContent)
      );

      if (emailSent.success) {
        // Registra o envio
        await db.execute(sql`
          INSERT INTO "emailLogs" ("userId", email, "templateKey", "sentAt", status)
          VALUES (${userId}, ${email}, 'upgrade_organico', NOW(), 'sent')
        `);
        return true;
      }

      return false;

    } catch (error) {
      console.error(`Erro ao enviar e-mail de upgrade para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Retorna status do agendamento
   */
  public getStatus(): { isRunning: boolean; info: string } {
    return {
      isRunning: this.isRunning,
      info: this.isRunning ? 'Verificações a cada 2 minutos' : 'Parado'
    };
  }
}