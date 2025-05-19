// Script de inicialização que detecta o modo e inicia o servidor adequado
import { spawn } from 'child_process';
import fs from 'fs';

console.log('🚀 Iniciando servidor webhook...');

// Verifica se o arquivo index.cjs existe
if (fs.existsSync('./index.cjs')) {
  console.log('✅ Servidor webhook encontrado, iniciando...');
  
  // Inicia o servidor webhook
  const webhook = spawn('node', ['index.cjs'], { stdio: 'inherit' });
  
  webhook.on('close', (code) => {
    console.log(`⚠️ Servidor webhook encerrado com código ${code}`);
  });
  
  // Tratamento de sinais para encerramento limpo
  process.on('SIGINT', () => {
    console.log('👋 Encerrando servidor webhook...');
    webhook.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('👋 Encerrando servidor webhook...');
    webhook.kill('SIGTERM');
  });
} else {
  console.error('❌ Arquivo index.cjs não encontrado');
  process.exit(1);
}