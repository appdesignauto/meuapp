import fetch from 'node-fetch';
import { createHash } from 'crypto';
import { getBrazilDateTime, getBrazilISOString } from '../utils/date-utils';

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
    // Usar o utilitário importado para timestamp no timezone do Brasil (UTC-3)
    // Não podemos usar require em módulos ES, portanto o import é feito no topo do arquivo
    const timestamp = getBrazilISOString();
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
  ): Promise<{success: boolean, messageId?: string, error?: string}> {
    try {
      if (!this.initialized) {
        this.log('❌ Serviço não inicializado');
        return { success: false, error: 'Serviço de email não inicializado' };
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
        
        // Utilizando função de data importada no topo do arquivo
        // para timezone do Brasil 
        
        // Armazena o email simulado com data no timezone do Brasil
        const simulatedEmail: SimulatedEmail = {
          from: sender.email,
          to: to[0].email, // Simplifica para o primeiro destinatário
          subject,
          html: htmlContent,
          text: finalTextContent || '', // Usando o texto final processado
          sentAt: getBrazilDateTime() // Data atual no fuso horário do Brasil
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
        return { success: false, error: 'Chave de API Brevo não configurada' };
      }
      
      // Validar o formato do email antes de enviar
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const recipient of to) {
        if (!emailRegex.test(recipient.email)) {
          this.log(`⚠️ Endereço de email inválido: ${recipient.email}`);
          return { success: false, error: `Endereço de email inválido: ${recipient.email}` };
        }
      }
      
      // Registrar comprimento da chave da API para diagnóstico (sem revelar a chave)
      this.log(`🔑 Usando chave Brevo API com ${BREVO_API_KEY.length} caracteres`);
      
      // Log completo do payload sem dados sensíveis para diagnóstico
      const debugPayload = { ...payload };
      if (debugPayload.sender) debugPayload.sender = { ...payload.sender };
      this.log(`📧 Detalhes do email: ${JSON.stringify(debugPayload)}`);
      
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ Erro ao enviar e-mail: ${errorMessage}`);
      return { success: false, error: errorMessage };
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
    // Validar email antes de continuar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.log(`❌ Endereço de email inválido para verificação: ${email}`);
      return { success: false };
    }
    
    // Extrair nome do email para fallback
    const name = email.split('@')[0];
    try {
      this.log(`📧 Preparando e-mail de verificação para ${email} usando remetente de suporte`);
      
      // Gerar um ID único para rastreamento da solicitação de verificação
      const requestId = createHash('md5').update(`${email}-${Date.now()}`).digest('hex').substring(0, 8);
      
      const htmlContent = `
        <html>
          <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 3px solid #4285f4;">
              <img src="https://designauto.com.br/images/logos/logo_1744762344394.png" alt="Design Auto Logo" style="max-width: 200px; margin-bottom: 10px;">
            </div>
            
            <div style="padding: 20px;">
              <h1 style="color: #4285f4;">Olá ${name},</h1>
              <p>Obrigado por se cadastrar no Design Auto!</p>
              <p>Seu código de verificação é:</p>
              
              <div style="margin: 30px 0; text-align: center;">
                <div style="font-size: 24px; padding: 15px; background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px; display: inline-block; letter-spacing: 8px; font-weight: bold; color: #333;">${verificationCode}</div>
              </div>
              
              <p>Este código expira em 24 horas.</p>
              <p><strong>Importante:</strong> Se você não solicitou este código, por favor ignore este e-mail.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #777; font-size: 12px;">Atenciosamente,<br>Equipe Design Auto</p>
              <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">ID da solicitação: ${requestId}</p>
            </div>
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
      // Validar email antes de continuar
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        this.log(`❌ Endereço de email inválido para envio de boas-vindas: ${email}`);
        return false;
      }
      
      // Usar o nome do usuário ou extrair do email como fallback
      const userName = name || email.split('@')[0];
      
      this.log(`📧 Preparando e-mail de boas-vindas para ${email} usando remetente de contato`);
      
      const htmlContent = `
        <html>
          <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 3px solid #4285f4;">
              <img src="https://designauto.com.br/images/logos/logo_1744762344394.png" alt="Design Auto Logo" style="max-width: 200px; margin-bottom: 10px;">
            </div>
            
            <div style="padding: 20px;">
              <h1 style="color: #4285f4;">Bem-vindo ao Design Auto, ${userName}!</h1>
              
              <p>Sua conta foi verificada com sucesso! 🎉</p>
              
              <div style="padding: 15px; background-color: #f5f5f5; border-radius: 4px; margin: 20px 0;">
                <p><strong>Você agora tem acesso a:</strong></p>
                <ul style="margin-top: 10px; padding-left: 20px;">
                  <li>Milhares de designs automotivos prontos para edição</li>
                  <li>Todas as artes disponíveis para seu plano</li>
                  <li>Categorias exclusivas de conteúdo para sua oficina</li>
                </ul>
              </div>
              
              <p>Se tiver qualquer dúvida, entre em contato conosco pelo suporte.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://designauto.com.br" style="padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Acessar Minha Conta</a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #777; font-size: 12px;">Atenciosamente,<br>Equipe Design Auto</p>
            </div>
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
      // Validar email antes de continuar
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        this.log(`❌ Endereço de email inválido para redefinição de senha: ${email}`);
        return false;
      }
      
      // Gerar um ID único para rastreamento da solicitação
      const requestId = createHash('md5').update(`${email}-${Date.now()}`).digest('hex').substring(0, 8);
      
      this.log(`📧 [ID:${requestId}] Preparando e-mail de redefinição de senha para ${email} usando remetente de suporte`);
      
      // Garantir que temos um nome de usuário válido
      const userName = data.userName || email.split('@')[0];
      
      // Verificar o URL de redefinição
      if (!data.resetUrl || !data.resetUrl.includes('token=')) {
        this.log(`❌ [ID:${requestId}] URL de redefinição inválido: ${data.resetUrl}`);
        return false;
      }
      
      // Adicionar parâmetro de rastreamento ao URL para debug
      const resetUrlWithTracking = `${data.resetUrl}&_debugid=${requestId}`;
      
      // Detecção e formatação de URL para diferentes provedores de email
      // URLs mais limpos e compatíveis com clientes de email
      const resetLink = resetUrlWithTracking.replace(/\s+/g, '');
      
      const htmlContent = `
        <html>
          <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 3px solid #4285f4;">
              <img src="https://designauto.com.br/images/logos/logo_1744762344394.png" alt="Design Auto Logo" style="max-width: 200px; margin-bottom: 10px;">
            </div>
            
            <div style="padding: 20px;">
              <h1 style="color: #4285f4;">Olá ${userName},</h1>
              <p>Recebemos uma solicitação para redefinir sua senha.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <!-- Link direto com ID de rastreamento para diagnóstico -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Redefinir Senha</a>
              </div>
              <p>Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:</p>
              <p style="word-break: break-all; font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">${resetLink}</p>
              <p>Este link expira em 1 hora.</p>
              <p><strong>Importante:</strong> Se você não solicitou esta mudança, por favor ignore este e-mail.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #777; font-size: 12px;">Atenciosamente,<br>Equipe Design Auto</p>
            </div>
          </body>
        </html>
      `;
      
      // Criar versão em texto plano explícita para garantir que os links funcionem
      const textContent = `
Olá ${userName},

Recebemos uma solicitação para redefinir sua senha.

Para criar uma nova senha, acesse o link abaixo:
${resetLink}

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
      // Validar email antes de continuar
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        this.log(`❌ Endereço de email inválido para confirmação de alteração: ${email}`);
        return false;
      }
      
      // Garantir que temos um nome de usuário válido
      const userName = data.userName || email.split('@')[0];
      
      // Gerar um ID único para rastreamento da solicitação
      const requestId = createHash('md5').update(`${email}-${Date.now()}`).digest('hex').substring(0, 8);
      
      this.log(`📧 [ID:${requestId}] Preparando e-mail de confirmação de alteração de senha para ${email}`);
      
      const htmlContent = `
        <html>
          <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 3px solid #4285f4;">
              <img src="https://designauto.com.br/images/logos/logo_1744762344394.png" alt="Design Auto Logo" style="max-width: 200px; margin-bottom: 10px;">
            </div>
            
            <div style="padding: 20px;">
              <h1 style="color: #4285f4;">Olá ${userName},</h1>
              
              <p><strong>Sua senha foi alterada com sucesso.</strong></p>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #4285f4; border-radius: 4px;">
                <p>Se você não realizou esta alteração, entre em contato <strong>imediatamente</strong> com nosso suporte.</p>
              </div>
              
              <p>Esta é uma notificação de segurança para garantir que apenas você tenha acesso à sua conta.</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #777; font-size: 12px;">Atenciosamente,<br>Equipe de Segurança<br>Design Auto</p>
              <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">ID da notificação: ${requestId}</p>
            </div>
          </body>
        </html>
      `;
      
      // Versão em texto simples para clientes de email sem suporte a HTML
      const textContent = `
Olá ${userName},

Sua senha foi alterada com sucesso.

IMPORTANTE: Se você não realizou esta alteração, entre em contato imediatamente com nosso suporte.

Esta é uma notificação de segurança para garantir que apenas você tenha acesso à sua conta.

Atenciosamente,
Equipe de Segurança
Design Auto

ID da notificação: ${requestId}
      `;
      
      // Usar remetente de suporte para notificações de segurança
      const supportSender = SENDERS.suporte;
      const subject = 'Confirmação de Alteração de Senha - Design Auto';
      
      const result = await this.sendBrevoEmail(
        supportSender, 
        [{ email, name: userName }], 
        subject, 
        htmlContent,
        textContent
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