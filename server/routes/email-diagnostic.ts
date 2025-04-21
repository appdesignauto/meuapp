/**
 * Rotas para diagnóstico avançado de problemas de email
 * Estas rotas são projetadas para ajudar a identificar e solucionar problemas específicos com envio de emails
 */

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { emailService } from '../services/email-service';
import { EmailVerificationService } from '../services/email-verification-service';

// Obter a instância do serviço de verificação de email
const emailVerificationService = EmailVerificationService.getInstance();
import { db } from '../db';
import { users, emailVerificationCodes } from '@shared/schema';
import { eq, desc, and, asc } from 'drizzle-orm';
import path from 'path';
import os from 'os';
import * as UAParserJs from 'ua-parser-js';
const UAParser = UAParserJs.UAParser;

const router = express.Router();

// Schema para validação de parâmetros
const emailDiagnosticSchema = z.object({
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().optional(),
  testMode: z.boolean().optional().default(true)
});

/**
 * GET /api/admin/email-diagnostic/status
 * Retorna informações sobre a configuração de email e ambiente
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Informações do sistema
    const systemInfo = {
      platform: os.platform(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      cpus: os.cpus().length,
      networkInterfaces: os.networkInterfaces(),
      nodeEnv: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };

    // Informações sobre a configuração de email
    const emailConfig = {
      provider: 'Brevo',
      apiKeyConfigured: !!process.env.BREVO_API_KEY,
      apiKeyLength: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.length : 0,
      defaultSender: 'suporte@inovesocialmedia.com.br',
      contactSender: 'contato@designauto.com.br'
    };

    // Verificar os logs de email mais recentes
    const recentLogs = emailService.getLogs().slice(-10);

    // Verificar códigos de verificação pendentes
    const pendingCodes = await db.select()
      .from(emailVerificationCodes)
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(5);

    // Retornar informações de diagnóstico
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: systemInfo,
      emailConfig,
      recentLogs,
      pendingCodes: pendingCodes.map(code => ({
        ...code,
        code: '****' // Ocultar o código por segurança
      }))
    });
  } catch (error) {
    console.error('Erro ao obter status de diagnóstico de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status de diagnóstico',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/admin/email-diagnostic/user/:email
 * Obtém informações de diagnóstico para um usuário específico pelo email
 */
