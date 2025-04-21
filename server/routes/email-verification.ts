import { Router, Request, Response } from "express";
import { EmailVerificationService } from "../services/email-verification-service";
import { storage } from "../storage";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { isAdmin } from "../middlewares/auth";
import { specialEmailHandler } from "../services/special-email-handler";

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
    
    // Capturar informações para diagnóstico
    const userAgent = req.headers['user-agent'] || 'Não informado';
    const clientIP = req.ip || req.connection.remoteAddress || 'Não disponível';
    const isMobile = /mobile|android|iphone|ipod|blackberry/i.test(userAgent.toLowerCase());
    
    console.log(`[EmailVerificationRoute] Solicitação de reenvio de código para usuário ${userId}`);
    console.log(`[EmailVerificationRoute] Dispositivo: ${isMobile ? 'Mobile' : 'Desktop'}, IP: ${clientIP}`);
    console.log(`[EmailVerificationRoute] User-Agent: ${userAgent}`);
    
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
    
    // Configurar variáveis temporárias de ambiente para o contexto desta solicitação
    process.env.CURRENT_USER_AGENT = userAgent;
    process.env.CURRENT_CLIENT_IP = clientIP;
    
    // Enviar o código de verificação
    const result = await emailVerificationService.sendVerificationCode(userId, userEmail);
    
    // Limpar as variáveis temporárias
    delete process.env.CURRENT_USER_AGENT;
    delete process.env.CURRENT_CLIENT_IP;
    
    console.log(`[EmailVerificationRoute] Resultado do envio de código para usuário ${userId} (${isMobile ? 'Mobile' : 'Desktop'}):`, result);
    
    // Para dispositivos móveis, adicionar informações especiais de diagnóstico
    if (isMobile) {
      console.log(`[EmailVerificationRoute] DIAGNÓSTICO MOBILE: Email: ${userEmail}, Dispositivo: ${userAgent}`);
    }
    
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
router.get("/admin/inspect/:userId", isAdmin, async (req: Request, res: Response) => {
  try {
    
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
router.post("/admin/verify/:userId", isAdmin, async (req: Request, res: Response) => {
  try {
    
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

// Rota especial para lidar com emails problemáticos conhecidos
router.post("/special-case/:email", isAdmin, async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email não fornecido"
      });
    }
    
    // Verifica se o email é um caso especial conhecido
    if (!specialEmailHandler.isProblematicEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Este email não está na lista de casos especiais conhecidos"
      });
    }
    
    console.log(`[SpecialEmailRoute] Iniciando tratamento especial para ${email} pelo administrador ${req.user!.id}`);
    
    // Envia email usando o tratamento especial
    const result = await specialEmailHandler.sendSpecialVerificationEmail(email);
    
    if (result.success) {
      console.log(`[SpecialEmailRoute] Email enviado com sucesso para ${email} (código: ${result.code})`);
      return res.json({
        success: true,
        message: `Email enviado com sucesso para ${email}`,
        code: result.code // Incluir o código na resposta para fins de depuração
      });
    } else {
      console.log(`[SpecialEmailRoute] Falha ao enviar email para ${email}`);
      return res.status(500).json({
        success: false,
        message: `Falha ao enviar email para ${email}. Tente novamente ou verifique os logs.`
      });
    }
  } catch (error) {
    console.error("[SpecialEmailRoute] Erro ao processar caso especial:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao processar caso especial de email"
    });
  }
});

// Rota especial para verificação direta de códigos para emails problemáticos
router.post("/special-verify/:email", isAdmin, async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const { code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email ou código não fornecidos"
      });
    }
    
    // Verifica se o email é um caso especial conhecido
    if (!specialEmailHandler.isProblematicEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Este email não está na lista de casos especiais conhecidos"
      });
    }
    
    console.log(`[SpecialEmailRoute] Verificando código para caso especial ${email}: ${code}`);
    
    // Verifica o código usando o método especial
    const isValid = await specialEmailHandler.verifyCodeSpecialCase(email, code);
    
    if (isValid) {
      console.log(`[SpecialEmailRoute] Código válido para ${email}`);
      
      // Buscar o usuário pelo email
      const user = await storage.getUserByEmail(email);
      if (user) {
        // Marca o email como confirmado
        await storage.updateUserEmailConfirmed(user.id, true);
        
        console.log(`[SpecialEmailRoute] Email ${email} confirmado com sucesso`);
        
        return res.json({
          success: true,
          message: "Email confirmado com sucesso"
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado com este email"
        });
      }
    } else {
      console.log(`[SpecialEmailRoute] Código inválido para ${email}`);
      return res.status(400).json({
        success: false,
        message: "Código inválido"
      });
    }
  } catch (error) {
    console.error("[SpecialEmailRoute] Erro ao verificar código especial:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao verificar código especial"
    });
  }
});

// Rota para forçar verificação direta de email (para uso administrativo)
router.post("/force-verification/:email", isAdmin, async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email não fornecido"
      });
    }
    
    console.log(`[EmailVerificationForce] Forçando verificação para ${email} pelo administrador ${req.user!.id}`);
    
    // Buscar o usuário pelo email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado com este email"
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
    await storage.updateUserEmailConfirmed(user.id, true);
    
    console.log(`[EmailVerificationForce] Email ${email} confirmado com sucesso pelo administrador ${req.user!.id}`);
    
    return res.json({
      success: true,
      message: `Email ${email} verificado com sucesso`
    });
  } catch (error) {
    console.error("[EmailVerificationForce] Erro ao forçar verificação:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao forçar verificação de email"
    });
  }
});

export default router;