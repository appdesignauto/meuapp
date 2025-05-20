/**
 * Monitor dedicado para webhooks da Hotmart e Doppus
 * Executa em uma porta separada para evitar a interceptação do Vite
 * 
 * Este script cria um servidor HTTP dedicado que:
 * 1. Captura toda a informação de webhooks recebidos
 * 2. Salva os dados em arquivos de log para análise
 * 3. Tenta processar os webhooks usando as mesmas funções do servidor principal
 * 4. Fornece uma interface web simples para visualizar logs recentes
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createHash } = require('crypto');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const http = require('http');

// Configurar variáveis de ambiente
dotenv.config();

// Verificar se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida. Verifique o arquivo .env');
  process.exit(1);
}

// Configurações do servidor
const PORT = process.env.WEBHOOK_MONITOR_PORT || 3777;
const LOG_DIR = path.join(__dirname, 'webhook-logs');
const LOG_FILE = path.join(LOG_DIR, `webhook-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
const HOTMART_SIGNATURE_HEADER = 'X-Hotmart-Signature';
const DATABASE_URL = process.env.DATABASE_URL;

// Conectar ao banco de dados
const pool = new Pool({ connectionString: DATABASE_URL });

// Criar diretório de logs se não existir
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Inicializar log
fs.writeFileSync(LOG_FILE, `=== WEBHOOK MONITOR - INICIADO EM ${new Date().toISOString()} ===\n\n`);

// Criar o servidor Express
const app = express();

// Configurar middleware para parse de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para log de todas as requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Função para buscar o secret da Hotmart no banco de dados
async function getHotmartSecret() {
  try {
    const result = await pool.query(
      'SELECT value FROM "integrationSettings" WHERE provider = $1 AND key = $2',
      ['hotmart', 'secret']
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].value;
    } else {
      console.warn('⚠️ Secret da Hotmart não encontrado no banco de dados');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao buscar secret da Hotmart:', error);
    return null;
  }
}

// Função para verificar a assinatura de um webhook da Hotmart
async function validateHotmartSignature(req) {
  try {
    // Obter o secret da Hotmart
    const secret = await getHotmartSecret();
    if (!secret) {
      console.warn('⚠️ Não foi possível validar a assinatura: secret não encontrado');
      return false;
    }
    
    // Obter a assinatura do header
    const signature = req.headers[HOTMART_SIGNATURE_HEADER.toLowerCase()];
    if (!signature) {
      console.warn('⚠️ Header de assinatura não encontrado');
      return false;
    }
    
    // Calcular a assinatura esperada
    const payload = JSON.stringify(req.body);
    const hmac = createHash('sha1')
      .update(`${payload}${secret}`, 'utf8')
      .digest('hex');
    
    // Comparar as assinaturas
    const isValid = hmac === signature;
    console.log(`🔐 Validação de assinatura: ${isValid ? '✅ Válida' : '❌ Inválida'}`);
    console.log(`🔑 Assinatura recebida: ${signature}`);
    console.log(`🔑 Assinatura calculada: ${hmac}`);
    
    return isValid;
  } catch (error) {
    console.error('❌ Erro ao validar assinatura:', error);
    return false;
  }
}

// Função para salvar um log do webhook e escrever no arquivo de log
async function logWebhook(req, source) {
  try {
    const timestamp = new Date().toISOString();
    const requestId = crypto.randomBytes(8).toString('hex');
    
    // Construir objeto de log
    const logEntry = {
      timestamp,
      requestId,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      source,
    };
    
    // Construir texto de log para o arquivo
    const logText = `\n=== WEBHOOK RECEBIDO (${requestId}) - ${timestamp} ===\n` +
      `Método: ${req.method}\n` +
      `URL: ${req.url}\n` +
      `Origem: ${source}\n` +
      `Headers:\n${JSON.stringify(req.headers, null, 2)}\n` +
      `Body:\n${JSON.stringify(req.body, null, 2)}\n` +
      `=== FIM DO WEBHOOK (${requestId}) ===\n\n`;
    
    // Escrever no arquivo de log
    fs.appendFileSync(LOG_FILE, logText);
    
    // Extrair dados para o banco de dados
    const eventType = req.body.event || 'unknown';
    const email = req.body.data?.buyer?.email || null;
    const status = 'received'; // Status inicial
    
    // Salvar no banco de dados
    const query = `
      INSERT INTO "webhookLogs" 
      ("source", "rawData", "eventType", "status", "email", "signatureValid", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `;
    
    const signatureValid = await validateHotmartSignature(req);
    
    const values = [
      source,
      JSON.stringify(req.body),
      eventType,
      status,
      email,
      signatureValid
    ];
    
    const result = await pool.query(query, values);
    const logId = result.rows[0].id;
    
    console.log(`📝 Webhook ${source} (${eventType}) registrado com ID ${logId}`);
    
    return { logId, requestId };
  } catch (error) {
    console.error('❌ Erro ao registrar webhook:', error);
    // Tentar registrar no arquivo mesmo se falhar no banco
    fs.appendFileSync(LOG_FILE, `\n❌ ERRO AO REGISTRAR WEBHOOK: ${error.message}\n\n`);
    return { error: error.message };
  }
}

// Repassar o webhook para o servidor principal
async function forwardToMainServer(req, source) {
  return new Promise((resolve, reject) => {
    try {
      // Dados a serem enviados
      const data = JSON.stringify(req.body);
      
      // Opções da requisição
      const options = {
        hostname: 'localhost',
        port: 3000, // Porta do servidor principal
        path: `/webhook/${source.toLowerCase()}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        }
      };
      
      // Copiar headers de autenticação/assinatura
      if (source === 'hotmart' && req.headers[HOTMART_SIGNATURE_HEADER.toLowerCase()]) {
        options.headers[HOTMART_SIGNATURE_HEADER] = req.headers[HOTMART_SIGNATURE_HEADER.toLowerCase()];
      }
      
      console.log(`🔄 Encaminhando webhook para o servidor principal: ${JSON.stringify(options)}`);
      
      // Fazer a requisição
      const request = http.request(options, (response) => {
        let responseData = '';
        
        response.on('data', (chunk) => {
          responseData += chunk;
        });
        
        response.on('end', () => {
          console.log(`✅ Resposta do servidor principal: ${responseData}`);
          resolve({
            success: response.statusCode >= 200 && response.statusCode < 300,
            statusCode: response.statusCode,
            response: responseData
          });
        });
      });
      
      request.on('error', (error) => {
        console.error(`❌ Erro ao encaminhar webhook: ${error.message}`);
        resolve({
          success: false,
          error: error.message
        });
      });
      
      request.write(data);
      request.end();
    } catch (error) {
      console.error(`❌ Erro ao preparar encaminhamento: ${error.message}`);
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

// Endpoint para receber webhooks da Hotmart
app.post('/webhook/hotmart', async (req, res) => {
  console.log('📥 Webhook da Hotmart recebido');
  
  try {
    // Registrar o webhook
    const { logId, requestId } = await logWebhook(req, 'hotmart');
    
    // Tentar encaminhar para o servidor principal
    const forwardResult = await forwardToMainServer(req, 'hotmart');
    
    // Atualizar o status no banco de dados
    await pool.query(
      'UPDATE "webhookLogs" SET status = $1, "processedData" = $2, "updatedAt" = NOW() WHERE id = $3',
      [
        forwardResult.success ? 'success' : 'error',
        JSON.stringify(forwardResult),
        logId
      ]
    );
    
    // Responder com sucesso para a Hotmart
    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      logId,
      requestId
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook da Hotmart:', error);
    
    // Sempre responder com 200 para a Hotmart não tentar novamente
    res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas recebido com sucesso',
      error: error.message
    });
  }
});

// Endpoint para receber webhooks da Doppus
app.post('/webhook/doppus', async (req, res) => {
  console.log('📥 Webhook da Doppus recebido');
  
  try {
    // Registrar o webhook
    const { logId, requestId } = await logWebhook(req, 'doppus');
    
    // Tentar encaminhar para o servidor principal
    const forwardResult = await forwardToMainServer(req, 'doppus');
    
    // Atualizar o status no banco de dados
    await pool.query(
      'UPDATE "webhookLogs" SET status = $1, "processedData" = $2, "updatedAt" = NOW() WHERE id = $3',
      [
        forwardResult.success ? 'success' : 'error',
        JSON.stringify(forwardResult),
        logId
      ]
    );
    
    // Responder com sucesso para a Doppus
    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      logId,
      requestId
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook da Doppus:', error);
    
    // Sempre responder com 200 para a Doppus não tentar novamente
    res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas recebido com sucesso',
      error: error.message
    });
  }
});

// Endpoint genérico para capturar qualquer webhook
app.post('/webhook/capture', async (req, res) => {
  console.log('📥 Webhook genérico recebido');
  
  try {
    // Registrar o webhook
    const { logId, requestId } = await logWebhook(req, 'generic');
    
    // Responder com sucesso
    res.status(200).json({
      success: true,
      message: 'Webhook genérico capturado com sucesso',
      logId,
      requestId
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook genérico:', error);
    
    res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas recebido com sucesso',
      error: error.message
    });
  }
});

// Endpoint para verificar o status do monitor
app.get('/status', async (req, res) => {
  try {
    // Verificar conexão com o banco de dados
    const dbResult = await pool.query('SELECT NOW()');
    const dbConnected = !!dbResult.rows[0];
    
    // Verificar se o secret da Hotmart está configurado
    const hotmartSecret = await getHotmartSecret();
    
    // Contar webhooks recebidos
    const countResult = await pool.query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'success\') as success, COUNT(*) FILTER (WHERE status = \'error\') as error FROM "webhookLogs"'
    );
    const webhookStats = countResult.rows[0] || { total: 0, success: 0, error: 0 };
    
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        connected: dbConnected,
        timestamp: dbResult.rows[0]?.now || null
      },
      configuration: {
        port: PORT,
        logFile: LOG_FILE,
        hotmartSecretConfigured: !!hotmartSecret
      },
      webhookStats,
      endpoints: {
        hotmart: '/webhook/hotmart',
        doppus: '/webhook/doppus',
        capture: '/webhook/capture',
        logs: '/logs',
        lastWebhooks: '/last-webhooks'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para obter os últimos webhooks
app.get('/last-webhooks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "webhookLogs" ORDER BY "createdAt" DESC LIMIT 10'
    );
    
    res.json({
      count: result.rows.length,
      webhooks: result.rows.map(log => ({
        id: log.id,
        source: log.source,
        eventType: log.eventType,
        status: log.status,
        email: log.email,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        signatureValid: log.signatureValid
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao buscar últimos webhooks:', error);
    
    res.status(500).json({
      error: error.message
    });
  }
});

// Endpoint para obter o arquivo de log
app.get('/logs', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.status(404).json({ error: 'Arquivo de log não encontrado' });
    }
    
    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(logContent);
  } catch (error) {
    console.error('❌ Erro ao ler logs:', error);
    res.status(500).json({ error: 'Erro ao ler logs' });
  }
});

// Página inicial com informações do sistema
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitor de Webhook - DesignAuto</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
      h1 { color: #1e40af; }
      .card { background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
      .endpoint { background: #e5e7eb; padding: 8px; border-radius: 4px; font-family: monospace; }
      .success { color: green; }
      .error { color: red; }
      .warning { color: orange; }
      pre { background: #f0f0f0; padding: 10px; overflow: auto; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Monitor de Webhook - DesignAuto</h1>
    <div class="card">
      <h2>Status do servidor</h2>
      <p>Servidor rodando na porta <strong>${PORT}</strong></p>
      <p>Iniciado em: <strong>${new Date().toISOString()}</strong></p>
      <p>Arquivo de log: <code>${LOG_FILE}</code></p>
    </div>
    
    <div class="card">
      <h2>Endpoints disponíveis</h2>
      <ul>
        <li>Status: <span class="endpoint">/status</span></li>
        <li>Webhook Hotmart: <span class="endpoint">/webhook/hotmart</span></li>
        <li>Webhook Doppus: <span class="endpoint">/webhook/doppus</span></li>
        <li>Webhook Genérico: <span class="endpoint">/webhook/capture</span></li>
        <li>Últimos Webhooks: <span class="endpoint">/last-webhooks</span></li>
        <li>Visualizar Logs: <span class="endpoint">/logs</span></li>
      </ul>
    </div>
    
    <div class="card">
      <h2>Uso do monitor</h2>
      <p>Para capturar webhooks da Hotmart, configure o URL abaixo no painel da Hotmart:</p>
      <p class="endpoint">https://seu-dominio.com/webhook/hotmart</p>
      <p>Para verificar se o monitor está funcionando, acesse o endpoint de status:</p>
      <p class="endpoint">http://localhost:${PORT}/status</p>
    </div>
    
    <div class="card">
      <h2>Monitoramento em tempo real</h2>
      <p>Acesse o endpoint <code>/last-webhooks</code> para ver os últimos webhooks recebidos.</p>
      <p>Consulte o arquivo de log para ver detalhes completos.</p>
    </div>
  </body>
  </html>
  `;
  
  res.send(html);
});

// Iniciar o servidor
const server = app.listen(PORT, () => {
  const startupMessage = `
==================================================
MONITOR DE WEBHOOK INICIADO
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
- Últimos Webhooks: http://localhost:${PORT}/last-webhooks
- Visualizar Logs: http://localhost:${PORT}/logs

Para capturar webhooks da Hotmart, configure o seguinte URL
no seu painel da Hotmart:
https://seu-dominio.com/webhook/hotmart

==================================================
`;

  console.log(startupMessage);
  fs.appendFileSync(LOG_FILE, startupMessage);
});