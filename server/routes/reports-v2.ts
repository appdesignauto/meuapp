/**
 * Sistema de Denúncias v2 - Implementação com SQL Puro
 * Este arquivo contém uma reimplementação completa do sistema de denúncias
 * usando SQL puro para evitar problemas com o ORM.
 */
import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import multer from 'multer';

const router = express.Router();

// Configuração do Multer para uploads temporários
const upload = multer({ 
  dest: 'temp/', 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Lista de tipos MIME permitidos
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use JPG, PNG, WEBP ou PDF'));
    }
  }
});

// Esquemas de validação
const createReportSchema = z.object({
  reportTypeId: z.number({ required_error: "O tipo de denúncia é obrigatório" }),
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  artId: z.number().optional(),
  userId: z.number().optional(),
  url: z.string().url({ message: "URL inválida" }).optional().or(z.literal('')),
  evidence: z.string().optional()
});

const updateReportSchema = z.object({
  status: z.enum(['pendente', 'em-analise', 'resolvido', 'rejeitado']).optional(),
  adminResponse: z.string().optional(),
  isResolved: z.boolean().optional(),
});

/**
 * Obter todos os tipos de denúncias
 * GET /api/reports-v2/types
 * Público
 */
router.get('/types', async (req, res) => {
  try {
    const query = `
      SELECT * FROM "reportTypes"
      WHERE "isActive" = true
      ORDER BY name ASC
    `;
    
    const result = await db.execute(sql.raw(query));
    return res.status(200).json(result.rows || []);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

/**
 * Criar uma denúncia
 * POST /api/reports-v2
 * Público - Não requer autenticação
 */
router.post('/', async (req, res) => {
  try {
    // Validação dos dados
    const validatedData = createReportSchema.parse(req.body);
    
    // Inserção no banco de dados com SQL puro
    const insertQuery = `
      INSERT INTO reports (
        "reportTypeId", title, description, "artId", "userId", url, evidence, 
        status, "isResolved", "createdAt", "updatedAt"
      ) VALUES (
        ${validatedData.reportTypeId},
        '${validatedData.title.replace(/'/g, "''")}',
        '${validatedData.description.replace(/'/g, "''")}',
        ${validatedData.artId || 'NULL'},
        ${validatedData.userId || 'NULL'},
        ${validatedData.url ? `'${validatedData.url.replace(/'/g, "''")}'` : 'NULL'},
        ${validatedData.evidence ? `'${validatedData.evidence.replace(/'/g, "''")}'` : 'NULL'},
        'pendente',
        false,
        NOW(),
        NOW()
      ) RETURNING *;
    `;
    
    const result = await db.execute(sql.raw(insertQuery));
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(500).json({ message: 'Erro ao criar denúncia' });
    }
    
    return res.status(201).json({
      message: 'Denúncia criada com sucesso',
      report: result.rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error('Erro ao criar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao criar denúncia' });
  }
});

/**
 * Listar denúncias para administradores
 * GET /api/reports-v2
 * Admin
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || null;
    
    console.log('GET /api/reports-v2 - Listando denúncias');
    console.log(`GET /api/reports-v2 - Parâmetros: page=${page}, limit=${limit}, status=${status}`);
    
    // Calcular offset para paginação
    const offset = (page - 1) * limit;
    
    // Consulta SQL base
    let listSql = `
      SELECT 
        r.*,
        rt.name as "reportTypeName",
        rt.description as "reportTypeDescription",
        u.username as "username",
        u.email as "userEmail",
        a.username as "adminUsername"
      FROM 
        reports r
      LEFT JOIN
        "reportTypes" rt ON r."reportTypeId" = rt.id
      LEFT JOIN
        users u ON r."userId" = u.id
      LEFT JOIN
        users a ON r."respondedBy" = a.id
    `;
    
    // Adicionar filtro por status se fornecido
    if (status) {
      listSql += ` WHERE r.status = '${status}'`;
    }
    
    // Ordenação e paginação
    listSql += ` ORDER BY r."createdAt" DESC LIMIT ${limit} OFFSET ${offset}`;
    
    console.log('GET /api/reports-v2 - SQL de listagem:', listSql);
    
    // Executar consulta principal
    const result = await db.execute(sql.raw(listSql));
    
    // Consulta de contagem
    let countSql = `SELECT COUNT(*) as total FROM reports`;
    if (status) {
      countSql += ` WHERE status = '${status}'`;
    }
    
    console.log('GET /api/reports-v2 - SQL de contagem:', countSql);
    
    // Executar consulta de contagem
    const countResult = await db.execute(sql.raw(countSql));
    const count = parseInt(countResult.rows[0].total);
    
    console.log(`GET /api/reports-v2 - Total de denúncias encontradas: ${count}`);
    
    // Formatar os resultados
    const reports = result.rows.map(row => {
      // Criar objeto formatado com as relações
      const report = {
        ...row,
        reportType: row.reportTypeName ? {
          id: row.reportTypeId,
          name: row.reportTypeName,
          description: row.reportTypeDescription
        } : null,
        user: row.username ? {
          id: row.userId,
          username: row.username,
          email: row.userEmail
        } : null,
        admin: row.adminUsername ? {
          id: row.respondedBy,
          username: row.adminUsername
        } : null
      };
      
      // Remover campos extras
      delete report.reportTypeName;
      delete report.reportTypeDescription;
      delete report.username;
      delete report.userEmail;
      delete report.adminUsername;
      
      return report;
    });
    
    console.log(`GET /api/reports-v2 - Retornando ${reports.length} denúncias formatadas`);
    
    return res.status(200).json({
      reports,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    return res.status(500).json({ message: 'Erro ao listar denúncias' });
  }
});

/**
 * Obter uma denúncia específica por ID
 * GET /api/reports-v2/:id
 * Admin
 */
router.get('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'ID de denúncia inválido' });
    }
    
    console.log(`GET /api/reports-v2/${reportId} - Buscando detalhes da denúncia com SQL`);
    
    // Executamos SQL puro para evitar problemas com o ORM
    const sql_query = `
      SELECT 
        r.*,
        rt.name as "reportTypeName",
        rt.description as "reportTypeDescription",
        u.username as "username",
        u.email as "userEmail",
        a.username as "adminUsername"
      FROM 
        reports r
      LEFT JOIN
        "reportTypes" rt ON r."reportTypeId" = rt.id
      LEFT JOIN
        users u ON r."userId" = u.id
      LEFT JOIN
        users a ON r."respondedBy" = a.id
      WHERE 
        r.id = ${reportId}
    `;
    
    const result = await db.execute(sql.raw(sql_query));
    console.log(`GET /api/reports-v2/${reportId} - Resultado da consulta:`, result.rows);
    
    if (!result.rows || result.rows.length === 0) {
      console.log(`GET /api/reports-v2/${reportId} - Denúncia não encontrada`);
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    // Formatamos o resultado para retornar com o mesmo formato esperado pelo frontend
    const reportData = result.rows[0];
    
    // Adicionamos os objetos relacionados formatados
    const formattedReport = {
      ...reportData,
      reportType: reportData.reportTypeName ? {
        id: reportData.reportTypeId,
        name: reportData.reportTypeName,
        description: reportData.reportTypeDescription
      } : null,
      user: reportData.username ? {
        id: reportData.userId,
        username: reportData.username,
        email: reportData.userEmail
      } : null,
      admin: reportData.adminUsername ? {
        id: reportData.respondedBy,
        username: reportData.adminUsername
      } : null
    };
    
    // Removemos campos extras
    delete formattedReport.reportTypeName;
    delete formattedReport.reportTypeDescription;
    delete formattedReport.username;
    delete formattedReport.userEmail;
    delete formattedReport.adminUsername;
    
    console.log(`GET /api/reports-v2/${reportId} - Denúncia formatada:`, formattedReport);
    
    return res.status(200).json(formattedReport);
  } catch (error) {
    console.error('Erro ao buscar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao buscar denúncia' });
  }
});

/**
 * Atualizar uma denúncia (responder/resolver)
 * PUT /api/reports-v2/:id
 * Admin
 */
router.put('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'ID de denúncia inválido' });
    }
    
    // Validar corpo da requisição
    console.log('PUT /api/reports-v2/:id - Dados recebidos:', req.body);
    
    // Validação dos dados recebidos
    const validatedData = updateReportSchema.parse(req.body);
    console.log('PUT /api/reports-v2/:id - Dados validados:', validatedData);
    
    // Verificar se a denúncia existe - Usando apenas SQL puro
    console.log(`PUT /api/reports-v2/${reportId} - Verificando existência da denúncia...`);
    
    const checkSql = `SELECT * FROM reports WHERE id = ${reportId};`;
    const checkResult = await db.execute(sql.raw(checkSql));
    console.log(`PUT /api/reports-v2/${reportId} - Resultado da verificação:`, checkResult.rows);
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      console.log(`PUT /api/reports-v2/${reportId} - Denúncia não encontrada`);
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    // Montar a query SQL de atualização
    let updateSql = `
      UPDATE reports 
      SET "updatedAt" = NOW()
    `;
    
    // Adicionar campos a serem atualizados
    if (validatedData.status) {
      updateSql += `, status = '${validatedData.status}'`;
    }
    
    if (validatedData.isResolved !== undefined) {
      updateSql += `, "isResolved" = ${validatedData.isResolved}`;
      
      if (validatedData.isResolved) {
        updateSql += `, "resolvedat" = NOW()`;
      }
    }
    
    if (validatedData.adminResponse) {
      updateSql += `, "adminResponse" = '${validatedData.adminResponse.replace(/'/g, "''")}'`;
    }
    
    // Se tiver usuário autenticado, registrar quem respondeu
    if (req.user?.id) {
      updateSql += `, "respondedBy" = ${req.user.id}, "respondedAt" = NOW()`;
    }
    
    // Completar a query com o WHERE e RETURNING
    updateSql += ` WHERE id = ${reportId} RETURNING *;`;
    
    console.log(`PUT /api/reports-v2/${reportId} - SQL de atualização:`, updateSql);
    
    // Executar a atualização
    const updateResult = await db.execute(sql.raw(updateSql));
    console.log(`PUT /api/reports-v2/${reportId} - Resultado da atualização:`, updateResult.rows);
    
    if (!updateResult.rows || updateResult.rows.length === 0) {
      console.log(`PUT /api/reports-v2/${reportId} - Falha na atualização`);
      return res.status(500).json({ message: 'Erro ao atualizar denúncia: nenhum registro atualizado' });
    }
    
    // Buscar dados relacionados para a resposta completa
    console.log(`PUT /api/reports-v2/${reportId} - Buscando dados relacionados para resposta...`);
    
    const detailsSql = `
      SELECT 
        r.*,
        rt.name as "reportTypeName",
        rt.description as "reportTypeDescription",
        u.username as "username",
        u.email as "userEmail",
        a.username as "adminUsername"
      FROM 
        reports r
      LEFT JOIN
        "reportTypes" rt ON r."reportTypeId" = rt.id
      LEFT JOIN
        users u ON r."userId" = u.id
      LEFT JOIN
        users a ON r."respondedBy" = a.id
      WHERE 
        r.id = ${reportId}
    `;
    
    const detailsResult = await db.execute(sql.raw(detailsSql));
    
    if (!detailsResult.rows || detailsResult.rows.length === 0) {
      // Caso extremamente improvável, mas por segurança retornamos o que temos
      console.log(`PUT /api/reports-v2/${reportId} - Dados detalhados não encontrados, retornando resultado básico`);
      return res.status(200).json({
        message: 'Denúncia atualizada com sucesso',
        report: updateResult.rows[0]
      });
    }
    
    // Formatar o resultado para incluir os objetos relacionados
    const reportData = detailsResult.rows[0];
    
    const formattedReport = {
      ...reportData,
      reportType: reportData.reportTypeName ? {
        id: reportData.reportTypeId,
        name: reportData.reportTypeName,
        description: reportData.reportTypeDescription
      } : null,
      user: reportData.username ? {
        id: reportData.userId,
        username: reportData.username,
        email: reportData.userEmail
      } : null,
      admin: reportData.adminUsername ? {
        id: reportData.respondedBy,
        username: reportData.adminUsername
      } : null
    };
    
    // Remover campos extras
    delete formattedReport.reportTypeName;
    delete formattedReport.reportTypeDescription;
    delete formattedReport.username;
    delete formattedReport.userEmail;
    delete formattedReport.adminUsername;
    
    console.log(`PUT /api/reports-v2/${reportId} - Denúncia formatada:`, formattedReport);
    
    // Retornar sucesso com os dados atualizados
    return res.status(200).json({
      message: 'Denúncia atualizada com sucesso',
      report: formattedReport
    });
    
  } catch (error) {
    console.error('PUT /api/reports-v2/:id - Erro:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error('Erro ao atualizar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao atualizar denúncia' });
  }
});

