/**
 * Script simplificado ESPECIFICAMENTE para criar um usuário a partir de um webhook
 * Esta versão foi simplificada ao máximo para garantir funcionamento imediato
 */

import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// Função para criar um usuário diretamente
async function criarUsuarioManual(email, nome, plano = 'premium') {
  console.log(`🔄 Criando usuário para ${email}`);
  
  // Configurar conexão com banco de dados
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Gerar dados do usuário
    const username = email.split('@')[0] + '-' + Date.now().toString().slice(-6);
    const password = 'auto@123';
    
    // Gerar hash seguro da senha
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const hashedPassword = `${hash}.${salt}`;
    
    console.log(`🔧 Dados gerados: username=${username}`);
    
    // Verificar se o usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    
    if (existingUser.rows.length > 0) {
      // Atualizar usuário existente
      userId = existingUser.rows[0].id;
      console.log(`🔄 Atualizando usuário existente com ID: ${userId}`);
      
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
      
      console.log(`✅ Usuário atualizado com sucesso`);
    } else {
      // Criar novo usuário com campos essenciais
      console.log('📝 Criando novo usuário no banco de dados...');
      
      const insertUser = await pool.query(
        `INSERT INTO users (
          username, password, email, name, 
          role, isactive, emailconfirmed
        ) VALUES (
          $1, $2, $3, $4, 
          'user', true, true
        ) RETURNING id`,
        [username, hashedPassword, email, nome]
      );
      
      userId = insertUser.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
      
      // Atualizar campos adicionais em query separada
      await pool.query(
        `UPDATE users SET 
          nivelacesso = 'premium',
          origemassinatura = 'hotmart', 
          tipoplano = $1,
          dataassinatura = NOW(),
          dataexpiracao = NOW() + INTERVAL '1 year',
          criadoem = NOW(),
          atualizadoem = NOW()
          WHERE id = $2`,
        [plano, userId]
      );
    }
    
    // Criar assinatura
    const transactionId = `MANUAL-${Date.now()}`;
    
    await pool.query(
      `INSERT INTO subscriptions (
        "userId", "planType", status, "startDate", "endDate", 
        origin, transactionid, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, 'active', NOW(), NOW() + INTERVAL '1 year',
        'hotmart', $3, NOW(), NOW()
      )`,
      [userId, plano, transactionId]
    );
    
    console.log(`✅ Assinatura registrada para usuário ${userId}`);
    console.log('✅ Processamento concluído com sucesso');
    
    return { userId, username, success: true };
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Processar webhook específico por ID
async function processarWebhook(webhookId) {
  console.log(`🔄 Processando webhook ID: ${webhookId}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar o webhook pelo ID
    const webhookResult = await pool.query(
      'SELECT * FROM webhook_logs WHERE id = $1',
      [webhookId]
    );
    
    if (webhookResult.rows.length === 0) {
      console.error(`❌ Webhook ID ${webhookId} não encontrado`);
      return false;
    }
    
    const webhook = webhookResult.rows[0];
    console.log(`✅ Webhook encontrado: ${webhook.id}, Email: ${webhook.email}`);
    
    // Verificar se o webhook já foi processado
    if (webhook.status === 'processed') {
      console.log(`⏩ Webhook ${webhookId} já foi processado anteriormente`);
      return true;
    }
    
    // Obter dados do webhook
    const email = webhook.email;
    let payload;
    
    try {
      // O payload pode já ser um objeto ou uma string JSON
      if (typeof webhook.raw_payload === 'string') {
        payload = JSON.parse(webhook.raw_payload);
      } else {
        payload = webhook.raw_payload;
      }
    } catch (e) {
      console.log('⚠️ Erro ao processar payload, usando valores padrão');
      payload = { data: { buyer: { name: email.split('@')[0] } } };
    }
    
    // Extrair nome do comprador e tipo de plano
    const name = payload.data?.buyer?.name || email.split('@')[0];
    const planType = 'premium';
    
    console.log(`📋 Dados extraídos: Nome=${name}, Email=${email}, Plano=${planType}`);
    
    // Criar o usuário usando a função manual
    const result = await criarUsuarioManual(email, name, planType);
    
    if (result.success) {
      // Marcar webhook como processado
      await pool.query(
        `UPDATE webhook_logs SET status = 'processed' WHERE id = $1`,
        [webhookId]
      );
      
      console.log(`✅ Webhook ${webhookId} processado com sucesso!`);
      return true;
    } else {
      console.error(`❌ Erro ao processar webhook ${webhookId}:`, result.error);
      
      // Marcar webhook como erro
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = $1 WHERE id = $2`,
        [result.error, webhookId]
      );
      
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${webhookId}:`, error);
    return false;
  } finally {
    await pool.end();
  }
}

// Verificar argumentos de linha de comando
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('⚠️ Uso: node criar-usuario-webhook.js [comando] [parâmetros]');
  console.log('Comandos disponíveis:');
  console.log('  criar-usuario [email] [nome] - Cria um usuário diretamente');
  console.log('  processar-webhook [id] - Processa um webhook específico pelo ID');
  process.exit(1);
}

const comando = args[0];

if (comando === 'criar-usuario') {
  if (args.length < 3) {
    console.error('❌ Email e nome são obrigatórios');
    process.exit(1);
  }
  
  const email = args[1];
  const nome = args[2];
  const plano = args[3] || 'premium';
  
  criarUsuarioManual(email, nome, plano)
    .then(result => {
      if (result.success) {
        console.log(`\n✅ Usuário ${result.username} criado com sucesso (ID: ${result.userId})`);
      } else {
        console.error(`\n❌ Falha ao criar usuário: ${result.error}`);
      }
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
    });
} else if (comando === 'processar-webhook') {
  if (args.length < 2) {
    console.error('❌ ID do webhook é obrigatório');
    process.exit(1);
  }
  
  const webhookId = parseInt(args[1]);
  
  processarWebhook(webhookId)
    .then(success => {
      if (success) {
        console.log(`\n✅ Webhook ${webhookId} processado com sucesso`);
      } else {
        console.error(`\n❌ Falha ao processar webhook ${webhookId}`);
      }
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
    });
} else {
  console.error(`❌ Comando desconhecido: ${comando}`);
  process.exit(1);
}