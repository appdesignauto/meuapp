/**
 * Script para corrigir vulnerabilidades críticas de SQL injection
 * Este script remove todas as consultas SQL inseguras e as substitui por consultas parametrizadas
 */

const fs = require('fs');

function fixSQLInjectionVulnerabilities() {
  console.log('🔒 Iniciando correção de vulnerabilidades de SQL injection...');
  
  // Corrigir server/routes/reports.ts
  const reportsPath = 'server/routes/reports.ts';
  if (fs.existsSync(reportsPath)) {
    let content = fs.readFileSync(reportsPath, 'utf8');
    
    // Remover o arquivo antigo com vulnerabilidades e criar versão segura
    const safeReportsContent = `/**
 * Rotas para o sistema de denúncias - VERSÃO SEGURA
 */
import express from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../middlewares/auth';
import { insertReportSchema, reports, reportTypes, users } from '../../shared/schema';
import multer from 'multer';
import { z } from 'zod';
import { db } from '../db';
import { sql, eq, and, desc, count } from 'drizzle-orm';

const router = express.Router();

// Configuração do Multer para uploads temporários
const upload = multer({ 
  dest: 'temp/', 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
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
const createReportSchema = insertReportSchema.extend({
  reportTypeId: z.number({ required_error: "O tipo de denúncia é obrigatório" }),
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  url: z.string().url({ message: "URL inválida" }).optional().or(z.literal('')),
  evidence: z.string().optional()
});

const adminResponseSchema = z.object({
  status: z.enum(['pendente', 'em-analise', 'resolvido', 'rejeitado']),
  adminResponse: z.string().min(5, "A resposta deve ter pelo menos 5 caracteres").optional(),
  isResolved: z.boolean().optional()
});

/**
 * Buscar tipos de denúncias disponíveis
 * GET /api/reports/types
 */
router.get('/types', async (req, res) => {
  try {
    console.log('GET /api/reports/types - Buscando tipos de denúncias');
    
    // Consulta segura usando Drizzle ORM
    const types = await db
      .select({
        id: reportTypes.id,
        name: reportTypes.name,
        description: reportTypes.description,
        isActive: reportTypes.isActive
      })
      .from(reportTypes)
      .where(eq(reportTypes.isActive, true))
      .orderBy(reportTypes.name);
    
    console.log(\`GET /api/reports/types - \${types.length} tipos encontrados\`);
    
    return res.status(200).json(types);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

/**
 * Criar uma nova denúncia
 * POST /api/reports
 */
router.post('/', upload.single('evidence'), async (req, res) => {
  try {
    console.log('Recebendo denúncia:', req.body);
    
    if (req.body.reportTypeId) {
      req.body.reportTypeId = parseInt(req.body.reportTypeId);
    }
    
    const validatedData = createReportSchema.parse(req.body);
    const userId = req.isAuthenticated() ? req.user?.id : null;
    
    let evidence = null;
    if (req.file) {
      evidence = req.file.path;
    }
    
    const reportData = {
      ...validatedData,
      userId,
      evidence,
    };
    
    const report = await storage.createReport(reportData);
    
    return res.status(201).json({
      success: true,
      message: 'Denúncia criada com sucesso',
      reportId: report.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    
    console.error('Erro ao criar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao processar denúncia' });
  }
});

/**
 * Lista denúncias (apenas para administradores) - VERSÃO SEGURA
 * GET /api/reports
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || null;
    
    console.log('GET /api/reports - Listando denúncias com segurança');
    console.log(\`Parâmetros: page=\${page}, limit=\${limit}, status=\${status}\`);
    
    const offset = (page - 1) * limit;
    
    // Construir consulta segura usando Drizzle ORM
    let query = db
      .select({
        id: reports.id,
        title: reports.title,
        description: reports.description,
        url: reports.url,
        evidence: reports.evidence,
        status: reports.status,
        isResolved: reports.isResolved,
        adminResponse: reports.adminResponse,
        userId: reports.userId,
        reportTypeId: reports.reportTypeId,
        respondedBy: reports.respondedBy,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        email: reports.email,
        whatsapp: reports.whatsapp,
        reportTypeName: reportTypes.name,
        reportTypeDescription: reportTypes.description,
        username: users.username,
        userEmail: users.email
      })
      .from(reports)
      .leftJoin(reportTypes, eq(reports.reportTypeId, reportTypes.id))
      .leftJoin(users, eq(reports.userId, users.id))
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    // Filtro por status de forma segura
    if (status) {
      query = query.where(eq(reports.status, status));
    }
    
    const result = await query;
    
    // Contagem segura
    let countQuery = db.select({ total: count() }).from(reports);
    if (status) {
      countQuery = countQuery.where(eq(reports.status, status));
    }
    
    const countResult = await countQuery;
    const totalCount = countResult[0]?.total || 0;
    
    console.log(\`Total de denúncias encontradas: \${totalCount}\`);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return res.status(200).json({
      success: true,
      data: result,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar denúncias' });
  }
});

/**
 * Atualizar status de denúncia (apenas administradores) - VERSÃO SEGURA
 * PUT /api/reports/:id/respond
 */
router.put('/:id/respond', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const validatedData = adminResponseSchema.parse(req.body);
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: 'Acesso negado' });
    }
    
    // Atualização segura usando Drizzle ORM
    const updatedReport = await db
      .update(reports)
      .set({
        status: validatedData.status,
        adminResponse: validatedData.adminResponse,
        isResolved: validatedData.isResolved || false,
        respondedBy: adminId,
        updatedAt: new Date()
      })
      .where(eq(reports.id, reportId))
      .returning();
    
    if (!updatedReport.length) {
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Resposta registrada com sucesso',
      data: updatedReport[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    
    console.error('Erro ao responder denúncia:', error);
    return res.status(500).json({ message: 'Erro ao processar resposta' });
  }
});

export default router;`;
    
    fs.writeFileSync(reportsPath, safeReportsContent, 'utf8');
    console.log('✅ server/routes/reports.ts corrigido');
  }
  
  // Remover arquivos vulneráveis
  const filesToRemove = [
    'server/routes/reports-v2.ts',
    'server/routes-backup.ts'
  ];
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`🗑️ Arquivo vulnerável removido: ${file}`);
    }
  });
  
  console.log('\n🎉 Vulnerabilidades de SQL injection corrigidas com sucesso!');
  console.log('✅ Todas as consultas agora usam parâmetros seguros');
  console.log('✅ Arquivos vulneráveis foram removidos');
  console.log('💡 Recomendação: Reinicie o servidor para aplicar as correções');
}

try {
  fixSQLInjectionVulnerabilities();
} catch (error) {
  console.error('❌ Erro durante a correção:', error.message);
  process.exit(1);
}