import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { emailService } from '../services/email-service';

export const emailDiagnosticsRouter = Router();

// Schema para validação do corpo da requisição de diagnóstico
const SendTestEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(3),
  html: z.string().optional(),
  text: z.string().optional(),
});

// Middleware de autenticação para rotas administrativas
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }
  
  // Verificar se o usuário tem permissão de administrador
  const user = req.user as any;
  if (!user || !user.nivelacesso || !['admin', 'superadmin'].includes(user.nivelacesso)) {
    return res.status(403).json({ success: false, message: 'Acesso negado: Permissão de administrador necessária' });
  }
  
  next();
}

/**
 * Rota para testar envio direto de email com diagnóstico detalhado
 * Acesso: Apenas administradores
 */
emailDiagnosticsRouter.post('/send-test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const validationResult = SendTestEmailSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.format()
      });
    }
    
    const { to, subject, html, text } = validationResult.data;
    
    // Registrar detalhes da solicitação
    console.log(`[EmailDiagnostics] Teste iniciado por administrador ID: ${(req.user as any).id}`);
    console.log(`[EmailDiagnostics] Enviando para: ${to}, assunto: ${subject}`);
    
    // Enviar email de teste usando o serviço
    const result = await emailService.sendDirectEmail({
      to,
      subject,
      html: html || `<html><body><h1>Teste do serviço de email</h1><p>Este é um email de teste enviado às ${new Date().toLocaleString()}</p><p>Testando envio de email via Brevo API.</p></body></html>`,
      text: text
    });
    
    if (result.success) {
      console.log(`[EmailDiagnostics] Teste enviado com sucesso: ${result.messageId}`);
      return res.status(200).json({
        success: true,
        message: 'Email de teste enviado com sucesso',
        messageId: result.messageId
      });
    } else {
      console.log(`[EmailDiagnostics] Falha no teste: ${result.error}`);
      return res.status(500).json({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: result.error
      });
    }
  } catch (error) {
    console.error('[EmailDiagnostics] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar requisição',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter logs do serviço de email
 * Acesso: Apenas administradores
 */
emailDiagnosticsRouter.get('/logs', requireAdmin, (req: Request, res: Response) => {
  try {
    const logs = emailService.getLogs();
    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('[EmailDiagnostics] Erro ao obter logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter logs',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para limpar logs do serviço de email
 * Acesso: Apenas administradores
 */
emailDiagnosticsRouter.post('/clear-logs', requireAdmin, (req: Request, res: Response) => {
  try {
    emailService.clearLogs();
    return res.status(200).json({
      success: true,
      message: 'Logs limpos com sucesso'
    });
  } catch (error) {
    console.error('[EmailDiagnostics] Erro ao limpar logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar logs',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter emails simulados (apenas em ambiente de desenvolvimento)
 * Acesso: Apenas administradores
 */
emailDiagnosticsRouter.get('/simulated-emails', requireAdmin, (req: Request, res: Response) => {
  try {
    const simulatedEmails = emailService.getSimulatedEmails();
    return res.status(200).json({
      success: true,
      emails: simulatedEmails
    });
  } catch (error) {
    console.error('[EmailDiagnostics] Erro ao obter emails simulados:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter emails simulados',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para limpar emails simulados (apenas em ambiente de desenvolvimento)
 * Acesso: Apenas administradores
 */
emailDiagnosticsRouter.post('/clear-simulated-emails', requireAdmin, (req: Request, res: Response) => {
  try {
    emailService.clearSimulatedEmails();
    return res.status(200).json({
      success: true,
      message: 'Emails simulados limpos com sucesso'
    });
  } catch (error) {
    console.error('[EmailDiagnostics] Erro ao limpar emails simulados:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar emails simulados',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para testar especificamente o processo de redefinição de senha
 * Acesso: Apenas administradores
 */
emailDiagnosticsRouter.post('/test-password-reset', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }
    
    // Gerar um link de redefinição de testes
    const testResetUrl = `https://design-auto-hub-1-appdesignauto.replit.app/password/reset?token=test-token-${Date.now()}`;
    
    // Enviar o email de teste
    const result = await emailService.sendPasswordResetEmail(email, {
      userName: 'Usuário de Teste',
      resetUrl: testResetUrl
    });
    
    if (result) {
      return res.status(200).json({
        success: true,
        message: 'Email de redefinição de senha de teste enviado com sucesso',
        resetUrl: testResetUrl
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Falha ao enviar email de redefinição de senha de teste'
      });
    }
  } catch (error) {
    console.error('[EmailDiagnostics] Erro ao testar redefinição de senha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar redefinição de senha',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para verificar status do serviço de email
 * Acesso: Apenas administradores
 */
emailDiagnosticsRouter.get('/status', requireAdmin, (req: Request, res: Response) => {
  try {
    // Obter chave da API do ambiente (sem expor os caracteres reais)
    const apiKey = process.env.BREVO_API_KEY;
    const apiKeyStatus = apiKey 
      ? `Configurada (${apiKey.length} caracteres, inicia com ${apiKey.substring(0, 3)}...)` 
      : 'Não configurada';
    
    // Verificar modo de operação (desenvolvimento vs produção)
    const devMode = (global as any).forceDevMode || false;
    
    return res.status(200).json({
      success: true,
      status: {
        apiKeyStatus,
        mode: devMode ? 'Desenvolvimento (simulação)' : 'Produção',
        environment: process.env.NODE_ENV || 'development',
        timestamps: {
          serverTime: new Date().toISOString(),
          localTime: new Date().toString()
        }
      }
    });
  } catch (error) {
    console.error('[EmailDiagnostics] Erro ao obter status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter status do serviço de email',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});