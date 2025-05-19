/**
 * Script de diagnóstico da API Hotmart
 * 
 * Este script testa diferentes abordagens de autenticação e requisição
 * para identificar exatamente onde está o problema.
 */

const axios = require('axios');
require('dotenv').config();

// Credenciais Hotmart fornecidas pelo usuário
const CLIENT_ID = '8c126e59-7bd0-49af-a402-ec7849a686d8';
const CLIENT_SECRET = '90bf5921-9565-4f1e-9763-19f7f2457d00';

// URLs da API
const AUTH_URL = 'https://developers.hotmart.com/security/oauth/token';
const SUBSCRIPTIONS_URL = 'https://developers.hotmart.com/payments/api/v1/subscriptions';

// Token Basic gerado a partir das credenciais
const BASIC_TOKEN = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const BASIC_TOKEN_HEADER = `Basic ${BASIC_TOKEN}`;

// Token Basic hardcoded que estava sendo usado anteriormente
const HARDCODED_BASIC_TOKEN = 'Basic OGMxMjZlNTktN2JkMC00OWFmLWE0MDItZWM3ODQ5YTY4NmQ4OjkwYmY1OTIxLTk1NjUtNGYxZS05NzYzLTE5ZjdmMjQ1N2QwMA==';

async function testTokenGeneration() {
  console.log('=== TESTE DE GERAÇÃO DE TOKEN BASIC ===');
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Client Secret: ${CLIENT_SECRET.substring(0, 4)}...${CLIENT_SECRET.substring(CLIENT_SECRET.length - 4)}`);
  console.log(`Token Basic gerado: ${BASIC_TOKEN_HEADER}`);
  console.log(`Token Basic hardcoded: ${HARDCODED_BASIC_TOKEN}`);
  console.log(`Tokens são iguais? ${BASIC_TOKEN_HEADER === HARDCODED_BASIC_TOKEN ? 'SIM' : 'NÃO'}`);
  
  if (BASIC_TOKEN_HEADER !== HARDCODED_BASIC_TOKEN) {
    console.log('AVISO: Os tokens Basic são diferentes. Isso pode ser a causa do problema.');
    console.log(`Gerado: ${BASIC_TOKEN}`);
    console.log(`Hardcoded: ${HARDCODED_BASIC_TOKEN.replace('Basic ', '')}`);
  }
}

async function testConnectionWithGeneratedToken() {
  console.log('\n=== TESTE DE CONEXÃO COM TOKEN BASIC GERADO ===');
  try {
    // Parâmetros para solicitação de token
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    
    // Configuração da requisição
    const config = {
      method: 'post',
      url: AUTH_URL,
      headers: {
        'Authorization': BASIC_TOKEN_HEADER,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    };
    
    console.log('Fazendo requisição para obter token...');
    console.log(`URL: ${AUTH_URL}`);
    console.log(`Headers: Authorization=${BASIC_TOKEN_HEADER.replace(CLIENT_SECRET, '****')}`);
    
    // Faz a requisição
    const response = await axios(config);
    
    // Verifica a resposta
    console.log('Resposta recebida:');
    console.log(`Status: ${response.status}`);
    console.log('Dados:', response.data);
    
    if (response.data && response.data.access_token) {
      console.log('SUCESSO: Token de acesso obtido!');
      return response.data.access_token;
    } else {
      console.log('FALHA: Resposta não contém token de acesso.');
      return null;
    }
  } catch (error) {
    console.log('ERRO ao obter token:');
    console.log(`Mensagem: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Dados da resposta:', error.response.data);
    }
    
    return null;
  }
}

