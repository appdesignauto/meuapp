import fetch from 'node-fetch';

// Chave da API do Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

// Modo de desenvolvimento (simulação de envio)
// Definir como true para desenvolvimento/teste
// Em produção, definir como false para usar o Brevo real
const DEV_MODE = false; 

// Backup de envio para dispositivos móveis - útil para testes e diagnostico
const MOBILE_BACKUP_MODE = true;

// Configurações de remetentes disponíveis no Brevo
const SENDERS = {
  suporte: {
    name: 'Suporte Design Auto',
    email: 'suporte@designauto.com.br'
  },
  contato: {
    name: 'Design Auto',
    email: 'contato@designauto.com.br'
  }
};

// Remetente padrão para emails
const DEFAULT_SENDER = SENDERS.suporte;

// URL base da API do Brevo
const BREVO_API_URL = 'https://api.brevo.com/v3';

// Armazenamento de emails simulados enviados (para desenvolvimento)
interface SimulatedEmail {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  sentAt: Date;
}

class EmailService {
  private initialized: boolean = false;
  private logs: string[] = [];
  private simulatedEmails: SimulatedEmail[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o serviço de e-mail do Brevo
   */
  private initialize(): void {
    try {
      if (DEV_MODE) {
        this.initialized = true;
        this.log('✅ Serviço de e-mail inicializado em modo de desenvolvimento (simulação)');
        return;
      }
      
      if (!BREVO_API_KEY) {
        this.log('❌ Erro: BREVO_API_KEY não foi configurada no ambiente');
        return;
      }

      this.initialized = true;
      this.log('✅ Serviço de e-mail Brevo inicializado com sucesso');
    } catch (error) {
      this.log(`❌ Erro ao inicializar serviço de e-mail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Registra logs para diagnóstico
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[EmailService ${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Limitar o tamanho máximo do log para evitar problemas de memória
    if (this.logs.length >= 500) {
      // Manter apenas os 450 logs mais recentes quando atingir o limite
      this.logs = this.logs.slice(this.logs.length - 450);
    }
    
    this.logs.push(logMessage);
  }
  
  /**
   * Registra logs específicos para um email
   */
  private logForEmail(email: string, message: string): void {
    this.log(`[${email}] ${message}`);
  }

  /**
   * Obtém os logs do serviço
   */
  public getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Limpa os logs do serviço
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Método utilitário para enviar e-mail - usado internamente por outros métodos especializados
   * @param sender O remetente do e-mail (suporte ou contato)
   * @param to Array com destinatários (email e nome)
   * @param subject Assunto do e-mail
   * @param htmlContent Conteúdo HTML do e-mail
   * @returns Promise<{success: boolean, messageId?: string}>
   * @private
   */
  private async sendBrevoEmail(
    sender: typeof SENDERS.suporte | typeof SENDERS.contato,
    to: Array<{ email: string; name?: string }>,
    subject: string,
    htmlContent: string,
    isMobileRequest: boolean = false
  ): Promise<{success: boolean, messageId?: string}> {
    try {
      if (!this.initialized) {
        this.log('❌ Serviço não inicializado');
        return { success: false };
      }

      // Converter HTML para texto simples para clientes sem suporte a HTML
      const textContent = htmlContent.replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const payload = {
        sender: {
          name: sender.name,
          email: sender.email
        },
        to,
        subject,
        htmlContent,
        textContent
      };

      // Verifica se está em modo de desenvolvimento para simulação
      if (DEV_MODE) {
        // Simula um envio bem-sucedido
        this.log(`🧪 [DEV MODE] Simulando envio de email de ${sender.email} para ${to.map(t => t.email).join(', ')}`);
        this.log(`🧪 [DEV MODE] Assunto: ${subject}`);
        
        // Armazena o email simulado
        const simulatedEmail: SimulatedEmail = {
          from: sender.email,
          to: to[0].email, // Simplifica para o primeiro destinatário
          subject,
          html: htmlContent,
          text: textContent,
          sentAt: new Date()
        };
        
        this.simulatedEmails.push(simulatedEmail);
        
        // Gera um ID de mensagem simulado
        const simulatedMessageId = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this.log(`🧪 [DEV MODE] Email simulado com sucesso! ID: ${simulatedMessageId}`);
        
        return { success: true, messageId: simulatedMessageId };
      }
      
      // Em modo de produção, faz a chamada real para a API do Brevo
      this.log(`🔄 Enviando e-mail via Brevo para: ${to.map(t => t.email).join(', ')}`);
      this.log(`🔄 Dados do payload: Remetente: ${JSON.stringify(payload.sender)}, Assunto: ${payload.subject}`);
      
      // Verificar se a chave da API está disponível
      if (!BREVO_API_KEY) {
        this.log(`❌ ERRO CRÍTICO: Chave da API Brevo não está disponível. Verifique as variáveis de ambiente.`);
        return { success: false, messageId: 'error-no-api-key' };
      }
      
      // Log detalhado da configuração da API
      this.log(`🔧 Configuração da API: URL=${BREVO_API_URL}, Chave API (primeiros 5 caracteres): ${BREVO_API_KEY.substring(0, 5)}...`);
      
      try {
        const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'api-key': BREVO_API_KEY
          },
          body: JSON.stringify(payload)
        });

        this.log(`📊 Resposta HTTP: Status=${response.status}, Status Text=${response.statusText}, OK=${response.ok}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          this.log(`❌ Resposta de erro completa: ${errorText}`);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
            this.log(`❌ API do Brevo retornou erro: ${JSON.stringify(errorData)}`);
          } catch (e) {
            this.log(`❌ API do Brevo retornou erro não-JSON: ${errorText}`);
            errorData = { message: errorText };
          }
          
          // Log detalhado do erro para diagnóstico
          this.log(`❌ Detalhes do erro: Código=${response.status}, Mensagem=${JSON.stringify(errorData)}`);
          
          return { success: false, messageId: `error-${response.status}` };
        }

        const responseText = await response.text();
        this.log(`✅ Resposta bruta: ${responseText}`);
        
        let data;
        try {
          data = JSON.parse(responseText);
          this.log(`✅ Email enviado com sucesso! ID: ${data.messageId}`);
          
          // Log adicional para rastrear sucesso
          if (to && to.length > 0) {
            this.log(`✅ Email enviado com sucesso para: ${to[0].email}, ID: ${data.messageId}`);
          }
        } catch (e) {
          this.log(`⚠️ Resposta não é JSON válido: ${responseText}`);
          data = { messageId: 'unknown-format' };
        }
        
        return { success: true, messageId: data.messageId };
      } catch (error) {
        // Captura erros de rede ou falhas na requisição fetch
        const fetchError = error as Error;
        this.log(`❌ Erro na requisição HTTP para o Brevo: ${fetchError.message || 'Erro desconhecido'}`);
        console.error("Erro completo na chamada para API do Brevo:", fetchError);
        
        return { success: false, messageId: 'fetch-error' };
      }
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false };
    }
  }
  
  /**
   * Retorna os emails simulados (apenas para modo de desenvolvimento)
   * @returns Array<SimulatedEmail> Lista de emails simulados
   */
  public getSimulatedEmails(): SimulatedEmail[] {
    if (!DEV_MODE) {
      this.log('⚠️ getSimulatedEmails só está disponível em modo de desenvolvimento');
      return [];
    }
    return [...this.simulatedEmails];
  }
  
  /**
   * Limpa os emails simulados (apenas para modo de desenvolvimento)
   */
  public clearSimulatedEmails(): void {
    if (!DEV_MODE) {
      this.log('⚠️ clearSimulatedEmails só está disponível em modo de desenvolvimento');
      return;
    }
    this.simulatedEmails = [];
    this.log('🧹 Emails simulados limpos com sucesso');
  }

  /**
   * Envia um e-mail de verificação com código usando o remetente de suporte
   * @param email Email do destinatário
   * @param name Nome do destinatário
   * @param verificationCode Código de verificação
   * @returns Promise<{success: boolean}> Indica se o envio foi bem-sucedido
   */
  public async sendEmailVerification(email: string, verificationCode: string): Promise<{success: boolean}> {
    // Extrair nome do email para fallback
    const name = email.split('@')[0];
    try {
      this.logForEmail(email, `📧 Preparando e-mail de verificação usando remetente de suporte`);
      
      // Informações de diagnóstico adicional para dispositivos móveis
      const userAgent = process.env.CURRENT_USER_AGENT || "Indisponível";
      const clientIP = process.env.CURRENT_CLIENT_IP || "Indisponível";
      const deviceType = userAgent !== "Indisponível" && /mobile|android|iphone|ipod|blackberry/i.test(userAgent.toLowerCase()) 
        ? 'Mobile' 
        : 'Desktop/Desconhecido';
      const isMobileDevice = deviceType === 'Mobile';
      
      this.logForEmail(email, `📱 Dados do dispositivo: Tipo=${deviceType}, IP=${clientIP}`);
      if (isMobileDevice) {
        this.logForEmail(email, `📱 User-Agent Mobile: ${userAgent}`);
      }
      
      // Registrar detalhes de DNS para diagnóstico
      const emailDomain = email.split('@')[1];
      this.logForEmail(email, `📧 Domínio do email: ${emailDomain}`);
      
      // Verificar condições especiais para dispositivos móveis
      if (isMobileDevice) {
        // Para emails em domínios populares, adicionar diagnóstico adicional
        const popularDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
        if (popularDomains.includes(emailDomain)) {
          this.logForEmail(email, `📱 Email em provedor popular (${emailDomain}) sendo enviado de dispositivo móvel`);
        }
      }
      
      const htmlContent = `
        <html>
          <body>
            <h1>Olá ${name},</h1>
            <p>Obrigado por se cadastrar no Design Auto!</p>
            <p>Seu código de verificação é:</p>
            <h2 style="font-size: 24px; padding: 10px; background-color: #f0f0f0; text-align: center; letter-spacing: 5px;">${verificationCode}</h2>
            <p>Este código expira em 24 horas.</p>
            <p>Se você não solicitou este código, por favor ignore este e-mail.</p>
            <p>Atenciosamente,<br>Equipe Design Auto</p>
          </body>
        </html>
      `;
      
      // Usar explicitamente o remetente de suporte para verificação
      const supportSender = SENDERS.suporte;
      const subject = 'Verifique seu e-mail - Design Auto';
      
      this.logForEmail(email, `🔄 Iniciando envio com código: ${verificationCode}`);
      
      // Modificar ligeiramente o assunto para dispositivos móveis para evitar filtros anti-spam
      const adjustedSubject = isMobileDevice 
        ? `Código de verificação - Design Auto: ${verificationCode.substring(0, 2)}****` 
        : subject;
      
      this.logForEmail(email, `📧 Enviando email com assunto: ${adjustedSubject} (Dispositivo móvel: ${isMobileDevice ? 'Sim' : 'Não'})`);
      
      // Enviar com sinalizador de dispositivo móvel
      const result = await this.sendBrevoEmail(
        supportSender, 
        [{ email, name }], 
        adjustedSubject, 
        htmlContent,
        isMobileDevice
      );
      
      // Se falhou no envio e é um dispositivo móvel, tentar novamente com estratégia alternativa
      if (!result.success && isMobileDevice && MOBILE_BACKUP_MODE) {
        this.logForEmail(email, `🔄 Falha no envio para dispositivo móvel. Tentando estratégia de backup...`);
        
        // Modificar ainda mais o assunto para evitar filtros de spam móveis
        const backupSubject = `Seu código: ${verificationCode}`;
        
        // Template simplificado para melhor entrega em dispositivos móveis
        const backupHtmlContent = `
          <html>
            <body>
              <h2>Seu código de verificação para o Design Auto:</h2>
              <div style="font-size: 26px; background-color: #e9e9e9; padding: 15px; text-align: center; letter-spacing: 8px; font-weight: bold;">${verificationCode}</div>
              <p>Por favor, digite este código no aplicativo para completar seu cadastro.</p>
            </body>
          </html>
        `;
        
        // Tentar enviar com o template alternativo
        const backupResult = await this.sendBrevoEmail(
          supportSender,
          [{ email, name }],
          backupSubject,
          backupHtmlContent,
          true
        );
        
        if (backupResult.success) {
          this.logForEmail(email, `✅ E-mail de backup enviado com sucesso para dispositivo móvel. ID: ${backupResult.messageId || 'desconhecido'}`);
          return { success: true };
        } else {
          this.logForEmail(email, `❌ Ambas as tentativas de envio falharam para dispositivo móvel`);
        }
      }
      
      if (result.success) {
        this.logForEmail(email, `✅ E-mail de verificação enviado com sucesso. ID: ${result.messageId || 'desconhecido'}`);
      } else {
        this.logForEmail(email, `❌ Falha ao enviar e-mail de verificação`);
      }
      
      return { success: result.success };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logForEmail(email, `❌ Erro ao enviar e-mail de verificação: ${errorMessage}`);
      return { success: false };
    }
  }

  /**
   * Envia um e-mail de boas-vindas após verificação usando remetente do contato oficial
   * @param email Email do destinatário
   * @param name Nome do destinatário
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      this.log(`📧 Preparando e-mail de boas-vindas para ${email} usando remetente de contato`);
      
      const htmlContent = `
        <html>
          <body>
            <h1>Bem-vindo ao Design Auto, ${name}!</h1>
            <p>Sua conta foi verificada com sucesso.</p>
            <p>Você agora tem acesso a todos os recursos disponíveis para seu plano.</p>
            <p>Se tiver qualquer dúvida, entre em contato conosco.</p>
            <p>Atenciosamente,<br>Equipe Design Auto</p>
          </body>
        </html>
      `;
      
      // Usar o remetente de contato para emails de boas-vindas
      const contactSender = SENDERS.contato;
      const subject = 'Bem-vindo ao Design Auto!';
      
      const result = await this.sendBrevoEmail(
        contactSender, 
        [{ email, name }], 
        subject, 
        htmlContent
      );
      
      if (result.success) {
        this.log(`✅ E-mail de boas-vindas enviado com sucesso de ${contactSender.email}: ${result.messageId}`);
      } else {
        this.log(`❌ Falha ao enviar e-mail de boas-vindas para ${email}`);
      }
      
      return result.success;
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de boas-vindas para ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Envia um e-mail de redefinição de senha usando o remetente de suporte
   * @param email Email do destinatário
   * @param name Nome do destinatário
   * @param resetToken Token de redefinição de senha
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
    try {
      this.log(`📧 Preparando e-mail de redefinição de senha para ${email} usando remetente de suporte`);
      
      // URL para redefinição de senha
      const resetUrl = `https://designauto.com.br/reset-password?token=${resetToken}`;
      
      const htmlContent = `
        <html>
          <body>
            <h1>Olá ${name},</h1>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}" style="padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Redefinir Senha</a>
            <p>Este link expira em 1 hora.</p>
            <p>Se você não solicitou esta mudança, por favor ignore este e-mail.</p>
            <p>Atenciosamente,<br>Equipe Design Auto</p>
          </body>
        </html>
      `;
      
      // Usar explicitamente o remetente de suporte para senhas
      const supportSender = SENDERS.suporte;
      const subject = 'Redefinição de Senha - Design Auto';
      
      const result = await this.sendBrevoEmail(
        supportSender, 
        [{ email, name }], 
        subject, 
        htmlContent
      );
      
      if (result.success) {
        this.log(`✅ E-mail de redefinição de senha enviado com sucesso de ${supportSender.email}: ${result.messageId}`);
      } else {
        this.log(`❌ Falha ao enviar e-mail de redefinição de senha para ${email}`);
      }
      
      return result.success;
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de redefinição de senha para ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

// Instância única para o serviço de e-mail
export const emailService = new EmailService();