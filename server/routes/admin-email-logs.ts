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
    
    // Enviar email de teste
    const result = await emailService.sendEmailVerification(email, testCode);
    
    return res.json({
      success: result.success,
      message: result.success 
        ? `Email de teste enviado com sucesso para ${email}` 
        : "Erro ao enviar email de teste"
    });
  } catch (error) {
    console.error("[Admin] Erro ao testar entrega de email:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao testar entrega de email" 
    });
  }
});

export default router;