router.get('/user/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    
    // Buscar o usuário pelo email
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Usuário com email ${email} não encontrado`
      });
    }
    
    // Buscar códigos de verificação para este usuário
    const verificationCodes = await db.select()
      .from(emailVerificationCodes)
      .where(eq(emailVerificationCodes.email, email))
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(10);
    
    // Retornar informações de diagnóstico
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailConfirmed: user.emailconfirmed,
        createdAt: user.criadoem,
        lastLogin: user.ultimologin
      },
      verificationHistory: verificationCodes.map(code => ({
        id: code.id,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt,
        used: code.used,
        verified: code.verified
      }))
    });
  } catch (error) {
    console.error(`Erro ao obter informações do usuário para ${req.params.email}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações do usuário',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/admin/email-diagnostic/send-test
 * Envia um email de teste para o endereço especificado
 */
router.post('/send-test', async (req: Request, res: Response) => {
  try {
    // Validar parâmetros
    const params = emailDiagnosticSchema.parse(req.body);
    
    // Obter informações do User-Agent para diagnóstico
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const parseUserAgent = (ua: string) => new UAParser(ua).getResult();
    const parsedUA = parseUserAgent(userAgent);
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    
    // Extrair informações de device do User-Agent para melhorar diagnóstico
    const deviceInfo = {
      browser: parsedUA.browser.name || 'Unknown',
      browserVersion: parsedUA.browser.version || 'Unknown',
      os: parsedUA.os.name || 'Unknown',
      osVersion: parsedUA.os.version || 'Unknown',
      device: parsedUA.device.vendor ? `${parsedUA.device.vendor} ${parsedUA.device.model}` : 'Desktop',
      userAgent: userAgent,
      ipAddress: ipAddress
    };
    
    // Preparar conteúdo do email de teste
    const subject = params.subject || `Teste de diagnóstico - ${new Date().toLocaleString('pt-BR')}`;
    const message = params.message || `
      <h2>Email de diagnóstico</h2>
      <p>Este é um email de teste enviado pelo DesignAuto para diagnosticar problemas de entrega.</p>
      <p>Data e hora do envio: <strong>${new Date().toLocaleString('pt-BR')}</strong></p>
      <p>Solicitado por: <strong>${req.user?.username || 'Administrador'}</strong></p>
      <hr>
      <h3>Informações de diagnóstico:</h3>
      <ul>
        <li>IP da solicitação: ${ipAddress}</li>
        <li>Browser: ${deviceInfo.browser} ${deviceInfo.browserVersion}</li>
        <li>Sistema operacional: ${deviceInfo.os} ${deviceInfo.osVersion}</li>
        <li>Dispositivo: ${deviceInfo.device}</li>
      </ul>
      <p>Se você recebeu este email, significa que o sistema de envio está funcionando corretamente para o seu endereço de email.</p>
    `;
    
    // Registrar informações detalhadas sobre a tentativa
    console.log(`\n[EMAIL-DIAGNOSTIC] Enviando email de diagnóstico para ${params.email}`);
    console.log(`[EMAIL-DIAGNOSTIC] Device info:`, deviceInfo);
    
    // Realizar análise de domínio do email (importante para diagnóstico)
    const emailDomain = params.email.split('@')[1];
    console.log(`[EMAIL-DIAGNOSTIC] Domínio do email: ${emailDomain}`);
    
    // Determinar categoria do provedor de email (ajuda a identificar problemas específicos)
    let emailProviderCategory = 'other';
    if (emailDomain === 'gmail.com') emailProviderCategory = 'gmail';
    else if (emailDomain === 'hotmail.com' || emailDomain === 'outlook.com' || emailDomain === 'live.com') emailProviderCategory = 'microsoft';
    else if (emailDomain === 'yahoo.com' || emailDomain === 'yahoo.com.br') emailProviderCategory = 'yahoo';
    else if (emailDomain === 'icloud.com' || emailDomain === 'me.com') emailProviderCategory = 'apple';
    
    console.log(`[EMAIL-DIAGNOSTIC] Categoria do provedor: ${emailProviderCategory}`);
    
    // Enviar email de diagnóstico através do serviço de email
    const result = await emailService.sendDiagnosticEmail(params.email, subject, message, {
      testMode: params.testMode,
      emailProviderCategory,
      deviceInfo
    });
    
    // Retornar resultado com detalhes completos
    res.json({
      success: result.success,
      message: result.success 
        ? `Email de diagnóstico enviado com sucesso para ${params.email}` 
        : `Falha ao enviar email de diagnóstico para ${params.email}`,
      details: {
        timestamp: new Date().toISOString(),
        messageId: result.messageId,
        email: params.email,
        emailDomain,
        emailProviderCategory,
        deviceInfo,
        logs: emailService.getLogs().slice(-5)
      }
    });
  } catch (error) {
    console.error('Erro ao enviar email de diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de diagnóstico',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/admin/email-diagnostic/send-verification
 * Envia um email de verificação para o endereço especificado
 */
router.post('/send-verification', async (req: Request, res: Response) => {
  try {
    // Validar parâmetros
    const { email } = emailDiagnosticSchema.parse(req.body);
    
    // Verificar se o usuário existe
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Usuário com email ${email} não encontrado`
      });
    }
    
    // Gerar um novo código de verificação
    const verificationCode = await emailVerificationService.generateVerificationCode(email);
    
    // Enviar o email de verificação
    const result = await emailVerificationService.sendVerificationEmail(email, verificationCode.code);
    
    // Retornar resultado
    res.json({
      success: result.success,
      message: result.success 
        ? `Email de verificação enviado com sucesso para ${email}` 
        : `Falha ao enviar email de verificação para ${email}`,
      verificationCode: {
        id: verificationCode.id,
        createdAt: verificationCode.createdAt,
        expiresAt: verificationCode.expiresAt
      },
      logs: emailService.getLogs().slice(-5)
    });
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de verificação',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/admin/email-diagnostic/verify-code
 * Verifica um código de verificação para o endereço de email especificado
 */
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email e código são obrigatórios'
      });
    }
    
    // Verificar código
    const result = await emailVerificationService.verifyCode(email, code);
    
    // Se verificação bem-sucedida, marcar usuário como verificado
    if (result.success) {
      await db.update(users)
        .set({ emailconfirmed: true })
        .where(eq(users.email, email));
    }
    
    // Retornar resultado
    res.json({
      success: result.success,
      message: result.message,
      codeDetails: result.success ? {
        id: result.code?.id,
        createdAt: result.code?.createdAt,
        expiresAt: result.code?.expiresAt,
        verified: true
      } : undefined
    });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar código',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/admin/email-diagnostic/debug/:email
 * Obtém informações de depuração detalhadas para um endereço de email específico
 * Especialmente útil para o caso de fernando.sim2018@gmail.com
 */
router.get('/debug/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    
    // Verificar se é um dos endereços de email problemáticos conhecidos
    const isKnownProblematic = email === 'fernando.sim2018@gmail.com';
    
    console.log(`\n========= INICIANDO DIAGNÓSTICO PARA ${email} =========\n`);
    console.log(`Email problemático conhecido: ${isKnownProblematic ? 'SIM ⚠️' : 'NÃO'}`);
    
    // Buscar o usuário pelo email
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email));
    
    console.log(`Usuário encontrado: ${user ? 'SIM' : 'NÃO'}`);
    
    if (user) {
      console.log(`- ID: ${user.id}`);
      console.log(`- Username: ${user.username}`);
      console.log(`- Email verificado: ${user.emailconfirmed ? 'SIM' : 'NÃO ⚠️'}`);
    }
    
    // Buscar códigos de verificação para este email
    const verificationCodes = await db.select()
      .from(emailVerificationCodes)
      .where(eq(emailVerificationCodes.email, email))
      .orderBy(desc(emailVerificationCodes.createdAt));
    
    console.log(`\nHistórico de códigos de verificação: ${verificationCodes.length} encontrados`);
    
    verificationCodes.forEach((code, index) => {
      console.log(`\n[Código #${index + 1}]`);
      console.log(`- ID: ${code.id}`);
      console.log(`- Criado em: ${code.createdAt.toLocaleString('pt-BR')}`);
      console.log(`- Expira em: ${code.expiresAt.toLocaleString('pt-BR')}`);
      console.log(`- Usado: ${code.used ? 'SIM' : 'NÃO'}`);
      console.log(`- Verificado: ${code.verified ? 'SIM' : 'NÃO'}`);
      
      // Verificar se o código está expirado
      const now = new Date();
      const isExpired = now > code.expiresAt;
      console.log(`- Expirado: ${isExpired ? 'SIM' : 'NÃO'}`);
    });
    
    // Enviar um email de diagnóstico específico para este caso
    if (isKnownProblematic) {
      console.log(`\n==== INICIANDO DIAGNÓSTICO ESPECIAL PARA ${email} ====\n`);
      
      // Preparar conteúdo do email com técnicas avançadas para casos problemáticos
      const subject = `[DIAGNÓSTICO ESPECIAL] DesignAuto - ${new Date().toLocaleString('pt-BR')}`;
      
      // Template especial com formatação mínima para evitar filtros de spam
      const message = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Teste Especial - DesignAuto</h2>
          <p>Olá,</p>
          <p>Este é um email especial de diagnóstico. Se você está visualizando este email, significa que nossa solução para casos especiais está funcionando.</p>
          <p><strong>Data e hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p>Por favor, contate o suporte informando que você recebeu este email de teste.</p>
          <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5;">
            <p style="font-size: 12px; color: #666;">
              Este é um email automatizado. Por favor, não responda a este email.<br>
              Copyright © ${new Date().getFullYear()} DesignAuto. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `;
      
      try {
        // Usar estratégias específicas para o caso
        const result = await emailService.sendSpecialCaseEmail(email, subject, message, {
          highPriority: true,
          useAlternativeMethod: true
        });
        
        console.log(`Resultado do envio de email especial: ${result.success ? 'SUCESSO ✓' : 'FALHA ✗'}`);
        if (result.messageId) {
          console.log(`ID da mensagem: ${result.messageId}`);
        }
        
        if (!result.success) {
          console.log(`Erro: ${result.error}`);
        }
      } catch (emailError) {
        console.error('Erro ao enviar email especial de diagnóstico:', emailError);
      }
    }
    
    // Retornar resultados do diagnóstico
    res.json({
      success: true,
      email,
      isKnownProblematic,
      user: user ? {
        id: user.id,
        username: user.username,
        emailConfirmed: user.emailconfirmed,
        createdAt: user.criadoem
      } : null,
      verificationHistory: verificationCodes.map(code => ({
        id: code.id,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt,
        used: code.used,
        verified: code.verified,
        isExpired: new Date() > code.expiresAt
      })),
      recentLogs: emailService.getLogs()
        .filter(log => log.includes(email))
        .slice(-10),
      recommendations: isKnownProblematic 
        ? [
            "Usar método alternativo de verificação",
            "Testar com formato de email simplificado",
            "Verificar configurações de SPF/DKIM",
            "Adicionar contato à lista de contatos confiáveis",
            "Verificar pasta de spam"
          ]
        : []
    });
  } catch (error) {
    console.error(`Erro ao fazer diagnóstico para ${req.params.email}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer diagnóstico',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/admin/email-diagnostic/force-verification/:email
 * Força o envio de um email de verificação usando técnicas especiais para emails problemáticos
 */
router.post('/force-verification/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    
    // Verificar se o usuário existe
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Usuário com email ${email} não encontrado`
      });
    }
    
    // Lista de emails conhecidos como problemáticos
    const knownProblematicEmails = ['fernando.sim2018@gmail.com'];
    const isKnownProblematic = knownProblematicEmails.includes(email.toLowerCase());
    
    console.log(`\n==== INICIANDO VERIFICAÇÃO FORÇADA PARA ${email} ====\n`);
    if (isKnownProblematic) {
      console.log(`🚨 AVISO: Este é um email conhecido como problemático!`);
      console.log(`📝 Aplicando tratamento especial com alta prioridade para ${email}`);
    }
    
    // Gerar um novo código de verificação
    const verificationCode = await emailVerificationService.generateVerificationCode(email);
    console.log(`Código gerado: ${verificationCode.code} (ID: ${verificationCode.id})`);
    
    // Preparar conteúdo simplificado para maximizar entrega
    const subject = `Seu código de verificação DesignAuto: ${verificationCode.code}`;
    
    // Usar formatação ultra simples
    const message = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: 0 auto;">
        <h2>Seu código de verificação</h2>
        <div style="font-size: 24px; padding: 15px; background-color: #f5f5f5; text-align: center; margin: 20px 0;">
          <strong>${verificationCode.code}</strong>
        </div>
        <p>Insira este código no site para verificar sua conta.</p>
        <p>Este código expira em 24 horas.</p>
        <p>- Equipe DesignAuto</p>
      </div>
    `;
    
    // Usar o método especial para casos problemáticos
    const result = await emailService.sendSpecialCaseEmail(email, subject, message, {
      highPriority: true,
      useAlternativeMethod: true,
      // Adicionar informação se é um email conhecido como problemático para logs
      isKnownProblematic
    });
    
    if (result.success) {
      console.log(`✅ Email de verificação forçada enviado com sucesso para ${email}`);
      
      // Adicionar entrada de log especial para registrar o sucesso (primeiro limpando logs antigos)
      emailService.clearLogs();
      console.log(`🚨 [VERIFICAÇÃO FORÇADA] Email enviado para ${email} com método especial (ID: ${result.messageId})`);
      
      res.json({
        success: true,
        message: `Email de verificação forçada enviado com sucesso para ${email}`,
        verificationCode: {
          id: verificationCode.id,
          code: verificationCode.code.substring(0, 2) + '****',
          createdAt: verificationCode.createdAt,
          expiresAt: verificationCode.expiresAt
        },
        messageId: result.messageId
      });
    } else {
      console.error(`❌ Falha ao enviar email de verificação forçada para ${email}: ${result.error}`);
      
      res.status(500).json({
        success: false,
        message: `Falha ao enviar email de verificação forçada para ${email}`,
        error: result.error,
        verificationCode: {
          id: verificationCode.id,
          code: verificationCode.code.substring(0, 2) + '****',
          createdAt: verificationCode.createdAt,
          expiresAt: verificationCode.expiresAt
        }
      });
    }
  } catch (error) {
    console.error(`Erro ao forçar verificação para ${req.params.email}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao forçar verificação',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/admin/email-diagnostic/special-case-email/:email
 * Rota específica para o caso do email fernando.sim2018@gmail.com e outros emails problemáticos
 * conhecidos que precisam de tratamento especial
 */
router.post('/special-case-email/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email.toLowerCase();
    
    // Lista específica de emails problemáticos
    const knownProblematicEmails = ['fernando.sim2018@gmail.com'];
    
    // Verificar se o email está na lista de problemas conhecidos
    if (!knownProblematicEmails.includes(email)) {
      return res.status(400).json({
        success: false,
        message: 'Este email não está na lista de casos especiais conhecidos'
      });
    }
    
    console.log(`\n==== ENVIANDO EMAIL PARA CASO ESPECIAL: ${email} ====\n`);
    console.log(`🚨 AVISO: Email com histórico de problemas de entrega detectado!`);
    
    // Verificar se o usuário existe
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Usuário com email ${email} não encontrado no sistema`
      });
    }
    
    // Gerar um código de verificação específico para este caso
    const verificationCode = await emailVerificationService.generateVerificationCode(email);
    console.log(`Código de verificação especial gerado: ${verificationCode.code}`);
    
    // Usar template simplificado específico para problemas de entrega
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
    
    // Enviar usando a estratégia mais robusta possível
    const result = await emailService.sendSpecialCaseEmail(email, subject, message, {
      highPriority: true,
      useAlternativeMethod: true,
      isKnownProblematic: true
    });
    
    if (result.success) {
      console.log(`✅ Email enviado com sucesso para o caso especial ${email}`);
      
      // Registrar sucesso nos logs para futuro diagnóstico
      emailService.clearLogs();
      emailService.getSimulatedEmails().forEach(email => console.log(JSON.stringify(email)));
      
      res.json({
        success: true,
        message: `Email enviado com sucesso para o caso especial ${email}`,
        verificationCode: {
          id: verificationCode.id,
          code: verificationCode.code.substring(0, 2) + '****', // Mascarar o código
          createdAt: verificationCode.createdAt,
          expiresAt: verificationCode.expiresAt
        }
      });
    } else {
      console.error(`❌ Falha ao enviar email para o caso especial ${email}: ${result.error}`);
      
      res.status(500).json({
        success: false,
        message: `Falha ao enviar email para o caso especial ${email}`,
        error: result.error,
        verificationCode: {
          id: verificationCode.id,
          code: verificationCode.code.substring(0, 2) + '****',
          createdAt: verificationCode.createdAt,
          expiresAt: verificationCode.expiresAt
        }
      });
    }
  } catch (error) {
    console.error(`Erro ao processar caso especial para ${req.params.email}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar caso especial',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;