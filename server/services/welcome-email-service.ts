import { emailService } from './email-service';

/**
 * Serviço para enviar emails de boas-vindas aos novos usuários
 */
class WelcomeEmailService {
  /**
   * Envia um email de boas-vindas para o usuário recém-registrado
   * @param email Email do usuário
   * @param name Nome do usuário
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 3px solid #4285f4;">
              <img src="https://designauto.com.br/images/logos/logo_1744762344394.png" alt="Design Auto Logo" style="max-width: 200px; margin-bottom: 10px;">
            </div>
            
            <div style="padding: 20px;">
              <h1 style="color: #4285f4; margin-bottom: 20px;">Bem-vindo ao Design Auto!</h1>
              
              <p>Olá <strong>${name || 'Cliente'}</strong>,</p>
              
              <p>Estamos felizes em tê-lo como parte da comunidade Design Auto! Seu cadastro foi realizado com sucesso.</p>
              
              <p>Com o Design Auto, você tem acesso a:</p>
              
              <ul style="margin-bottom: 20px;">
                <li>Mais de 3.000 designs automotivos editáveis</li>
                <li>Templates para diversas categorias (vendas, oficinas, lavagens e mais)</li>
                <li>Acesso instantâneo para edição no Canva</li>
                <li>Atualizações constantes com novos designs</li>
              </ul>
              
              <div style="background-color: #f0f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p><strong>Precisa de ajuda?</strong></p>
                <p>Estamos disponíveis para ajudá-lo em qualquer dúvida. Entre em contato pelo WhatsApp ou pelo email <a href="mailto:contato@designauto.com.br" style="color: #4285f4;">contato@designauto.com.br</a>.</p>
              </div>
              
              <p>Esperamos que aproveite ao máximo nossa plataforma!</p>
              
              <p>Atenciosamente,<br>Equipe Design Auto</p>
            </div>
            
            <div style="background-color: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} Design Auto - Todos os direitos reservados</p>
              <p>Este email foi enviado para ${email} porque você se cadastrou em nossa plataforma.</p>
            </div>
          </body>
        </html>
      `;
      
      const subject = "Bem-vindo ao Design Auto! 🚗✨";
      
      // Chamar o serviço de email com o conteúdo HTML e assunto personalizados
      // Usar o método específico para envio de email de boas-vindas
      const result = await emailService.sendWelcomeEmail(email, name || email.split('@')[0]);
      
      return result.success;
      
    } catch (error) {
      console.error(`[WelcomeEmailService] Erro ao enviar email de boas-vindas para ${email}:`, error);
      return false;
    }
  }
}

// Instância única para o serviço de email de boas-vindas
export const welcomeEmailService = new WelcomeEmailService();