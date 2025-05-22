/**
 * Script simplificado para processamento direto de usuários Hotmart
 * Esta é uma versão mais simples e direta que funciona garantidamente
 */

import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';

const { Pool } = pg;

// Conectar ao banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Função para criar hash seguro de senha
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

// Função para processar um usuário a partir de dados do webhook
async function processarUsuario(email, nome, plano = 'premium') {
  console.log(`🔄 Processando usuário: ${email}`);
  
  try {
    // Verificar se o usuário já existe
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    
    if (userResult.rows.length === 0) {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário para ${email}`);
      
      // Gerar username único baseado no email
      const username = email.split('@')[0] + '-' + Date.now().toString().slice(-6);
      
      // Gerar senha e criar hash
      const password = 'auto@123';
      const hashedPassword = hashPassword(password);
      
      // Inserir usuário com campos mínimos essenciais primeiro
      const insertResult = await pool.query(
        `INSERT INTO users 
         (username, password, email, name, role, isactive)
         VALUES ($1, $2, $3, $4, 'user', true)
         RETURNING id`,
        [username, hashedPassword, email, nome]
      );
      
      userId = insertResult.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
      
      // Atualizar campos adicionais em query separada
      await pool.query(
        `UPDATE users SET 
         nivelacesso = 'premium',
         origemassinatura = 'hotmart',
         tipoplano = $1,
         dataassinatura = NOW(),
         dataexpiracao = NOW() + INTERVAL '1 year',
         emailconfirmed = true,
         criadoem = NOW(),
         atualizadoem = NOW()
         WHERE id = $2`,
        [plano, userId]
      );
    } else {
      // Atualizar usuário existente
      userId = userResult.rows[0].id;
      console.log(`🔄 Atualizando usuário existente: ${userId}`);
      
      await pool.query(
        `UPDATE users SET 
         nivelacesso = 'premium',
         origemassinatura = 'hotmart',
         tipoplano = $1,
         dataassinatura = NOW(),
         dataexpiracao = NOW() + INTERVAL '1 year',
         atualizadoem = NOW()
         WHERE id = $2`,
        [plano, userId]
      );
    }
    
    // Adicionar registro de assinatura (apenas se não existir)
    const transactionId = `MANUAL-${Date.now()}`;
    
    // Verificar se já existe assinatura ativa para esse usuário
    const subCheck = await pool.query(
      'SELECT id FROM subscriptions WHERE "userId" = $1 AND status = $2',
      [userId, 'active']
    );
    
    if (subCheck.rows.length === 0) {
      // Criar nova assinatura
      await pool.query(
        `INSERT INTO subscriptions 
         ("userId", "planType", status, "startDate", "endDate", origin,
          transactionid, "createdAt", "updatedAt", "paymentmethod", price, currency)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '1 year', $4,
                $5, NOW(), NOW(), $6, $7, $8)`,
        [userId, plano, 'active', 'hotmart', 
         transactionId, 'manual', 97.00, 'BRL']
      );
      
      console.log(`📝 Assinatura registrada para usuário ${userId}`);
    } else {
      console.log(`ℹ️ Usuário ${userId} já possui assinatura ativa`);
    }
    
    console.log(`✅ Processamento completo para ${email}`);
    return { userId, success: true };
  } catch (error) {
    console.error(`❌ Erro ao processar usuário ${email}:`, error);
    return { success: false, error: error.message };
  }
}

// Função para processar um webhook da Hotmart pelo ID
async function processarWebhookPorId(webhookId) {
  try {
    // Buscar webhook no banco de dados
    const webhookResult = await pool.query(
      'SELECT * FROM webhook_logs WHERE id = $1',
      [webhookId]
    );
    
    if (webhookResult.rows.length === 0) {
      console.error(`❌ Webhook ID ${webhookId} não encontrado`);
      return false;
    }
    
    const webhook = webhookResult.rows[0];
    
    // Verificar se o webhook já foi processado
    if (webhook.status === 'processed') {
      console.log(`⏩ Webhook ${webhookId} já foi processado anteriormente`);
      return true;
    }
    
    const email = webhook.email;
    
    if (!email) {
      console.error('❌ Email não encontrado no webhook');
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = 'Email não encontrado' WHERE id = $1`,
        [webhookId]
      );
      return false;
    }
    
    // Extrair informações adicionais do payload
    let payload;
    try {
      payload = JSON.parse(webhook.raw_payload);
    } catch (e) {
      console.error('❌ Erro ao parsear payload:', e);
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = 'Erro ao parsear payload' WHERE id = $1`,
        [webhookId]
      );
      return false;
    }
    
    // Extrair nome e plano
    const name = findNameInPayload(payload) || email.split('@')[0];
    const planType = findPlanInfo(payload);
    
    console.log(`📋 Dados extraídos: ${name}, ${email}, Plano: ${planType}`);
    
    // Processar o usuário
    const result = await processarUsuario(email, name, planType);
    
    if (result.success) {
      // Marcar webhook como processado
      await pool.query(
        `UPDATE webhook_logs SET status = 'processed' WHERE id = $1`,
        [webhookId]
      );
      return true;
    } else {
      // Marcar webhook como erro
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = $1 WHERE id = $2`,
        [result.error, webhookId]
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${webhookId}:`, error);
    try {
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = $1 WHERE id = $2`,
        [error.message, webhookId]
      );
    } catch (updateError) {
      console.error('Erro ao atualizar status do webhook:', updateError);
    }
    return false;
  }
}

