import fetch from 'node-fetch';

// Chave da API do Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY;

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

class EmailService {
  private initialized: boolean = false;
  private logs: string[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o serviço de e-mail do Brevo
   */
  private initialize(): void {
    try {
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
    this.logs.push(logMessage);
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
    htmlContent: string
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

      const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-key': BREVO_API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API do Brevo retornou erro: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false };
    }
  }

  /**
   * Envia um e-mail de verificação com código usando o remetente de suporte
   * @param email Email do destinatário
   * @param name Nome do destinatário
   * @param verificationCode Código de verificação
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendVerificationEmail(email: string, name: string, verificationCode: string): Promise<boolean> {
    try {
      this.log(`📧 Preparando e-mail de verificação para ${email} usando remetente de suporte`);
      
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
      
      const result = await this.sendBrevoEmail(
        supportSender, 
        [{ email, name }], 
        subject, 
        htmlContent
      );
      
      if (result.success) {
        this.log(`✅ E-mail de verificação enviado com sucesso de ${supportSender.email}: ${result.messageId}`);
      } else {
        this.log(`❌ Falha ao enviar e-mail de verificação para ${email}`);
      }
      
      return result.success;
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de verificação para ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
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