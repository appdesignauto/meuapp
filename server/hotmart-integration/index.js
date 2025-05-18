// index.js
require('dotenv').config();
const { fork } = require('child_process');
const express = require('express');
const path = require('path');

// Porta principal para o serviço combinado
const PORT = process.env.HOTMART_PORT || 5050;

// Iniciar o servidor de autenticação (em processo separado)
const authServer = fork('./server/hotmart-integration/auth-server.js');

// Iniciar o serviço de sincronização (em processo separado)
const syncService = fork('./server/hotmart-integration/sync-service.js');

// Servidor principal (API + arquivos estáticos)
const app = express();

// Redirecionar solicitações para API
app.use('/api', require('./api-server'));

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