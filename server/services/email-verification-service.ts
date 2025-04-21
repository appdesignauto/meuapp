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
      console.log(`[EmailVerificationService] Iniciando envio de código para usuário ID=${userId}, email=${email}`);
      
      // Verificar se já existe um código pendente
      const hasPending = await this.hasPendingVerificationCode(userId);
      console.log(`[EmailVerificationService] Usuário ${userId} já possui código pendente? ${hasPending}`);
      
      // Se já existir, inative-o antes de criar um novo
      if (hasPending) {
        console.log(`[EmailVerificationService] Inativando códigos anteriores para usuário ${userId}`);
        const now = new Date();
        try {
          await db.execute(sql`
            UPDATE "emailVerificationCodes"
            SET "isUsed" = true, "usedAt" = ${now}
            WHERE "userId" = ${userId} AND "isUsed" = false
          `);
          console.log(`[EmailVerificationService] Códigos anteriores inativados com sucesso para usuário ${userId}`);
        } catch (updateError) {
          console.error(`[EmailVerificationService] Erro ao inativar códigos anteriores:`, updateError);
        }
      }
      
      // Gerar código de 6 dígitos
      const code = randomInt(100000, 999999).toString();
      console.log(`[EmailVerificationService] Código gerado para usuário ${userId}: ${code}`);
      
      // Calcular data de expiração (24 horas a partir de agora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.CODE_EXPIRATION_HOURS);
      const createdAt = new Date();
      
      console.log(`[EmailVerificationService] Tentando salvar código no banco para usuário ${userId}`);
      try {
        // Salvar o código no banco de dados
        await db.execute(sql`
          INSERT INTO "emailVerificationCodes" 
          ("userId", "email", "code", "expiresAt", "createdAt", "isUsed")
          VALUES (${userId}, ${email}, ${code}, ${expiresAt}, ${createdAt}, false)
        `);
        console.log(`[EmailVerificationService] Código salvo com sucesso no banco para usuário ${userId}`);
      } catch (error) {
        const insertError = error as Error;
        console.error(`[EmailVerificationService] ERRO AO INSERIR CÓDIGO NO BANCO:`, insertError);
        throw new Error(`Falha ao salvar código de verificação: ${insertError.message || 'Erro desconhecido'}`);
      }
      
      console.log(`[EmailVerificationService] Iniciando envio de email de verificação para ${email} com código ${code}`);
      // Enviar o e-mail de verificação com o código gerado
      const result = await emailService.sendEmailVerification(email, code);
      console.log(`[EmailVerificationService] Resultado do envio de email: ${JSON.stringify(result)}`);
      
      if (!result.success) {
        console.error(`[EmailVerificationService] Falha no envio de email para ${email}`);
        return { 
          success: false, 
          message: "Falha ao enviar e-mail de verificação. Tente novamente mais tarde." 
        };
      }
      
      console.log(`[EmailVerificationService] Código de verificação enviado com sucesso para usuário ${userId}`);
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
      // Normalize o código removendo espaços
      const normalizedCode = code.trim();
      
      if (!normalizedCode) {
        return { 
          success: false, 
          message: "Código não fornecido. Por favor, insira o código de verificação." 
        };
      }
      
      console.log(`[EmailVerificationService] Verificando código para usuário ${userId}. Código fornecido: ${normalizedCode}`);
      
      const now = new Date();
      
      // Primeiro busque todos os códigos do usuário para fins de depuração
      const allCodes = await db.execute(sql`
        SELECT * FROM "emailVerificationCodes"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
      `);
      
      console.log(`[EmailVerificationService] Encontrados ${allCodes.rows.length} códigos para o usuário ${userId}`);
      
      // Agora busque o código específico
      const results = await db.execute(sql`
        SELECT * FROM "emailVerificationCodes"
        WHERE "userId" = ${userId}
        AND "code" = ${normalizedCode}
        AND "expiresAt" > ${now}
        AND "isUsed" = false
      `);
      
      if (results.rows.length === 0) {
        // Verificar se o código existe, mas expirou
        const expiredResults = await db.execute(sql`
          SELECT * FROM "emailVerificationCodes"
          WHERE "userId" = ${userId}
          AND "code" = ${normalizedCode}
          AND "expiresAt" <= ${now}
          AND "isUsed" = false
        `);
        
        if (expiredResults.rows.length > 0) {
          return { 
            success: false, 
            message: "Código expirado. Por favor, solicite um novo código." 
          };
        }
        
        // Verificar se o código já foi usado
        const usedResults = await db.execute(sql`
          SELECT * FROM "emailVerificationCodes"
          WHERE "userId" = ${userId}
          AND "code" = ${normalizedCode}
          AND "isUsed" = true
        `);
        
        if (usedResults.rows.length > 0) {
          return { 
            success: false, 
            message: "Este código já foi utilizado. Por favor, solicite um novo." 
          };
        }
        
        // Verificar se existe qualquer código para este usuário
        if (allCodes.rows.length > 0) {
          // Verificando o tipo e garantindo que `code` existe e é uma string
          const lastCodeRow = allCodes.rows[0];
          if (lastCodeRow && typeof lastCodeRow === 'object' && 'code' in lastCodeRow && typeof lastCodeRow.code === 'string') {
            const lastCode = lastCodeRow.code;
            // Não mostramos o código completo por segurança
            const lastCodeMasked = lastCode.substring(0, 2) + '****';
            
            return { 
              success: false, 
              message: `Código inválido. O último código enviado começa com ${lastCodeMasked}. Verifique seu email mais recente.` 
            };
          }
          
          // Caso não consiga obter o código corretamente
          return { 
            success: false, 
            message: `Código inválido. Verifique o código ou solicite um novo.` 
          };
        }
        
        return { 
          success: false, 
          message: "Código inválido. Verifique o código ou solicite um novo." 
        };
      }
      
      // Marcar o código como utilizado
      const usedAt = new Date();
      const resultRow = results.rows[0];
      
      if (resultRow && typeof resultRow === 'object' && 'id' in resultRow) {
        await db.execute(sql`
          UPDATE "emailVerificationCodes"
          SET "isUsed" = true, "usedAt" = ${usedAt}
          WHERE "id" = ${resultRow.id}
        `);
      } else {
        console.error("[EmailVerificationService] Erro ao marcar código como utilizado: id não encontrado.");
        throw new Error("Código encontrado, mas estrutura de dados inconsistente.");
      }
      
      console.log(`[EmailVerificationService] Código ${normalizedCode} verificado com sucesso para o usuário ${userId}`);
      
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