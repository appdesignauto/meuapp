/**
 * Serviço especializado para tratamento de emails problemáticos
 * Foco principal no caso conhecido do fernando.sim2018@gmail.com
 */

import { emailService } from "./email-service";
import { EmailVerificationService } from "./email-verification-service";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

class SpecialEmailHandler {
  private static instance: SpecialEmailHandler;
  private problematiEmails: string[] = ['fernando.sim2018@gmail.com'];
  
  private constructor() {
    console.log('🔧 Inicializando manipulador de emails especiais');
  }
  
  public static getInstance(): SpecialEmailHandler {
    if (!SpecialEmailHandler.instance) {
      SpecialEmailHandler.instance = new SpecialEmailHandler();
    }
    return SpecialEmailHandler.instance;
  }
  
  /**
   * Verifica se um email está na lista de emails problemáticos conhecidos
   */
  public isProblematicEmail(email: string): boolean {
    return this.problematiEmails.includes(email.toLowerCase());
  }
  
  /**
   * Envia um email de verificação usando técnicas especiais para casos problemáticos
   */
  public async sendSpecialVerificationEmail(email: string): Promise<{success: boolean, code?: string}> {
    console.log(`\n==== TENTATIVA ESPECIAL PARA ${email} ====\n`);
    
    try {
      // Verificar se o usuário existe
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, email));
      
      if (!user) {
        console.log(`❌ Usuário com email ${email} não encontrado`);
        return { success: false };
      }
      
      // Gerar um novo código de verificação
      const emailVerificationService = EmailVerificationService.getInstance();
      const verificationCode = await emailVerificationService.generateVerificationCode(email);
      console.log(`✅ Código especial gerado: ${verificationCode.code}`);
      
      // Preparar conteúdo simplificado para maximizar entrega
      const subject = `Seu código de verificação DesignAuto: ${verificationCode.code}`;
      
      // HTML ultra-simplificado para máxima compatibilidade
      const message = `
        <div style="font-family: Arial, sans-serif;">
          <h2>Seu código de verificação</h2>
          <div style="font-size: 24px; padding: 10px; margin: 15px 0; text-align: center;">
            <b>${verificationCode.code}</b>
          </div>
          <p>Digite este código para verificar sua conta no DesignAuto.</p>
          <p>- Equipe DesignAuto</p>
        </div>
      `;
      
      // Enviar usando todos os métodos possíveis
      console.log(`📧 Tentando múltiplos métodos de envio para garantir entrega...`);
      
      // Método 1: Usando sendSpecialCaseEmail com alta prioridade
      const result1 = await emailService.sendSpecialCaseEmail(email, subject, message, {
        highPriority: true,
        useAlternativeMethod: true,
        isKnownProblematic: true
      });
      
      if (result1.success) {
        console.log(`✅ Método 1 bem-sucedido para ${email}`);
        return { success: true, code: verificationCode.code };
      }
      
      console.log(`⚠️ Método 1 falhou, tentando método 2...`);
      
      // Método 2: Tentativa com outro remetente e outro formato
      const alternativeSubject = `Código ${verificationCode.code} - DesignAuto`;
      const alternativeMessage = `
        <div style="max-width: 500px; margin: 0 auto; font-family: Arial, sans-serif;">
          <p>Olá,</p>
          <p>Seu código de verificação para o DesignAuto é: <strong>${verificationCode.code}</strong></p>
          <p>Este código expira em 24 horas.</p>
          <p>Atenciosamente,<br>Equipe DesignAuto</p>
        </div>
      `;
      
      const result2 = await emailService.sendDiagnosticEmail(email, alternativeSubject, alternativeMessage, {
        highPriority: true,
        bypassFilters: true
      });
      
      if (result2.success) {
        console.log(`✅ Método 2 bem-sucedido para ${email}`);
        return { success: true, code: verificationCode.code };
      }
      
      console.log(`❌ Todos os métodos falharam para ${email}`);
      return { success: false };
      
    } catch (error) {
      console.error(`❌ Erro no tratamento especial para ${email}:`, error);
      return { success: false };
    }
  }
  
  /**
   * Verifica um código de verificação usando método especial
   */
  public async verifyCodeSpecialCase(email: string, code: string): Promise<boolean> {
    try {
      const emailVerificationService = EmailVerificationService.getInstance();
      return await emailVerificationService.verifyCode(email, code);
    } catch (error) {
      console.error(`❌ Erro na verificação especial para ${email}:`, error);
      return false;
    }
  }
}

export const specialEmailHandler = SpecialEmailHandler.getInstance();