import { Router, Request, Response } from 'express';
import { emailVerificationService } from '../services/email-verification-service';
import { z } from 'zod';

const router = Router();

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
};

// Esquema de validação para verificação de código
const verifyCodeSchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
});

/**
 * Envia um e-mail de verificação para o usuário atualmente logado
 * POST /api/email-verification/send
 */
router.post('/send', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    // Verifica se o email já está confirmado
    if (user.emailconfirmed) {
      return res.status(400).json({
        success: false,
        message: 'E-mail já verificado'
      });
    }
    
    // Envia e-mail de verificação
    const success = await emailVerificationService.sendVerificationEmail(
      user.id,
      user.email,
      user.name || 'Usuário'
    );
    
    if (success) {
      return res.json({
        success: true,
        message: 'E-mail de verificação enviado com sucesso'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Falha ao enviar e-mail de verificação'
      });
    }
  } catch (error) {
    console.error('Erro ao enviar e-mail de verificação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar solicitação'
    });
  }
});

/**
 * Verifica um código de verificação para o usuário atualmente logado
 * POST /api/email-verification/verify
 */
router.post('/verify', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validação do código
    const result = verifyCodeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido',
        errors: result.error.errors
      });
    }
    
    const { code } = result.data;
    const user = req.user!;
    
    // Verifica se o email já está confirmado
    if (user.emailconfirmed) {
      return res.status(400).json({
        success: false,
        message: 'E-mail já verificado'
      });
    }
    
    // Verifica o código
    const isValid = await emailVerificationService.verifyCode(user.id, code);
    
    if (isValid) {
      return res.json({
        success: true,
        message: 'E-mail verificado com sucesso'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Código inválido ou expirado'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar solicitação'
    });
  }
});

/**
 * Verifica o status de verificação do e-mail do usuário atual
 * GET /api/email-verification/status
 */
router.get('/status', isAuthenticated, (req: Request, res: Response) => {
  const user = req.user!;
  
  return res.json({
    verified: user.emailconfirmed || false,
    email: user.email
  });
});

export default router;