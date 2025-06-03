/**
 * Script para processar automaticamente webhooks pendentes
 * Este script pode ser executado como um cron job a cada 5 minutos
 * para garantir que todos os webhooks recebidos sejam processados
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Caminho para o log de processos
const logPath = path.join(__dirname, 'logs', 'webhook-cron.log');

// Cria diretório de logs se não existir
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}

// Gera timestamp para log
function getTimestamp() {
  return new Date().toISOString();
}

// Registra mensagem no log
function logMessage(message) {
  const timestamp = getTimestamp();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(logEntry.trim());
  
  fs.appendFileSync(logPath, logEntry, { encoding: 'utf8' });
}

// Função principal para rodar o processador de webhooks
async function processWebhooks() {
  logMessage('Iniciando processamento automático de webhooks');
  
  try {
    // Executa o script de processamento de webhook
    const processor = spawn('node', ['fix-webhook-processor.mjs'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });
    
    let output = '';
    let errorOutput = '';
    
    processor.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      logMessage(`[PROCESSOR] ${dataStr.trim()}`);
    });
    
    processor.stderr.on('data', (data) => {
      const dataStr = data.toString();
      errorOutput += dataStr;
      logMessage(`[ERROR] ${dataStr.trim()}`);
    });
    
    processor.on('close', (code) => {
      if (code === 0) {
        logMessage(`Processamento de webhooks concluído com sucesso`);
      } else {
        logMessage(`Processamento de webhooks falhou com código: ${code}`);
      }
    });
  } catch (error) {
    logMessage(`Erro ao executar processador: ${error.message}`);
  }
}

// Executa o processamento
processWebhooks().catch(err => {
  logMessage(`Erro não tratado: ${err.message}`);
});

logMessage('Script de processamento automático inicializado');