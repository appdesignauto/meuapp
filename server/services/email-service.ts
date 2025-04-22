import fetch from 'node-fetch';
import { createHash } from 'crypto';

// Chave da API do Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Verificar a chave na inicialização
console.log(`[EmailService] Verificando BREVO_API_KEY: ${BREVO_API_KEY ? 'Chave presente com ' + BREVO_API_KEY.length + ' caracteres' : 'Chave não configurada!'}`);

// Domínio para URLs de redefinição
const APP_DOMAIN = process.env.NODE_ENV === 'production' 
  ? 'https://design-auto-hub-1-appdesignauto.replit.app'
  : 'http://localhost:5000';

// Modo de desenvolvimento (simulação de envio)
// Em ambiente de desenvolvimento local, pode-se optar por simular o envio de emails
// Em produção, usa sempre a API real do Brevo
// Para testes em desenvolvimento, estamos usando a API real por padrão
const DEV_MODE = false;

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
        this.log('⚠️ Sistema continuará em modo de simulação de emails');
        
        // Force DEV_MODE to true if no API key is available
        (global as any).forceDevMode = true;
        return;
      }

      const apiKeyLength = BREVO_API_KEY.length;
      if (apiKeyLength < 10) {
        this.log(`⚠️ BREVO_API_KEY parece inválida (${apiKeyLength} caracteres)`);
        this.log('⚠️ Sistema continuará em modo de simulação de emails');
        
        // Force DEV_MODE to true if API key seems invalid
        (global as any).forceDevMode = true;
        return;
      }

      this.initialized = true;
      this.log('✅ Serviço de e-mail Brevo inicializado com sucesso');
      this.log(`🔑 Verificação da Brevo API: chave com ${apiKeyLength} caracteres detectada`);
    } catch (error) {
      this.log(`❌ Erro ao inicializar serviço de e-mail: ${error instanceof Error ? error.message : String(error)}`);
      
      // Force DEV_MODE to true in case of initialization error
      (global as any).forceDevMode = true;
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
   * Método para envio direto de email - exposto para testes de diagnóstico
   * @param params Parâmetros do email {to, subject, html, text}
   * @returns Promise<{success: boolean, messageId?: string, error?: string}>
   */
  public async sendDirectEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{success: boolean, messageId?: string, error?: string}> {
    try {
      if (!this.initialized) {
        this.log('❌ Serviço não inicializado para envio direto');
        return { success: false, error: 'Serviço não inicializado' };
      }
      
      // Preparar destinatário
      const to = [{ email: params.to, name: params.to.split('@')[0] }];
      
      // Usar remetente padrão para envios diretos
      const sender = DEFAULT_SENDER;
      
      // Conteúdo em texto plano (opcional)
      const textContent = params.text || params.html
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      this.log(`📧 [ENVIO DIRETO] Enviando email para ${params.to} com assunto: ${params.subject}`);
      
      // Enviar usando o método interno
      return await this.sendBrevoEmail(
        sender,
        to,
        params.subject,
        params.html,
        textContent
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ [ENVIO DIRETO] Erro ao enviar email: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Método utilitário para enviar e-mail - usado internamente por outros métodos especializados
   * @param sender O remetente do e-mail (suporte ou contato)
   * @param to Array com destinatários (email e nome)
   * @param subject Assunto do e-mail
   * @param htmlContent Conteúdo HTML do e-mail
   * @param textContent Conteúdo em texto puro (opcional)
   * @returns Promise<{success: boolean, messageId?: string, error?: string}>
   * @private
   */
  private async sendBrevoEmail(
    sender: typeof SENDERS.suporte | typeof SENDERS.contato,
    to: Array<{ email: string; name?: string }>,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<{success: boolean, messageId?: string}> {
    try {
      if (!this.initialized) {
        this.log('❌ Serviço não inicializado');
        return { success: false };
      }

      // Converter HTML para texto simples para clientes sem suporte a HTML
      // Remover qualquer código de HTML e preservar o texto puro
      let finalTextContent = textContent;
      if (!finalTextContent) {
        finalTextContent = htmlContent
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
        
      // Garantir que o link de redefinição permaneça intacto no texto
      if (to[0]?.email && subject.includes('Redefinição de Senha')) {
        // Tentar extrair o link de resetUrl do conteúdo HTML
        const resetUrlMatch = htmlContent.match(/href="([^"]+)"/);
        if (resetUrlMatch && resetUrlMatch[1]) {
          finalTextContent += "\n\nLink direto para redefinição de senha: " + resetUrlMatch[1];
        }
      }
      
      // Incluir messageId personalizado para rastreamento
      const customMessageId = `design-auto-${Date.now()}-${createHash('md5').update(to[0].email + subject).digest('hex').substring(0, 8)}`;
      
      const payload = {
        sender: {
          name: sender.name,
          email: sender.email
        },
        to,
        subject,
        htmlContent,
        textContent: finalTextContent || '',
        headers: {
          'X-Custom-MessageId': customMessageId,
          'X-App-Name': 'DesignAuto',
          'X-Environment': process.env.NODE_ENV || 'development'
        }
      };

      // Verifica se está em modo de desenvolvimento para simulação
      if (DEV_MODE || (global as any).forceDevMode) {
        // Simula um envio bem-sucedido
        this.log(`🧪 [DEV MODE] Simulando envio de email de ${sender.email} para ${to.map(t => t.email).join(', ')}`);
        this.log(`🧪 [DEV MODE] Assunto: ${subject}`);
        
        // Armazena o email simulado
        const simulatedEmail: SimulatedEmail = {
          from: sender.email,
          to: to[0].email, // Simplifica para o primeiro destinatário
          subject,
          html: htmlContent,
          text: finalTextContent || '', // Usando o texto final processado
          sentAt: new Date()
        };
        
        this.simulatedEmails.push(simulatedEmail);
        
        // Gera um ID de mensagem simulado
        const simulatedMessageId = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this.log(`🧪 [DEV MODE] Email simulado com sucesso! ID: ${simulatedMessageId}`);
        
        // Mostrar link de redefinição em logs de desenvolvimento
        if (subject.includes('Redefinição de Senha')) {
          const resetUrlMatch = htmlContent.match(/href="([^"]+)"/);
          if (resetUrlMatch && resetUrlMatch[1]) {
            this.log(`🔗 [DEV MODE] Link de redefinição: ${resetUrlMatch[1]}`);
          }
        }
        
        return { success: true, messageId: simulatedMessageId };
      }
      
      // Em modo de produção, faz a chamada real para a API do Brevo
      // Log detalhado para depuração da API do Brevo
      this.log(`📤 Enviando e-mail real via Brevo API para ${to.map(t => t.email).join(', ')}`);
      
      // Verificar se temos a chave da API
      if (!BREVO_API_KEY) {
        this.log('❌ ERRO CRÍTICO: BREVO_API_KEY não configurada!');
        return { success: false };
      }
      
      // Registrar comprimento da chave da API para diagnóstico (sem revelar a chave)
      this.log(`🔑 Usando chave Brevo API com ${BREVO_API_KEY.length} caracteres`);
      
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
        try {
          const errorData = await response.json();
          throw new Error(`API do Brevo retornou erro: ${JSON.stringify(errorData)}`);
        } catch (parseError) {
          throw new Error(`API do Brevo retornou erro: ${response.status} ${response.statusText}`);
        }
      }

      // Garantir que o retorno tem a estrutura correta
      const responseData = await response.json();
      const messageId = typeof responseData === 'object' && responseData !== null && 'messageId' in responseData
        ? String(responseData.messageId)
        : `response-${Date.now()}`;
      
      return { success: true, messageId };
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
    if (!DEV_MODE && !(global as any).forceDevMode) {
      this.log('⚠️ getSimulatedEmails só está disponível em modo de desenvolvimento');
      return [];
    }
    return [...this.simulatedEmails];
  }
  
  /**
   * Limpa os emails simulados (apenas para modo de desenvolvimento)
   */
  public clearSimulatedEmails(): void {
    if (!DEV_MODE && !(global as any).forceDevMode) {
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
      
      return { success: result.success };
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de verificação para ${email}: ${error instanceof Error ? error.message : String(error)}`);
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
   * @param data Dados para o template do email
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendPasswordResetEmail(email: string, data: {userName: string, resetUrl: string}): Promise<boolean> {
    try {
      // Gerar um ID único para rastreamento da solicitação
      const requestId = createHash('md5').update(`${email}-${Date.now()}`).digest('hex').substring(0, 8);
      
      this.log(`📧 [ID:${requestId}] Preparando e-mail de redefinição de senha para ${email} usando remetente de suporte`);
      
      // Adicionar parâmetro de rastreamento ao URL para debug
      const resetUrlWithTracking = `${data.resetUrl}&_debugid=${requestId}`;
      
      const htmlContent = `
        <html>
          <body>
            <h1>Olá ${data.userName},</h1>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <!-- Link direto com ID de rastreamento para diagnóstico -->
            <a href="${resetUrlWithTracking}" style="padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Redefinir Senha</a>
            <p>Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:</p>
            <p style="word-break: break-all; font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrlWithTracking}</p>
            <p>Este link expira em 1 hora.</p>
            <p>Se você não solicitou esta mudança, por favor ignore este e-mail.</p>
            <p>Atenciosamente,<br>Equipe Design Auto</p>
          </body>
        </html>
      `;
      
      // Criar versão em texto plano explícita para garantir que os links funcionem
      const textContent = `
Olá ${data.userName},

Recebemos uma solicitação para redefinir sua senha.

Para criar uma nova senha, acesse o link abaixo:
${resetUrlWithTracking}

Este link expira em 1 hora.

Se você não solicitou esta mudança, por favor ignore este e-mail.

Atenciosamente,
Equipe Design Auto
      `;
      
      // Usar explicitamente o remetente de suporte para senhas
      const supportSender = SENDERS.suporte;
      const subject = 'Redefinição de Senha - Design Auto';
      
      this.log(`📧 [ID:${requestId}] Enviando e-mail para ${email} com URL de redefinição`);
      
      const result = await this.sendBrevoEmail(
        supportSender, 
        [{ email, name: data.userName }], 
        subject, 
        htmlContent,
        textContent
      );
      
      if (result.success) {
        this.log(`✅ [ID:${requestId}] E-mail de redefinição de senha enviado com sucesso de ${supportSender.email}: ${result.messageId}`);
        // Registrar o URL de redefinição no log para diagnóstico
        this.log(`🔗 [ID:${requestId}] URL de redefinição: ${resetUrlWithTracking}`);
      } else {
        this.log(`❌ [ID:${requestId}] Falha ao enviar e-mail de redefinição de senha para ${email}`);
      }
      
      return result.success;
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de redefinição de senha para ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Envia um e-mail de confirmação de alteração de senha
   * @param email Email do destinatário
   * @param data Dados para o template do email
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendPasswordChangeConfirmationEmail(email: string, data: {userName: string}): Promise<boolean> {
    try {
      this.log(`📧 Preparando e-mail de confirmação de alteração de senha para ${email}`);
      
      const htmlContent = `
        <html>
          <body>
            <h1>Olá ${data.userName},</h1>
            <p>Sua senha foi alterada com sucesso.</p>
            <p>Se você não realizou esta alteração, entre em contato imediatamente com nosso suporte.</p>
            <p>Atenciosamente,<br>Equipe Design Auto</p>
          </body>
        </html>
      `;
      
      // Usar remetente de suporte para notificações de segurança
      const supportSender = SENDERS.suporte;
      const subject = 'Confirmação de Alteração de Senha - Design Auto';
      
      const result = await this.sendBrevoEmail(
        supportSender, 
        [{ email, name: data.userName }], 
        subject, 
        htmlContent
      );
      
      if (result.success) {
        this.log(`✅ E-mail de confirmação de alteração de senha enviado com sucesso de ${supportSender.email}: ${result.messageId}`);
      } else {
        this.log(`❌ Falha ao enviar e-mail de confirmação de alteração de senha para ${email}`);
      }
      
      return result.success;
    } catch (error) {
      this.log(`❌ Erro ao enviar e-mail de confirmação de alteração de senha para ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

// Instância única para o serviço de e-mail
export const emailService = new EmailService();