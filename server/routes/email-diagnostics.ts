import { Router } from 'express';
import { emailService } from '../services/email-service';
// Função auxiliar para verificar se o usuário é administrador
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  const user = req.user;
  if (!user || (user.role !== 'admin' && user.nivelacesso !== 'admin')) {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  
  next();
};

const router = Router();

/**
 * Rota para diagnóstico do serviço de email
 * Permite fazer testes de conectividade e envio com a API do Brevo
 */
router.post('/test-connectivity', isAdmin, async (req, res) => {
  try {
    console.log('[EmailDiagnostic] Iniciando teste de conectividade com API Brevo');
    
    const brevoApiKey = process.env.BREVO_API_KEY;
    
    // Verificar presença da API key
    if (!brevoApiKey) {
      return res.status(500).json({
        success: false,
        message: 'API Key do Brevo não encontrada nas variáveis de ambiente'
      });
    }
    
    // Tenta fazer uma chamada simples para a API do Brevo
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': brevoApiKey
      }
    });
    
    const statusCode = response.status;
    let responseBody;
    
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = { error: 'Falha ao processar resposta da API' };
    }
    
    // Log detalhado da resposta
    console.log(`[EmailDiagnostic] Status da API Brevo: ${statusCode}`);
    console.log(`[EmailDiagnostic] Corpo da resposta: ${JSON.stringify(responseBody).substring(0, 200)}...`);
    
    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'Conexão com a API do Brevo bem-sucedida',
        data: {
          status: statusCode,
          apiResponse: responseBody
        }
      });
    } else {
      return res.status(response.status).json({
        success: false,
        message: `Erro ao conectar com a API do Brevo: ${response.statusText}`,
        data: {
          status: statusCode,
          apiResponse: responseBody
        }
      });
    }
  } catch (error) {
    console.error('[EmailDiagnostic] Erro ao testar conectividade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar conectividade com a API do Brevo',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Teste de envio de email direto pelo serviço
 */
router.post('/test-send', isAdmin, async (req, res) => {
  try {
    const { 
      email = 'fernando.sim2018@gmail.com', 
      name = 'Usuário Teste', 
      subject = 'Teste de Diagnóstico do Serviço de Email',
      plainMessage = false
    } = req.body;
    
    console.log(`[EmailDiagnostic] Enviando email de teste para: ${email}`);
    
    // Mensagem HTML para envio
    let htmlContent = `
      <html>
        <body>
          <h1>Teste do Serviço de Email</h1>
          <p>Olá ${name},</p>
          <p>Este é um email de teste enviado do DesignAuto às ${new Date().toLocaleTimeString('pt-BR')} em ${new Date().toLocaleDateString('pt-BR')}.</p>
          <p>Se você está lendo este email, significa que o serviço está funcionando corretamente.</p>
          <hr>
          <p>Informações do serviço:</p>
          <ul>
            <li><strong>Serviço:</strong> Brevo API</li>
            <li><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'Não especificado'}</li>
            <li><strong>Cabeçalhos de email:</strong> Verificados</li>
            <li><strong>Domínio:</strong> designauto.com.br</li>
            <li><strong>Data do teste:</strong> ${new Date().toISOString()}</li>
          </ul>
          <hr>
          <p>Atenciosamente,<br>
          Equipe de Suporte DesignAuto</p>
        </body>
      </html>
    `;
    
    // Se solicitado envio de mensagem simples para teste
    if (plainMessage) {
      htmlContent = `
        <html>
          <body>
            <p>Olá ${name}, este é um email de teste às ${new Date().toLocaleTimeString('pt-BR')}.</p>
          </body>
        </html>
      `;
    }
    
    // Usar método direto para contornar validações extras
    const result = await emailService.sendDirectEmail({
      to: email,
      subject,
      html: htmlContent
    });
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Email de teste enviado com sucesso para ${email}`,
        data: {
          messageId: result.messageId,
          recipient: email,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Falha ao enviar email de teste',
        data: {
          recipient: email,
          errorDetails: result.error || 'Erro não especificado'
        }
      });
    }
  } catch (error) {
    console.error('[EmailDiagnostic] Erro ao enviar email de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de teste',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Obter logs do serviço de email
 */
router.get('/logs', isAdmin, (req, res) => {
  try {
    const logs = emailService.getLogs();
    return res.status(200).json({
      success: true,
      logCount: logs.length,
      logs: logs.slice(-100) // Apenas os últimos 100 logs
    });
  } catch (error) {
    console.error('[EmailDiagnostic] Erro ao buscar logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar logs do serviço de email',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Limpar logs do serviço de email
 */
router.post('/clear-logs', isAdmin, (req, res) => {
  try {
    emailService.clearLogs();
    return res.status(200).json({
      success: true,
      message: 'Logs do serviço de email limpos com sucesso'
    });
  } catch (error) {
    console.error('[EmailDiagnostic] Erro ao limpar logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar logs do serviço de email',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Teste específico do endpoint de redefinição de senha
 */
router.post('/test-password-reset', isAdmin, async (req, res) => {
  try {
    const { email = 'fernando.sim2018@gmail.com' } = req.body;
    
    console.log(`[EmailDiagnostic] Testando endpoint de redefinição de senha para: ${email}`);
    
    // Fazemos uma chamada direta à API interna de redefinição de senha
    const response = await fetch('http://localhost:5000/api/password-reset/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    
    return res.status(response.status).json({
      success: response.ok,
      message: `Teste do endpoint de redefinição de senha: ${response.ok ? 'Sucesso' : 'Falha'}`,
      data: {
        statusCode: response.status,
        responseData: result
      }
    });
  } catch (error) {
    console.error('[EmailDiagnostic] Erro ao testar redefinição de senha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar endpoint de redefinição de senha',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;