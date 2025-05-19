import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import pg from 'pg';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar conexão com o banco de dados
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Verificar conexão com o banco
pool.connect()
  .then(client => {
    console.log('✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
    client.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  });

// Criar um servidor Express para receber webhooks da Hotmart
const app = express();
app.use(express.json());

const PORT = process.env.WEBHOOK_PORT || 5001;

// Pasta para salvar logs do webhook
const logsFolder = path.join(__dirname, 'webhook-logs');
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder, { recursive: true });
}

/**
 * Registra um webhook no banco de dados
 */
async function registrarWebhook(payload) {
  const client = await pool.connect();
  try {
    // Inserir registro do webhook na tabela (se existir)
    await client.query(
      `INSERT INTO webhook_logs 
       (event_type, transaction_code, buyer_email, raw_data, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        payload.event || 'unknown',
        payload.data?.purchase?.transaction || 'unknown',
        payload.data?.buyer?.email || null,
        JSON.stringify(payload),
        new Date()
      ]
    );
    console.log('✅ Webhook registrado no banco de dados');
    return true;
  } catch (err) {
    console.error('❌ Erro ao registrar webhook no banco:', err);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Atualiza a assinatura de um usuário no banco de dados
 */
async function atualizarAssinaturaUsuario(email, eventType, payload) {
  if (!email) {
    console.log('⚠️ Email não fornecido, não é possível atualizar assinatura');
    return { success: false, message: 'Email não fornecido' };
  }

  const client = await pool.connect();
  
  try {
    // Verificar se o usuário existe
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`⚠️ Usuário com email ${email} não encontrado no banco de dados`);
      return { success: false, message: `Usuário com email ${email} não encontrado` };
    }
    
    const user = userResult.rows[0];
    
    // Processar com base no tipo de evento
    switch (eventType) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
      case 'SUBSCRIPTION_REACTIVATION':
        // Definir data de expiração (1 ano a partir de agora)
        const dataAssinatura = new Date();
        const dataExpiracao = new Date();
        dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
        
        // Atualizar assinatura do usuário
        await client.query(
          `UPDATE users 
           SET origemassinatura = $1, 
               tipoplano = $2, 
               dataassinatura = $3, 
               dataexpiracao = $4, 
               codigoassinante = $5,
               transaction_code = $6,
               acessovitalicio = $7,
               isactive = $8
           WHERE id = $9`,
          [
            'hotmart',
            'premium',
            dataAssinatura,
            dataExpiracao,
            payload.data?.subscription?.subscriber?.code || payload.data?.purchase?.transaction,
            payload.data?.purchase?.transaction,
            false,
            true,
            user.id
          ]
        );
        
        console.log(`✅ Assinatura do usuário ${user.username} (ID: ${user.id}) atualizada com sucesso para premium!`);
        return { 
          success: true, 
          message: `Assinatura atualizada para o usuário ${user.username} (ID: ${user.id})` 
        };
        
      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'SUBSCRIPTION_CANCELLATION':
        // Cancelar assinatura do usuário
        await client.query(
          `UPDATE users 
           SET tipoplano = $1, 
               dataexpiracao = $2,
               isactive = $3
           WHERE id = $4`,
          [
            'free',
            new Date(), // Expira agora
            true,
            user.id
          ]
        );
        
        console.log(`✅ Assinatura do usuário ${user.username} (ID: ${user.id}) cancelada!`);
        return { 
          success: true, 
          message: `Assinatura cancelada para o usuário ${user.username} (ID: ${user.id})` 
        };
        
      default:
        console.log(`ℹ️ Evento ${eventType} não requer atualização de assinatura`);
        return { 
          success: true, 
          message: `Evento ${eventType} recebido, mas não requer atualização de assinatura` 
        };
    }
  } catch (err) {
    console.error('❌ Erro ao atualizar assinatura:', err);
    return { success: false, message: `Erro ao processar assinatura: ${err.message}` };
  } finally {
    client.release();
  }
}

// Rota principal para receber webhooks da Hotmart
app.post('/webhook-hotmart', async (req, res) => {
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
    
    // Registrar o webhook no banco de dados
    try {
      await registrarWebhook(payload);
    } catch (dbError) {
      console.error('Erro ao registrar webhook no banco:', dbError);
    }
    
    // Processar atualização de assinatura de usuário
    let processingResult = {
      success: false,
      message: `Evento ${payload.event || 'unknown'} recebido mas não processado completamente`
    };
    
    const eventType = payload.event || 'unknown';
    const buyerEmail = payload.data?.buyer?.email;
    
    if (eventType !== 'unknown' && buyerEmail) {
      processingResult = await atualizarAssinaturaUsuario(buyerEmail, eventType, payload);
    }
    
    // Responder com sucesso para a Hotmart não reenviar o webhook
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido e processado',
      timestamp: new Date().toISOString(),
      processingResult
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
app.get('/webhook-logs', async (req, res) => {
  try {
    // Logs de arquivos
    const files = fs.readdirSync(logsFolder);
    const logFiles = files
      .filter(file => file.startsWith('webhook-') && file.endsWith('.json'))
      .sort((a, b) => {
        // Ordenar por data de modificação (mais recente primeiro)
        return fs.statSync(path.join(logsFolder, b)).mtime.getTime() - 
               fs.statSync(path.join(logsFolder, a)).mtime.getTime();
      });
    
    // Logs do banco de dados
    let dbLogs = [];
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 50`
        );
        dbLogs = result.rows;
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Erro ao buscar logs no banco:', dbError);
    }
    
    return res.status(200).json({
      totalFileLogs: logFiles.length,
      totalDbLogs: dbLogs.length,
      fileLogs: logFiles.slice(0, 5).map(file => {
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
      }),
      dbLogs: dbLogs.slice(0, 5)
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Erro ao listar logs'
    });
  }
});

