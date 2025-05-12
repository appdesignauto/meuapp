/**
 * Rotas para o sistema de denúncias
 */
import express from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../middlewares/auth';
import { insertReportSchema, reports } from '../../shared/schema';
import multer from 'multer';
import { z } from 'zod';
import { db } from '../db';
import { sql, eq } from 'drizzle-orm';

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

// Esquema para validação do corpo da requisição para criação de denúncia
const createReportSchema = insertReportSchema.extend({
  reportTypeId: z.number({ required_error: "O tipo de denúncia é obrigatório" }),
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  url: z.string().url({ message: "URL inválida" }).optional().or(z.literal('')),
  evidence: z.string().optional()
});

// Esquema para validação da resposta do administrador
const adminResponseSchema = z.object({
  status: z.enum(['pendente', 'em-analise', 'resolvido', 'rejeitado']),
  adminResponse: z.string().min(5, "A resposta deve ter pelo menos 5 caracteres").optional(),
  isResolved: z.boolean().optional()
});

// Esquema para atualização de uma denúncia - mais flexível para UX
const updateReportSchema = z.object({
  status: z.enum(['pendente', 'em-analise', 'resolvido', 'rejeitado']).optional(),
  adminResponse: z.string().min(5, "A resposta deve ter pelo menos 5 caracteres").optional(),
  isResolved: z.boolean().optional()
});

/**
 * Obter todos os tipos de denúncias
 * GET /api/reports/types
 * Público
 */
