// index.js
import dotenv from 'dotenv';
import { fork } from 'child_process';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurando o dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Porta principal para o serviço combinado
const PORT = process.env.HOTMART_PORT || 5050;

// Iniciar o servidor de autenticação (em processo separado)
const authServer = fork('./auth-server.js');

// Iniciar o serviço de sincronização (em processo separado)
const syncService = fork('./sync-service.js');

// Servidor principal (API + arquivos estáticos)
const app = express();

// Importar api-server dinamicamente
import('./api-server.js').then(apiServer => {
  // Redirecionar solicitações para API
  app.use('/api', apiServer.default);
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota de fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor principal
app.listen(PORT, () => {
  console.log(`Servidor de integração Hotmart rodando na porta ${PORT}`);
});

// Lidar com sinais de encerramento
process.on('SIGINT', () => {
  console.log('Encerrando todos os serviços de integração Hotmart...');
  authServer.kill();
  syncService.kill();
  process.exit(0);
});