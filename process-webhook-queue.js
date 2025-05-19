/**
 * Script para processar a fila de webhooks da Hotmart
 * 
 * Este script pode ser executado manualmente ou agendado com cron
 * para processar webhooks pendentes na fila.
 */

// Importar o processador de webhook 
// Compilar o TypeScript do processador antes de executar
require('esbuild').buildSync({
  entryPoints: ['server/jobs/process-webhook-queue.ts'],
  outdir: 'server/jobs/dist',
  platform: 'node',
  format: 'cjs',
  target: ['node16'],
  bundle: true,
});

// Importar o processador compilado
const { processWebhookQueue } = require('./server/jobs/dist/process-webhook-queue');

// Executar o processamento
console.log('Iniciando processamento da fila de webhooks...');

processWebhookQueue()
  .then((result) => {
    console.log('Processamento concluído com sucesso:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao processar fila de webhooks:', error);
    process.exit(1);
  });