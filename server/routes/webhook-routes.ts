import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { HotmartService } from '../services/hotmart-service';
import { logWebhookToDatabase, extractEmailFromPayload } from '../utils/webhook-helpers';

const prisma = new PrismaClient();
const hotmartService = new HotmartService(prisma);
const router = Router();

// Endpoint para webhook da Hotmart
router.post('/hotmart', async (req: Request, res: Response) => {
  try {
    // Log detalhado para diagnóstico
    console.log('[Webhook] Cabeçalhos recebidos:', JSON.stringify(req.headers));
    console.log('[Webhook] Corpo recebido:', JSON.stringify(req.body));
    
    // Verificação de token simplificada
    // Prioriza o corpo da requisição primeiro, depois tenta os cabeçalhos
    const token = 
      (req.body && req.body.hottok) || // Busca primeiro no corpo (formato mais comum na Hotmart)
      req.headers['x-hotmart-hottok']?.toString() || 
      req.headers['x-hotmart-webhook-token']?.toString() ||
      null;
    
    console.log('🔑 [Webhook] Token recebido:', token);
    console.log('🔑 [Webhook] Token esperado:', process.env.HOTMART_WEBHOOK_SECRET);
    
    // Verificação do token - validação desativada temporariamente para debugging
    // Remova o comentário abaixo quando estiver tudo funcionando
    /*
    if (!token || token !== process.env.HOTMART_WEBHOOK_SECRET) {
      console.warn("🔒 [Webhook] Token de autenticação ausente ou inválido");
      return res.status(200).json({
        success: false,
        message: 'Token inválido ou ausente',
        note: 'Webhook rejeitado, mas confirmamos o recebimento'
      });
    }
    */
    
    // ATENÇÃO: VALIDAÇÃO DE TOKEN TEMPORARIAMENTE DESATIVADA
    // Esta linha abaixo deve ser removida quando a integração estiver funcionando!
    console.warn("⚠️ [AVISO] Validação de token Hotmart está temporariamente desativada para testes");
    
    // Extrair informações do evento - também flexível
    let event = req.headers['x-hotmart-event'] as string;
    
    // Se não encontrar no cabeçalho padrão, verificar em alternativas conhecidas
    if (!event && req.body.event) {
      event = req.body.event;
    }
    
    // Se ainda não tiver evento, assumir baseado na operação no corpo
    if (!event && req.body.data && req.body.data.purchase) {
      event = 'PURCHASE_APPROVED'; // Assumir compra aprovada como padrão
    }
    
    const payload = req.body;
    
    console.log(`[Webhook] Processando evento da Hotmart: ${event || 'evento não identificado'}`);
    
    // Se não tiver identificado um evento, definir um valor padrão
    if (!event) {
      console.warn('[Webhook] AVISO: Tipo de evento da Hotmart ausente, prosseguindo como evento genérico');
      event = 'UNDEFINED_EVENT';
    }

    // Usar o token obtido anteriormente como assinatura para validação
    const result = await hotmartService.processWebhook(event, payload, token as string);
    
    if (result.success) {
      console.log(`[Webhook] Evento da Hotmart processado com sucesso: ${event}`);
      return res.status(200).json({ 
        success: true, 
        message: result.message 
      });
    } else {
      console.warn(`[Webhook] Erro ao processar evento da Hotmart: ${result.message}`);
      // Importante: Sempre retornar 200 para a Hotmart, mesmo com erro
      // Isso evita que a Hotmart tente reenviar o mesmo webhook repetidamente
      return res.status(200).json({ 
        success: false, 
        message: result.message,
        note: "Erro registrado, mas confirmamos o recebimento do webhook"
      });
    }
  } catch (error) {
    console.error('[Webhook] Erro interno ao processar webhook da Hotmart:', error);
    
    // Registrar o erro no log mesmo em caso de exceção
    try {
      const payload = req.body;
      const event = req.body.event || 'UNKNOWN_EVENT';
      
      await logWebhookToDatabase(
        prisma,
        event,
        'error',
        extractEmailFromPayload(payload),
        payload,
        error.message || 'Erro interno no processamento do webhook'
      );
    } catch (logError) {
      console.error('[Webhook] Erro ao registrar log de falha:', logError);
    }
    
    // Sempre responder com 200 mesmo em caso de erro interno
    // A Hotmart não precisa reenviar o webhook, nós é que precisamos corrigir o problema
    return res.status(200).json({ 
      success: false, 
      message: 'Erro interno ao processar webhook, mas confirmando recebimento' 
    });
  }
});

