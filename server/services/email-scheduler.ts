/**
 * Serviço de agendamento de e-mails de upgrade
 * Gerencia o envio automático de e-mails para usuários orgânicos
 */

import cron from 'node-cron';
import { UpgradeEmailService } from './upgrade-email-service.js';

export class EmailScheduler {
  private static instance: EmailScheduler;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private upgradeEmailService: UpgradeEmailService;

  private constructor() {
    this.upgradeEmailService = new UpgradeEmailService();
  }

  public static getInstance(): EmailScheduler {
    if (!EmailScheduler.instance) {
      EmailScheduler.instance = new EmailScheduler();
    }
    return EmailScheduler.instance;
  }

  /**
   * Inicia o agendamento automático de e-mails de upgrade
   */
  public startUpgradeEmailScheduler(config: {
    enabled: boolean;
    cronExpression: string;
    daysAfterRegistration: number;
    maxEmailsPerRun: number;
  }): void {
    this.stopJob('upgrade-emails');

    if (!config.enabled) {
      console.log('📧 [EmailScheduler] Agendamento de e-mails de upgrade desabilitado');
      return;
    }

    console.log(`📧 [EmailScheduler] Configurando agendamento: ${config.cronExpression}`);
    console.log(`📧 [EmailScheduler] Dias após cadastro: ${config.daysAfterRegistration}`);
    console.log(`📧 [EmailScheduler] Máximo por execução: ${config.maxEmailsPerRun}`);

    const task = cron.schedule(config.cronExpression, async () => {
      await this.executeUpgradeEmailCampaign(config.daysAfterRegistration, config.maxEmailsPerRun);
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.set('upgrade-emails', task);
    console.log('✅ [EmailScheduler] Agendamento de e-mails de upgrade ativado');
  }

  /**
   * Executa a campanha de e-mails de upgrade
   */
  private async executeUpgradeEmailCampaign(daysAfterRegistration: number, maxEmails: number): Promise<void> {
    try {
      console.log('🚀 [EmailScheduler] Iniciando campanha automática de e-mails de upgrade');

      const stats = await this.upgradeEmailService.getUpgradeStats();
      console.log(`📊 [EmailScheduler] Usuários elegíveis: ${stats.eligibleUsers}`);

      if (stats.eligibleUsers === 0) {
        console.log('ℹ️ [EmailScheduler] Nenhum usuário elegível encontrado');
        return;
      }

      const result = await this.upgradeEmailService.sendBatchUpgradeEmails(maxEmails);
      
      console.log(`✅ [EmailScheduler] Campanha concluída:`);
      console.log(`   - E-mails enviados: ${result.sent}`);
      console.log(`   - E-mails falharam: ${result.failed}`);
      console.log(`   - Usuários processados: ${result.processedUsers.length}`);

      if (result.failed > 0) {
        console.log(`⚠️ [EmailScheduler] ${result.failed} e-mails falharam no envio`);
      }

    } catch (error) {
      console.error('❌ [EmailScheduler] Erro na campanha automática:', error);
    }
  }

  /**
   * Para um job específico
   */
  public stopJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (job) {
      job.destroy();
      this.jobs.delete(jobName);
      console.log(`🛑 [EmailScheduler] Job '${jobName}' parado`);
    }
  }

  /**
   * Para todos os jobs
   */
  public stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`🛑 [EmailScheduler] Job '${name}' parado`);
    });
    this.jobs.clear();
  }

  /**
   * Lista jobs ativos
   */
  public getActiveJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  /**
   * Testa o envio imediato (para debugging)
   */
  public async testUpgradeEmailCampaign(maxEmails: number = 5): Promise<any> {
    console.log('🧪 [EmailScheduler] Executando teste de campanha de upgrade');
    return await this.executeUpgradeEmailCampaign(3, maxEmails);
  }
}

// Configurações padrão para diferentes cenários
export const SchedulePresets = {
  // Envio diário às 10h
  DAILY_MORNING: {
    cronExpression: '0 10 * * *',
    daysAfterRegistration: 3,
    maxEmailsPerRun: 50,
    description: 'Diário às 10h (máx. 50 e-mails)'
  },
  
  // Envio a cada 3 dias às 14h
  EVERY_3_DAYS: {
    cronExpression: '0 14 */3 * *',
    daysAfterRegistration: 3,
    maxEmailsPerRun: 100,
    description: 'A cada 3 dias às 14h (máx. 100 e-mails)'
  },

  // Envio semanal (segundas às 9h)
  WEEKLY_MONDAY: {
    cronExpression: '0 9 * * 1',
    daysAfterRegistration: 7,
    maxEmailsPerRun: 200,
    description: 'Segundas às 9h (máx. 200 e-mails)'
  },

  // Envio de teste (a cada 5 minutos)
  TEST_MODE: {
    cronExpression: '*/5 * * * *',
    daysAfterRegistration: 0,
    maxEmailsPerRun: 5,
    description: 'Teste: a cada 5 minutos (máx. 5 e-mails)'
  }
};