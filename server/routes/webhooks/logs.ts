import { Router } from 'express';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { isAdmin } from '../../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Schema para validação de parâmetros de busca
const searchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  filters: z.object({
    status: z.string().optional(),
    eventType: z.string().optional(),
    source: z.string().optional(),
    search: z.string().optional()
  }).optional()
});

/**
 * @route GET /api/webhooks/logs
 * @description Lista logs de webhook com paginação e filtros
 * @access Admin
 */
router.get('/', isAdmin, async (req, res) => {
  try {
    console.log('DEBUG /api/webhooks/logs - Parâmetros da requisição:', {
      page: req.query.page,
      limit: req.query.limit,
      filters: {
        status: req.query.status,
        eventType: req.query.eventType,
        source: req.query.source,
        search: req.query.search
      }
    });

    // Validar parâmetros de consulta
    const validation = searchParamsSchema.safeParse({
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      filters: {
        status: req.query.status,
        eventType: req.query.eventType,
        source: req.query.source,
        search: req.query.search
      }
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: validation.error.format()
      });
    }

    const { page, limit, filters } = validation.data;
    const offset = (page - 1) * limit;

    console.log('DEBUG getWebhookLogs - Filtros recebidos:', {
      page,
      limit,
      filters,
      status: filters?.status,
      eventType: filters?.eventType,
      source: filters?.source,
      search: filters?.search
    });

    // Construir a consulta base
    let query = db.select({
      id: sql`id`,
      eventType: sql`"eventType"`,
      status: sql`status`,
      source: sql`source`,
      createdAt: sql`"createdAt"`,
      payloadData: sql`"payloadData"`
    }).from(sql`"webhookLogs"`);

    // Adicionar condições conforme os filtros
    let conditions = [];

    if (filters?.status) {
      conditions.push(sql`status = ${filters.status}`);
    }

    if (filters?.eventType) {
      conditions.push(sql`"eventType" = ${filters.eventType}`);
    }

    if (filters?.source) {
      conditions.push(sql`source = ${filters.source}`);
    }

    if (filters?.search) {
      conditions.push(sql`"payloadData"::text ILIKE ${'%' + filters.search + '%'}`);
    }

    if (conditions.length > 0) {
      query = query.where(sql.and(...conditions));
    }

    // Consulta para contagem total
    const countQuery = db.select({
      count: sql<number>`count(*)`
    }).from(sql`"webhookLogs"`);
    
    if (conditions.length > 0) {
      countQuery.where(sql.and(...conditions));
    }

    // Executar consulta de contagem
    const [totalCount] = await countQuery;
    
    // Adicionar ordenação e paginação à consulta principal
    const logs = await query
      .orderBy(sql`id DESC`)
      .limit(limit)
      .offset(offset);

    // Processar resultados para o formato adequado
    // Garantir que payloadData seja uma string JSON válida
    for (let i = 0; i < logs.length; i++) {
      try {
        // Verificar se payloadData é uma string JSON válida
        JSON.parse(logs[i].payloadData);
        console.log(`Log ${logs[i].id} tem payloadData como string JSON válida`);
      } catch (e) {
        console.error(`Log ${logs[i].id} tem payloadData em formato inválido:`, e);
        
        // Se não for uma string JSON válida, tentar convertê-la
        if (typeof logs[i].payloadData === 'object') {
          logs[i].payloadData = JSON.stringify(logs[i].payloadData);
        }
      }
    }

    console.log('DEBUG /api/webhooks/logs - Resultado:', {
      totalCount: totalCount?.count || 0,
      logsLength: logs.length,
      firstLog: logs.length > 0 ? { 
        id: logs[0].id, 
        eventType: logs[0].eventType, 
        status: logs[0].status 
      } : null
    });

    // Retornar os resultados
    res.json({
      logs,
      totalCount: totalCount?.count || 0
    });
  } catch (error) {
    console.error('Erro ao listar logs de webhook:', error);
    res.status(500).json({
      error: 'Erro ao listar logs de webhook',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/webhooks/logs/:id
 * @description Obtém detalhes de um log de webhook específico
 * @access Admin
 */
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const [log] = await db.select()
      .from(sql`"webhookLogs"`)
      .where(sql`id = ${id}`);
    
    if (!log) {
      return res.status(404).json({ error: 'Log não encontrado' });
    }
    
    // Garantir que payloadData seja uma string JSON válida
    if (typeof log.payloadData === 'object') {
      log.payloadData = JSON.stringify(log.payloadData);
    }
    
    res.json(log);
  } catch (error) {
    console.error(`Erro ao buscar log ID ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Erro ao buscar log',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/webhooks/logs/types
 * @description Lista todos os tipos de eventos de webhook disponíveis
 * @access Admin
 */
router.get('/types', isAdmin, async (req, res) => {
  try {
    const types = await db.selectDistinct({
      eventType: sql`"eventType"`
    }).from(sql`"webhookLogs"`);
    
    res.json(types.map(t => t.eventType).filter(Boolean));
  } catch (error) {
    console.error('Erro ao listar tipos de evento:', error);
    res.status(500).json({
      error: 'Erro ao listar tipos de evento',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/webhooks/logs/sources
 * @description Lista todas as origens de webhook disponíveis
 * @access Admin
 */
router.get('/sources', isAdmin, async (req, res) => {
  try {
    const sources = await db.selectDistinct({
      source: sql`source`
    }).from(sql`"webhookLogs"`);
    
    res.json(sources.map(s => s.source).filter(Boolean));
  } catch (error) {
    console.error('Erro ao listar origens de webhook:', error);
    res.status(500).json({
      error: 'Erro ao listar origens de webhook',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;