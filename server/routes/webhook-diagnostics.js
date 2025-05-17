/**
 * Router para diagnóstico avançado de webhooks
 * 
 * Este router fornece endpoints para realizar consultas avançadas nos logs de webhooks,
 * incluindo a capacidade de buscar em campos aninhados nos dados JSON
 */

import express from 'express';
import { pool } from '../db.js';
import { isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Middleware para garantir que apenas admins possam acessar estas rotas
router.use(isAdmin);

/**
 * Busca avançada de webhook por email, mesmo em campos aninhados
 * 
 * Esta rota consegue encontrar logs que contenham o email especificado,
 * mesmo quando está aninhado nos dados JSON do payload
 */
router.get('/advanced-search', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'O parâmetro email é obrigatório'
      });
    }
    
    console.log(`[/webhook-diagnostics/advanced-search] Buscando logs com email: ${email}`);
    
    // Usar o operador @> do PostgreSQL para buscar em JSON
    // Essa consulta é mais avançada e consegue buscar em campos aninhados
    const result = await pool.query(`
      WITH parsed_webhooks AS (
        SELECT 
          id, 
          "eventType",
          source,
          status,
          "createdAt",
          "payloadData",
          "errorMessage"
        FROM "webhookLogs"
        WHERE 
          "payloadData" LIKE $1
          OR ("payloadData"::text ILIKE $2)
      )
      SELECT * FROM parsed_webhooks
      ORDER BY "createdAt" DESC
    `, [`%${email}%`, `%${email}%`]);
    
    // Para cada resultado, tentar extrair o email real para confirmar
    const enhancedResults = result.rows.map(log => {
      let foundEmail = null;
      let emailLocation = null;
      
      try {
        // Converter o payload para JSON se for string
        const payload = typeof log.payloadData === 'string' 
          ? JSON.parse(log.payloadData) 
          : log.payloadData;
        
        // Buscar em diferentes locais dependendo da origem
        if (log.source === 'hotmart') {
          foundEmail = payload.data?.buyer?.email || null;
          emailLocation = foundEmail ? 'data.buyer.email' : null;
        } else if (log.source === 'doppus') {
          foundEmail = payload.customer?.email || null;
          emailLocation = foundEmail ? 'customer.email' : null;
        }
        
        // Se ainda não encontrou o email, verificar se está no texto serializado
        if (!foundEmail) {
          const payloadStr = JSON.stringify(payload).toLowerCase();
          if (payloadStr.includes(email.toLowerCase())) {
            foundEmail = '[Email encontrado na serialização do payload]';
            emailLocation = 'json_serialized';
          }
        }
      } catch (e) {
        console.error(`Erro ao analisar payload do log ${log.id}:`, e);
      }
      
      return {
        ...log,
        extractedEmail: foundEmail,
        emailLocation,
        matchType: foundEmail ? 'direct_match' : 'text_match'
      };
    });
    
    res.json({
      success: true,
      count: enhancedResults.length,
      results: enhancedResults
    });
  } catch (error) {
    console.error('Erro na busca avançada de webhooks:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar busca avançada de webhooks',
      error: error.message
    });
  }
});

/**
 * Exibe informações detalhadas sobre um log específico
 */
router.get('/log/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    const result = await pool.query(`
      SELECT * 
      FROM "webhookLogs"
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Log não encontrado'
      });
    }
    
    const log = result.rows[0];
    
    // Tentar extrair informações relevantes do payload
    let parsedPayload = null;
    let extractedEmail = null;
    let payloadEmail = null;
    
    try {
      parsedPayload = typeof log.payloadData === 'string' 
        ? JSON.parse(log.payloadData) 
        : log.payloadData;
      
      // Tentar encontrar o email dependendo da origem
      if (log.source === 'hotmart') {
        payloadEmail = parsedPayload.data?.buyer?.email;
      } else if (log.source === 'doppus') {
        payloadEmail = parsedPayload.customer?.email;
      }
      
      // Se encontrou o email, destacar
      if (payloadEmail) {
        extractedEmail = payloadEmail;
      }
    } catch (e) {
      console.error(`Erro ao analisar payload do log ${log.id}:`, e);
    }
    
    res.json({
      success: true,
      log: {
        ...log,
        parsedPayload,
        extractedEmail
      }
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do log:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes do log',
      error: error.message
    });
  }
});

export default router;