// Função para encontrar nome em qualquer parte do payload
function findNameInPayload(payload) {
  if (!payload) return null;
  
  // Verificar locais comuns primeiro
  if (payload.data?.buyer?.name) return payload.data.buyer.name;
  if (payload.data?.customer?.name) return payload.data.customer.name;
  if (payload.data?.subscription?.subscriber?.name) return payload.data.subscription.subscriber.name;
  
  // Função recursiva para busca profunda
  function searchName(obj) {
    if (!obj || typeof obj !== 'object') return null;
    
    // Verificar chaves comuns
    if (obj.name && typeof obj.name === 'string') return obj.name;
    if (obj.fullName && typeof obj.fullName === 'string') return obj.fullName;
    if (obj.firstName && obj.lastName) return `${obj.firstName} ${obj.lastName}`;
    
    // Buscar em propriedades
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        const result = searchName(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchName(payload);
}

// Função para extrair plano do payload
function findPlanInfo(payload) {
  try {
    // Tenta encontrar em diferentes posições no payload
    if (payload.data?.subscription?.plan?.name) {
      return payload.data.subscription.plan.name.toLowerCase();
    }
    
    if (payload.data?.purchase?.offer?.code === 'aukjngrt') {
      return 'plano anual';
    }
    
    if (payload.data?.product?.name) {
      return payload.data.product.name.toLowerCase();
    }
    
    // Se não encontrar, retorna um valor padrão
    return 'plano premium';
  } catch (e) {
    console.error('Erro ao extrair plano do payload:', e);
    return 'plano premium';
  }
}

// Verificar argumentos de linha de comando
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Uso: node webhook-standalone.js [comando] [parâmetros]');
  console.log('Comandos disponíveis:');
  console.log('  process-webhook [id] - Processa um webhook específico pelo ID');
  console.log('  create-user [email] [nome] - Cria um usuário diretamente');
  console.log('  pending-webhooks - Processa todos os webhooks pendentes');
  process.exit(1);
}

// Executar comando
async function main() {
  const command = args[0];
  
  try {
    switch (command) {
      case 'process-webhook':
        if (args.length < 2) {
          console.error('❌ ID do webhook não fornecido');
          process.exit(1);
        }
        
        const webhookId = parseInt(args[1]);
        console.log(`🔍 Processando webhook específico ID: ${webhookId}`);
        const result = await processarWebhookPorId(webhookId);
        console.log(`Resultado: ${result ? 'Sucesso' : 'Falha'}`);
        break;
        
      case 'create-user':
        if (args.length < 3) {
          console.error('❌ Email ou nome não fornecidos');
          console.log('Uso: node webhook-standalone.js create-user [email] [nome] [plano opcional]');
          process.exit(1);
        }
        
        const email = args[1];
        const nome = args[2];
        const plano = args[3] || 'premium';
        
        console.log(`🔍 Criando usuário: ${email}, ${nome}, Plano: ${plano}`);
        const userResult = await processarUsuario(email, nome, plano);
        console.log(`Resultado: ${userResult.success ? 'Sucesso' : 'Falha'}`);
        break;
        
      case 'pending-webhooks':
        console.log('🔍 Processando todos os webhooks pendentes');
        
        // Buscar webhooks pendentes
        const pending = await pool.query(
          "SELECT id FROM webhook_logs WHERE status = 'received' ORDER BY created_at ASC"
        );
        
        console.log(`Encontrados ${pending.rows.length} webhooks pendentes`);
        
        // Processar cada webhook
        let processed = 0;
        let failed = 0;
        
        for (const row of pending.rows) {
          const id = row.id;
          console.log(`\nProcessando webhook ID: ${id}`);
          
          const success = await processarWebhookPorId(id);
          
          if (success) {
            processed++;
          } else {
            failed++;
          }
        }
        
        console.log(`\n✅ Processamento concluído: ${processed} sucesso, ${failed} falhas`);
        break;
        
      default:
        console.error(`❌ Comando desconhecido: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});