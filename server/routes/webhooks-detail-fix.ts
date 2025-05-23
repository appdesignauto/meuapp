/**
 * Implementação corrigida para buscar detalhes de webhooks
 * Esta versão não depende da coluna userId que não existe na tabela atual
 */

import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { SessionData } from 'express-session';

const router = express.Router();

// Interface para extender o tipo de sessão com usuário
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      nivelacesso: string;
      [key: string]: any;
    };
  }
}

// Middleware para verificar se o usuário é administrador
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.session?.user?.nivelacesso === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado' });
};

// Rota para buscar detalhes de um webhook específico
router.get('/api/webhooks/logs/:id', isAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  
  try {
    // Consulta direta SQL para maior flexibilidade
    const query = `
      SELECT *
      FROM "webhookLogs"
      WHERE id = $1
    `;
    
    const result = await db.execute(sql`
      SELECT * FROM "webhookLogs" WHERE id = ${id}
    `);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: 'Log não encontrado' });
    }
    
    const webhookLog = result.rows[0];
    
    // Processar dados antes de enviar para o cliente
    let payloadData = webhookLog.payloadData;
    
    // Garantir que o payload seja um objeto JSON
    if (typeof payloadData === 'string') {
      try {
        payloadData = JSON.parse(payloadData);
      } catch (e) {
        // Se não for um JSON válido, manter como string
        console.warn(`Payload do webhook #${id} não é um JSON válido:`, e);
      }
    }
    
    // Formatar datas para exibição - tratando possíveis tipos
    const createdAt = webhookLog.createdAt 
      ? (typeof webhookLog.createdAt === 'object' 
         ? new Date(webhookLog.createdAt as any).toISOString() 
         : new Date(String(webhookLog.createdAt)).toISOString()) 
      : null;
    
    // Montar o objeto de resposta
    const logResponse = {
      ...webhookLog,
      payloadData,
      createdAt,
      // Incluir campos adicionais mesmo que sejam null para compatibilidade
      userId: null
    };
    
    console.log(`Webhook #${id} encontrado e retornado`);
    return res.status(200).json(logResponse);
    
  } catch (error: any) {
    console.error(`Erro ao buscar log de webhook #${id}:`, error);
    return res.status(500).json({ 
      message: 'Erro ao buscar detalhes do webhook', 
      error: error?.message || 'Erro desconhecido' 
    });
  }
});

export default router;