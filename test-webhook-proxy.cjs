/**
 * Script para testar o proxy de webhook da Hotmart
 * 
 * Este script inicia o serviço de proxy em uma porta separada e envia
 * um webhook de teste para ele
 */
const http = require('http');
const { exec } = require('child_process');

// Configurações
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3333;
const WEBHOOK_URL = `http://localhost:${WEBHOOK_PORT}/webhook/hotmart`;

// Dados de teste do webhook (simulando uma compra aprovada com formato real da Hotmart)
const webhookData = {
  id: `083bb5a0-f7e0-414b-b600-585a01${Date.now().toString().slice(-6)}`,
  creation_date: new Date().toISOString(),
  event: 'PURCHASE_APPROVED',
  version: "2.0",
  data: {
    buyer: {
      email: 'teste@designauto.com.br',
      name: 'Usuário Teste',
      checkout_phone: "+5511999999999"
    },
    purchase: {
      transaction: `TRANS-${Date.now().toString().slice(-6)}`,
      order_date: new Date().toISOString(),
      approved_date: new Date().toISOString(),
      status: "APPROVED",
      payment: {
        method: "CREDIT_CARD",
        installment_number: 1
      },
      price: {
        value: 297.00
      }
    },
    product: {
      id: "1820731",
      name: "DesignAuto Premium",
      has_co_production: false
    },
    offer: {
      code: "DAUTOANUAL",
      payment_mode: "PAYMENT_SINGLE"
    },
    producer: {
      name: "Design Auto"
    },
    commissions: [],
    subscription: null,
    affiliate: null
  }
};

// Inicia o servidor proxy em segundo plano
function startProxyServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Iniciando servidor de proxy de webhook...');
    
    const proxyProcess = exec('node webhook-proxy.cjs', (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao executar o servidor de proxy: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Erro no servidor de proxy: ${stderr}`);
        return;
      }
    });
    
    // Dar tempo para o servidor iniciar
    setTimeout(() => {
      console.log('✅ Servidor de proxy iniciado com sucesso');
      resolve(proxyProcess);
    }, 2000);
  });
}

// Função para testar a conexão com o servidor de proxy
function testProxyConnection() {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testando conexão com o servidor de proxy: ${WEBHOOK_URL.replace('/webhook/hotmart', '/webhook/status')}`);
    
    const req = http.request(
      `${WEBHOOK_URL.replace('/webhook/hotmart', '/webhook/status')}`,
      { method: 'GET' },
      (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            console.log('✅ Conexão com o servidor de proxy estabelecida com sucesso');
            console.log('📋 Status do servidor:', parsedData);
            resolve(true);
          } catch (error) {
            console.error('❌ Erro ao processar resposta do servidor:', error.message);
            resolve(false);
          }
        });
      }
    );
    
    req.on('error', (error) => {
      console.error('❌ Erro ao conectar com o servidor de proxy:', error.message);
      resolve(false);
    });
    
    req.end();
  });
}

// Função para enviar um webhook de teste para o proxy
function sendTestWebhook() {
  return new Promise((resolve, reject) => {
    console.log(`📡 Enviando webhook de teste para: ${WEBHOOK_URL}`);
    
    // Gerar um ID de rastreamento único para este teste
    const traceId = `test-${Date.now()}`;
    const data = JSON.stringify(webhookData);
    
    // Adicionar cabeçalhos que simulam um request real da Hotmart
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Hotmart-Signature': `teste-sig-${traceId}`, // Assinatura simulada
        'User-Agent': 'Hotmart-Webhook/1.0',
        'X-Hotmart-Webhook-Trace-ID': traceId,
        'Accept': 'application/json'
      }
    };
    
    console.log('🔍 Enviando com headers:', JSON.stringify(options.headers, null, 2));
    console.log('📊 Payload:', data.substring(0, 200) + '... (truncado)');
    
    const req = http.request(
      WEBHOOK_URL,
      options,
      (res) => {
        let responseData = '';
        
        // Log do status e headers de resposta para debugging
        console.log(`📥 Resposta recebida com status: ${res.statusCode}`);
        console.log('📥 Headers de resposta:', JSON.stringify(res.headers, null, 2));
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log(`📄 Dados da resposta (${responseData.length} bytes): "${responseData.substring(0, 100)}${responseData.length > 100 ? '...' : ''}"`);
          
          // Tentar analisar a resposta como JSON
          try {
            if (responseData.trim() === '') {
              console.log('⚠️ Resposta vazia do servidor');
              resolve({ 
                success: false, 
                message: 'Resposta vazia do servidor',
                statusCode: res.statusCode,
                headers: res.headers 
              });
              return;
            }
            
            const parsedResponse = JSON.parse(responseData);
            console.log(`✅ Webhook enviado com sucesso! Status: ${res.statusCode}`);
            console.log('📋 Resposta do servidor:', JSON.stringify(parsedResponse, null, 2));
            resolve(parsedResponse);
          } catch (error) {
            console.error('❌ Erro ao processar resposta do webhook como JSON:', error.message);
            console.log('Resposta bruta completa:', responseData);
            
            // Tentar determinar o tipo de resposta
            if (responseData.includes('<!DOCTYPE html>') || responseData.includes('<html>')) {
              console.log('⚠️ Resposta contém HTML (possível interceptação pelo Vite)');
            }
            
            resolve({ 
              success: false, 
              error: error.message,
              rawResponse: responseData.substring(0, 500),
              statusCode: res.statusCode,
              headers: res.headers 
            });
          }
        });
      }
    );
    
    req.on('error', (error) => {
      console.error('❌ Erro ao enviar webhook:', error.message);
      resolve({ success: false, error: error.message });
    });
    
    req.write(data);
    req.end();
  });
}

// Função principal que executa o teste completo
async function runFullTest() {
  console.log('🔄 Iniciando teste completo do proxy de webhook...');
  
  try {
    // Inicia o servidor de proxy
    const proxyProcess = await startProxyServer();
    
    // Testa a conexão com o servidor
    const isConnected = await testProxyConnection();
    if (!isConnected) {
      console.error('❌ Não foi possível conectar ao servidor de proxy. Abortando teste.');
      process.exit(1);
    }
    
    // Envia um webhook de teste
    const webhookResult = await sendTestWebhook();
    
    // Encerra o teste
    console.log('✅ Teste completo finalizado');
    
    // Encerra o processo do proxy após 2 segundos para dar tempo de processar o webhook
    setTimeout(() => {
      console.log('🛑 Encerrando servidor de proxy...');
      
      if (proxyProcess && proxyProcess.pid) {
        try {
          process.kill(proxyProcess.pid);
          console.log('✅ Servidor de proxy encerrado com sucesso');
        } catch (error) {
          console.error('❌ Erro ao encerrar servidor de proxy:', error.message);
        }
      }
      
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

// Executar o teste
runFullTest();