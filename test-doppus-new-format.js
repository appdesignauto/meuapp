/**
 * Script para testar o novo formato de webhook da Doppus (maio/2025)
 * Este script simula o envio de um webhook no formato atualizado que a Doppus está enviando
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import pg from 'pg';
const { Pool } = pg;

// Função para gerar assinatura (mesma usada pela Doppus)
function generateSignature(body, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  return hmac.digest('hex');
}

// Função para obter a chave secreta do banco de dados
async function getSecretKey() {
  try {
    // Conectar ao banco de dados
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Buscar chave secreta da tabela de configurações - tentando com e sem aspas no nome da tabela
    let result;
    try {
      result = await pool.query(
        "SELECT value FROM \"integrationSettings\" WHERE key = 'doppusSecretKey'"
      );
    } catch (err) {
      console.log("⚠️ Erro buscando na tabela com aspas, tentando sem aspas...");
      try {
        result = await pool.query(
          "SELECT value FROM integrationSettings WHERE key = 'doppusSecretKey'"
        );
      } catch (innerErr) {
        console.log("❌ Também falhou sem aspas:", innerErr.message);
        // Verificar se a tabela existe
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("📋 Tabelas disponíveis:", tables.rows.map(r => r.table_name).join(', '));
      }
    }
    
    await pool.end();
    
    if (result.rows.length > 0) {
      return result.rows[0].value;
    } else {
      console.error('Chave secreta da Doppus não encontrada no banco de dados');
      return 'chave-secreta-test'; // Valor padrão para testes
    }
  } catch (error) {
    console.error('Erro ao obter chave secreta:', error);
    return 'chave-secreta-test'; // Valor padrão para testes
  }
}

async function simulateNewDoppusWebhook() {
  try {
    // Obter o secret key do banco de dados
    const secretKey = await getSecretKey();
    console.log(`Usando chave secreta: ${secretKey}`);
    
    // Payload no novo formato da Doppus (maio/2025)
    const payload = {
      "customer": {
        "name": "Cliente Teste Doppus Maio 2025",
        "email": "teste.maio2025@exemplo.com",
        "doc": "12345678900",
        "doc_type": "cpf",
        "ip_address": "187.123.45.67"
      },
      "status": {
        "code": "approved",
        "date": "2025-05-17T16:30:00.000Z"
      },
      "transaction": {
        "code": "TX987654321",
        "total": 297.00,
        "payment_type": "credit_card"
      },
      "items": [
        {
          "code": "designauto-product",
          "name": "Design Auto Premium",
          "offer": "anual-platinum",
          "offer_name": "Plano Anual Platinum",
          "value": 297.00
        }
      ],
      "recurrence": {
        "code": "REC987654",
        "periodicy": "yearly",
        "expiration_date": "2026-05-17T16:30:00.000Z"
      }
    };
    
    // Converter payload para string (exatamente como a Doppus envia)
    const payloadString = JSON.stringify(payload);
    
    // Gerar assinatura
    const signature = generateSignature(payloadString, secretKey);
    
    // Usar localhost na porta 5000
    const webhookUrl = 'http://127.0.0.1:5000/api/webhooks/doppus';
    console.log(`Enviando webhook para ${webhookUrl}`);
    console.log('Payload:', payloadString);
    console.log('Assinatura:', signature);
    
    // Enviando requisição
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Doppus-Signature': signature
      },
      body: payloadString
    });
    
    // Capturando a resposta como texto simples
    let responseText;
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = 'Erro ao ler resposta: ' + e.message;
    }
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', response.headers.raw());
    console.log('Corpo da resposta:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook enviado com sucesso!');
    } else {
      console.error('❌ Erro ao enviar webhook');
    }
    
    // Aguardar alguns segundos e verificar se o webhook foi registrado no banco
    console.log('Aguardando 2 segundos para verificar o registro no banco de dados...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar no banco de dados
    await checkWebhookLog();
    
  } catch (error) {
    console.error('Erro ao simular webhook:', error);
  }
}

async function checkWebhookLog() {
  try {
    // Conectar ao banco de dados
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Verificar se a tabela existe e tentar diferentes variações do nome
    let result;
    try {
      // Tentativa 1: com letras minúsculas
      result = await pool.query(
        "SELECT * FROM webhooklogs WHERE source = 'doppus' ORDER BY \"createdAt\" DESC LIMIT 1"
      );
    } catch (err1) {
      console.log("⚠️ Erro na primeira consulta:", err1.message);
      try {
        // Tentativa 2: com CamelCase e aspas
        result = await pool.query(
          "SELECT * FROM \"webhookLogs\" WHERE source = 'doppus' ORDER BY \"createdAt\" DESC LIMIT 1"
        );
      } catch (err2) {
        console.log("⚠️ Erro na segunda consulta:", err2.message);
        
        // Listar todas as tabelas para diagnóstico
        const tables = await pool.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        console.log("📋 Tabelas disponíveis:", tables.rows.map(r => r.table_name).join(', '));
        
        // Tentar buscar com o nome correto da tabela
        if (tables.rows.some(row => row.table_name.toLowerCase().includes('webhook'))) {
          const webhookTable = tables.rows.find(row => row.table_name.toLowerCase().includes('webhook')).table_name;
          console.log(`🔍 Encontrada tabela de webhooks: ${webhookTable}`);
          
          try {
            result = await pool.query(
              `SELECT * FROM "${webhookTable}" WHERE source = 'doppus' ORDER BY "createdAt" DESC LIMIT 1`
            );
          } catch (err3) {
            console.log(`❌ Erro ao consultar tabela ${webhookTable}:`, err3.message);
          }
        }
      }
    }
    
    await pool.end();
    
    if (result.rows.length > 0) {
      const log = result.rows[0];
      console.log('\n✅ Webhook registrado no banco de dados:');
      console.log(`ID: ${log.id}`);
      console.log(`Status: ${log.status}`);
      console.log(`Tipo de evento: ${log.eventType}`);
      console.log(`Data de criação: ${log.createdAt}`);
      console.log(`Mensagem de erro: ${log.errorMessage || 'Nenhum erro'}`);
      
      try {
        // Exibir resumo do payload
        const payload = JSON.parse(log.payloadData);
        console.log('\nResumo do payload armazenado:');
        console.log('- Email do cliente:', payload.data?.customer?.email || payload.customer?.email || 'N/A');
        console.log('- Nome do produto:', 
          payload.data?.items?.[0]?.name || 
          payload.items?.[0]?.name || 
          'N/A'
        );
      } catch (e) {
        console.error('Erro ao parsear payload armazenado:', e);
      }
      
      if (log.processingResult) {
        try {
          const result = JSON.parse(log.processingResult);
          console.log('\nResultado do processamento:', result);
        } catch (e) {
          console.log('Resultado do processamento (texto):', log.processingResult);
        }
      }
    } else {
      console.log('❌ Nenhum log de webhook encontrado para a última requisição');
    }
  } catch (error) {
    console.error('Erro ao verificar logs de webhook:', error);
  }
}

// Iniciar o teste
simulateNewDoppusWebhook().then(() => {
  console.log('\nTeste concluído.');
}).catch(error => {
  console.error('Erro durante o teste:', error);
});