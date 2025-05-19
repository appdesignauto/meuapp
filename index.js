import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialização do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Criar pasta de logs se não existir
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Arquivo de log
const logFile = path.join(logsDir, 'webhook-logs.json');
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, '[\n', 'utf8');
}

// Rota de verificação (healthcheck)
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Servidor de webhooks da Hotmart', 
    time: new Date().toISOString() 
  });
});

// Rota principal para webhook da Hotmart
app.post('/api/webhook-hotmart', async (req, res) => {
  try {
    const payload = req.body;
    
    console.log('🔔 Webhook recebido da Hotmart:', JSON.stringify(payload, null, 2));

    // Salvar no log com timestamp
    const logEntry = {
      receivedAt: new Date().toISOString(),
      payload
    };
    
    const fileContent = fs.readFileSync(logFile, 'utf8');
    // Se já tiver conteúdo além do colchete inicial, adicione uma vírgula
    const appendData = fileContent.trim() === '[' 
      ? JSON.stringify(logEntry, null, 2) 
      : ',\n' + JSON.stringify(logEntry, null, 2);
    
    fs.appendFileSync(logFile, appendData, 'utf8');

    // Processamento baseado no tipo de evento
    const type = payload?.event;
    const email = payload?.data?.buyer?.email || payload?.buyer?.email;

    switch (type) {
      case 'PURCHASE_APPROVED':
      case 'SUBSCRIPTION_ACTIVATED':
        console.log(`✅ Assinatura ativada para: ${email}`);
        // Criar ou ativar assinatura
        break;
      case 'SUBSCRIPTION_CANCELLED':
      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'SUBSCRIPTION_EXPIRED':
        console.log(`❌ Assinatura cancelada para: ${email}`);
        // Cancelar ou rebaixar assinatura
        break;
      default:
        console.log('⚠️ Evento não reconhecido:', type);
    }

    // Sempre responder com 200 OK
    res.sendStatus(200);
  } catch (error) {
    console.error('⚠️ Erro ao processar webhook:', error);
    
    // Mesmo em caso de erro, enviar 200 (requisito da Hotmart)
    res.sendStatus(200);
  }
});

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor escutando na porta ${PORT}`);
  console.log(`🔗 Webhook da Hotmart disponível em: /api/webhook-hotmart`);
  console.log(`📊 Logs salvos em: ${logFile}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  // Não encerra o processo
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promise rejeitada sem tratamento:', reason);
  // Não encerra o processo
});