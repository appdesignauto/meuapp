/**
 * Script para testar o processamento completo de um webhook no caminho de produção
 * 
 * Este script simula um webhook real da Hotmart com todas as etapas:
 * 1. Envia o webhook para /webhook/hotmart (caminho configurado na Hotmart)
 * 2. Verifica o registro no banco de dados
 * 3. Verifica a criação ou atualização do usuário e assinatura
 */

import fetch from 'node-fetch';
import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da conexão com o banco de dados
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Dados para o webhook de teste
const webhookData = {
  id: '083bb5a0-f7e0-414b-b600-585a015403f2',
  creation_date: 1747447467789,
  event: 'PURCHASE_APPROVED',
  data: {
    purchase: {
      transaction: 'IARN14053259',
      order_date: 1589217147000,
      approved_date: 1589217147000,
      status: 'APPROVED',
      payment: {
        type: 'credit_card',
        method: 'VISA',
        installments_number: 1
      },
      price: {
        value: 25.00,
      },
      full_price: {
        value: 25.00,
      },
      email_marketed: false,
      product: {
        id: '1618860',
        name: 'DesignAuto',
        ucode: 'null'
      },
      recurrence: {
        subscriber: {
          code: 3953461,
          name: 'Usuário Teste',
          email: 'teste@designauto.com.br'
        },
        plan: {
          name: 'Mensal',
          frequency: 'MONTH',
          recurrences: null
        }
      }
    },
    subscriber: {
      code: 3953461,
      name: 'Usuário Teste',
      email: 'teste@designauto.com.br'
    },
    buyer: {
      id: 'BUYER12345',
      name: 'Usuário Teste',
      email: 'teste@designauto.com.br'
    },
    product: {
      id: 1618860,
      name: 'DesignAuto',
      has_co_production: false
    }
  }
};

/**
 * Gera a assinatura HMAC para autenticação do webhook da Hotmart
 * @param {Object} data Os dados do webhook
 * @param {string} secret A chave secreta da Hotmart
 * @returns {string} A assinatura HMAC
 */
function generateSignature(data, secret) {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

/**
 * Envia o webhook para o endpoint do DesignAuto
 */
async function enviarWebhook() {
  try {
    console.log('🚀 Iniciando teste de webhook da Hotmart...');
    
    // Obter a chave secreta da Hotmart do ambiente ou banco de dados
    const hotmartSecret = process.env.HOTMART_SECRET || await getHotmartSecret();
    
    if (!hotmartSecret) {
      console.error('❌ Erro: HOTMART_SECRET não encontrado no ambiente ou no banco de dados');
      process.exit(1);
    }
    
    // Gerar assinatura HMAC para autenticação
    const signature = generateSignature(webhookData, hotmartSecret);
    console.log(`✅ Assinatura HMAC gerada: ${signature}`);
    
    // URL do webhook - usar o domínio do Replit quando disponível
    const dominio = process.env.REPLIT_DOMAIN || 'localhost:3000';
    const webhookUrl = `https://${dominio}/webhook/hotmart`;
    console.log(`📡 Enviando webhook para: ${webhookUrl}`);
    
    // Enviar o webhook com cabeçalhos de autenticação
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': signature
      },
      body: JSON.stringify(webhookData)
    });
    
    // Verificar resposta
    const responseStatus = response.status;
    const responseBody = await response.text();
    
    console.log(`🔄 Resposta do servidor: ${responseStatus}`);
    console.log(`📄 Resposta detalhada: ${responseBody}`);
    
    if (responseStatus >= 200 && responseStatus < 300) {
      console.log('✅ Webhook enviado com sucesso!');
      // Verificar o registro no banco de dados
      await verificarLog();
      // Verificar a criação/atualização do usuário
      await verificarUsuario();
    } else {
      console.error(`❌ Erro no envio do webhook: ${responseStatus} - ${responseBody}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar teste:', error);
  } finally {
    // Encerrar conexão com o banco de dados
    pool.end();
  }
}

/**
 * Obtém a chave secreta da Hotmart do banco de dados
 */
async function getHotmartSecret() {
  try {
    const result = await pool.query(
      `SELECT value FROM "integrationSettings" WHERE key = 'HOTMART_SECRET' LIMIT 1`
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].value;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar HOTMART_SECRET do banco:', error);
    return null;
  }
}

/**
 * Verifica se o webhook foi registrado no banco de dados
 */
async function verificarLog() {
  try {
    console.log('🔍 Verificando registro do webhook no banco de dados...');
    
    const result = await pool.query(
      `SELECT * FROM "webhookLogs" WHERE "webhookId" = $1 ORDER BY id DESC LIMIT 1`,
      [webhookData.id]
    );
    
    if (result.rows.length > 0) {
      const log = result.rows[0];
      console.log('✅ Log encontrado no banco de dados:');
      console.log(`   ID: ${log.id}`);
      console.log(`   Evento: ${log.event}`);
      console.log(`   Data de Criação: ${log.createdAt}`);
      return true;
    } else {
      console.log('❌ Nenhum log encontrado no banco de dados para este webhook');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar log:', error);
    return false;
  }
}

/**
 * Verifica se o usuário foi criado ou atualizado no banco de dados
 */
async function verificarUsuario() {
  try {
    const email = webhookData.data.buyer.email;
    console.log(`🔍 Verificando assinatura para o usuário: ${email}`);
    
    // Verificar usuário
    const userResult = await pool.query(
      `SELECT * FROM "users" WHERE "email" = $1`,
      [email]
    );
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ Usuário encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Nível: ${user.nivelacesso}`);
      console.log(`   Tipo de Plano: ${user.tipoplano}`);
      console.log(`   Origem: ${user.origemassinatura}`);
      
      // Verificar assinatura
      const subResult = await pool.query(
        `SELECT * FROM "subscriptions" WHERE "userId" = $1`,
        [user.id]
      );
      
      if (subResult.rows.length > 0) {
        const sub = subResult.rows[0];
        console.log('✅ Assinatura encontrada:');
        console.log(`   ID: ${sub.id}`);
        console.log(`   Tipo: ${sub.planType}`);
        console.log(`   Origem: ${sub.source}`);
        console.log(`   Início: ${sub.startDate}`);
        console.log(`   Término: ${sub.endDate}`);
        console.log(`   Ativa: ${sub.isActive}`);
        return true;
      } else {
        console.log('❌ Nenhuma assinatura encontrada para este usuário');
      }
    } else {
      console.log(`❌ Usuário ${email} não encontrado no banco de dados`);
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao verificar usuário/assinatura:', error);
    return false;
  }
}

// Executar o teste
enviarWebhook();