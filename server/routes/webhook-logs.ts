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
    
    // Usar SQL direto para obter contagem total
    let totalCount = 0;
    let logs = [];
    
    try {
      // Primeiro verificamos se a tabela existe
      await prisma.$executeRawUnsafe(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'webhook_logs'
      `);
      
      // Se a tabela existir, fazemos a consulta principal
      const countResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) AS count FROM webhook_logs
      `);
      
      totalCount = parseInt(countResult[0]?.count || '0');
      
      // Construir a condição WHERE com base nos filtros
      let whereClause = '';
      const filterParams = [];
      let paramIndex = 1;
      
      if (status) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `status = $${paramIndex++}`;
        filterParams.push(status);
      }
      
      if (eventType) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `event_type = $${paramIndex++}`;
        filterParams.push(eventType);
      }
      
      if (source) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `source = $${paramIndex++}`;
        filterParams.push(source);
      }
      
      if (search) {
        whereClause += whereClause ? ' AND ' : ' WHERE ';
        whereClause += `email ILIKE $${paramIndex++}`;
        filterParams.push(`%${search}%`);
      }
      
      // Consulta principal para buscar logs
      const query = `
        SELECT id, created_at, event_type, status, email, source, raw_payload, error_message
        FROM webhook_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      
      filterParams.push(limit);
      filterParams.push(skip);
      
      logs = await prisma.$queryRawUnsafe(query, ...filterParams);
    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      // Se houver erro no banco, retornar array vazio
      logs = [];
    }
    
    // Formatar os logs para o formato esperado pelo frontend
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

/**
 * Rota para testar o registro de webhook manualmente
 */
router.post('/test', async (req, res) => {
  try {
    // Inserir um registro de teste na tabela webhook_logs
    await prisma.$executeRawUnsafe(`
      INSERT INTO webhook_logs (event_type, status, email, source, raw_payload, error_message)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, 'TEST_EVENT', 'success', 'test@example.com', 'hotmart', JSON.stringify({test: 'payload'}), null);
    
    return res.json({
      success: true,
      message: 'Log de teste criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar log de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar log de teste',
      error: error.message
    });
  }
});

export default router;