/**
 * Script para testar o processamento completo de um webhook no caminho de produção
 * 
 * Este script simula um webhook real da Hotmart com todas as etapas:
 * 1. Envia o webhook para /webhook/hotmart (caminho configurado na Hotmart)
 * 2. Verifica o registro no banco de dados
 * 3. Verifica a criação ou atualização do usuário e assinatura
 */

import pg from 'pg';
import fetch from 'node-fetch';

const { Pool } = pg;

// Configuração
const baseUrl = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}`
  : 'http://localhost:5000';

const HOTMART_TOKEN = process.env.HOTMART_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

if (!HOTMART_TOKEN) {
  console.error('Erro: HOTMART_SECRET não definido. Configure a variável de ambiente.');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('Erro: DATABASE_URL não definido. Configure a variável de ambiente.');
  process.exit(1);
}

// Criar conexão com o banco
const pool = new Pool({
  connectionString: DATABASE_URL
});

// Configurar os dados do webhook
const email = `teste.${Date.now()}@example.com`;
const transactionId = `HOT-TEST-${Date.now().toString().slice(-8)}`;
const productId = 5381714; // ID real do produto da Hotmart
const offerId = "aukjngrt"; // ID real da oferta da Hotmart
const nome = "Usuário Teste Webhook";

// Payload exato da Hotmart
const payload = {
  "id": `webhook-test-${Date.now()}`,
  "creation_date": Date.now(),
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": productId,
      "ucode": "eef7f8c8-ce74-47aa-a8da-d1e7505dfa8a",
      "name": "App DesignAuto",
      "warranty_date": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      "has_co_production": false,
      "is_physical_product": false
    },
    "affiliates": [
      {
        "affiliate_code": "",
        "name": ""
      }
    ],
    "buyer": {
      "email": email,
      "name": nome,
      "first_name": nome.split(' ')[0],
      "last_name": nome.split(' ')[1] || "",
      "address": {
        "country": "Brasil",
        "country_iso": "BR"
      },
      "document": "12345678900",
      "document_type": "CPF"
    },
    "producer": {
      "name": "EDITORA INOVE DIGITAL LTDA",
      "document": "52883206000100",
      "legal_nature": "Pessoa Jurídica"
    },
    "commissions": [
      {
        "value": 1.4,
        "source": "MARKETPLACE",
        "currency_value": "BRL"
      },
      {
        "value": 5.6,
        "source": "PRODUCER",
        "currency_value": "BRL"
      }
    ],
    "purchase": {
      "approved_date": Date.now(),
      "full_price": {
        "value": 297,
        "currency_value": "BRL"
      },
      "price": {
        "value": 297,
        "currency_value": "BRL"
      },
      "checkout_country": {
        "name": "Brasil",
        "iso": "BR"
      },
      "order_bump": {
        "is_order_bump": false
      },
      "original_offer_price": {
        "value": 297,
        "currency_value": "BRL"
      },
      "order_date": Date.now(),
      "status": "APPROVED",
      "transaction": transactionId,
      "payment": {
        "installments_number": 1,
        "type": "CREDIT_CARD"
      },
      "offer": {
        "code": offerId
      },
      "invoice_by": "HOTMART",
      "subscription_anticipation_purchase": false,
      "date_next_charge": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).getTime(),
      "recurrence_number": 1,
      "is_funnel": false,
      "business_model": "I"
    },
    "subscription": {
      "status": "ACTIVE",
      "plan": {
        "id": 1038897,
        "name": "Plano Anual"
      },
      "subscriber": {
        "code": "IY8BW62L"
      }
    }
  },
  "hottok": HOTMART_TOKEN
};

// Função para verificar o log no banco
async function verificarLog() {
  try {
    const result = await pool.query(
      `SELECT * FROM "webhookLogs" WHERE "transactionId" = $1 ORDER BY id DESC LIMIT 1`,
      [transactionId]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Log do webhook não encontrado no banco de dados');
      return null;
    }
    
    console.log('✅ Log do webhook encontrado:');
    console.log('- ID:', result.rows[0].id);
    console.log('- Status:', result.rows[0].status);
    console.log('- Evento:', result.rows[0].eventType);
    console.log('- Email:', result.rows[0].email);
    
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao verificar log:', error);
    return null;
  }
}

// Função para verificar o usuário no banco
async function verificarUsuario() {
  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado no banco de dados');
      return null;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log('- ID:', result.rows[0].id);
    console.log('- Nome:', result.rows[0].name);
    console.log('- Nível de acesso:', result.rows[0].nivelacesso);
    console.log('- Tipo de plano:', result.rows[0].tipoplano);
    console.log('- Data de expiração:', result.rows[0].dataexpiracao);
    
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return null;
  }
}

// Função principal de teste
async function executarTeste() {
  console.log(`🔄 Iniciando teste completo do webhook da Hotmart`);
  console.log(`URL base: ${baseUrl}`);
  console.log(`Email de teste: ${email}`);
  console.log(`Transação: ${transactionId}`);
  console.log(`Produto ID: ${productId}`);
  console.log(`Oferta ID: ${offerId}`);
  
  try {
    console.log('\n1. Enviando webhook para /webhook/hotmart:');
    
    const response = await fetch(`${baseUrl}/webhook/hotmart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    
    console.log(`Status da resposta: ${response.status}`);
    console.log(`Resposta: ${JSON.stringify(responseData, null, 2)}`);
    
    if (response.status >= 200 && response.status < 300 && responseData.success) {
      console.log('\n✅ Webhook enviado com sucesso');
      
      // Esperar 2 segundos para garantir que o processamento concluiu
      console.log('\nAguardando 2 segundos para garantir processamento completo...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar o log do webhook
      console.log('\n2. Verificando registro de log no banco:');
      const log = await verificarLog();
      
      if (log && log.status === 'success') {
        console.log('\n✅ Log registrado e processado com sucesso');
        
        // Verificar o usuário
        console.log('\n3. Verificando criação/atualização do usuário:');
        const user = await verificarUsuario();
        
        if (user) {
          console.log('\n✅ Usuário criado/atualizado com sucesso');
          
          if (user.nivelacesso === 'premium' && user.tipoplano) {
            console.log('\n🎉 TESTE COMPLETO BEM-SUCEDIDO! O sistema está processando webhooks corretamente.');
            console.log('\nResumo dos resultados:');
            console.log('- Webhook recebido e processado');
            console.log('- Log registrado no banco com status "success"');
            console.log(`- Usuário criado com email ${email}`);
            console.log(`- Assinatura atribuída com tipo ${user.tipoplano}`);
            console.log(`- Data de expiração definida para ${user.dataexpiracao}`);
          } else {
            console.log('\n⚠️ Usuário criado mas nível de acesso não definido como premium ou tipo de plano não definido');
          }
        }
      } else if (log) {
        console.log('\n⚠️ Log registrado mas status não é "success":', log.status);
        console.log('Mensagem de erro:', log.errorMessage);
      }
    } else {
      console.log('\n❌ Falha ao enviar webhook:', responseData.message || 'Resposta não contém message');
    }
  } catch (error) {
    console.error('Erro durante o teste:', error);
  } finally {
    // Fechar a conexão com o banco
    await pool.end();
  }
}

// Executar o teste
executarTeste();