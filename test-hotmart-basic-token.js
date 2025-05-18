// test-hotmart-basic-token.js
// Script para testar autenticação com token Basic específico fornecido pelo usuário

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testHotmartWithBasicToken() {
  // Token Basic fornecido pelo usuário
  const basicToken = 'Basic OGMxMjZlNTktN2JkMC00OWFmLWE0MDItZWM3ODQ5YTY4NmQ4OjkwYmY1OTIxLTk1NjUtNGYxZS05NzYzLTE5ZjdmMjQ1N2QwMA==';
  
  // URLs da API
  const productionUrl = 'https://developers.hotmart.com/security/oauth/token';
  
  console.log(`\n📡 Testando autenticação com token Basic fornecido na API de produção...`);
  console.log(`URL: ${productionUrl}`);
  
  try {
    // Configurando parâmetros conforme a documentação
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    
    const response = await axios({
      method: 'post',
      url: productionUrl,
      headers: {
        'Authorization': basicToken,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params,
      validateStatus: () => true // Não lançar exceção para status de erro
    });
    
    console.log(`Status da resposta: ${response.status} ${response.statusText}`);
    console.log('Cabeçalhos da resposta:');
    console.log(JSON.stringify(response.headers, null, 2));
    console.log('Detalhes da resposta:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.status >= 200 && response.status < 300 && response.data.access_token) {
      console.log('\n✅ Autenticação bem-sucedida!');
      console.log(`Token: ${response.data.access_token.substring(0, 15)}...`);
      console.log(`Tipo: ${response.data.token_type}`);
      console.log(`Expira em: ${response.data.expires_in} segundos`);
      
      // Teste adicional - verificar produtos com o token obtido
      if (response.data.access_token) {
        await testProductsAPI(response.data.access_token);
      }
    } else {
      console.log('\n❌ Falha na autenticação ou formato inesperado de resposta');
    }
  } catch (error) {
    console.log('\n❌ Erro ao tentar autenticação:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Resposta:', error.response.data);
    } else if (error.request) {
      console.log('Sem resposta do servidor');
      console.log(error.request);
    } else {
      console.log('Erro:', error.message);
    }
  }
}

async function testProductsAPI(accessToken) {
  const productsUrl = 'https://developers.hotmart.com/payments/api/v1/products';
  
  console.log(`\n📡 Testando acesso à API de produtos com o token obtido...`);
  console.log(`URL: ${productsUrl}`);
  
  try {
    const response = await axios({
      method: 'get',
      url: productsUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });
    
    console.log(`Status da resposta: ${response.status} ${response.statusText}`);
    console.log('Detalhes da resposta:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.status >= 200 && response.status < 300) {
      console.log('\n✅ Acesso à API de produtos bem-sucedido!');
    } else {
      console.log('\n❌ Falha no acesso à API de produtos');
    }
  } catch (error) {
    console.log('\n❌ Erro ao acessar API de produtos:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Resposta:', error.response.data);
    } else if (error.request) {
      console.log('Sem resposta do servidor');
      console.log(error.request);
    } else {
      console.log('Erro:', error.message);
    }
  }
}

testHotmartWithBasicToken();