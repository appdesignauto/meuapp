import { db } from '../db';
import { randomBytes } from 'crypto';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { emailService } from './email-service';
import { hashPassword } from '../auth-utils';

export class PasswordResetService {
  constructor() {
    // Não é necessário inicializar o emailService aqui, pois é uma instância global
  }

  /**
   * Gera um token de redefinição de senha único
   * @returns Token de redefinição
   */
  private generateToken(): string {
    // Gera token hexadecimal único
    const tokenBase = randomBytes(32).toString('hex');
    
    // Adiciona timestamp para diagnóstico e rastreamento
    const timestamp = Date.now();
    
    // Concatena para ter um token com timestamp embutido (útil para diagnóstico)
    return `${tokenBase}.${timestamp}`;
  }

  /**
   * Cria um token de redefinição de senha para um usuário
   * @param email Email do usuário
   * @returns Sucesso da operação e mensagens
   */
  async createResetToken(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verifica se o usuário existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        // Por segurança, não informamos que o email não existe
        return { 
          success: true, 
          message: 'Se o email estiver cadastrado, você receberá um link para redefinir a senha'
        };
      }

      // Gera token único
      const token = this.generateToken();
      
      // Data de expiração (1 hora a partir de agora)
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);

      // Atualiza o token de redefinição de senha do usuário
      await db
        .update(users)
        .set({
          resetpasswordtoken: token,
          resetpasswordexpires: expiration
        })
        .where(eq(users.id, user.id));

      // Envia email com o link de redefinição
      // Usar o domínio correto baseado no ambiente (desenvolvimento ou produção)
      // Em desenvolvimento: localhost; Em produção: URL do Replit
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://design-auto-hub-1-appdesignauto.replit.app'
        : 'http://localhost:5000';
      
      // Extrair o timestamp do token para diagnóstico
      const tokenParts = token.split('.');
      const tokenTimestamp = tokenParts.length > 1 ? tokenParts[1] : 'unknown';
      
      console.log(`[PasswordResetService] Gerando link de redefinição com base URL: ${baseUrl}`);
      console.log(`[PasswordResetService] Token gerado em: ${new Date(parseInt(tokenTimestamp) || Date.now()).toISOString()}`);
      
      // Caminho direto para a página de reset
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      
      // Registrar detalhes da solicitação para diagnóstico
      console.log(`[PasswordResetService] Solicitação de redefinição para usuário ID: ${user.id}, email: ${user.email}`);
      console.log(`[PasswordResetService] Token expira em: ${expiration.toISOString()}`);
      
      await emailService.sendPasswordResetEmail(user.email, {
        userName: user.name || user.username,
        resetUrl
      });

      return { 
        success: true, 
        message: 'Um email com instruções para redefinir sua senha foi enviado'
      };
    } catch (error) {
      console.error('Erro ao criar token de redefinição:', error);
      return { 
        success: false, 
        message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.'
      };
    }
  }

  /**
   * Redefine a senha de um usuário usando um token válido
   * @param token Token de redefinição
   * @param newPassword Nova senha
   * @returns Sucesso da operação e mensagens
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Extrair metadados do token para diagnóstico
      const tokenParts = token.split('.');
      const tokenBase = tokenParts[0] || token;
      const tokenTimestamp = tokenParts[1] ? new Date(parseInt(tokenParts[1])).toISOString() : 'unknown';
      
      console.log(`[PasswordResetService] Processando redefinição de senha com token: ${tokenBase.substring(0, 8)}... (gerado em: ${tokenTimestamp})`);
      
      // Extrair parâmetro de debug se presente
      const debugId = token.includes('_debugid=') ? token.split('_debugid=')[1] : 'none';
      if (debugId !== 'none') {
        console.log(`[PasswordResetService] Parâmetro de diagnóstico presente: ${debugId}`);
      }
      
      // Busca usuário com o token fornecido e que ainda não expirou
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetpasswordtoken, token));

      if (!user) {
        console.log(`[PasswordResetService] Token inválido: ${tokenBase.substring(0, 8)}... não encontrado no banco de dados`);
        return { 
          success: false, 
          message: 'Token inválido ou expirado. Solicite um novo link de redefinição de senha.'
        };
      }

      console.log(`[PasswordResetService] Token válido para usuário ID: ${user.id}, email: ${user.email}`);
      
      // Verifica se o token ainda é válido
      if (user.resetpasswordexpires && new Date() > new Date(user.resetpasswordexpires)) {
        console.log(`[PasswordResetService] Token expirado: Expirou em ${new Date(user.resetpasswordexpires).toISOString()}`);
        return { 
          success: false, 
          message: 'O link de redefinição de senha expirou. Solicite um novo.'
        };
      }
      
      console.log(`[PasswordResetService] Token válido e não expirado. Data de expiração: ${new Date(user.resetpasswordexpires || Date.now()).toISOString()}`);
      

      // Gera hash da nova senha
      const hashedPassword = await hashPassword(newPassword);

      // Atualiza a senha e limpa os tokens de redefinição
      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetpasswordtoken: null,
          resetpasswordexpires: null
        })
        .where(eq(users.id, user.id));

      // Envia e-mail de confirmação
      await emailService.sendPasswordChangeConfirmationEmail(user.email, {
        userName: user.name || user.username
      });

      return { 
        success: true, 
        message: 'Senha redefinida com sucesso'
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return { 
        success: false, 
        message: 'Ocorreu um erro ao redefinir sua senha. Tente novamente mais tarde.'
      };
    }
  }
}