/**
 * Rota fixa para webhook da Hotmart com implementação independente
 * que garante sempre uma resposta JSON válida, sem interferência
 * do middleware SPA ou outras configurações
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

// Criar router para a rota fixa
const router = Router();

// Função para encontrar email em qualquer parte do payload da Hotmart
function findEmailInPayload(payload: any): string | null {
  if (!payload) return null;
  
  // Função recursiva para buscar emails em objetos aninhados
  function searchEmail(obj: any): string | null {
    // Caso base: é uma string e parece um email
    if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
      return obj;
    }
    
    // Caso recursivo: objeto
    if (typeof obj === 'object' && obj !== null) {
      // Verificar chaves que provavelmente contêm email
      if (obj.email && typeof obj.email === 'string') return obj.email;
      if (obj.buyer && obj.buyer.email) return obj.buyer.email;
      if (obj.customer && obj.customer.email) return obj.customer.email;
      if (obj.data && obj.data.buyer && obj.data.buyer.email) return obj.data.buyer.email;
      
      // Buscar em todas as propriedades
      for (const key in obj) {
        const result = searchEmail(obj[key]);
        if (result) return result;
      }
    }
    
    // Caso recursivo: array
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const result = searchEmail(obj[i]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchEmail(payload);
}

// Função para encontrar ID da transação no payload
function findTransactionId(payload: any): string | null {
  if (!payload) return null;
  
  // Verificar locais comuns primeiro
  if (payload.data?.purchase?.transaction) return payload.data.purchase.transaction;
  if (payload.data?.transaction) return payload.data.transaction;
  if (payload.transaction) return payload.transaction;
  
  // Função recursiva para busca profunda
  function searchTransactionId(obj: any): string | null {
    if (!obj || typeof obj !== 'object') return null;
    
    // Procurar por chaves que possam conter o ID da transação
    for (const key in obj) {
      if (
        (key.toLowerCase().includes('transaction') || 
         key.toLowerCase().includes('order') || 
         key.toLowerCase().includes('pedido')) && 
        typeof obj[key] === 'string'
      ) {
        return obj[key];
      }
      
      // Buscar recursivamente
      if (typeof obj[key] === 'object') {
        const result = searchTransactionId(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchTransactionId(payload);
}

// Implementação dedicada do webhook da Hotmart para garantir resposta JSON
router.post('/', async (req: Request, res: Response) => {
  // Forçar todos os cabeçalhos anti-cache possíveis
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-No-Cache', Date.now().toString());
  
  console.log('📩 Webhook FIXO da Hotmart recebido em', new Date().toISOString());
  
  try {
    // Imprimir o corpo da requisição
    console.log('📦 Corpo do webhook:', JSON.stringify(req.body, null, 2));
    
    // Capturar dados básicos do webhook
    const payload = req.body;
    const event = payload?.event || 'UNKNOWN';
    const email = findEmailInPayload(payload);
    const transactionId = findTransactionId(payload);
    
    console.log(`📊 Dados extraídos: evento=${event}, email=${email}, transactionId=${transactionId}`);
    
    // Registrar no banco de dados (log only)
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      await pool.query(
        `INSERT INTO webhook_logs 
          (event_type, status, email, source, raw_payload, transaction_id, source_ip, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          event,
          'received',
          email,
          'hotmart',
          JSON.stringify(payload),
          transactionId,
          req.ip,
          new Date()
        ]
      );
      
      console.log('✅ Webhook registrado no banco de dados');
      await pool.end();
    } catch (dbError) {
      console.error('❌ Erro ao registrar webhook:', dbError);
      // Continuar mesmo com erro de log
    }
    
    // Sempre retornar sucesso para a Hotmart não reenviar
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso pelo endpoint FIXO',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Mesmo com erro, retornar 200 para evitar reenvios
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas confirmamos o recebimento',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;