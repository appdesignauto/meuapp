import { db } from '../db';
import { emailVerificationCodes, users } from '@shared/schema';
import { eq, and, lt, or } from 'drizzle-orm';
import { emailService } from './email-service';

const CODE_EXPIRATION_HOURS = 24; // Códigos expiram após 24 horas

class EmailVerificationService {
  /**
   * Gera um código aleatório de 6 dígitos para verificação de e-mail
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Verifica se um código de verificação já existe para o usuário
   * @param userId ID do usuário
   * @returns Booleano indicando se existe código
   */
  private async hasExistingCode(userId: number): Promise<boolean> {
    const existingCodes = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.userId, userId),
          eq(emailVerificationCodes.isUsed, false),
          lt(new Date(), emailVerificationCodes.expiresAt)
        )
      );
    
    return existingCodes.length > 0;
  }

  /**
   * Gera e armazena um novo código de verificação para o usuário
   * @param userId ID do usuário
   * @param email E-mail do usuário
   * @returns O código gerado ou null em caso de erro
   */
  public async createVerificationCode(userId: number, email: string): Promise<string | null> {
    try {
      // Verifica se já existe um código válido
      const hasCode = await this.hasExistingCode(userId);
      if (hasCode) {
        console.log(`Usuário ${userId} já possui um código de verificação válido`);
        const existingCode = await db
          .select()
          .from(emailVerificationCodes)
          .where(
            and(
              eq(emailVerificationCodes.userId, userId),
              eq(emailVerificationCodes.isUsed, false),
              lt(new Date(), emailVerificationCodes.expiresAt)
            )
          )
          .limit(1);
        
        if (existingCode.length > 0) {
          return existingCode[0].code;
        }
      }

      // Gera um novo código
      const code = this.generateVerificationCode();
      
      // Calcula data de expiração (24 horas a partir de agora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + CODE_EXPIRATION_HOURS);
      
      // Insere no banco de dados
      await db.insert(emailVerificationCodes).values({
        userId,
        email,
        code,
        expiresAt,
        isUsed: false
      });
      
      return code;
    } catch (error) {
      console.error(`Erro ao criar código de verificação: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Envia um e-mail com o código de verificação para o usuário
   * @param userId ID do usuário
   * @param email E-mail do usuário
   * @param name Nome do usuário
   * @returns Booleano indicando sucesso ou falha
   */
  public async sendVerificationEmail(userId: number, email: string, name: string): Promise<boolean> {
    try {
      // Gera um novo código de verificação
      const code = await this.createVerificationCode(userId, email);
      if (!code) {
        return false;
      }
      
      // Envia o e-mail com o código
      const success = await emailService.sendVerificationEmail(email, name || 'Usuário', code);
      
      return success;
    } catch (error) {
      console.error(`Erro ao enviar e-mail de verificação: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Verifica se o código fornecido é válido para o usuário
   * @param userId ID do usuário
   * @param code Código de verificação
   * @returns Booleano indicando se o código é válido
   */
  public async verifyCode(userId: number, code: string): Promise<boolean> {
    try {
      // Busca o código de verificação no banco de dados
      const verificationCodes = await db
        .select()
        .from(emailVerificationCodes)
        .where(
          and(
            eq(emailVerificationCodes.userId, userId),
            eq(emailVerificationCodes.code, code),
            eq(emailVerificationCodes.isUsed, false),
            lt(new Date(), emailVerificationCodes.expiresAt)
          )
        );
      
      if (verificationCodes.length === 0) {
        return false;
      }
      
      const verificationCode = verificationCodes[0];
      
      // Marca o código como usado
      await db
        .update(emailVerificationCodes)
        .set({
          isUsed: true,
          usedAt: new Date()
        })
        .where(eq(emailVerificationCodes.id, verificationCode.id));
      
      // Atualiza o status de e-mail verificado do usuário
      await db
        .update(users)
        .set({ emailconfirmed: true })
        .where(eq(users.id, userId));
      
      return true;
    } catch (error) {
      console.error(`Erro ao verificar código: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Limpa códigos de verificação expirados ou já utilizados
   * @returns Número de registros removidos
   */
  public async cleanupExpiredCodes(): Promise<number> {
    try {
      const now = new Date();
      const result = await db
        .delete(emailVerificationCodes)
        .where(
          or(
            lt(emailVerificationCodes.expiresAt, now),
            eq(emailVerificationCodes.isUsed, true)
          )
        );
      
      return result.rowCount || 0;
    } catch (error) {
      console.error(`Erro ao limpar códigos expirados: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }
}

// Instância única para o serviço de verificação de e-mail
export const emailVerificationService = new EmailVerificationService();