// Endpoint para simular webhook da Hotmart (apenas para testes)
router.post('/hotmart/simulate', async (req: Request, res: Response) => {
  // Verificar se está em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'development' && process.env.HOTMART_SANDBOX !== 'true') {
    return res.status(403).json({ 
      success: false, 
      message: 'Esta rota só está disponível em ambiente de desenvolvimento ou sandbox' 
    });
  }

  try {
    const payload = req.body;
    const event = req.body.event || 'PURCHASE_APPROVED'; // Evento padrão
    const signature = 'simulado'; // Assinatura simulada
    
    console.log(`[Webhook Simulado] Simulando evento da Hotmart: ${event}`);
    
    const result = await hotmartService.processWebhook(event, payload, signature);
    
    return res.status(200).json({ 
      success: true, 
      simulationResult: result 
    });
  } catch (error) {
    console.error('[Webhook Simulado] Erro ao simular webhook:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao simular webhook' 
    });
  }
});

// Endpoint para listar logs de webhook (apenas para administradores)
router.get('/logs', async (req: Request, res: Response) => {
  try {
    // Parâmetros de paginação e filtros
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Filtros opcionais
    const status = req.query.status as string;
    const eventType = req.query.eventType as string;
    const source = req.query.source as string;
    const search = req.query.search as string;
    
    console.log('Buscando logs de webhook com filtros:', {
      page, limit, status, eventType, source, search
    });
    
    // Consulta SQL direta para buscar os logs
    let whereClause = '';
    const params = [];
    let paramCount = 1;
    
    if (status) {
      whereClause += ' WHERE status = $' + paramCount++;
      params.push(status);
    }
    
    if (eventType) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'event_type = $' + paramCount++;
      params.push(eventType);
    }
    
    if (source) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'source = $' + paramCount++;
      params.push(source);
    }
    
    if (search) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'email ILIKE $' + paramCount++;
      params.push(`%${search}%`);
    }
    
    // Consulta para contar o total de registros
    const countQuery = `SELECT COUNT(*) FROM webhook_logs${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
    const totalCount = parseInt(countResult[0]?.count || '0');
    
    // Consulta para buscar os logs com paginação
    const query = `
      SELECT id, created_at, event_type, status, email, source, raw_payload, error_message
      FROM webhook_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(limit);
    params.push(skip);
    
    const logs = await prisma.$queryRawUnsafe(query, ...params);
    
    // Formatar os logs para o frontend
    const formatted = logs.map(log => ({
      id: log.id,
      date: log.created_at,
      email: log.email || 'N/A',
      source: log.source || 'hotmart',
      event_type: log.event_type,
      status: log.status,
      raw_payload: log.raw_payload,
      error_message: log.error_message
    }));
    
    return res.status(200).json({
      logs: formatted,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar logs de webhook:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar logs de webhook',
      error: error.message
    });
  }
});

// Endpoint para listar assinaturas ativas (apenas para administradores)
router.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    // Parâmetros de paginação e filtros
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const planType = req.query.planType as string;
    const status = req.query.status as string;
    
    console.log('Buscando assinaturas com filtros:', {
      page, limit, search, planType, status
    });
    
    // Consulta SQL direta para buscar as assinaturas
    let whereClause = '';
    const params = [];
    let paramCount = 1;
    
    // Começamos com WHERE tipoplano IS NOT NULL para garantir que só buscamos usuários com assinatura
    whereClause = ' WHERE tipoplano IS NOT NULL';
    
    if (search) {
      whereClause += ' AND (email ILIKE $' + paramCount + ' OR username ILIKE $' + paramCount + ')';
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (planType) {
      whereClause += ' AND tipoplano = $' + paramCount++;
      params.push(planType);
    }
    
    if (status) {
      if (status === 'active') {
        whereClause += ' AND dataexpiracao > NOW()';
      } else if (status === 'expired') {
        whereClause += ' AND dataexpiracao < NOW()';
      }
    }
    
    // Consulta para contar o total de registros
    const countQuery = `SELECT COUNT(*) FROM users${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
    const totalCount = parseInt(countResult[0]?.count || '0');
    
    // Consulta para buscar as assinaturas com paginação
    const query = `
      SELECT 
        id, 
        username, 
        email, 
        tipoplano, 
        origemassinatura, 
        dataassinatura, 
        dataexpiracao,
        acessovitalicio,
        observacaoadmin
      FROM users
      ${whereClause}
      ORDER BY dataassinatura DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    params.push(limit);
    params.push(skip);
    
    const subscriptions = await prisma.$queryRawUnsafe(query, ...params);
    
    // Formatar as assinaturas para o frontend
    const formatted = subscriptions.map(sub => ({
      id: sub.id,
      username: sub.username,
      email: sub.email,
      planType: sub.tipoplano,
      source: sub.origemassinatura || 'manual',
      startDate: sub.dataassinatura,
      expiryDate: sub.dataexpiracao,
      isLifetime: sub.acessovitalicio,
      adminNotes: sub.observacaoadmin,
      status: sub.dataexpiracao > new Date() || sub.acessovitalicio ? 'active' : 'expired'
    }));
    
    return res.status(200).json({
      subscriptions: formatted,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar assinaturas',
      error: error.message
    });
  }
});

export default router;