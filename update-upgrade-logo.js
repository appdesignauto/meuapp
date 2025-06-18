/**
 * Script para atualizar logo do e-mail de upgrade orgânico
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

async function convertNewLogoToBase64() {
  try {
    const logoPath = path.join(__dirname, 'attached_assets', 'Prancheta 1 cópia 5_1750283556681.png');
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Novo logo não encontrado em:', logoPath);
      return null;
    }
    
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString('base64');
    const logoDataUrl = `data:image/png;base64,${base64Logo}`;
    
    console.log('✅ Novo logo convertido para base64 com sucesso');
    console.log(`📊 Tamanho: ${Math.round(base64Logo.length / 1024)}KB`);
    
    return logoDataUrl;
    
  } catch (error) {
    console.error('❌ Erro ao converter novo logo:', error);
    return null;
  }
}

async function updateUpgradeTemplate(logoDataUrl) {
  try {
    const db = await getDatabase();
    
    // Template de upgrade orgânico com novo logo
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

    // Atualizar apenas o template de upgrade orgânico
    await db.query(`
      UPDATE "emailTemplates" 
      SET "htmlContent" = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "templateKey" = 'upgrade_organico'
    `, [upgradeTemplate]);

    console.log('✅ Template de upgrade orgânico atualizado com novo logo');
    
    await db.end();
    
  } catch (error) {
    console.error('❌ Erro ao atualizar template:', error);
  }
}

async function main() {
  console.log('🔧 Iniciando atualização do logo no e-mail de upgrade...');
  
  const logoDataUrl = await convertNewLogoToBase64();
  
  if (logoDataUrl) {
    await updateUpgradeTemplate(logoDataUrl);
    console.log('🎉 Logo do e-mail de upgrade atualizado com sucesso!');
  } else {
    console.log('❌ Falha na conversão do novo logo');
  }
}

main().catch(console.error);