import { Router, Request, Response } from "express";
import { EmailVerificationService } from "../services/email-verification-service";
import { storage } from "../storage";

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
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Email do usuário não encontrado"
      });
    }
    
    // Enviar o código de verificação
    const result = await emailVerificationService.sendVerificationCode(userId, userEmail);
    
    return res.json(result);
  } catch (error) {
    console.error("[Verificação de Email] Erro ao reenviar código:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao enviar código de verificação"
    });
  }
});

// Verificar código
router.post("/verify", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Código de verificação não fornecido"
      });
    }
    
    // Verificar o código
    const result = await emailVerificationService.verifyCode(userId, code);
    
    if (result.success) {
      // Se o código for válido, marca o email como confirmado
      await storage.updateUserEmailConfirmed(userId, true);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("[Verificação de Email] Erro ao verificar código:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao verificar código"
    });
  }
});

export default router;