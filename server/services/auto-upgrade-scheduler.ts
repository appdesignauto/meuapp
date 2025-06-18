/**
 * Sistema de agendamento automático para e-mails de upgrade
 * Executa a cada 2 minutos verificando usuários cadastrados há mais de 10 minutos
 */

import { UpgradeEmailService } from './upgrade-email-service.js';

export class AutoUpgradeScheduler {
  private static instance: AutoUpgradeScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private upgradeEmailService: UpgradeEmailService;
  private isRunning = false;

  private constructor() {
    this.upgradeEmailService = new UpgradeEmailService();
  }

  public static getInstance(): AutoUpgradeScheduler {
    if (!AutoUpgradeScheduler.instance) {
      AutoUpgradeScheduler.instance = new AutoUpgradeScheduler();
    }
    return AutoUpgradeScheduler.instance;
  }

  /**
   * Inicia o agendamento automático (executa a cada 2 minutos)
   */
  public start(): void {
    if (this.isRunning) {
      console.log('📧 [AutoUpgradeScheduler] Agendamento já está em execução');
      return;
    }

    console.log('🚀 [AutoUpgradeScheduler] Iniciando agendamento automático de e-mails de upgrade');
    console.log('⏰ [AutoUpgradeScheduler] Verificações a cada 2 minutos para usuários cadastrados há mais de 10 minutos');

    this.intervalId = setInterval(async () => {
      await this.executeUpgradeCheck();
    }, 2 * 60 * 1000); // 2 minutos

    this.isRunning = true;

    // Executa uma vez imediatamente ao iniciar
    setTimeout(() => {
      this.executeUpgradeCheck();
    }, 5000); // 5 segundos após iniciar
  }

  /**
   * Para o agendamento automático
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 [AutoUpgradeScheduler] Agendamento automático parado');
    }
  }

  /**
   * Executa verificação e envio de e-mails de upgrade
   */
  private async executeUpgradeCheck(): Promise<void> {
    try {
      console.log('🔍 [AutoUpgradeScheduler] Verificando usuários elegíveis para upgrade...');

      const stats = await this.upgradeEmailService.getUpgradeEmailStats();
      
      if (stats.eligibleUsers === 0) {
        console.log('ℹ️ [AutoUpgradeScheduler] Nenhum usuário elegível encontrado nesta verificação');
        return;
      }

      console.log(`📊 [AutoUpgradeScheduler] ${stats.eligibleUsers} usuários elegíveis encontrados`);

      // Envia até 10 e-mails por execução para não sobrecarregar
      const result = await this.upgradeEmailService.sendBatchUpgradeEmails(10);
      
      if (result.sent > 0) {
        console.log(`✅ [AutoUpgradeScheduler] ${result.sent} e-mails de upgrade enviados com sucesso`);
      }

      if (result.failed > 0) {
        console.log(`⚠️ [AutoUpgradeScheduler] ${result.failed} e-mails falharam no envio`);
      }

    } catch (error) {
      console.error('❌ [AutoUpgradeScheduler] Erro na verificação automática:', error);
    }
  }

  /**
   * Retorna status do agendamento
   */
  public getStatus(): { isRunning: boolean; nextCheck: string } {
    return {
      isRunning: this.isRunning,
      nextCheck: this.isRunning ? 'A cada 2 minutos' : 'Parado'
    };
  }

  /**
   * Executa verificação manual (para testes)
   */
  public async executeManualCheck(): Promise<any> {
    console.log('🧪 [AutoUpgradeScheduler] Executando verificação manual...');
    return await this.executeUpgradeCheck();
  }
}