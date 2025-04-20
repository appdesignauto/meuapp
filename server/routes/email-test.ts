import express from 'express';
import { emailService } from '../services/email-service';

const router = express.Router();

/**
 * Rota unificada para testar todos os tipos de e-mail
 * POST /api/email-test
 * 
 * Parâmetros:
 * - type: 'verification', 'welcome', ou 'reset'
 * - email: e-mail de destino
 * - name: nome do destinatário
 * - verificationCode: (para type=verification) código de verificação
 * - resetToken: (para type=reset) token de redefinição de senha
 */
router.post('/', async (req, res) => {
  try {
    const { 
      type, 
      email = 'inovedigitalmarketing10@gmail.com', 
      name = 'Usuário Teste',
      verificationCode, 
      resetToken 
    } = req.body;
    
    let result = false;
    let details = {};
    
    // Valida o tipo de e-mail solicitado
    if (!type || !['verification', 'welcome', 'reset'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de e-mail inválido. Use "verification", "welcome" ou "reset".'
      });
    }
    
    // Envia o e-mail apropriado com base no tipo
    switch (type) {
      case 'verification': {
        // Gera um código se não foi fornecido
        const code = verificationCode || Math.floor(100000 + Math.random() * 900000).toString();
        result = await emailService.sendVerificationEmail(email, name, code);
        details = { code, sender: 'suporte@designauto.com.br' };
        break;
      }
        
      case 'welcome': {
        result = await emailService.sendWelcomeEmail(email, name);
        details = { sender: 'contato@designauto.com.br' };
        break;
      }
        
      case 'reset': {
        // Valida token de redefinição
        if (!resetToken) {
          return res.status(400).json({ 
            success: false, 
            message: 'Token de redefinição não fornecido para e-mail do tipo "reset"'
          });
        }
        
        result = await emailService.sendPasswordResetEmail(email, name, resetToken);
        details = { token: resetToken, sender: 'suporte@designauto.com.br' };
        break;
      }
    }
    
    if (result) {
      res.status(200).json({ 
        success: true, 
        message: `E-mail de ${type} enviado com sucesso`, 
        ...details
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: `Erro ao enviar e-mail de ${type}`
      });
    }
  } catch (error) {
    console.error('Erro ao testar envio de e-mail:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao enviar e-mail',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Testa o envio de um e-mail de verificação
 * GET /api/email-test/verification
 */
router.get('/verification', async (req, res) => {
  try {
    const { email = 'inovedigitalmarketing10@gmail.com', name = 'Usuário Teste' } = req.query;
    
    // Gera um código de verificação aleatório de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await emailService.sendVerificationEmail(
      email as string, 
      name as string, 
      verificationCode
    );
    
    if (result) {
      res.status(200).json({ 
        success: true, 
        message: 'E-mail de verificação enviado com sucesso', 
        code: verificationCode 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao enviar e-mail de verificação'
      });
    }
  } catch (error) {
    console.error('Erro ao testar envio de e-mail:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao enviar e-mail de verificação',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Testa o envio de um e-mail de boas-vindas
 * GET /api/email-test/welcome
 */
router.get('/welcome', async (req, res) => {
  try {
    const { email = 'inovedigitalmarketing10@gmail.com', name = 'Usuário Teste' } = req.query;
    
    const result = await emailService.sendWelcomeEmail(
      email as string, 
      name as string
    );
    
    if (result) {
      res.status(200).json({ 
        success: true, 
        message: 'E-mail de boas-vindas enviado com sucesso'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao enviar e-mail de boas-vindas'
      });
    }
  } catch (error) {
    console.error('Erro ao testar envio de e-mail:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao enviar e-mail de boas-vindas',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Obtém os logs do serviço de e-mail
 * GET /api/email-test/logs
 */
router.get('/logs', (req, res) => {
  const logs = emailService.getLogs();
  res.status(200).json({ logs });
});

/**
 * Limpa os logs do serviço de e-mail
 * POST /api/email-test/logs/clear
 */
router.post('/logs/clear', (req, res) => {
  emailService.clearLogs();
  res.status(200).json({ message: 'Logs limpos com sucesso' });
});

export default router;