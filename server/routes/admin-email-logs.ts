import { Router } from "express";
import { EmailVerificationService } from "../services/email-verification-service";
import { emailService } from "../services/email-service";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * Obter logs do serviço de email
 */
router.get("/logs", async (_req, res) => {
  try {
    const logs = emailService.getLogs();
    return res.json({ success: true, logs });
  } catch (error) {
    console.error("[Admin] Erro ao obter logs de email:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao recuperar logs de email",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Limpar logs do serviço de email
 */
router.delete("/logs", async (_req, res) => {
  try {
    emailService.clearLogs();
    return res.json({ 
      success: true, 
      message: "Logs de email limpos com sucesso." 
    });
  } catch (error) {
    console.error("[Admin] Erro ao limpar logs de email:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao limpar logs de email" 
    });
  }
});

/**
 * Verificar status de verificação por usuário
 */
router.get("/verification/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de usuário inválido" 
      });
    }
    
    // Buscar códigos de verificação do usuário
    const codesResults = await db.execute(sql`
      SELECT * FROM "emailVerificationCodes" 
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `);
    
    // Buscar informações básicas do usuário
    const userResults = await db.execute(sql`
      SELECT id, email, username, name, emailconfirmed 
      FROM users 
      WHERE id = ${userId}
    `);
    
    const user = userResults.rows.length > 0 ? userResults.rows[0] : null;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuário não encontrado" 
      });
    }
    
    return res.json({
      success: true,
      user,
      verificationCodes: codesResults.rows,
    });
  } catch (error) {
    console.error("[Admin] Erro ao buscar status de verificação:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao buscar status de verificação de email" 
    });
  }
});

/**
 * Verificar status de verificação por email
 */
router.get("/verification/email/:email", async (req, res) => {
  try {
    const email = req.params.email;
    
    // Buscar usuário pelo email
    const userResults = await db.execute(sql`
      SELECT id, email, username, name, emailconfirmed 
      FROM users 
      WHERE email = ${email}
    `);
    
    const user = userResults.rows.length > 0 ? userResults.rows[0] : null;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuário não encontrado" 
      });
    }
    
    // Buscar códigos de verificação do usuário
    const codesResults = await db.execute(sql`
      SELECT * FROM "emailVerificationCodes" 
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
    `);
    
    // Filtrar logs específicos para este email
    const allLogs = emailService.getLogs();
    const emailLogs = allLogs.filter(log => 
      log.includes(`[${email}]`) || 
      log.includes(`para ${email}`) ||
      log.includes(`para: [{"email":"${email}"`)
    );
    
    return res.json({
      success: true,
      user,
      verificationCodes: codesResults.rows,
      emailLogs
    });
  } catch (error) {
    console.error("[Admin] Erro ao buscar status de verificação por email:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao buscar status de verificação de email" 
    });
  }
});

/**
 * Reenviar código de verificação
 */
router.post("/verification/:userId/resend", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de usuário inválido" 
      });
    }
    
    // Buscar usuário
    const userResults = await db.execute(sql`
      SELECT id, email, username, name, emailconfirmed 
      FROM users 
      WHERE id = ${userId}
    `);
    
    const user = userResults.rows.length > 0 ? userResults.rows[0] : null;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuário não encontrado" 
      });
    }
    
    if (user.emailconfirmed) {
      return res.status(400).json({ 
        success: false, 
        message: "Este usuário já confirmou seu email" 
      });
    }
    
    // Enviar novo código de verificação
    const emailVerificationService = EmailVerificationService.getInstance();
    const result = await emailVerificationService.sendVerificationCode(userId, user.email);
    
    return res.json({
      success: result.success,
      message: result.success 
        ? `Código de verificação reenviado com sucesso para ${user.email}` 
        : result.message || "Erro ao reenviar código de verificação"
    });
  } catch (error) {
    console.error("[Admin] Erro ao reenviar código de verificação:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao reenviar código de verificação" 
    });
  }
});

/**
 * Verificação manual de email pelo admin
 */
router.post("/verification/:userId/verify", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de usuário inválido" 
      });
    }
    
    // Buscar usuário
    const userResults = await db.execute(sql`
      SELECT id, email, username, name, emailconfirmed 
      FROM users 
      WHERE id = ${userId}
    `);
    
    const user = userResults.rows.length > 0 ? userResults.rows[0] : null;
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuário não encontrado" 
      });
    }
    
    if (user.emailconfirmed) {
      return res.status(400).json({ 
        success: false, 
        message: "Este usuário já confirmou seu email" 
      });
    }
    
    // Marcar o email como verificado
    await db.execute(sql`
      UPDATE users 
      SET emailconfirmed = true, atualizadoem = NOW() 
      WHERE id = ${userId}
    `);
    
    // Marcar todos os códigos de verificação como usados
    const now = new Date();
    await db.execute(sql`
      UPDATE "emailVerificationCodes"
      SET "isUsed" = true, "usedAt" = ${now}
      WHERE "userId" = ${userId} AND "isUsed" = false
    `);
    
    return res.json({
      success: true,
      message: `Email ${user.email} verificado manualmente com sucesso`
    });
  } catch (error) {
    console.error("[Admin] Erro ao verificar email manualmente:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao verificar email manualmente" 
    });
  }
});

