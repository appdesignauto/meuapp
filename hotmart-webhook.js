import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar um servidor simples para receber webhooks da Hotmart
const app = express();
app.use(express.json());

const PORT = process.env.WEBHOOK_PORT || 3333;

// Pasta para salvar logs do webhook
const logsFolder = path.join(__dirname, 'webhook-logs');
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder, { recursive: true });
}

// Rota principal para receber webhooks da Hotmart
app.post('/webhook-hotmart', (req, res) => {
  try {
    console.log('===================== WEBHOOK HOTMART RECEBIDO =====================');
    
    // Obter o payload do webhook
    const payload = req.body;
    
    // Log inicial
    console.log(`Recebido webhook da Hotmart: ${JSON.stringify(payload, null, 2)}`);
    
    // Salvar em arquivo para análise posterior
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const logFile = path.join(logsFolder, `webhook-${timestamp}.json`);
    
    fs.writeFileSync(logFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: payload
    }, null, 2));
    
    // Criar arquivo de teste para garantir registro
    fs.writeFileSync(
      'webhook-test.txt', 
      `Webhook recebido em ${new Date().toISOString()}\nTipo: ${payload.event || 'Desconhecido'}\n`
    );
    
    console.log(`Webhook salvo em ${logFile}`);
    
    // Responder com sucesso para a Hotmart não reenviar o webhook
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    // Tenta salvar informações do erro
    try {
      fs.appendFileSync(
        'webhook-errors.txt',
        `\n--- ERRO ${new Date().toISOString()} ---\n${error}\n${error instanceof Error ? error.stack : ''}\n-----------------------\n`
      );
    } catch (e) {
      console.error('Não foi possível salvar log de erro:', e);
    }
    
    // Mesmo com erro, responder 200 para a Hotmart não reenviar
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas foi recebido',
      error: error.message || 'Erro desconhecido'
    });
  }
});

// Rota para verificar logs de webhooks recebidos
app.get('/webhook-logs', (req, res) => {
  try {
    const files = fs.readdirSync(logsFolder);
    const logFiles = files.filter(file => file.startsWith('webhook-') && file.endsWith('.json'));
    
    return res.status(200).json({
      totalLogs: logFiles.length,
      logs: logFiles.map(file => {
        try {
          const content = fs.readFileSync(path.join(logsFolder, file), 'utf8');
          return {
            filename: file,
            data: JSON.parse(content)
          };
        } catch (e) {
          return {
            filename: file,
            error: e.message
          };
        }
      })
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Erro ao listar logs'
    });
  }
});

// Rota para ver o último webhook recebido
app.get('/ultimo-webhook', (req, res) => {
  try {
    // Listar os arquivos de log e pegar o mais recente
    const files = fs.readdirSync(logsFolder);
    const logFiles = files
      .filter(file => file.startsWith('webhook-') && file.endsWith('.json'))
      .sort((a, b) => {
        // Ordenar por data de modificação (mais recente primeiro)
        return fs.statSync(path.join(logsFolder, b)).mtime.getTime() - 
               fs.statSync(path.join(logsFolder, a)).mtime.getTime();
      });
    
    if (logFiles.length === 0) {
      return res.status(404).json({ message: 'Nenhum webhook recebido ainda' });
    }
    
    // Ler o arquivo de log mais recente
    const latestFile = logFiles[0];
    const content = fs.readFileSync(path.join(logsFolder, latestFile), 'utf8');
    const webhookData = JSON.parse(content);
    
    return res.status(200).json({
      latestWebhook: webhookData,
      receivedAt: new Date(webhookData.timestamp).toLocaleString('pt-BR'),
      filename: latestFile
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Erro ao obter último webhook'
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor webhook da Hotmart rodando na porta ${PORT}`);
  console.log(`URL para configurar na Hotmart: https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev:${PORT}/webhook-hotmart`);
  console.log(`Para ver logs acumulados: https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev:${PORT}/webhook-logs`);
  console.log(`Para ver o último webhook: https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev:${PORT}/ultimo-webhook`);
});