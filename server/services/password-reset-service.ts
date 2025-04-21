import { randomBytes } from 'crypto';
import { db } from '../db';
import { passwordResetTokens, users } from '@shared/schema';
import { eq, and, lt, gt } from 'drizzle-orm';
import { emailService } from './email-service';

class PasswordResetService {
  /**
   * Gera um token único para redefinição de senha
   * @returns Token de redefinição
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Cria um token de redefinição de senha para um usuário específico
   * @param userId ID do usuário
   * @param email Email do usuário
   * @returns Objeto com status do processo e mensagem ou token
   */
  public async createResetToken(userId: number, email: string): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      // Verificar e invalidar tokens existentes
      await db
        .update(passwordResetTokens)
        .set({ isUsed: true })
        .where(and(
          eq(passwordResetTokens.userId, userId),
          eq(passwordResetTokens.isUsed, false)
        ));

      // Gerar novo token
      const token = this.generateToken();
      
      // Calcular data de expiração (1 hora no futuro)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Inserir novo token
      await db
        .insert(passwordResetTokens)
        .values({
          userId,
          token,
          expiresAt,
          isUsed: false
        });
      
      return { success: true, token };
    } catch (error) {
      console.error('Erro ao criar token de redefinição de senha:', error);
      return { 
        success: false, 
        message: `Erro ao gerar token: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Envia um email com instruções para redefinição de senha
   * @param email Email do usuário
   * @returns Objeto com status do processo e mensagem
   */
  public async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Procurar usuário pelo email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      // Por segurança, não revelar se o email existe ou não
      if (!user) {
        return { 
          success: true, 
          message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' 
        };
      }
      
      // Gerar token de redefinição
      const resetResult = await this.createResetToken(user.id, email);
      
      if (!resetResult.success || !resetResult.token) {
        return { 
          success: false, 
          message: resetResult.message || 'Erro ao gerar token de redefinição de senha.' 
        };
      }
      
      // Extrair o nome do usuário ou fallback para o nome de usuário
      const name = user.name || user.username;
      
      // Enviar email com instruções de redefinição
      const emailSent = await emailService.sendPasswordResetEmail(email, name, resetResult.token);
      
      if (!emailSent) {
        return { 
          success: false, 
          message: 'Falha ao enviar email de redefinição de senha.' 
        };
      }
      
      return { 
        success: true, 
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' 
      };
    } catch (error) {
      console.error('Erro ao processar solicitação de redefinição de senha:', error);
      return { 
        success: false, 
        message: `Erro ao processar solicitação: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Verifica se um token de redefinição de senha é válido
   * @param token Token a ser verificado
   * @returns Objeto com status de validação e usuário associado (se válido)
   */
  public async validateResetToken(token: string): Promise<{ 
    valid: boolean; 
    userId?: number; 
    message?: string 
  }> {
    try {
      const now = new Date();
      
      // Buscar token não utilizado e não expirado
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.isUsed, false),
          gt(passwordResetTokens.expiresAt, now)
        ));
      
      if (!resetToken) {
        return { 
          valid: false, 
          message: 'Token inválido ou expirado. Por favor, solicite uma nova redefinição de senha.' 
        };
      }
      
      return { valid: true, userId: resetToken.userId };
    } catch (error) {
      console.error('Erro ao validar token de redefinição:', error);
      return { 
        valid: false, 
        message: `Erro ao validar token: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Redefine a senha de um usuário usando um token de redefinição
   * @param token Token de redefinição
   * @param newPassword Nova senha
   * @returns Objeto com status do processo e mensagem
   */
  public async resetPassword(token: string, newPassword: string): Promise<{ 
    success: boolean; 
    message: string 
  }> {
    try {
      // Verificar se o token é válido
      const validation = await this.validateResetToken(token);
      
      if (!validation.valid || !validation.userId) {
        return { 
          success: false, 
          message: validation.message || 'Token inválido ou expirado.' 
        };
      }
      
      // Atualizar a senha do usuário
      await db
        .update(users)
        .set({ password: newPassword })
        .where(eq(users.id, validation.userId));
      
      // Marcar o token como usado
      await db
        .update(passwordResetTokens)
        .set({ 
          isUsed: true,
          usedAt: new Date()
        })
        .where(eq(passwordResetTokens.token, token));
      
      return { 
        success: true, 
        message: 'Senha redefinida com sucesso. Agora você pode fazer login com sua nova senha.' 
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return { 
        success: false, 
        message: `Erro ao redefinir senha: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}

export const passwordResetService = new PasswordResetService();