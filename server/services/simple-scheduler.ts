/**
 * Sistema de agendamento automático simplificado para e-mails de upgrade
 * Executa a cada 2 minutos verificando usuários cadastrados há mais de 10 minutos
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export class SimpleScheduler {
  private static instance: SimpleScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {
    // Constructor vazio - serviços serão importados dinamicamente
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
      console.log('📧 [SimpleScheduler] Agendamento já está em execução');
      return;
    }

    console.log('🚀 [SimpleScheduler] Iniciando agendamento automático de e-mails de upgrade');
    console.log('⏰ [SimpleScheduler] Verificações a cada 2 minutos para usuários cadastrados há mais de 10 minutos');

    this.intervalId = setInterval(async () => {
      await this.checkAndSendUpgradeEmails();
    }, 2 * 60 * 1000); // 2 minutos

    this.isRunning = true;

    // Executa uma vez imediatamente ao iniciar (após 10 segundos)
    setTimeout(() => {
      this.checkAndSendUpgradeEmails();
    }, 10000);
  }

  /**
   * Para o agendamento automático
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ [SimpleScheduler] Agendamento automático parado');
  }

  /**
   * Verifica e envia e-mails de upgrade para usuários elegíveis
   */
  private async checkAndSendUpgradeEmails(): Promise<void> {
    try {
      console.log('🔍 [SimpleScheduler] Verificando usuários elegíveis para e-mail de upgrade...');

      // Busca usuários orgânicos cadastrados há mais de 10 minutos que ainda não receberam e-mail
      const eligibleUsers = await db.execute(sql`
        SELECT u.id, u.email, u.name, u.username, u."createdAt"
        FROM users u
        WHERE u."nivelacesso" = 'usuario'
          AND (u."origemassinatura" IS NULL OR u."origemassinatura" = 'nenhuma')
          AND u."isactive" = true
          AND u."createdAt" <= NOW() - INTERVAL '10 minutes'
          AND u."createdAt" >= NOW() - INTERVAL '30 days'
          AND NOT EXISTS (
            SELECT 1 FROM "emailLogs" el 
            WHERE el."userId" = u.id 
            AND el."templateKey" = 'upgrade_organico'
          )
        ORDER BY u."createdAt" ASC
        LIMIT 5
      `);

      if (eligibleUsers.rows.length === 0) {
        console.log('✅ [SimpleScheduler] Nenhum usuário elegível encontrado');
        return;
      }

      console.log(`📧 [SimpleScheduler] Encontrados ${eligibleUsers.rows.length} usuários elegíveis`);

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
      console.error('❌ [SimpleScheduler] Erro na verificação de usuários elegíveis:', error);
    }
  }

  /**
   * Envia e-mail de upgrade para um usuário específico
   */
  private async sendUpgradeEmailToUser(userId: number, email: string, name: string): Promise<boolean> {
    try {
      // Busca o template de upgrade
      const templateResult = await db.execute(sql`
        SELECT * FROM "emailTemplates" 
        WHERE "templateKey" = 'upgrade_organico' AND "isActive" = true
        LIMIT 1
      `);

      if (templateResult.rows.length === 0) {
        console.error('❌ Template upgrade_organico não encontrado');
        return false;
      }

      const templateData = templateResult.rows[0];
      
      // Substitui variáveis no template
      const variables = {
        nome: name,
        email: email
      };

      let htmlContent = String(templateData.htmlContent);
      let subject = String(templateData.subject);

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, value);
        subject = subject.replace(regex, value);
      });

      // Importa EmailService dinamicamente
      const { EmailService } = await import('./email-service.js');
      const emailService = new EmailService();

      // Envia o e-mail
      const emailSent = await emailService.sendEmail(
        { name: 'DesignAuto', email: 'suporte@designauto.com.br' },
        [{ email: email, name: name }],
        subject,
        htmlContent,
        String(templateData.textContent)
      );

      if (emailSent.success) {
        // Registra o envio
        await db.execute(sql`
          INSERT INTO "emailLogs" ("userId", email, "templateKey", "sentAt", status, "messageId")
          VALUES (${userId}, ${email}, 'upgrade_organico', NOW(), 'sent', ${emailSent.messageId || 'unknown'})
        `);
        return true;
      } else {
        console.error(`❌ Erro ao enviar e-mail: ${emailSent.error}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Erro no envio de e-mail para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Retorna status do agendamento
   */
  public getStatus(): { isRunning: boolean; info: string } {
    return {
      isRunning: this.isRunning,
      info: this.isRunning 
        ? 'Agendamento ativo - verificações a cada 2 minutos'
        : 'Agendamento parado'
    };
  }
}