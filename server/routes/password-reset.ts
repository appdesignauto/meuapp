import { Router } from 'express';
import { passwordResetService } from '../services/password-reset-service';
import { hashPassword } from '../auth-utils';
import { z } from 'zod';

const router = Router();

// Validação para solicitação de redefinição de senha
const requestResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

// Validação para redefinição de senha
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'A confirmação de senha deve ter pelo menos 6 caracteres'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

// Validação para verificação de token
const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

/**
 * @route POST /api/password-reset/request
 * @desc Solicita redefinição de senha enviando um email com instruções
 * @access Public
 */
router.post('/request', async (req, res) => {
  try {
    // Validar dados de entrada
    const validation = requestResetSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: validation.error.errors 
      });
    }

    const { email } = validation.data;
    
    // Processar solicitação de redefinição
    const result = await passwordResetService.sendPasswordResetEmail(email);
    
    // Sempre retornar sucesso (mesmo quando o email não existe)
    // para evitar vazamento de informação sobre existência de contas
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor', 
    });
  }
});

/**
 * @route POST /api/password-reset/verify-token
 * @desc Verifica se um token de redefinição é válido
 * @access Public
 */
router.post('/verify-token', async (req, res) => {
  try {
    // Validar dados de entrada
    const validation = verifyTokenSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token inválido', 
        errors: validation.error.errors 
      });
    }

    const { token } = validation.data;
    
    // Verificar validade do token
    const result = await passwordResetService.validateResetToken(token);
    
    return res.status(result.valid ? 200 : 400).json({ 
      success: result.valid, 
      message: result.message || (result.valid ? 'Token válido' : 'Token inválido') 
    });
  } catch (error) {
    console.error('Erro ao verificar token de redefinição:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor', 
    });
  }
});

/**
 * @route POST /api/password-reset/reset
 * @desc Redefine a senha usando um token válido
 * @access Public
 */
router.post('/reset', async (req, res) => {
  try {
    // Validar dados de entrada
    const validation = resetPasswordSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: validation.error.errors 
      });
    }

    const { token, password } = validation.data;
    
    // Hash da nova senha
    const hashedPassword = await hashPassword(password);
    
    // Redefinir a senha
    const result = await passwordResetService.resetPassword(token, hashedPassword);
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor', 
    });
  }
});

export default router;