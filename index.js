// Servidor webhook da Hotmart usando ES Modules
import express from 'express';
import fs from 'fs';
import cors from 'cors';

// Inicialização do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Criar arquivo de logs se não existir
if (!fs.existsSync('webhook-logs.json')) {
  fs.writeFileSync('webhook-logs.json', '[\n', 'utf8');
}

// Rota de verificação simples
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Servidor de webhooks da Hotmart', 
    time: new Date().toISOString() 
  });
});

// Rota principal para webhook da Hotmart
app.post('/api/webhook-hotmart', (req, res) => {
  try {
    const payload = req.body;
    
    console.log('✅ Webhook recebido da Hotmart:', JSON.stringify(payload, null, 2));

    // Salvar no log com timestamp
    const logEntry = {
      receivedAt: new Date().toISOString(),
      payload
    };
    
    // Adicionando ao arquivo de log
    const fileContent = fs.readFileSync('webhook-logs.json', 'utf8');
    // Se já tiver conteúdo além do colchete inicial, adicione uma vírgula
    const appendData = fileContent.trim() === '[' 
      ? JSON.stringify(logEntry, null, 2) 
      : ',\n' + JSON.stringify(logEntry, null, 2);
    
    fs.appendFileSync('webhook-logs.json', appendData, 'utf8');

    // Processamento básico baseado no tipo de evento
    const type = payload?.event;
    console.log(`📣 Tipo de evento recebido: ${type}`);

    // Responder sempre com 200 OK
    res.sendStatus(200);
  } catch (error) {
    console.error('⚠️ Erro ao processar webhook:', error);
    
    // Mesmo em caso de erro, enviar 200 (requisito da Hotmart)
    res.sendStatus(200);
  }
});

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de webhook da Hotmart escutando na porta ${PORT}`);
  console.log(`🔗 Webhook disponível em: /api/webhook-hotmart`);
});