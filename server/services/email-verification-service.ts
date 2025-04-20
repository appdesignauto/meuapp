import { db } from "../db";
import { sql } from "drizzle-orm";
import { randomInt } from "crypto";
import { emailService } from "./email-service";
import { pgTable, serial, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Esquema da tabela de códigos de verificação
export const emailVerificationCodes = pgTable("emailVerificationCodes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: integer("used").notNull().default(0),
});

export class EmailVerificationService {
  private CODE_EXPIRATION_HOURS = 24; // Código válido por 24 horas

  /**
   * Verifica se existe um código de verificação pendente para o usuário
   */
  async hasPendingVerificationCode(userId: number): Promise<boolean> {
    const now = new Date();
    
    // Buscar códigos válidos e não utilizados
    const results = await db
      .select()
      .from(emailVerificationCodes)
      .where(sql`${emailVerificationCodes.userId} = ${userId} AND 
               ${emailVerificationCodes.expiresAt} > ${now} AND 
               ${emailVerificationCodes.used} = 0`);
    
    return results.length > 0;
  }

  /**
   * Gera e envia um código de verificação para o e-mail do usuário
   */
  async sendVerificationCode(userId: number, email: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Verificar se já existe um código pendente
      const hasPending = await this.hasPendingVerificationCode(userId);
      
      // Se já existir, inative-o (marque como usado) antes de criar um novo
      if (hasPending) {
        await db
          .update(emailVerificationCodes)
          .set({ used: 1 })
          .where(sql`${emailVerificationCodes.userId} = ${userId} AND ${emailVerificationCodes.used} = 0`);
      }
      
      // Gerar código de 6 dígitos
      const code = randomInt(100000, 999999).toString();
      
      // Calcular data de expiração (24 horas a partir de agora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.CODE_EXPIRATION_HOURS);
      
      // Salvar o código no banco de dados
      await db.insert(emailVerificationCodes).values({
        userId,
        email,
        code,
        expiresAt,
        createdAt: new Date(),
        used: 0
      });
      
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
      const results = await db
        .select()
        .from(emailVerificationCodes)
        .where(sql`${emailVerificationCodes.userId} = ${userId} AND 
                 ${emailVerificationCodes.code} = ${code} AND 
                 ${emailVerificationCodes.expiresAt} > ${now} AND 
                 ${emailVerificationCodes.used} = 0`);
      
      if (results.length === 0) {
        return { 
          success: false, 
          message: "Código inválido ou expirado. Verifique o código ou solicite um novo." 
        };
      }
      
      // Marcar o código como utilizado
      await db
        .update(emailVerificationCodes)
        .set({ used: 1 })
        .where(sql`${emailVerificationCodes.id} = ${results[0].id}`);
      
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