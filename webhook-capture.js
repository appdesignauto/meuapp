/**
 * Ferramenta de captura de webhooks para diagnóstico
 * 
 * Este script cria um servidor HTTP que captura todos os webhooks enviados para ele
 * e os salva em um arquivo de log para análise posterior.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuração básica
const PORT = 3777; // Usar uma porta diferente da aplicação principal
const LOG_DIR = path.join(__dirname, 'webhook-logs');
const LOG_FILE = path.join(LOG_DIR, `webhook-capture-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Criar diretório de logs se não existir
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Inicializar log
fs.writeFileSync(LOG_FILE, `=== WEBHOOK CAPTURE LOG - INICIADO EM ${new Date().toISOString()} ===\n\n`);

// Criar o servidor Express
const app = express();

// Configurar o middleware para parsear JSON e formulários
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Função para registrar os dados do webhook
function logWebhook(req, eventType = 'unknown') {
  const timestamp = new Date().toISOString();
  const requestId = crypto.randomBytes(8).toString('hex');
  
  const logEntry = {
    timestamp,
    requestId,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    eventType,
  };
  
  const logText = `\n=== WEBHOOK RECEBIDO (${requestId}) - ${timestamp} ===\n` +
    `Método: ${req.method}\n` +
    `URL: ${req.url}\n` +
    `Headers: ${JSON.stringify(req.headers, null, 2)}\n` +
    `Body: ${JSON.stringify(req.body, null, 2)}\n` +
    `Query: ${JSON.stringify(req.query, null, 2)}\n` +
    `Tipo de Evento: ${eventType}\n` +
    `=== FIM DO WEBHOOK (${requestId}) ===\n\n`;
  
  fs.appendFileSync(LOG_FILE, logText);
  console.log(`📥 Webhook capturado! ID: ${requestId} Tipo: ${eventType}`);
  
  return requestId;
}

// Endpoint para status do capturador
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    logFilePath: LOG_FILE,
    uptime: process.uptime(),
    endpoints: {
      hotmart: '/webhook/hotmart',
      doppus: '/webhook/doppus',
      generic: '/webhook/capture'
    }
  });
});

// Endpoints para capturar webhooks da Hotmart
app.post('/webhook/hotmart', (req, res) => {
  // Extrair tipo de evento do body
  const eventType = req.body.event || 'unknown-hotmart-event';
  const requestId = logWebhook(req, eventType);
  
  // Responder com sucesso para a Hotmart
  res.status(200).json({
    success: true,
    message: `Webhook da Hotmart capturado com sucesso. ID: ${requestId}`,
    timestamp: new Date().toISOString()
  });
});

// Endpoints para capturar webhooks da Doppus
app.post('/webhook/doppus', (req, res) => {
  // Extrair tipo de evento do body
  const eventType = req.body.event || 'unknown-doppus-event';
  const requestId = logWebhook(req, eventType);
  
  // Responder com sucesso para a Doppus
  res.status(200).json({
    success: true,
    message: `Webhook da Doppus capturado com sucesso. ID: ${requestId}`,
    timestamp: new Date().toISOString()
  });
});

// Endpoint genérico para capturar qualquer webhook
app.post('/webhook/capture', (req, res) => {
  const requestId = logWebhook(req, 'generic-webhook');
  
  res.status(200).json({
    success: true,
    message: `Webhook genérico capturado com sucesso. ID: ${requestId}`,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para verificar os webhooks capturados
app.get('/logs', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.status(404).json({ error: 'Arquivo de log não encontrado' });
    }
    
    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(logContent);
  } catch (error) {
    console.error('Erro ao ler logs:', error);
    res.status(500).json({ error: 'Erro ao ler logs' });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  const startupMessage = `
==================================================
CAPTURADOR DE WEBHOOK INICIADO
==================================================
Porta: ${PORT}
Arquivo de Log: ${LOG_FILE}
Timestamp: ${new Date().toISOString()}
==================================================

Endpoints disponíveis:
- Status: http://localhost:${PORT}/status
- Webhook Hotmart: http://localhost:${PORT}/webhook/hotmart
- Webhook Doppus: http://localhost:${PORT}/webhook/doppus
- Webhook Genérico: http://localhost:${PORT}/webhook/capture
- Visualizar Logs: http://localhost:${PORT}/logs

Para capturar webhooks da Hotmart, configure o seguinte URL
no seu painel da Hotmart:
https://seu-dominio.com/webhook/hotmart

==================================================
`;

  console.log(startupMessage);
  fs.appendFileSync(LOG_FILE, startupMessage);
});