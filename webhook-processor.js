/**
 * Script para processar fila de webhooks pendentes da Hotmart
 * 
 * Este script pode ser executado manualmente ou agendado
 * via cron job para processar webhooks pendentes.
 */
import { WebhookProcessor } from './server/services/webhook-processor';

async function processWebhookQueue() {
  console.log('Iniciando processamento da fila de webhooks da Hotmart...');
  
  try {
    // Processar até 20 webhooks pendentes por vez
    const processedCount = await WebhookProcessor.processWebhookQueue(20);
    
    console.log(`Processamento concluído. ${processedCount} webhooks foram processados.`);
  } catch (error) {
    console.error('Erro ao processar fila de webhooks:', error);
  }
}

// Executar o processador
processWebhookQueue()
  .then(() => {
    console.log('Script concluído com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });