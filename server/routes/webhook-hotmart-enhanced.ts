/**
 * Rota de Webhook da Hotmart com Processamento Aprimorado
 * 
 * Esta implementação oferece tratamento robusto para diferentes formatos de webhook
 * da Hotmart, incluindo extração segura de dados e conformidade com a API v2.0.0.
 */

import express from 'express';
import pg from 'pg';
import crypto from 'crypto';
import { getHotmartSecret } from '../webhook-config';
const { Pool } = pg;

// Função para obter a conexão com o banco de dados
async function getPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  return pool;
}

const router = express.Router();

/**
 * Função de extração profunda de email dos payloads Hotmart
 * Busca recursivamente por campos de email em qualquer nível do objeto JSON
 */
function extractEmailDeep(payload: any): string | null {
  console.log('🔍 Iniciando extração profunda de email do payload...');
  
  // Função auxiliar recursiva
  function searchEmail(obj: any, path: string = ''): string | null {
    // Caso base: objeto nulo ou indefinido
    if (!obj) return null;
    
    // Caso base: é uma string e parece um email
    if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
      console.log(`✅ Email encontrado em ${path}: ${obj}`);
      return obj;
    }
    
    // Caso recursivo: é um objeto
    if (typeof obj === 'object') {
      // Primeiro, verificar campos com nome sugestivo de email
      for (const key in obj) {
        if (
          key.toLowerCase().includes('email') && 
          typeof obj[key] === 'string' && 
          obj[key].includes('@')
        ) {
          console.log(`✅ Email encontrado em ${path}.${key}: ${obj[key]}`);
          return obj[key];
        }
      }
      
      // Depois, buscar recursivamente em todos os campos
      for (const key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        const result = searchEmail(obj[key], newPath);
        if (result) return result;
      }
    }
    
    // Caso especial: é um array
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const newPath = path ? `${path}[${i}]` : `[${i}]`;
        const result = searchEmail(obj[i], newPath);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  // Inicia a busca e retorna o resultado
  const result = searchEmail(payload);
  
  if (!result) {
    console.log('⚠️ Nenhum email encontrado no payload após busca profunda');
  }
  
  return result;
}

/**
 * Função para registrar logs de webhook no banco de dados
 */
async function logWebhookToDatabase(
  event: string,
  status: 'received' | 'processed' | 'error',
  email: string | null,
  webhookData: any,
  errorMessage: string | null = null,
  transactionId: string | null = null,
  sourceIp: string | null = null
) {
  try {
    // Log detalhado para debugging
    console.log('📝 Registrando webhook no banco de dados:');
    console.log('- Evento:', event);
    console.log('- Status:', status);
    console.log('- Email:', email);
    console.log('- Transaction ID:', transactionId);
    
    // Obter conexão com o banco de dados
    const pool = await getPool();
    
    // Construir consulta SQL com suporte à coluna transactionId
    const query = `
      INSERT INTO "webhookLogs" (
        "eventType", "status", "email", "source", "payloadData", 
        "errorMessage", "transactionId", "sourceIp", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const values = [
      event,
      status,
      email,
      'hotmart',
      JSON.stringify(webhookData),
      errorMessage,
      transactionId,
      sourceIp,
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

/**
 * Função para extrair número da transação (quando disponível)
 */
function extractTransactionId(payload: any): string | null {
  // Verificar diferentes formatos de payload
  
  // Formato v2.0.0 com purchase.transaction
  if (payload?.data?.purchase?.transaction) {
    console.log(`✅ TransactionId encontrado em data.purchase.transaction: ${payload.data.purchase.transaction}`);
    return payload.data.purchase.transaction;
  }
  
  // Formatos alternativos
  if (payload?.data?.transaction) {
    console.log(`✅ TransactionId encontrado em data.transaction: ${payload.data.transaction}`);
    return payload.data.transaction;
  }
  
  if (payload?.transaction) {
    console.log(`✅ TransactionId encontrado em transaction: ${payload.transaction}`);
    return payload.transaction;
  }
  
  // Buscar transactionId em qualquer lugar no payload
  function searchTransactionId(obj: any, path: string = ''): string | null {
    if (!obj) return null;
    
    if (typeof obj === 'object') {
      // Procurar por campos com nome relacionado a transação
      for (const key in obj) {
        if (
          (key.toLowerCase().includes('transaction') || 
           key.toLowerCase().includes('pedido') || 
           key.toLowerCase().includes('order')) && 
          typeof obj[key] === 'string'
        ) {
          console.log(`✅ TransactionId encontrado em ${path}.${key}: ${obj[key]}`);
          return obj[key];
        }
      }
      
      // Buscar recursivamente
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          const newPath = path ? `${path}.${key}` : key;
          const result = searchTransactionId(obj[key], newPath);
          if (result) return result;
        }
      }
    }
    
    return null;
  }
  
  // Se não encontrou nos caminhos conhecidos, buscar recursivamente
  const result = searchTransactionId(payload);
  
  if (!result) {
    console.log('⚠️ Nenhum transactionId encontrado no payload');
  }
  
  return result;
}

/**
 * Função para normalizar o formato de data do payload
 */
function normalizePayloadDates(payload: any): any {
  try {
    // Criar uma cópia do payload para não modificar o original
    const normalizedPayload = JSON.parse(JSON.stringify(payload));
    
    // Verificar se creation_date é um número e convertê-lo para string ISO
    if (normalizedPayload.creation_date && typeof normalizedPayload.creation_date === 'number') {
      const date = new Date(normalizedPayload.creation_date);
      normalizedPayload.creation_date = date.toISOString();
      console.log('📅 creation_date convertido:', normalizedPayload.creation_date);
    }
    
    // Verificar campos de data aninhados em data.purchase
    if (normalizedPayload.data?.purchase) {
      const purchase = normalizedPayload.data.purchase;
      
      // Converter approved_date se for número
      if (purchase.approved_date && typeof purchase.approved_date === 'number') {
        purchase.approved_date = new Date(purchase.approved_date).toISOString();
        console.log('📅 purchase.approved_date convertido:', purchase.approved_date);
      }
      
      // Converter order_date se for número
      if (purchase.order_date && typeof purchase.order_date === 'number') {
        purchase.order_date = new Date(purchase.order_date).toISOString();
        console.log('📅 purchase.order_date convertido:', purchase.order_date);
      }
      
      // Converter date_next_charge se for número
      if (purchase.date_next_charge && typeof purchase.date_next_charge === 'number') {
        purchase.date_next_charge = new Date(purchase.date_next_charge).toISOString();
        console.log('📅 purchase.date_next_charge convertido:', purchase.date_next_charge);
      }
      
      // Converter pix_expiration_date se existir e for número
      if (purchase.payment?.pix_expiration_date && typeof purchase.payment.pix_expiration_date === 'number') {
        purchase.payment.pix_expiration_date = new Date(purchase.payment.pix_expiration_date).toISOString();
        console.log('📅 purchase.payment.pix_expiration_date convertido:', purchase.payment.pix_expiration_date);
      }
    }
    
    return normalizedPayload;
  } catch (error) {
    console.error('❌ Erro ao normalizar datas do payload:', error);
    // Em caso de erro, retornar o payload original
    return payload;
  }
}

/**
 * Função para verificar a assinatura do webhook da Hotmart
 * @param payload Dados recebidos no webhook
 * @param signature Assinatura fornecida no cabeçalho
 * @param secret Secret compartilhado com a Hotmart
 * @returns boolean indicando se a assinatura é válida
 */
function verifyHotmartSignature(payload: any, signature: string | undefined, secret: string): boolean {
  try {
    // Se a assinatura não estiver presente, prosseguir sem verificação em ambiente de desenvolvimento
    if (!signature) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Webhook sem assinatura, prosseguindo sem verificação (ambiente de desenvolvimento)');
        return true;
      } else {
        console.error('❌ Webhook sem assinatura em ambiente de produção');
        return false;
      }
    }
    
    // Já importamos crypto no topo do arquivo
    // Não precisamos importar novamente
    
    // Calcular assinatura usando o mesmo algoritmo da Hotmart (HMAC SHA-256)
    const calculatedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Verificar se as assinaturas correspondem
    const isValid = calculatedSignature === signature;
    
    if (isValid) {
      console.log('✅ Assinatura do webhook validada com sucesso');
    } else {
      console.error('❌ Falha na validação da assinatura do webhook');
      console.log('- Assinatura recebida:', signature);
      console.log('- Assinatura calculada:', calculatedSignature);
    }
    
    // Em ambiente de desenvolvimento, permitir mesmo com assinatura inválida
    if (!isValid && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Prosseguindo com assinatura inválida (ambiente de desenvolvimento)');
      return true;
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Erro ao verificar assinatura do webhook:', error);
    // Em ambiente de desenvolvimento, continuar mesmo com erro
    return process.env.NODE_ENV === 'development';
  }
}

/**
 * Rota principal para receber webhooks da Hotmart
 */
router.post('/', async (req, res) => {
  console.log('📩 Webhook da Hotmart recebido em', new Date().toISOString());
  console.log('📦 Corpo do webhook:', JSON.stringify(req.body, null, 2));
  
  // Obter IP de origem para rastreamento
  const sourceIp = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   'unknown';
  
  // Listar os cabeçalhos recebidos para diagnóstico
  const headerKeys = Object.keys(req.headers).join(', ');
  console.log('🔑 Cabeçalhos recebidos:', headerKeys);
  console.log('🔐 Assinatura recebida:', req.headers['x-hotmart-webhook-signature']);
  
  try {
    // Normalizar o payload, especialmente as datas
    const originalPayload = req.body;
    const payload = normalizePayloadDates(originalPayload);
    
    // Obter a assinatura do cabeçalho
    const signature = req.headers['x-hotmart-webhook-signature'] as string | undefined;
    
    // Obter o segredo (secret) compartilhado da Hotmart
    const hotmartSecret = getHotmartSecret();
    
    // Verificar a assinatura do webhook (se em produção)
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyHotmartSignature(originalPayload, signature, hotmartSecret);
      if (!isValid) {
        console.error('❌ Assinatura do webhook inválida ou ausente em ambiente de produção');
        
        // Log da tentativa inválida no banco de dados
        await logWebhookToDatabase(
          'INVALID_SIGNATURE',
          'error',
          null,
          { originalPayload, signature },
          'Assinatura inválida',
          null,
          sourceIp as string
        );
        
        // Em produção, retornar 200 mesmo com assinatura inválida
        // para não causar reenvios (mas registrar o erro)
        return res.status(200).json({
          success: false,
          message: 'Assinatura do webhook inválida',
          note: 'Webhook registrado como inválido'
        });
      }
    } else {
      // Em desenvolvimento, verificar mas continuar mesmo se inválido
      verifyHotmartSignature(originalPayload, signature, hotmartSecret);
    }
    
    let event = payload?.event || 'UNKNOWN';
    let webhookStatus = 'received';
    let webhookError = null;
    let logId = null;
    
    // Extrair o email do payload usando extração profunda
    const email = extractEmailDeep(payload);
    console.log('📧 Email extraído:', email);
    
    // Extrair número da transação
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
        payload,
        null,
        transactionId,
        sourceIp as string
      );
      
      console.log(`📝 Webhook registrado com ID: ${logId}`);
    } catch (dbError) {
      console.error("❌ Erro ao registrar webhook no banco de dados:", dbError);
      // Continuar o processamento mesmo com erro de registro
    }
    
    // Extrair informações adicionais para resposta
    const productId = payload?.data?.product?.id || null;
    const productName = payload?.data?.product?.name || null;
    const planName = payload?.data?.subscription?.plan?.name || null;
    
    // Registrar recebimento e retornar sucesso
    // Sempre retornar 200 para a Hotmart não reenviar
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso',
      event: event,
      email: email,
      transactionId: transactionId,
      productId: productId,
      productName: productName,
      planName: planName
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook da Hotmart:', error);
    
    // Sempre retornar 200 para a Hotmart não reenviar
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook',
      note: 'Erro registrado, mas confirmamos o recebimento do webhook'
    });
  }
});

/**
 * Rota para testar se o webhook está acessível
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'O endpoint de webhook da Hotmart (versão aprimorada) está online e funcionando',
    timestamp: new Date().toISOString(),
    note: 'Configure este endpoint na plataforma da Hotmart para receber notificações de pagamento'
  });
});

export default router;