import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Rota para buscar logs de webhook com paginação e filtros
 */
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Filtros opcionais
    const status = req.query.status as string;
    const eventType = req.query.eventType as string;
    const source = req.query.source as string;
    const search = req.query.search as string;
    
    // Debug information
    console.log('DEBUG /api/webhooks/logs - Parâmetros da requisição:', {
      page,
      limit,
      filters: {
        status,
        eventType,
        source,
        search
      }
    });
    
    // Construir WHERE com filtros dinâmicos
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (eventType) {
      whereClause.event_type = eventType;
    }
    
    if (source) {
      whereClause.source = source;
    }
    
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Usar SQL direto para garantir compatibilidade com o nome da tabela no banco
    const countQuery = `
      SELECT COUNT(*) FROM webhook_logs 
      ${Object.keys(whereClause).length > 0 ? 'WHERE ...' : ''}
    `;
    
    const logsQuery = `
      SELECT * FROM webhook_logs 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    // Buscar o número total de logs para paginação
    const totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) FROM webhook_logs
    `;
    
    // Buscar os logs com paginação
    const logs = await prisma.$queryRaw`
      SELECT id, created_at, event_type, status, email, source, raw_payload, error_message
      FROM webhook_logs
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${skip}
    `;
    
    const totalCount = parseInt(totalCountResult[0].count || "0");
    
    // Formatar resposta
    const formatted = Array.isArray(logs) ? logs.map(log => ({
      id: log.id,
      date: log.created_at,
      email: log.email || 'N/A',
      source: log.source || 'hotmart',
      event_type: log.event_type,
      status: log.status,
      raw_payload: log.raw_payload,
      error_message: log.error_message
    })) : [];
    
    console.log('DEBUG /api/webhooks/logs - Resultado:', {
      totalCount,
      logsLength: formatted.length,
      firstLog: formatted.length > 0 ? formatted[0].event_type : 'Nenhum log retornado'
    });
    
    return res.json({
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

export default router;