/**
 * Testar entregabilidade de email
 */
router.post("/test-delivery", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email não fornecido"
      });
    }
    
    // Gerar código de teste
    const testCode = `TESTE-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Log detalhado antes de enviar
    console.log(`[Email Debug] Iniciando teste para ${email} com código ${testCode}`);
    console.log(`[Email Debug] Chave da API Brevo presente: ${!!process.env.BREVO_API_KEY}`);
    if (process.env.BREVO_API_KEY) {
      console.log(`[Email Debug] Tamanho da chave da API: ${process.env.BREVO_API_KEY.length} caracteres`);
      console.log(`[Email Debug] Primeiros 5 caracteres da chave: ${process.env.BREVO_API_KEY.substring(0, 5)}...`);
    }
    
    // Enviar email de teste
    const result = await emailService.sendEmailVerification(email, testCode);
    
    // Buscar logs recentes
    const recentLogs = emailService.getLogs().slice(-30);
    
    return res.json({
      success: result.success,
      message: result.success 
        ? `Email de teste enviado com sucesso para ${email}` 
        : "Erro ao enviar email de teste",
      testCode,
      logs: recentLogs
    });
  } catch (error) {
    console.error("[Admin] Erro ao testar entrega de email:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao testar entrega de email",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Verificar e tentar corrigir problemas na tabela de verificação de email
 */
router.post("/verify-table-structure", async (req, res) => {
  try {
    // Verificar se a tabela emailVerificationCodes existe
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'emailVerificationCodes'
      )
    `);
    
    const tableExistsResult = tableExists.rows[0]?.exists === true;
    
    if (!tableExistsResult) {
      // A tabela não existe, vamos criá-la
      await db.execute(sql`
        CREATE TABLE "emailVerificationCodes" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL,
          "email" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP NOT NULL,
          "usedAt" TIMESTAMP,
          "isUsed" BOOLEAN NOT NULL DEFAULT false
        )
      `);
      
      return res.json({
        success: true,
        message: "Tabela emailVerificationCodes criada com sucesso!",
        action: "create_table"
      });
    }
    
    // Verificar a estrutura da tabela
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'emailVerificationCodes'
    `);
    
    // Verificar se há código de verificação pendente para um usuário específico
    let pendingCodesCheck = {};
    if (req.body.userId) {
      const userId = parseInt(req.body.userId);
      if (!isNaN(userId)) {
        const pendingCodes = await db.execute(sql`
          SELECT * FROM "emailVerificationCodes" 
          WHERE "userId" = ${userId} 
          AND "isUsed" = false 
          AND "expiresAt" > NOW()
        `);
        
        pendingCodesCheck = {
          userId,
          hasPendingCodes: pendingCodes.rows.length > 0,
          pendingCodes: pendingCodes.rows
        };
      }
    }
    
    // Verificar se há código duplicado ou conflitante para um email específico
    let duplicateCheck = {};
    if (req.body.email) {
      const email = req.body.email;
      const duplicateCodes = await db.execute(sql`
        SELECT * FROM "emailVerificationCodes" 
        WHERE "email" = ${email} 
        ORDER BY "createdAt" DESC
      `);
      
      duplicateCheck = {
        email,
        totalCodes: duplicateCodes.rows.length,
        codes: duplicateCodes.rows
      };
    }
    
    return res.json({
      success: true,
      tableExists: tableExistsResult,
      columns: columns.rows,
      pendingCodesCheck,
      duplicateCheck,
    });
  } catch (error) {
    console.error("[Admin] Erro ao verificar estrutura da tabela:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao verificar estrutura da tabela",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Remover códigos de verificação problemáticos
 */
router.post("/cleanup-verification-codes", async (req, res) => {
  try {
    const { userId, email, all } = req.body;
    
    let result = { success: true, actions: [] };
    
    if (all === true) {
      // Limpar todos os códigos não utilizados e expirados
      const cleanupExpired = await db.execute(sql`
        DELETE FROM "emailVerificationCodes"
        WHERE "isUsed" = false AND "expiresAt" < NOW()
      `);
      
      result.actions.push({
        type: "cleanup_expired",
        count: cleanupExpired.rowCount || 0
      });
    }
    
    if (userId) {
      // Limpar códigos problemáticos para um usuário específico
      const userIdNum = parseInt(userId);
      if (!isNaN(userIdNum)) {
        const cleanupUser = await db.execute(sql`
          DELETE FROM "emailVerificationCodes"
          WHERE "userId" = ${userIdNum}
        `);
        
        result.actions.push({
          type: "cleanup_user",
          userId: userIdNum,
          count: cleanupUser.rowCount || 0
        });
      }
    }
    
    if (email) {
      // Limpar códigos problemáticos para um email específico
      const cleanupEmail = await db.execute(sql`
        DELETE FROM "emailVerificationCodes"
        WHERE "email" = ${email}
      `);
      
      result.actions.push({
        type: "cleanup_email",
        email,
        count: cleanupEmail.rowCount || 0
      });
    }
    
    return res.json(result);
  } catch (error) {
    console.error("[Admin] Erro ao limpar códigos de verificação:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao limpar códigos de verificação",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;