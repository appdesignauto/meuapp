/**
 * Script para testar a autenticação nos ambientes de Produção e Sandbox da Hotmart
 */

const axios = require('axios');
require('dotenv').config();

// Credenciais Hotmart
const CLIENT_ID = '8c126e59-7bd0-49af-a402-ec7849a686d8';
const CLIENT_SECRET = '90bf5921-9565-4f1e-9763-19f7f2457d00';

// Ambientes da Hotmart
const ENVIRONMENTS = {
  PROD: {
    name: 'Produção',
    authUrl: 'https://developers.hotmart.com/security/oauth/token',
    subscriptionsUrl: 'https://developers.hotmart.com/payments/api/v1/subscriptions'
  },
  SANDBOX: {
    name: 'Sandbox',
    authUrl: 'https://sandbox.hotmart.com/security/oauth/token',
    subscriptionsUrl: 'https://sandbox.hotmart.com/payments/api/v1/subscriptions'
  }
};

// Token Basic gerado a partir das credenciais
const BASIC_TOKEN = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const BASIC_TOKEN_HEADER = `Basic ${BASIC_TOKEN}`;

async function testAuthWithClientCredentials(environment) {
  console.log(`\n=== TESTE DE AUTENTICAÇÃO NO AMBIENTE ${environment.name} ===`);
  console.log(`URL de autenticação: ${environment.authUrl}`);
  
  try {
    // Formato com grant_type como parâmetro e Authorization no header
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    
    const config = {
      method: 'post',
      url: environment.authUrl,
      headers: {
        'Authorization': BASIC_TOKEN_HEADER,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    };
    
    console.log('Enviando requisição...');
    const response = await axios(config);
    
    console.log(`Status: ${response.status}`);
    
    if (response.data && response.data.access_token) {
      console.log('✅ SUCESSO! Token obtido.');
      console.log(`Token: ${response.data.access_token.substring(0, 10)}...`);
      console.log(`Expira em: ${response.data.expires_in} segundos`);
      return {
        success: true,
        token: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } else {
      console.log('❌ FALHA: Resposta não contém token de acesso');
      console.log('Resposta:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ ERRO na requisição:');
    console.log(`Mensagem: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Dados:', error.response.data);
    }
    
    return { success: false, error };
  }
}

async function testAuthWithClientParams(environment) {
  console.log(`\n=== TESTE DE AUTENTICAÇÃO ALTERNATIVA NO AMBIENTE ${environment.name} ===`);
  console.log(`URL de autenticação: ${environment.authUrl}`);
  
  try {
    // Formato alternativo com client_id e client_secret como parâmetros
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    
    const config = {
      method: 'post',
      url: environment.authUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    };
    
    console.log('Enviando requisição alternativa...');
    const response = await axios(config);
    
    console.log(`Status: ${response.status}`);
    
    if (response.data && response.data.access_token) {
      console.log('✅ SUCESSO! Token obtido com método alternativo.');
      console.log(`Token: ${response.data.access_token.substring(0, 10)}...`);
      console.log(`Expira em: ${response.data.expires_in} segundos`);
      return {
        success: true,
        token: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } else {
      console.log('❌ FALHA: Resposta não contém token de acesso');
      console.log('Resposta:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ ERRO na requisição:');
    console.log(`Mensagem: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Dados:', error.response.data);
    }
    
    return { success: false, error };
  }
}

async function testSubscriptions(environment, token) {
  if (!token) {
    console.log(`\n=== TESTE DE ASSINATURAS NO AMBIENTE ${environment.name} ===`);
    console.log('❓ PULANDO: Nenhum token de acesso disponível');
    return;
  }
  
  console.log(`\n=== TESTE DE ASSINATURAS NO AMBIENTE ${environment.name} ===`);
  console.log(`URL de assinaturas: ${environment.subscriptionsUrl}`);
  
  try {
    const params = new URLSearchParams();
    params.append('status', 'ACTIVE');
    params.append('max_results', '10');
    
    const url = `${environment.subscriptionsUrl}?${params.toString()}`;
    
    const config = {
      method: 'get',
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('Enviando requisição de assinaturas...');
    const response = await axios(config);
    
    console.log(`Status: ${response.status}`);
    
    if (response.data && response.data.items) {
      console.log(`✅ SUCESSO! ${response.data.items.length} assinaturas encontradas.`);
      
      if (response.data.items.length > 0) {
        console.log('\nDetalhes das assinaturas:');
        response.data.items.forEach((sub, index) => {
          console.log(`\nAssinatura ${index + 1}:`);
          console.log(`ID: ${sub.id || 'N/A'}`);
          console.log(`Plano: ${sub.plan?.name || 'Plano não especificado'}`);
          console.log(`Status: ${sub.status || 'Status desconhecido'}`);
          console.log(`Cliente: ${sub.subscriber?.name || 'Nome não disponível'} (${sub.subscriber?.email || 'Email não disponível'})`);
          console.log(`Produto: ${sub.product?.name || 'Produto não especificado'} (ID: ${sub.product?.id || 'N/A'})`);
          console.log(`Data de início: ${sub.accessionDate || 'Data não disponível'}`);
          console.log(`Próximo pagamento: ${sub.nextChargeDate || 'Data não disponível'}`);
          console.log(`Valor: ${sub.price?.value || 0} ${sub.price?.currency || 'BRL'}`);
        });
      }
      
      return {
        success: true,
        count: response.data.items.length,
        subscriptions: response.data.items
      };
    } else {
      console.log('❌ FALHA: Resposta não contém assinaturas');
      console.log('Resposta:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ ERRO na requisição de assinaturas:');
    console.log(`Mensagem: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Dados:', error.response.data);
    }
    
    return { success: false, error };
  }
}

async function runTests() {
  console.log('=====================================================');
  console.log('DIAGNÓSTICO DE CONEXÃO HOTMART - MULTIPLOS AMBIENTES');
  console.log('=====================================================');
  console.log(`Data e hora: ${new Date().toISOString()}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Client Secret: ${CLIENT_SECRET.substring(0, 4)}...${CLIENT_SECRET.substring(CLIENT_SECRET.length - 4)}`);
  
  // Testes em produção
  const prodAuth = await testAuthWithClientCredentials(ENVIRONMENTS.PROD);
  let prodToken = prodAuth.success ? prodAuth.token : null;
  
  if (!prodToken) {
    const prodAuthAlt = await testAuthWithClientParams(ENVIRONMENTS.PROD);
    prodToken = prodAuthAlt.success ? prodAuthAlt.token : null;
  }
  
  await testSubscriptions(ENVIRONMENTS.PROD, prodToken);
  
  // Testes em sandbox
  const sandboxAuth = await testAuthWithClientCredentials(ENVIRONMENTS.SANDBOX);
  let sandboxToken = sandboxAuth.success ? sandboxAuth.token : null;
  
  if (!sandboxToken) {
    const sandboxAuthAlt = await testAuthWithClientParams(ENVIRONMENTS.SANDBOX);
    sandboxToken = sandboxAuthAlt.success ? sandboxAuthAlt.token : null;
  }
  
  await testSubscriptions(ENVIRONMENTS.SANDBOX, sandboxToken);
  
  // Resumo
  console.log('\n=====================================================');
  console.log('RESUMO DOS TESTES');
  console.log('=====================================================');
  console.log(`Ambiente de Produção: ${prodToken ? 'FUNCIONAL ✅' : 'NÃO FUNCIONAL ❌'}`);
  console.log(`Ambiente de Sandbox: ${sandboxToken ? 'FUNCIONAL ✅' : 'NÃO FUNCIONAL ❌'}`);
  
  if (!prodToken && !sandboxToken) {
    console.log('\n⚠️ CONCLUSÃO: Nenhum ambiente está funcionando com as credenciais fornecidas.');
    console.log('Recomendações:');
    console.log('1. Verifique se as credenciais estão corretas e ativas');
    console.log('2. Verifique se a conta Hotmart está ativa e com permissões corretas');
    console.log('3. Certifique-se de que o aplicativo na Hotmart tem acesso às APIs necessárias');
    console.log('4. Se possível, gere um novo par de credenciais no painel da Hotmart');
  } else {
    if (prodToken) {
      console.log('\n✅ CONCLUSÃO: O ambiente de PRODUÇÃO está funcionando corretamente.');
      console.log('Recomendações:');
      console.log('1. Atualize o código para usar a URL base https://developers.hotmart.com/');
      console.log('2. Configure a aplicação para usar o ambiente de produção');
    } else if (sandboxToken) {
      console.log('\n✅ CONCLUSÃO: O ambiente de SANDBOX está funcionando corretamente.');
      console.log('Recomendações:');
      console.log('1. Atualize o código para usar a URL base https://sandbox.hotmart.com/');
      console.log('2. Configure a aplicação para usar o ambiente de sandbox');
    }
  }
}

// Executar os testes
runTests();