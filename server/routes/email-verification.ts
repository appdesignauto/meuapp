import { Request, Response, Router } from "express";
import { EmailVerificationService } from "../services/email-verification-service";
import { storage } from "../storage";
import { z } from "zod";

const emailVerificationRouter = Router();
const emailVerificationService = new EmailVerificationService();

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Não autenticado" });
  }
  next();
};

// Obter status da verificação
emailVerificationRouter.get("/status", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Verificar se o usuário já tem seu e-mail confirmado
    if (req.user!.emailconfirmed) {
      return res.json({ 
        success: true, 
        verified: true,
        message: "E-mail já verificado"
      });
    }
    
    // Verificar se existe um código pendente
    const hasPendingCode = await emailVerificationService.hasPendingVerificationCode(userId);
    
    return res.json({
      success: true,
      verified: false,
      sent: hasPendingCode,
      message: hasPendingCode 
        ? "Código de verificação já enviado" 
        : "Nenhum código de verificação enviado"
    });
  } catch (error) {
    console.error("[Email Verification] Erro ao verificar status:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao verificar status da verificação" 
    });
  }
});

// Enviar/reenviar código de verificação
emailVerificationRouter.post("/resend", isAuthenticated, async (req, res) => {
  try {
    const user = req.user!;
    
    // Não reenviar se o e-mail já foi verificado
    if (user.emailconfirmed) {
      return res.json({ 
        success: true, 
        verified: true,
        message: "E-mail já verificado" 
      });
    }

    // Gerar e enviar código de verificação
    const result = await emailVerificationService.sendVerificationCode(user.id, user.email);
    
    if (result.success) {
      return res.json({ 
        success: true, 
        message: "Código de verificação enviado"
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: result.message || "Erro ao enviar código de verificação" 
      });
    }
  } catch (error) {
    console.error("[Email Verification] Erro ao reenviar código:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao enviar código de verificação" 
    });
  }
});

// Verificar código
emailVerificationRouter.post("/verify", isAuthenticated, async (req, res) => {
  try {
    const schema = z.object({
      code: z.string().length(6)
    });
    
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Código inválido. Deve ter 6 dígitos." 
      });
    }
    
    const { code } = parseResult.data;
    const userId = req.user!.id;
    
    // Não verificar se o e-mail já foi verificado
    if (req.user!.emailconfirmed) {
      return res.json({ 
        success: true, 
        verified: true,
        message: "E-mail já verificado" 
      });
    }
    
    // Verificar o código
    const result = await emailVerificationService.verifyCode(userId, code);
    
    if (result.success) {
      // Atualizar o usuário como verificado
      await storage.updateUserEmailConfirmed(userId, true);
      
      // Atualizar os dados do usuário na sessão
      if (req.user) {
        req.user.emailconfirmed = true;
      }
      
      return res.json({ 
        success: true, 
        message: "E-mail verificado com sucesso" 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: result.message || "Código inválido ou expirado" 
      });
    }
  } catch (error) {
    console.error("[Email Verification] Erro ao verificar código:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao verificar código" 
    });
  }
});

export default emailVerificationRouter;