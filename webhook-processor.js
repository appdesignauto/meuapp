/**
 * Script para processar fila de webhooks pendentes da Hotmart
 * 
 * Este script pode ser executado manualmente ou agendado
 * via cron job para processar webhooks pendentes.
 */

// Importar o processador de webhooks compilado
const { processWebhookQueue } = require('./server/dist/jobs/process-webhook-queue');

console.log('Iniciando processamento da fila de webhooks...');

processWebhookQueue()
  .then(result => {
    console.log('=== RESULTADO DO PROCESSAMENTO ===');
    console.log(`Webhooks processados com sucesso: ${result.processed}`);
    console.log(`Webhooks com erro: ${result.errors}`);
    console.log('=== DETALHES ===');
    
    // Detalhar resultados
    if (result.details && result.details.length > 0) {
      result.details.forEach(item => {
        console.log(`- ID: ${item.id}, Tipo: ${item.eventType}, Transação: ${item.transactionCode}, Status: ${item.status}`);
        if (item.details) {
          console.log(`  Detalhes: ${item.details}`);
        }
      });
    } else {
      console.log('Nenhum webhook pendente encontrado para processamento.');
    }
    
    console.log('Processamento concluído com sucesso!');
  })
  .catch(error => {
    console.error('Erro ao processar fila de webhooks:', error);
    process.exit(1);
  });