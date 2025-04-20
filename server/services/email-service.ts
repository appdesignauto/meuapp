import { TransactionalEmailsApi } from '@getbrevo/brevo/dist/api/transactionalEmailsApi';
import { SendSmtpEmail } from '@getbrevo/brevo/dist/model/sendSmtpEmail';

// Chave da API do Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Nome do remetente e e-mail para envios
const SENDER_NAME = 'Design Auto';
const SENDER_EMAIL = 'inovedigitalmarketing10@gmail.com';

// Templates de E-mail (IDs do Brevo)
// Você pode criar templates no painel do Brevo e usar os IDs aqui
const EMAIL_TEMPLATES = {
  VERIFICATION: 1, // Substitua pelo ID real do template de verificação
  WELCOME: 2,      // Substitua pelo ID real do template de boas-vindas
  PASSWORD_RESET: 3 // Substitua pelo ID real do template de redefinição de senha
};

class EmailService {
  private apiInstance: TransactionalEmailsApi;
  private initialized: boolean = false;
  private logs: string[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o cliente da API do Brevo
   */
  private initialize(): void {
    try {
      if (!BREVO_API_KEY) {
        this.log('❌ Erro: BREVO_API_KEY não foi configurada no ambiente');
        return;
      }

      this.apiInstance = new TransactionalEmailsApi();
      // Configurar a chave de API nos cabeçalhos
      this.apiInstance.setApiKey('api-key', BREVO_API_KEY);
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
   * Envia um e-mail de verificação com código
   * @param email Email do destinatário
   * @param name Nome do destinatário
   * @param verificationCode Código de verificação
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendVerificationEmail(email: string, name: string, verificationCode: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        this.initialize();
        if (!this.initialized) {
          this.log(`❌ Erro: Serviço não inicializado para envio para ${email}`);
          return false;
        }
      }

      const sendSmtpEmail = new SendSmtpEmail();
      
      // Configuração do e-mail
      sendSmtpEmail.subject = 'Verifique seu e-mail - Design Auto';
      sendSmtpEmail.htmlContent = `
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
      sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
      sendSmtpEmail.to = [{ email, name }];
      
      // Envio do e-mail
      this.log(`📧 Enviando e-mail de verificação para ${email}`);
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.log(`✅ E-mail de verificação enviado com sucesso para ${email}`);
      return true;
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de verificação para ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Envia um e-mail de boas-vindas após verificação
   * @param email Email do destinatário
   * @param name Nome do destinatário
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        this.initialize();
        if (!this.initialized) {
          this.log(`❌ Erro: Serviço não inicializado para envio para ${email}`);
          return false;
        }
      }

      const sendSmtpEmail = new SendSmtpEmail();
      
      // Configuração do e-mail
      sendSmtpEmail.subject = 'Bem-vindo ao Design Auto!';
      sendSmtpEmail.htmlContent = `
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
      sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
      sendSmtpEmail.to = [{ email, name }];
      
      // Envio do e-mail
      this.log(`📧 Enviando e-mail de boas-vindas para ${email}`);
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.log(`✅ E-mail de boas-vindas enviado com sucesso para ${email}`);
      return true;
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de boas-vindas para ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Envia um e-mail de redefinição de senha
   * @param email Email do destinatário
   * @param name Nome do destinatário
   * @param resetToken Token de redefinição de senha
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        this.initialize();
        if (!this.initialized) {
          this.log(`❌ Erro: Serviço não inicializado para envio para ${email}`);
          return false;
        }
      }

      // URL para redefinição de senha
      const resetUrl = `https://designauto.com.br/reset-password?token=${resetToken}`;

      const sendSmtpEmail = new SendSmtpEmail();
      
      // Configuração do e-mail
      sendSmtpEmail.subject = 'Redefinição de Senha - Design Auto';
      sendSmtpEmail.htmlContent = `
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
      sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
      sendSmtpEmail.to = [{ email, name }];
      
      // Envio do e-mail
      this.log(`📧 Enviando e-mail de redefinição de senha para ${email}`);
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.log(`✅ E-mail de redefinição de senha enviado com sucesso para ${email}`);
      return true;
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de redefinição de senha para ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

// Instância única para o serviço de e-mail
export const emailService = new EmailService();