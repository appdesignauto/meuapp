/**
 * Job para processar a fila de webhooks da Hotmart periodicamente
 * 
 * Este job pode ser executado a cada poucos minutos para processar
 * webhooks pendentes, garantindo que eles sejam tratados mesmo que
 * o processamento assíncrono inicial falhe.
 */
import { WebhookProcessor } from '../services/webhook-processor';

export async function processWebhookQueue() {
  console.log('[Job] Iniciando processamento da fila de webhooks da Hotmart...');
  
  try {
    // Processar até 20 webhooks pendentes por vez
    const processedCount = await WebhookProcessor.processWebhookQueue(20);
    
    console.log(`[Job] Processamento concluído. ${processedCount} webhooks foram processados.`);
    return {
      success: true,
      processedCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Job] Erro ao processar fila de webhooks:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

// Se este arquivo for executado diretamente
if (require.main === module) {
  processWebhookQueue()
    .then((result) => {
      console.log('Resultado do job:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao executar job:', error);
      process.exit(1);
    });
}