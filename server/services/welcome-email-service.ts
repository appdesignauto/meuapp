import fetch from 'node-fetch';

/**
 * Serviço para enviar emails de boas-vindas aos novos usuários
 */
class WelcomeEmailService {
  private readonly BREVO_API_KEY = process.env.BREVO_API_KEY;
  private readonly BREVO_API_URL = 'https://api.brevo.com/v3';
  private initialized = !!process.env.BREVO_API_KEY;
  
  /**
   * Envia um email de boas-vindas para o usuário recém-registrado
   * @param email Email do usuário
   * @param name Nome do usuário
   * @returns Promise<boolean> Indica se o envio foi bem-sucedido
   */
  public async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        console.error('❌ Serviço de email não inicializado (BREVO_API_KEY não configurada)');
        return false;
      }
      
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
              <p>&copy; ${new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getFullYear()} Design Auto - Todos os direitos reservados</p>
              <p>Este email foi enviado para ${email} porque você se cadastrou em nossa plataforma.</p>
            </div>
          </body>
        </html>
      `;
      
      // Converter HTML para texto simples para clientes sem suporte a HTML
      const textContent = htmlContent.replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const subject = "Bem-vindo ao Design Auto! 🚗✨";
      
      // Enviar email diretamente via Brevo API
      if (process.env.NODE_ENV === 'development' && process.env.DEV_MAIL_SIMULATION === 'true') {
        console.log(`🧪 [DEV MODE] Simulando envio de email para ${email}`);
        console.log(`Assunto: ${subject}`);
        console.log(`Conteúdo: Email de boas-vindas para ${name}`);
        return true;
      }
      
      const response = await fetch(`${this.BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.BREVO_API_KEY!
        },
        body: JSON.stringify({
          sender: {
            name: 'Design Auto',
            email: 'contato@designauto.com.br'
          },
          to: [
            {
              email,
              name: name || email.split('@')[0]
            }
          ],
          subject,
          htmlContent,
          textContent
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Email de boas-vindas enviado com sucesso para ${email}: ${data.messageId}`);
        return true;
      } else {
        const errorData = await response.text();
        console.error(`❌ Erro ao enviar email de boas-vindas para ${email}: ${response.status} ${response.statusText} - ${errorData}`);
        return false;
      }
      
    } catch (error) {
      console.error(`[WelcomeEmailService] Erro ao enviar email de boas-vindas para ${email}:`, error);
      return false;
    }
  }
}

// Instância única para o serviço de email de boas-vindas
export const welcomeEmailService = new WelcomeEmailService();