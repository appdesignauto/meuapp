/**
 * Rotas de webhook da Hotmart com tratamento melhorado
 * Esta implementação segue as melhores práticas para integração com a Hotmart
 */

import express from 'express';
import pg from 'pg';
const { Pool } = pg;

// Função para obter a conexão com o banco de dados
async function getPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  return pool;
}

const router = express.Router();

// Função para registrar logs de webhook
async function logWebhookToDatabase(
  event: string,
  status: 'received' | 'processed' | 'error',
  email: string | null,
  webhookData: any,
  errorMessage: string | null = null
) {
  try {
    // Log detalhado para debugging
    console.log('📝 Registrando webhook no banco de dados:');
    console.log('- Evento:', event);
    console.log('- Status:', status);
    console.log('- Email:', email);
    
    // Obter conexão com o banco de dados
    const pool = await getPool();
    
    // Construir consulta SQL diretamente - verificando estrutura da tabela
    const query = `
      INSERT INTO "webhookLogs" (
        "eventType", "status", "email", "source", "payloadData", "errorMessage", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const values = [
      event,
      status,
      email,
      'hotmart',
      JSON.stringify(webhookData),
      errorMessage,
      new Date()
    ];
    
    // Executar a consulta
    const result = await pool.query(query, values);
    const logId = result.rows[0].id;
    
    console.log('✅ Log de webhook registrado com ID:', logId);
    
    // Liberar a conexão
    await pool.end();
    
    return logId;
  } catch (error) {
    console.error('❌ Erro ao registrar webhook no banco de dados:', error);
    // Não lançar erro para não interromper o fluxo
    return null;
  }
}

// Função para extrair email do payload da Hotmart
function extractEmailFromPayload(payload: any): string | null {
  let email = null;
  
  // Verificar todas as possíveis localizações do email
  if (payload?.data?.buyer?.email) {
    email = payload.data.buyer.email;
  } else if (payload?.data?.subscriber?.email) {
    email = payload.data.subscriber.email;
  } else if (payload?.buyer?.email) {
    email = payload.buyer.email;
  } else if (payload?.subscriber?.email) {
    email = payload.subscriber.email;
  } else if (payload?.data?.customer?.email) {
    // Alguns webhooks da Hotmart usam 'customer' em vez de 'buyer'
    email = payload.data.customer.email;
  } else if (payload?.data?.purchase?.customer?.email) {
    // Formato encontrado em alguns webhooks de compra
    email = payload.data.purchase.customer.email;
  }
  
  return email;
}

// Função para normalizar o formato de data do payload
function normalizePayloadDates(payload: any): any {
  try {
    // Criar uma cópia do payload para não modificar o original
    const normalizedPayload = { ...payload };
    
    // Verificar se o creation_date é um número (timestamp) e convertê-lo para string ISO
    if (normalizedPayload.creation_date && typeof normalizedPayload.creation_date === 'number') {
      // Converter timestamp de milissegundos para data ISO
      const date = new Date(normalizedPayload.creation_date);
      normalizedPayload.creation_date = date.toISOString();
      console.log('📅 Timestamp convertido:', normalizedPayload.creation_date);
    }
    
    return normalizedPayload;
  } catch (error) {
    console.error('❌ Erro ao normalizar datas do payload:', error);
    // Em caso de erro, retornar o payload original
    return payload;
  }
}

// Função para extrair número da transação (quando disponível)
function extractTransactionId(payload: any): string | null {
  if (payload?.data?.purchase?.transaction) {
    return payload.data.purchase.transaction;
  } else if (payload?.data?.transaction) {
    return payload.data.transaction;
  } else if (payload?.transaction) {
    return payload.transaction;
  }
  return null;
}

// Rota principal para receber webhooks da Hotmart
router.post('/', async (req, res) => {
  console.log('📩 Webhook da Hotmart recebido');
  console.log('📦 Corpo do webhook:', JSON.stringify(req.body, null, 2));
  
  // Listar os cabeçalhos recebidos para diagnóstico
  const headerKeys = Object.keys(req.headers).join(', ');
  console.log('🔑 Cabeçalhos recebidos:', headerKeys);
  
  try {
    // Normalizar o payload, especialmente as datas
    const originalPayload = req.body;
    const payload = normalizePayloadDates(originalPayload);
    
    let event = payload?.event || 'UNKNOWN';
    let webhookStatus = 'received';
    let webhookError = null;
    let logId = null;
    
    // Extrair o email do payload para registro
    const email = extractEmailFromPayload(payload);
    console.log('📧 Email extraído:', email);
    
    // Extrair número da transação (quando disponível)
    const transactionId = extractTransactionId(payload);
    console.log('🧾 ID da Transação:', transactionId);
    
    // Verificar se o evento é válido
    if (!event || event === 'UNKNOWN') {
      console.warn('⚠️ Evento Hotmart indefinido ou desconhecido');
      event = 'UNDEFINED_EVENT';
    }
    
    // Registrar o webhook no log
    try {
      logId = await logWebhookToDatabase(
        event,
        webhookStatus as 'received' | 'processed' | 'error',
        email,
        payload
      );
      
      console.log(`📝 Webhook registrado com ID: ${logId}`);
    } catch (dbError) {
      console.error("Erro ao registrar webhook no banco de dados:", dbError);
      // Continuar o processamento mesmo com erro de registro
    }
    
    // ⚠️ Por padrão, sempre confirmar recebimento para a Hotmart
    // mesmo que haja erros no processamento interno
    
    // Aqui implementaríamos a lógica de processamento do webhook
    // com base no tipo de evento (purchase_approved, etc)
    
    // Para o diagnóstico, vamos apenas confirmar recebimento
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso',
      event: event,
      email: email,
      transactionId: transactionId,
      note: 'Este endpoint é apenas para diagnóstico'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook da Hotmart:', error);
    
    // Sempre retornar 200 para a Hotmart não reenviar
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas confirmando recebimento',
      error: error.message
    });
  }
});

// Rota para testar se o webhook está acessível
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'O endpoint de webhook da Hotmart está online e funcionando',
    timestamp: new Date().toISOString(),
    note: 'Configure este endpoint na plataforma da Hotmart para receber notificações de pagamento'
  });
});

// Exportação padrão como objeto
export default router;

// Exportação compatível com ESM para dynamic import
export { router };