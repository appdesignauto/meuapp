import express from 'express';
import { EmailVerificationService } from '../services/email-verification-service';
import { emailService } from '../services/email-service';

const router = express.Router();

// Verifica as configurações atuais do serviço de email para um endereço específico
router.get('/check/:email', async (req, res) => {
  try {
    // Apenas administradores podem verificar
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Apenas administradores podem acessar esta funcionalidade' 
      });
    }

    const { email } = req.params;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email não fornecido'
      });
    }

    // Capturar informações do User-Agent
    const userAgent = req.get('User-Agent') || 'Desconhecido';
    // Capturar IP
    const clientIP = req.ip || req.connection.remoteAddress || 'Desconhecido';

    // Temporariamente armazenar essas informações no processo para uso no service
    process.env.CURRENT_USER_AGENT = userAgent;
    process.env.CURRENT_CLIENT_IP = clientIP;

    // Verificar se o domínio é suportado
    const emailDomain = email.split('@')[1];
    const popularDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
    const isPopularDomain = popularDomains.includes(emailDomain);
    const isGmail = emailDomain === 'gmail.com';

    // Gerar um código de verificação novo apenas para teste
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Enviar um email de teste
    const result = await emailService.sendEmailVerification(email, verificationCode);

    // Limpar os valores temporários
    delete process.env.CURRENT_USER_AGENT;
    delete process.env.CURRENT_CLIENT_IP;

    // Obter os últimos logs específicos para este email
    const logs = emailService.getLogs().filter(log => log.includes(`[${email}]`));

    return res.json({
      success: result.success,
      email,
      domainInfo: {
        domain: emailDomain,
        isPopularDomain,
        isGmail,
        isSupported: true
      },
      deviceInfo: {
        userAgent,
        isMobile: /mobile|android|iphone|ipod|blackberry/i.test(userAgent.toLowerCase()),
        clientIP
      },
      verificationCode,
      logs: logs.slice(-20) // Enviar apenas os 20 logs mais recentes
    });
  } catch (error) {
    console.error('Erro no diagnóstico de email:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no diagnóstico'
    });
  }
});

export default router;