/**
 * Excluir uma denúncia
 * DELETE /api/reports-v2/:id
 * Admin
 */
router.delete('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'ID de denúncia inválido' });
    }
    
    console.log(`DELETE /api/reports-v2/${reportId} - Iniciando exclusão de denúncia`);
    
    // Verificar se a denúncia existe
    const checkSql = `SELECT * FROM reports WHERE id = ${reportId};`;
    const checkResult = await db.execute(sql.raw(checkSql));
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      console.log(`DELETE /api/reports-v2/${reportId} - Denúncia não encontrada`);
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    console.log(`DELETE /api/reports-v2/${reportId} - Denúncia encontrada, procedendo com a exclusão`);
    
    // Excluir a denúncia
    const deleteSql = `DELETE FROM reports WHERE id = ${reportId} RETURNING id;`;
    const deleteResult = await db.execute(sql.raw(deleteSql));
    
    console.log(`DELETE /api/reports-v2/${reportId} - Resultado da exclusão:`, deleteResult.rows);
    
    if (!deleteResult.rows || deleteResult.rows.length === 0) {
      console.log(`DELETE /api/reports-v2/${reportId} - Falha na exclusão`);
      return res.status(500).json({ message: 'Erro ao excluir denúncia: operação não realizada' });
    }
    
    console.log(`DELETE /api/reports-v2/${reportId} - Exclusão concluída com sucesso`);
    return res.status(200).json({
      message: 'Denúncia excluída com sucesso',
      id: reportId
    });
    
  } catch (error) {
    console.error(`DELETE /api/reports-v2/:id - Erro:`, error);
    return res.status(500).json({ message: 'Erro ao excluir denúncia' });
  }
});

export default router;