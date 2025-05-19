import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar um servidor simples para receber webhooks da Hotmart
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3333;

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
    
    console.log(`Webhook salvo em ${logFile}`);
    
    // Responder com sucesso para a Hotmart não reenviar o webhook
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
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

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor webhook da Hotmart rodando na porta ${PORT}`);
  console.log(`URL para configurar na Hotmart: http://seudominio.com:${PORT}/webhook-hotmart`);
  console.log(`Para ver logs acumulados: http://seudominio.com:${PORT}/webhook-logs`);
});