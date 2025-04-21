import { Router, Request, Response } from "express";
import { EmailVerificationService } from "../services/email-verification-service";
import { storage } from "../storage";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();
const emailVerificationService = EmailVerificationService.getInstance();

// Middleware para garantir que o usuário está autenticado
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Não autenticado" });
  }
  next();
};

// Obter status da verificação de email (se já foi enviado um código)
router.get("/status", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Verifica se já existe um código de verificação pendente
    const hasPending = await emailVerificationService.hasPendingVerificationCode(userId);
    
    return res.json({
      success: true,
      sent: hasPending
    });
  } catch (error) {
    console.error("[Verificação de Email] Erro ao verificar status:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao verificar status de verificação"
    });
  }
});

// Reenviar código de verificação
router.post("/resend", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    
    console.log(`[EmailVerificationRoute] Solicitação de reenvio de código para usuário ${userId}`);
    
    if (!userEmail) {
      console.log(`[EmailVerificationRoute] Email não encontrado para o usuário ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Email do usuário não encontrado"
      });
    }
    
    // Verificar se o email já está confirmado
    const user = await storage.getUser(userId);
    if (user && user.emailconfirmed === true) {
      console.log(`[EmailVerificationRoute] Email já confirmado para o usuário ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Seu email já foi confirmado. Não é necessário reenviar o código."
      });
    }
    
    console.log(`[EmailVerificationRoute] Enviando código de verificação para ${userEmail} (usuário ${userId})`);
    
    // Enviar o código de verificação
    const result = await emailVerificationService.sendVerificationCode(userId, userEmail);
    
    console.log(`[EmailVerificationRoute] Resultado do envio de código para usuário ${userId}:`, result);
    
    return res.json(result);
  } catch (error) {
    console.error("[Verificação de Email] Erro ao reenviar código:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao enviar código de verificação. Tente novamente mais tarde."
    });
  }
});

// Verificar código
router.post("/verify", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;
    
    console.log(`[EmailVerificationRoute] Recebida solicitação de verificação para usuário ${userId}. Código fornecido: ${code}`);
    
    if (!code) {
      console.log(`[EmailVerificationRoute] Código não fornecido pelo usuário ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Código de verificação não fornecido"
      });
    }
    
    // Normalizar o código para evitar problemas com espaços e garantir que seja string
    const normalizedCode = String(code).trim();
    
    // Verificar o código
    console.log(`[EmailVerificationRoute] Verificando código '${normalizedCode}' para usuário ${userId}`);
    const result = await emailVerificationService.verifyCode(userId, normalizedCode);
    
    console.log(`[EmailVerificationRoute] Resultado da verificação para usuário ${userId}:`, result);
    
    if (result.success) {
      // Se o código for válido, marca o email como confirmado
      console.log(`[EmailVerificationRoute] Atualizando status de emailconfirmed para o usuário ${userId}`);
      await storage.updateUserEmailConfirmed(userId, true);
      
      console.log(`[EmailVerificationRoute] Email confirmado com sucesso para o usuário ${userId}`);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("[Verificação de Email] Erro ao verificar código:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao verificar código. Por favor tente novamente ou solicite um novo código."
    });
  }
});

// Rota para examinar os códigos de um usuário (somente para administradores)
router.get("/admin/inspect/:userId", async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário atual é um administrador
    if (!req.isAuthenticated() || req.user?.nivelacesso !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Acesso não autorizado"
      });
    }
    
    const targetUserId = parseInt(req.params.userId, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "ID de usuário inválido"
      });
    }
    
    console.log(`[EmailVerificationAdmin] Inspecionando códigos do usuário ${targetUserId} por administrador ${req.user.id}`);
    
    // Buscar o usuário
    const user = await storage.getUser(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }
    
    // Buscar todos os códigos do usuário
    const codesResult = await db.execute(sql`
      SELECT * FROM "emailVerificationCodes"
      WHERE "userId" = ${targetUserId}
      ORDER BY "createdAt" DESC
    `);
    
    // Buscar informações sobre o status da verificação
    const isEmailConfirmed = user.emailconfirmed === true;
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: isEmailConfirmed,
      },
      codes: codesResult.rows.map((code: any) => ({
        id: code.id,
        code: code.code,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt,
        isUsed: code.isUsed,
        usedAt: code.usedAt
      }))
    });
  } catch (error) {
    console.error("[EmailVerificationAdmin] Erro ao inspecionar códigos:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao inspecionar códigos de verificação"
    });
  }
});

// Rota para validar manualmente um email (somente para administradores)
router.post("/admin/verify/:userId", async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário atual é um administrador
    if (!req.isAuthenticated() || req.user?.nivelacesso !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Acesso não autorizado"
      });
    }
    
    const targetUserId = parseInt(req.params.userId, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "ID de usuário inválido"
      });
    }
    
    console.log(`[EmailVerificationAdmin] Verificando manualmente o email do usuário ${targetUserId} pelo administrador ${req.user.id}`);
    
    // Buscar o usuário
    const user = await storage.getUser(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }
    
    // Verificar se o email já está confirmado
    if (user.emailconfirmed === true) {
      return res.status(400).json({
        success: false,
        message: "O email deste usuário já está confirmado"
      });
    }
    
    // Confirmar o email do usuário
    await storage.updateUserEmailConfirmed(targetUserId, true);
    
    console.log(`[EmailVerificationAdmin] Email do usuário ${targetUserId} confirmado manualmente com sucesso pelo administrador ${req.user.id}`);
    
    return res.json({
      success: true,
      message: "Email do usuário confirmado com sucesso"
    });
  } catch (error) {
    console.error("[EmailVerificationAdmin] Erro ao verificar manualmente:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao confirmar email do usuário"
    });
  }
});

export default router;