// Endpoint principal para obter tipos de denúncias
router.get('/types', async (req, res) => {
  try {
    const reportTypes = await storage.getReportTypes();
    
    // Adiciona fallback para caso não existam tipos no banco
    if (!reportTypes || reportTypes.length === 0) {
      const defaultTypes = [
        { id: 1, name: 'Plágio', description: 'Conteúdo copiado sem autorização ou crédito' },
        { id: 2, name: 'Conteúdo impróprio', description: 'Material ofensivo ou inadequado' },
        { id: 3, name: 'Erro técnico', description: 'Problemas de funcionamento da plataforma' }
      ];
      return res.status(200).json(defaultTypes);
    }
    
    return res.status(200).json(reportTypes);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

// Endpoint adicional específico para JSON (garantia de receber JSON)
router.get('/types/json', async (req, res) => {
  try {
    // Força o Content-Type para application/json
    res.setHeader('Content-Type', 'application/json');
    
    const reportTypes = await storage.getReportTypes();
    
    // Adiciona fallback para caso não existam tipos no banco
    if (!reportTypes || reportTypes.length === 0) {
      const defaultTypes = [
        { id: 1, name: 'Plágio', description: 'Conteúdo copiado sem autorização ou crédito' },
        { id: 2, name: 'Conteúdo impróprio', description: 'Material ofensivo ou inadequado' },
        { id: 3, name: 'Erro técnico', description: 'Problemas de funcionamento da plataforma' }
      ];
      return res.status(200).json(defaultTypes);
    }
    
    return res.status(200).json(reportTypes);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

// Endpoint adicional para obter os dados diretamente sem passar pelo Express Router
router.get('/types-raw', async (req, res) => {
  try {
    // Configurar cabeçalhos para forçar entrega como JSON puro
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Obter dados
    const reportTypes = await storage.getReportTypes();
    
    // Adiciona fallback para caso não existam tipos no banco
    let data = reportTypes;
    if (!reportTypes || reportTypes.length === 0) {
      data = [
        { id: 1, name: 'Plágio', description: 'Conteúdo copiado sem autorização ou crédito' },
        { id: 2, name: 'Conteúdo impróprio', description: 'Material ofensivo ou inadequado' },
        { id: 3, name: 'Erro técnico', description: 'Problemas de funcionamento da plataforma' }
      ];
    }
    
    // Enviar diretamente como texto sem passar pelo express.json()
    const jsonString = JSON.stringify(data);
    return res.status(200).send(jsonString);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).send(JSON.stringify({ message: 'Erro ao buscar tipos de denúncias' }));
  }
});

/**
 * Criar uma nova denúncia
 * POST /api/reports
 * Aberto para todos (incluindo anônimos)
 */
router.post('/', upload.single('evidence'), async (req, res) => {
  try {
    console.log('Recebendo denúncia:', req.body);
    // Converter reportTypeId para número (vem como string do formulário)
    if (req.body.reportTypeId) {
      req.body.reportTypeId = parseInt(req.body.reportTypeId);
    }
    
    // Validar corpo da requisição
    const validatedData = createReportSchema.parse(req.body);
    
    // Adicionar o ID do usuário logado (se disponível)
    const userId = req.isAuthenticated() ? req.user?.id : null;
    
    // Adicionar o caminho do arquivo de evidência, se houver
    let evidence = null;
    if (req.file) {
      // O arquivo está disponível em req.file graças ao multer
      evidence = req.file.path;
    }
    
    console.log('Dados validados:', validatedData);
    
    // Criar a denúncia com os campos permitidos pelo schema do banco
    const reportData = {
      ...validatedData,
      userId,
      evidence,
    };
    
    console.log('Dados finais para criação da denúncia:', reportData);
    
    // Criar a denúncia
    const report = await storage.createReport(reportData);
    
    return res.status(201).json({
      message: 'Denúncia enviada com sucesso',
      reportId: report.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error('Erro ao criar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao processar denúncia' });
  }
});

/**
 * Lista denúncias (apenas para administradores)
 * GET /api/reports
 * Admin - Temporariamente sem autenticação para fins de desenvolvimento
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || null;
    
    console.log('GET /api/reports - Listando denúncias');
    console.log(`GET /api/reports - Parâmetros: page=${page}, limit=${limit}, status=${status}`);
    
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
    
    console.log('GET /api/reports - SQL de listagem:', listSql);
    
    // Executar consulta principal
    const result = await db.execute(sql.raw(listSql));
    
    // Consulta de contagem
    let countSql = `SELECT COUNT(*) as total FROM reports`;
    if (status) {
      countSql += ` WHERE status = '${status}'`;
    }
    
    console.log('GET /api/reports - SQL de contagem:', countSql);
    
    // Executar consulta de contagem
    const countResult = await db.execute(sql.raw(countSql));
    const count = parseInt(countResult.rows[0].total);
    
    console.log(`GET /api/reports - Total de denúncias encontradas: ${count}`);
    
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
    
    console.log(`GET /api/reports - Retornando ${reports.length} denúncias formatadas`);
    
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
 * Obter uma denúncia específica (apenas para administradores)
 * GET /api/reports/:id
 * Admin - Temporariamente sem autenticação para fins de desenvolvimento
 */
router.get('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'ID de denúncia inválido' });
    }
    
    console.log(`GET /api/reports/${reportId} - Buscando detalhes da denúncia com SQL`);
    
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
    console.log(`GET /api/reports/${reportId} - Resultado da consulta:`, result.rows);
    
    if (!result.rows || result.rows.length === 0) {
      console.log(`GET /api/reports/${reportId} - Denúncia não encontrada`);
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
    
    console.log(`GET /api/reports/${reportId} - Denúncia formatada:`, formattedReport);
    
    return res.status(200).json(formattedReport);
  } catch (error) {
    console.error('Erro ao buscar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao buscar denúncia' });
  }
});

/**
 * Responder a uma denúncia (apenas para administradores)
 * PUT /api/reports/:id
 * Admin - Temporariamente sem autenticação para fins de desenvolvimento
 */
router.put('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'ID de denúncia inválido' });
    }
    
    // Validar corpo da requisição
    console.log('PUT /api/reports/:id - Dados recebidos:', req.body);
    
    // Validação dos dados recebidos
    const validatedData = updateReportSchema.parse(req.body);
    console.log('PUT /api/reports/:id - Dados validados:', validatedData);
    
    // SOLUÇÃO DEFINITIVA: Vamos fazer tudo com SQL bruto puro sem depender do ORM
    // ou das funções do storage para evitar o problema com os nomes de campos
    
    // 1. Primeiro verificamos se a denúncia existe diretamente no banco
    const checkSql = `SELECT * FROM reports WHERE id = ${reportId};`;
    console.log(`PUT /api/reports/${reportId} - Verificando denúncia com SQL:`, checkSql);
    
    const checkResult = await db.execute(sql.raw(checkSql));
    console.log(`PUT /api/reports/${reportId} - Resultado da verificação:`, checkResult.rows);
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    // 2. Preparar os campos a serem atualizados
    const adminId = req.user?.id || 1; // Fallback para ID 1 em desenvolvimento
    const isResolved = validatedData.isResolved === true || validatedData.status === 'resolvido';
    const status = validatedData.status || (isResolved ? 'resolvido' : undefined);
    
    // 3. Construir a query SQL de atualização manualmente
    let updateSql = `
      UPDATE reports 
      SET 
        "updatedAt" = NOW()
    `;
    
    // Adicionar status se fornecido
    if (status) {
      updateSql += `, status = '${status}'`;
    }
    
    // Adicionar resposta do admin
    if (validatedData.adminResponse) {
      // Escapar aspas simples para evitar SQL injection
      const escapedResponse = validatedData.adminResponse.replace(/'/g, "''");
      updateSql += `, "adminResponse" = '${escapedResponse}'`;
    }
    
    // Adicionar dados do administrador que respondeu
    updateSql += `, "respondedBy" = ${adminId}`;
    updateSql += `, "respondedAt" = NOW()`;
    
    // Marcar como resolvido se necessário
    updateSql += `, "isResolved" = ${isResolved}`;
    
    // Se estiver marcando como resolvido, definir a data de resolução
    if (isResolved) {
      updateSql += `, resolvedat = NOW()`;
    }
    
    // Completar a query SQL com a condição WHERE e RETURNING
    updateSql += ` WHERE id = ${reportId} RETURNING *;`;
    
    console.log(`PUT /api/reports/${reportId} - SQL de atualização final:`, updateSql);
    
    // 4. Executar a atualização
    const updateResult = await db.execute(sql.raw(updateSql));
    console.log(`PUT /api/reports/${reportId} - Resultado da atualização:`, updateResult.rows);
    
    if (!updateResult.rows || updateResult.rows.length === 0) {
      return res.status(500).json({ message: 'Erro ao atualizar denúncia: nenhum registro atualizado' });
    }
    
    // 5. Retornar sucesso com os dados atualizados
    return res.status(200).json({
      message: 'Denúncia atualizada com sucesso',
      report: updateResult.rows[0]
    });
    
  } catch (error) {
    console.error('PUT /api/reports/:id - Erro:', error);
    
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
 * Excluir uma denúncia (apenas para administradores)
 * DELETE /api/reports/:id
 * Admin - Temporariamente sem autenticação para fins de desenvolvimento
 */
router.delete('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'ID de denúncia inválido' });
    }
    
    console.log(`DELETE /api/reports/${reportId} - Iniciando exclusão de denúncia`);
    
    // 1. Verificar se a denúncia existe com SQL puro
    const checkSql = `SELECT * FROM reports WHERE id = ${reportId};`;
    const checkResult = await db.execute(sql.raw(checkSql));
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      console.log(`DELETE /api/reports/${reportId} - Denúncia não encontrada`);
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    console.log(`DELETE /api/reports/${reportId} - Denúncia encontrada, procedendo com a exclusão`);
    
    // 2. Excluir a denúncia com SQL puro
    const deleteSql = `DELETE FROM reports WHERE id = ${reportId} RETURNING id;`;
    const deleteResult = await db.execute(sql.raw(deleteSql));
    
    console.log(`DELETE /api/reports/${reportId} - Resultado da exclusão:`, deleteResult.rows);
    
    // 3. Verificar se a exclusão foi bem-sucedida
    if (!deleteResult.rows || deleteResult.rows.length === 0) {
      console.log(`DELETE /api/reports/${reportId} - Falha na exclusão`);
      return res.status(500).json({ message: 'Erro ao excluir denúncia: operação não realizada' });
    }
    
    // 4. Retornar sucesso
    console.log(`DELETE /api/reports/${reportId} - Exclusão concluída com sucesso`);
    return res.status(200).json({
      message: 'Denúncia excluída com sucesso',
      id: reportId
    });
    
  } catch (error) {
    console.error(`DELETE /api/reports/:id - Erro:`, error);
    return res.status(500).json({ message: 'Erro ao excluir denúncia' });
  }
});

export default router;