// Rota para ver o último webhook recebido
app.get('/ultimo-webhook', async (req, res) => {
  try {
    // Buscar do banco de dados primeiro (mais confiável)
    let dbWebhook = null;
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1`
        );
        if (result.rows.length > 0) {
          dbWebhook = result.rows[0];
        }
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Erro ao buscar último webhook no banco:', dbError);
    }
    
    // Se não encontrou no banco, tenta nos arquivos
    if (!dbWebhook) {
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
        source: 'file',
        latestWebhook: webhookData,
        receivedAt: new Date(webhookData.timestamp).toLocaleString('pt-BR'),
        filename: latestFile
      });
    } else {
      // Retornar o webhook do banco
      return res.status(200).json({
        source: 'database',
        latestWebhook: {
          ...dbWebhook,
          raw_data: typeof dbWebhook.raw_data === 'string' 
            ? JSON.parse(dbWebhook.raw_data)
            : dbWebhook.raw_data
        },
        receivedAt: new Date(dbWebhook.created_at).toLocaleString('pt-BR')
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Erro ao obter último webhook'
    });
  }
});

// Rota para verificar status do servidor
app.get('/', (req, res) => {
  return res.status(200).json({
    status: 'online',
    message: 'Servidor de webhook da Hotmart está funcionando',
    endpoints: {
      webhook: '/webhook-hotmart',
      logs: '/webhook-logs',
      ultimoWebhook: '/ultimo-webhook'
    },
    serverTime: new Date().toISOString()
  });
});

// Criar tabela de logs de webhook se não existir
async function criarTabelaWebhookLogs() {
  const client = await pool.connect();
  try {
    // Verificar se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_logs'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Criando tabela webhook_logs...');
      await client.query(`
        CREATE TABLE webhook_logs (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(100) NOT NULL,
          transaction_code VARCHAR(100),
          buyer_email VARCHAR(255),
          raw_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          processed BOOLEAN DEFAULT FALSE,
          process_result JSONB
        );
      `);
      console.log('✅ Tabela webhook_logs criada com sucesso!');
    } else {
      console.log('✅ Tabela webhook_logs já existe.');
    }
  } catch (err) {
    console.error('❌ Erro ao criar tabela webhook_logs:', err);
  } finally {
    client.release();
  }
}

// Iniciar o servidor
criarTabelaWebhookLogs().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor webhook da Hotmart rodando na porta ${PORT}`);
    console.log(`URL para configurar na Hotmart: https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev:${PORT}/webhook-hotmart`);
    console.log(`Para ver logs acumulados: https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev:${PORT}/webhook-logs`);
    console.log(`Para ver o último webhook: https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev:${PORT}/ultimo-webhook`);
  });
});