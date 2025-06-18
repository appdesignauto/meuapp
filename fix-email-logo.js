/**
 * Script para corrigir o logo nos templates de e-mail
 * Converte o logo para base64 e atualiza todos os templates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL não encontrada');
  }
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  return pool;
}

async function convertLogoToBase64() {
  try {
    const logoPath = path.join(__dirname, 'public/images/logos/logo_1745019394541_8q4daq.png');
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo não encontrado em:', logoPath);
      return null;
    }
    
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString('base64');
    const logoDataUrl = `data:image/png;base64,${base64Logo}`;
    
    console.log('✅ Logo convertido para base64 com sucesso');
    console.log(`📊 Tamanho: ${Math.round(base64Logo.length / 1024)}KB`);
    
    return logoDataUrl;
    
  } catch (error) {
    console.error('❌ Erro ao converter logo:', error);
    return null;
  }
}

async function updateEmailTemplates(logoDataUrl) {
  try {
    const db = await getDatabase();
    
    // Template de upgrade orgânico
    const upgradeTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upgrade para Premium - DesignAuto</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      text-align: center; 
      background: #1e3b61; 
      padding: 30px; 
      border-radius: 10px 10px 0 0; 
    }
    .logo { 
      max-width: 200px; 
      height: auto; 
    }
    .content { 
      background: #ffffff; 
      padding: 30px; 
      border: 1px solid #e5e7eb; 
    }
    .benefit { 
      display: flex; 
      align-items: center; 
      margin: 15px 0; 
    }
    .benefit-icon { 
      color: #10b981; 
      margin-right: 10px; 
      font-weight: bold; 
    }
    .cta-button { 
      display: inline-block; 
      background: #10b981; 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: bold; 
      text-align: center; 
      margin: 20px 0; 
    }
    .pricing { 
      background: #f8fafc; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0; 
      text-align: center; 
    }
    .price { 
      font-size: 24px; 
      color: #1e3b61; 
      font-weight: bold; 
    }
    .footer { 
      background: #f3f4f6; 
      padding: 20px; 
      text-align: center; 
      border-radius: 0 0 10px 10px; 
      font-size: 14px; 
      color: #6b7280; 
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoDataUrl}" alt="DesignAuto" class="logo">
  </div>
  
  <div class="content">
    <h1 style="color: #1e3b61; margin-bottom: 20px;">Olá, {{nome}}!</h1>
    
    <p style="font-size: 18px; margin-bottom: 25px;">
      Vejo que você se cadastrou no <strong>DesignAuto</strong>! Que tal dar o próximo passo e desbloquear todo o potencial da nossa plataforma?
    </p>
    
    <h2 style="color: #1e3b61; margin-bottom: 20px;">🚀 Upgrade para Premium e tenha acesso a:</h2>
    
    <div class="benefit">
      <span class="benefit-icon">✓</span>
      <span><strong>Milhares de artes exclusivas</strong> - Novos designs toda semana</span>
    </div>
    <div class="benefit">
      <span class="benefit-icon">✓</span>
      <span><strong>Downloads ilimitados</strong> - Baixe quantas artes quiser</span>
    </div>
    <div class="benefit">
      <span class="benefit-icon">✓</span>
      <span><strong>Formatos profissionais</strong> - Stories, feeds, cartazes e muito mais</span>
    </div>
    <div class="benefit">
      <span class="benefit-icon">✓</span>
      <span><strong>Suporte prioritário</strong> - Atendimento preferencial via WhatsApp</span>
    </div>
    <div class="benefit">
      <span class="benefit-icon">✓</span>
      <span><strong>Atualizações semanais</strong> - Sempre com conteúdo novo</span>
    </div>
    <div class="benefit">
      <span class="benefit-icon">✓</span>
      <span><strong>Sem compromisso</strong> - Cancele quando quiser</span>
    </div>
    
    <div class="pricing">
      <h3 style="margin-top: 0; color: #1e3b61;">💰 Planos Especiais</h3>
      <div style="margin: 15px 0;">
        <span class="price">R$ 47/mês</span> - Plano Mensal
      </div>
      <div style="margin: 15px 0;">
        <span class="price">R$ 147/ano</span> - <span style="color: #10b981; font-weight: bold;">ECONOMIZE R$ 417!</span>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://checkout.doppus.app/83779723" class="cta-button">
        🎯 QUERO FAZER UPGRADE AGORA
      </a>
    </div>
    
    <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <strong>⏰ Oferta limitada:</strong> Milhares de clientes já estão usando nossas artes para vender mais. Não perca tempo e junte-se a eles!
    </p>
    
    <p style="margin-top: 25px;">
      Qualquer dúvida, estou aqui para ajudar!<br>
      <strong>Equipe DesignAuto</strong>
    </p>
  </div>
  
  <div class="footer">
    <p>DesignAuto - Artes Automotivas Profissionais</p>
    <p>Este e-mail foi enviado para {{email}} porque você se cadastrou em nossa plataforma.</p>
  </div>
</body>
</html>`;

    // Template de boas-vindas com credenciais
    const welcomeTemplate = `<html><body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;"><div style="background: #4285f4; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;"><img src="${logoDataUrl}" alt="DesignAuto" style="max-width: 200px; height: auto; margin-bottom: 15px;"><h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Bem-vindo ao DesignAuto!</h1><p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sua assinatura foi ativada com sucesso</p></div><div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"><h2 style="color: #4285f4; margin-bottom: 20px;">Olá {{userName}}! 👋</h2><p style="font-size: 16px; margin-bottom: 25px;">Parabéns! Sua assinatura via <strong>{{paymentSource}}</strong> foi processada com sucesso. Agora você tem acesso completo a todas as artes automotivas profissionais da plataforma!</p><div style="background: #f8f9fa; border-left: 4px solid #4285f4; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;"><h3 style="color: #4285f4; margin: 0 0 15px 0; font-size: 18px;">🔑 Seus Dados de Acesso:</h3><div style="margin-bottom: 15px;"><strong style="color: #333;">📧 Login (E-mail):</strong><br><code style="background: #e9ecef; padding: 8px 12px; border-radius: 4px; font-family: monospace; color: #495057; display: inline-block; margin-top: 5px;">{{loginEmail}}</code></div><div style="margin-bottom: 20px;"><strong style="color: #333;">🔒 Senha Temporária:</strong><br><code style="background: #e9ecef; padding: 8px 12px; border-radius: 4px; font-family: monospace; color: #495057; display: inline-block; margin-top: 5px;">{{defaultPassword}}</code></div><p style="font-size: 14px; color: #6c757d; margin: 0;">💡 <strong>Dica:</strong> Recomendamos alterar sua senha após o primeiro login para maior segurança.</p></div><div style="text-align: center; margin: 30px 0;"><a href="{{accessUrl}}" style="background: #34a853; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">🚀 Acessar Plataforma Agora</a></div><div style="background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 20px; margin: 25px 0;"><h3 style="color: #2d5a2d; margin: 0 0 15px 0; font-size: 16px;">✨ O que você tem acesso agora:</h3><ul style="margin: 0; padding-left: 20px; color: #2d5a2d;"><li>🎨 <strong>Milhares de artes automotivas editáveis</strong></li><li>📱 <strong>Templates para Stories, Posts e Flyers</strong></li><li>🔄 <strong>Atualizações semanais com novos designs</strong></li><li>🎯 <strong>Suporte prioritário para assinantes</strong></li><li>📚 <strong>Acesso a videoaulas exclusivas</strong></li></ul></div><div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #856404; font-size: 14px;"><strong>⚠️ Importante:</strong> Guarde este e-mail com suas credenciais de acesso. Se precisar de ajuda, nossa equipe de suporte está sempre disponível!</p></div><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"><div style="text-align: center;"><p style="color: #777; font-size: 14px; margin-bottom: 10px;">Atenciosamente,<br><strong>Equipe DesignAuto</strong></p><p style="color: #999; font-size: 12px;">Este e-mail foi enviado automaticamente após a confirmação do seu pagamento.</p></div></div></body></html>`;

    // Atualizar template de upgrade orgânico
    await db.query(`
      UPDATE "emailTemplates" 
      SET "htmlContent" = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "templateKey" = 'upgrade_organico'
    `, [upgradeTemplate]);

    // Atualizar template de boas-vindas
    await db.query(`
      UPDATE "emailTemplates" 
      SET "htmlContent" = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "templateKey" = 'webhook_credentials'
    `, [welcomeTemplate]);

    console.log('✅ Templates de e-mail atualizados com logo base64');
    
    await db.end();
    
  } catch (error) {
    console.error('❌ Erro ao atualizar templates:', error);
  }
}

async function main() {
  console.log('🔧 Iniciando correção do logo nos e-mails...');
  
  const logoDataUrl = await convertLogoToBase64();
  
  if (logoDataUrl) {
    await updateEmailTemplates(logoDataUrl);
    console.log('🎉 Logo corrigido com sucesso nos templates de e-mail!');
  } else {
    console.log('❌ Falha na conversão do logo');
  }
}

main().catch(console.error);