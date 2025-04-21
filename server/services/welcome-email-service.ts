import { emailService } from './email-service';

/**
 * Serviço responsável pelo envio de emails de boas-vindas para novos usuários
 */
export class WelcomeEmailService {
  private static instance: WelcomeEmailService;

  private constructor() {
    // Nada a inicializar aqui, usaremos o emailService global
  }

  /**
   * Obtém a instância singleton do serviço
   */
  public static getInstance(): WelcomeEmailService {
    if (!WelcomeEmailService.instance) {
      WelcomeEmailService.instance = new WelcomeEmailService();
    }
    return WelcomeEmailService.instance;
  }

  /**
   * Envia um email de boas-vindas para um novo usuário
   */
  public async sendWelcomeEmail(userId: number, email: string, name: string | null): Promise<{ success: boolean; message?: string }> {
    try {
      if (!email) {
        console.error(`[WelcomeEmail] Email não especificado para usuário ${userId}`);
        return { success: false, message: 'Email não especificado' };
      }

      const userName = name || email.split('@')[0];
      
      // Criar uma mensagem de boas-vindas com informações úteis
      const subject = 'Bem-vindo ao DesignAuto!';
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${process.env.APP_URL || 'https://designauto.app'}/images/logos/logo_1744786583884.png" alt="DesignAuto Logo" style="max-width: 200px;">
          </div>
          
          <h1 style="color: #0066CC; margin-bottom: 20px; font-size: 24px;">Olá, ${userName}!</h1>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
            Seja bem-vindo(a) ao <strong>DesignAuto</strong>, a plataforma definitiva para artes automotivas!
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
            Estamos felizes em tê-lo(a) conosco. Sua conta já está ativa e você pode começar a utilizar nossa plataforma imediatamente.
          </p>
          
          <h2 style="color: #0066CC; margin: 30px 0 15px; font-size: 20px;">O que você pode fazer agora:</h2>
          
          <ul style="font-size: 16px; line-height: 1.6; margin-bottom: 25px; padding-left: 20px;">
            <li>Explorar nossa biblioteca com mais de 3.000 artes para o segmento automotivo</li>
            <li>Personalizar as artes usando Canva e Google Docs</li>
            <li>Salvar suas artes favoritas para uso posterior</li>
            <li>Atualizar seu perfil com suas informações</li>
          </ul>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #0066CC; padding: 15px; margin: 30px 0; font-size: 16px;">
            <p style="margin: 0 0 10px 0;"><strong>Dica:</strong> No plano gratuito, você tem acesso limitado às nossas artes.</p>
            <p style="margin: 0;">Considere fazer um upgrade para um plano premium para desbloquear todos os recursos!</p>
          </div>
          
          <div style="text-align: center; margin: 40px 0 30px;">
            <a href="${process.env.APP_URL || 'https://designauto.app'}" style="background-color: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">Acessar Minha Conta</a>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5;">
            Caso tenha alguma dúvida, estamos à disposição para ajudá-lo(a).
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Atenciosamente,<br>
            <strong>Equipe DesignAuto</strong>
          </p>
          
          <div style="border-top: 1px solid #eeeeee; padding-top: 20px; font-size: 12px; color: #666666; text-align: center;">
            <p>
              Este email foi enviado para ${email}.<br>
              © ${new Date().getFullYear()} DesignAuto. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `;
      
      // Enviar o email usando o serviço de email
      // Como esse é um email de boas-vindas, vamos usar uma forma 
      // mais direta que não filtra por dispositivo e nem adiciona 
      // códigos de verificação
      const supportSender = { 
        name: 'Design Auto', 
        email: 'contato@designauto.com.br' 
      };
      
      const result = await emailService.sendBrevoEmail(
        supportSender,
        [{ email, name: userName }],
        subject,
        htmlContent,
        false, // não é dispositivo móvel
        true   // alta prioridade para email de boas-vindas
      );
      
      if (result.success) {
        console.log(`[WelcomeEmail] Email de boas-vindas enviado com sucesso para ${email} (Usuário: ${userId})`);
        return { success: true };
      } else {
        console.error(`[WelcomeEmail] Falha ao enviar email de boas-vindas para ${email}:`, result.error);
        return { success: false, message: result.error || 'Erro ao enviar email de boas-vindas' };
      }
    } catch (error) {
      console.error(`[WelcomeEmail] Erro ao processar email de boas-vindas para ${email}:`, error);
      return { success: false, message: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}