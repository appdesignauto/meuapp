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
    return randomBytes(32).toString('hex');
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
      // Usar "localhost:5000" para desenvolvimento, mas obter a URL real da requisição para produção
      // No Replit, será o domínio do projeto
      let baseUrl = 'http://localhost:5000';
      
      // Força usar URL estática para o Replit - domínio oficial da aplicação
      baseUrl = 'https://design-auto-hub-1-appdesignauto.replit.app';
      
      // Caminho direto para a página de reset
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      
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
      // Busca usuário com o token fornecido e que ainda não expirou
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetpasswordtoken, token));

      if (!user) {
        return { 
          success: false, 
          message: 'Token inválido ou expirado. Solicite um novo link de redefinição de senha.'
        };
      }

      // Verifica se o token ainda é válido
      if (user.resetpasswordexpires && new Date() > new Date(user.resetpasswordexpires)) {
        return { 
          success: false, 
          message: 'O link de redefinição de senha expirou. Solicite um novo.'
        };
      }

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