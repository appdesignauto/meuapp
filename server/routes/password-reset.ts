import { Router } from 'express';
import { PasswordResetService } from '../services/password-reset-service';
import { hashPassword } from '../auth-utils';
import { z } from 'zod';

const router = Router();
const passwordResetService = new PasswordResetService();

// Schema para validação da solicitação de reset
const requestResetSchema = z.object({
  email: z.string().email({ message: 'Email inválido' })
});

// Schema para validação da redefinição de senha
const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Token inválido' }),
  password: z.string().min(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
});

/**
 * Rota para solicitar redefinição de senha
 * POST /api/password-reset/request
 */
router.post('/request', async (req, res) => {
  try {
    // Valida os dados enviados
    const validationResult = requestResetSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: validationResult.error.errors 
      });
    }

    const { email } = validationResult.data;
    const result = await passwordResetService.createResetToken(email);

    if (!result.success) {
      // Se existe cooldown, envia essa informação para o cliente
      if (result.cooldown) {
        return res.status(429).json({ 
          message: "Um e-mail já foi enviado e chegará em instantes. Para solicitar outro, aguarde alguns minutos (prazo máximo de 3 minutos).",
          cooldown: result.cooldown
        });
      }
      return res.status(500).json({ message: result.message });
    }

    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Erro na requisição de redefinição de senha:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao processar a solicitação de redefinição de senha' 
    });
  }
});

/**
 * Rota para redefinir a senha utilizando um token
 * POST /api/password-reset/reset
 */
router.post('/reset', async (req, res) => {
  try {
    // Valida os dados enviados
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: validationResult.error.errors 
      });
    }

    const { token, password } = validationResult.data;
    const result = await passwordResetService.resetPassword(token, password);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Erro na redefinição de senha:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao processar a redefinição de senha' 
    });
  }
});

export default router;