async function testConnectionWithHardcodedToken() {
  console.log('\n=== TESTE DE CONEXÃO COM TOKEN BASIC HARDCODED ===');
  try {
    // Parâmetros para solicitação de token
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    
    // Configuração da requisição
    const config = {
      method: 'post',
      url: AUTH_URL,
      headers: {
        'Authorization': HARDCODED_BASIC_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    };
    
    console.log('Fazendo requisição para obter token...');
    console.log(`URL: ${AUTH_URL}`);
    console.log(`Headers: Authorization=${HARDCODED_BASIC_TOKEN.substring(0, 15)}...`);
    
    // Faz a requisição
    const response = await axios(config);
    
    // Verifica a resposta
    console.log('Resposta recebida:');
    console.log(`Status: ${response.status}`);
    console.log('Dados:', response.data);
    
    if (response.data && response.data.access_token) {
      console.log('SUCESSO: Token de acesso obtido!');
      return response.data.access_token;
    } else {
      console.log('FALHA: Resposta não contém token de acesso.');
      return null;
    }
  } catch (error) {
    console.log('ERRO ao obter token:');
    console.log(`Mensagem: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Dados da resposta:', error.response.data);
    }
    
    return null;
  }
}

async function testAlternativeAuthFormat() {
  console.log('\n=== TESTE COM FORMATO ALTERNATIVO DE AUTENTICAÇÃO ===');
  try {
    // Formato alternativo usando client_id e client_secret como parâmetros
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    
    // Configuração da requisição sem Authorization header
    const config = {
      method: 'post',
      url: AUTH_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    };
    
    console.log('Fazendo requisição para obter token com formato alternativo...');
    console.log(`URL: ${AUTH_URL}`);
    console.log('Usando client_id e client_secret como parâmetros no corpo da requisição');
    
    // Faz a requisição
    const response = await axios(config);
    
    // Verifica a resposta
    console.log('Resposta recebida:');
    console.log(`Status: ${response.status}`);
    console.log('Dados:', response.data);
    
    if (response.data && response.data.access_token) {
      console.log('SUCESSO: Token de acesso obtido!');
      return response.data.access_token;
    } else {
      console.log('FALHA: Resposta não contém token de acesso.');
      return null;
    }
  } catch (error) {
    console.log('ERRO ao obter token:');
    console.log(`Mensagem: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Dados da resposta:', error.response.data);
    }
    
    return null;
  }
}

async function testSubscriptionsRequest(accessToken) {
  if (!accessToken) {
    console.log('\n=== TESTE DE OBTENÇÃO DE ASSINATURAS ===');
    console.log('PULANDO: Nenhum token de acesso disponível');
    return;
  }
  
  console.log('\n=== TESTE DE OBTENÇÃO DE ASSINATURAS ===');
  try {
    // Parâmetros para filtrar apenas assinaturas ativas
    const params = {
      'status': 'ACTIVE',
      'max_results': 10
    };
    
    // Constrói a URL com os parâmetros
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      queryParams.append(key, value);
    }
    const url = `${SUBSCRIPTIONS_URL}?${queryParams.toString()}`;
    
    // Configuração da requisição
    const config = {
      method: 'get',
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('Fazendo requisição para obter assinaturas...');
    console.log(`URL: ${url}`);
    console.log(`Headers: Authorization=Bearer ${accessToken.substring(0, 10)}...`);
    
    // Faz a requisição
    const response = await axios(config);
    
    // Verifica a resposta
    console.log('Resposta recebida:');
    console.log(`Status: ${response.status}`);
    
    if (response.data && response.data.items) {
      console.log(`SUCESSO: ${response.data.items.length} assinaturas encontradas`);
      console.log('Primeiras assinaturas:', response.data.items.slice(0, 2));
    } else {
      console.log('FALHA: Resposta não contém assinaturas.');
    }
  } catch (error) {
    console.log('ERRO ao obter assinaturas:');
    console.log(`Mensagem: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Dados da resposta:', error.response.data);
    }
  }
}

async function runAllTests() {
  try {
    console.log('===================================================');
    console.log('DIAGNÓSTICO DE CONEXÃO COM A API HOTMART');
    console.log('===================================================');
    console.log(`Data e hora: ${new Date().toISOString()}`);
    
    // Teste 1: Geração de token Basic
    await testTokenGeneration();
    
    // Teste 2: Conexão com token Basic gerado
    const tokenFromGenerated = await testConnectionWithGeneratedToken();
    
    // Teste 3: Conexão com token Basic hardcoded
    const tokenFromHardcoded = await testConnectionWithHardcodedToken();
    
    // Teste 4: Formato alternativo de autenticação
    const tokenFromAlternative = await testAlternativeAuthFormat();
    
    // Teste 5: Requisição de assinaturas
    // Usa o primeiro token válido encontrado
    const validToken = tokenFromGenerated || tokenFromHardcoded || tokenFromAlternative;
    await testSubscriptionsRequest(validToken);
    
    console.log('\n===================================================');
    console.log('RESUMO DOS TESTES');
    console.log('===================================================');
    console.log(`Token gerado: ${tokenFromGenerated ? 'SUCESSO' : 'FALHA'}`);
    console.log(`Token hardcoded: ${tokenFromHardcoded ? 'SUCESSO' : 'FALHA'}`);
    console.log(`Formato alternativo: ${tokenFromAlternative ? 'SUCESSO' : 'FALHA'}`);
    
    if (!tokenFromGenerated && !tokenFromHardcoded && !tokenFromAlternative) {
      console.log('\n⚠️ CONCLUSÃO: Falha em todos os métodos de autenticação.');
      console.log('Possíveis causas:');
      console.log('1. Credenciais incorretas ou revogadas');
      console.log('2. Restrições de CORS ou rede');
      console.log('3. Problemas temporários na API da Hotmart');
      console.log('\nRecomendações:');
      console.log('- Verifique se as credenciais estão corretas');
      console.log('- Verifique se as credenciais têm permissão para acessar a API');
      console.log('- Entre em contato com o suporte da Hotmart para verificar o status da conta');
    } else {
      console.log('\n✅ CONCLUSÃO: Pelo menos um método de autenticação funcionou!');
      if (tokenFromAlternative && !tokenFromGenerated && !tokenFromHardcoded) {
        console.log('O método alternativo funcionou, mas os métodos principais falharam.');
        console.log('Recomendação: Atualize o código para usar o formato alternativo de autenticação.');
      }
    }
    
  } catch (error) {
    console.error('Erro durante os testes:', error);
  }
}

// Executa todos os testes
runAllTests();