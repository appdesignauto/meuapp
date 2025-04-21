import { db } from "../db";
import { sql } from "drizzle-orm";
import { randomInt } from "crypto";
import { emailService } from "./email-service";

export class EmailVerificationService {
  private CODE_EXPIRATION_HOURS = 24; // Código válido por 24 horas
  
  // Instância única para ser usada em toda a aplicação
  private static instance: EmailVerificationService;
  
  // Método para obter a instância única
  public static getInstance(): EmailVerificationService {
    if (!EmailVerificationService.instance) {
      EmailVerificationService.instance = new EmailVerificationService();
    }
    return EmailVerificationService.instance;
  }

  /**
   * Verifica se existe um código de verificação pendente para o usuário
   */
  async hasPendingVerificationCode(userId: number): Promise<boolean> {
    const now = new Date();
    
    // Buscar códigos válidos e não utilizados
    const results = await db.execute(sql`
      SELECT * FROM "emailVerificationCodes" 
      WHERE "userId" = ${userId} 
      AND "expiresAt" > ${now} 
      AND "isUsed" = false
    `);
    
    return results.rows.length > 0;
  }

  /**
   * Gera e envia um código de verificação para o e-mail do usuário
   */
  async sendVerificationCode(userId: number, email: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Verificar se já existe um código pendente
      const hasPending = await this.hasPendingVerificationCode(userId);
      
      // Se já existir, inative-o antes de criar um novo
      if (hasPending) {
        const now = new Date();
        await db.execute(sql`
          UPDATE "emailVerificationCodes"
          SET "isUsed" = true, "usedAt" = ${now}
          WHERE "userId" = ${userId} AND "isUsed" = false
        `);
      }
      
      // Gerar código de 6 dígitos
      const code = randomInt(100000, 999999).toString();
      
      // Calcular data de expiração (24 horas a partir de agora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.CODE_EXPIRATION_HOURS);
      const createdAt = new Date();
      
      // Salvar o código no banco de dados
      await db.execute(sql`
        INSERT INTO "emailVerificationCodes" 
        ("userId", "email", "code", "expiresAt", "createdAt", "isUsed")
        VALUES (${userId}, ${email}, ${code}, ${expiresAt}, ${createdAt}, false)
      `);
      
      // Enviar o e-mail de verificação com o código gerado
      const result = await emailService.sendEmailVerification(email, code);
      
      if (!result.success) {
        return { 
          success: false, 
          message: "Falha ao enviar e-mail de verificação. Tente novamente mais tarde." 
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error("[EmailVerificationService] Erro ao enviar código:", error);
      return { 
        success: false, 
        message: "Erro ao gerar código de verificação. Tente novamente mais tarde." 
      };
    }
  }

  /**
   * Verifica o código informado pelo usuário
   */
  async verifyCode(userId: number, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      const now = new Date();
      
      // Buscar o código de verificação do usuário que ainda é válido
      const results = await db.execute(sql`
        SELECT * FROM "emailVerificationCodes"
        WHERE "userId" = ${userId}
        AND "code" = ${code}
        AND "expiresAt" > ${now}
        AND "isUsed" = false
      `);
      
      if (results.rows.length === 0) {
        return { 
          success: false, 
          message: "Código inválido ou expirado. Verifique o código ou solicite um novo." 
        };
      }
      
      // Marcar o código como utilizado
      const usedAt = new Date();
      await db.execute(sql`
        UPDATE "emailVerificationCodes"
        SET "isUsed" = true, "usedAt" = ${usedAt}
        WHERE "id" = ${results.rows[0].id}
      `);
      
      return { success: true };
    } catch (error) {
      console.error("[EmailVerificationService] Erro ao verificar código:", error);
      return { 
        success: false, 
        message: "Erro ao verificar código. Tente novamente mais tarde." 
      };
    }
  }
}