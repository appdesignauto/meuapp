import { Router } from 'express';
import { db } from '../db';
import { users, webhookLogs } from '@shared/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

const router = Router();

// Middleware alternativo para verificar se o usuário é admin
// sem depender do req.isAuthenticated() do Passport
const checkAdminManually = async (req, res, next) => {
  try {
    // Verificar se existe uma sessão
    if (!req.session || !req.session.passport || !req.session.passport.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Buscar o usuário pelo ID na sessão
    const userId = req.session.passport.user;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || user.nivelacesso !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado, apenas administradores podem realizar esta ação' });
    }
    
    // Anexar o usuário à requisição para uso posterior
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro ao verificar administrador:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões de administrador' });
  }
};

// Rota para listar logs de webhook (com paginação)
router.get('/', checkAdminManually, async (req, res) => {
  try {
    console.log('DEBUG /api/webhook-logs-direct - Endpoint chamado');
    
    // Verificar registros diretamente
    try {
      const rawCount = await db.select({ count: sql<number>`count(*)` }).from(webhookLogs);
      console.log('DEBUG /api/webhook-logs-direct - Total de registros na tabela:', rawCount[0]?.count || 0);
    } catch (countErr) {
      console.error('DEBUG /api/webhook-logs-direct - Erro ao contar registros:', countErr);
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const filters = {
      status: req.query.status as string,
      eventType: req.query.eventType as string,
      source: req.query.source as string,
      search: req.query.search as string
    };
    
    console.log('DEBUG /api/webhook-logs-direct - Parâmetros da requisição:', { page, limit, filters });
    
    // Construir a consulta base
    let query = db.select({
      id: webhookLogs.id,
      eventType: webhookLogs.eventType,
      status: webhookLogs.status,
      source: webhookLogs.source,
      createdAt: webhookLogs.createdAt,
      payloadData: webhookLogs.payloadData
    }).from(webhookLogs);
    
    // Adicionar condições conforme os filtros
    let conditions = [];
    
    if (filters.status) {
      conditions.push(eq(webhookLogs.status, filters.status));
    }
    
    if (filters.eventType) {
      conditions.push(eq(webhookLogs.eventType, filters.eventType));
    }
    
    if (filters.source) {
      conditions.push(eq(webhookLogs.source, filters.source));
    }
    
    if (filters.search) {
      // Não é possível fazer busca em JSON diretamente no Drizzle, então simplificamos este caso
      conditions.push(sql`"payloadData"::text ILIKE ${`%${filters.search}%`}`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Adicionar ordenação e paginação
    const logs = await query
      .orderBy(desc(webhookLogs.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Consulta para contagem total
    let countQuery = db.select({
      count: sql<number>`count(*)`
    }).from(webhookLogs);
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    
    const countResult = await countQuery;
    const totalCount = Number(countResult[0]?.count || 0);
    
    // Obter estatísticas de status e tipos de eventos para os filtros
    const statusStats = await db.select({
      status: webhookLogs.status,
      count: sql<number>`count(*)`
    })
    .from(webhookLogs)
    .groupBy(webhookLogs.status);
    
    const eventTypeStats = await db.select({
      eventType: webhookLogs.eventType,
      count: sql<number>`count(*)`
    })
    .from(webhookLogs)
    .groupBy(webhookLogs.eventType);
    
    const sourceStats = await db.select({
      source: webhookLogs.source,
      count: sql<number>`count(*)`
    })
    .from(webhookLogs)
    .groupBy(webhookLogs.source);
    
    console.log('DEBUG /api/webhook-logs-direct - Resultado:', {
      totalCount,
      logsLength: logs.length,
      firstLog: logs[0] ? {
        id: logs[0].id,
        eventType: logs[0].eventType,
        status: logs[0].status,
      } : 'Nenhum log retornado'
    });
    
    return res.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        status: statusStats,
        eventType: eventTypeStats,
        source: sourceStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de webhook:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar logs de webhook', 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
});

// Rota para obter detalhes de um webhook específico
router.get('/:id', checkAdminManually, async (req, res) => {
  try {
    const logId = parseInt(req.params.id);
    
    const [log] = await db.select()
      .from(webhookLogs)
      .where(eq(webhookLogs.id, logId));
    
    if (!log) {
      return res.status(404).json({ 
        success: false,
        message: 'Log de webhook não encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error(`Erro ao buscar detalhes do log de webhook ID ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar detalhes do log de webhook', 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
});

export default router;