// test-hotmart-oauth.js
// Script para testar a autenticação com a API da Hotmart seguindo a documentação oficial

import axios from 'axios';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

dotenv.config();

async function testHotmartAuthentication() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    console.log('Consultando credenciais da Hotmart no banco de dados...');
    
    const result = await pool.query(`
      SELECT key, value 
      FROM integration_settings
      WHERE provider = 'hotmart'
      AND (key = 'client_id' OR key = 'client_secret')
    `);
    
    const credentials = {
      clientId: null,
      clientSecret: null
    };
    
    result.rows.forEach(row => {
      if (row.key === 'client_id') {
        credentials.clientId = row.value;
      } else if (row.key === 'client_secret') {
        credentials.clientSecret = row.value;
      }
    });
    
    console.log(`Credenciais encontradas:
- Client ID: ${credentials.clientId}
- Client Secret: ${credentials.clientSecret.substring(0, 4)}...${credentials.clientSecret.substring(credentials.clientSecret.length - 4)}`);
    
    // Criar token de autorização Basic
    const basicAuth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');
    console.log(`Basic Auth Token gerado: ${basicAuth.substring(0, 10)}...`);
    
    // Teste com URL padrão conforme documentação
    const authUrl = 'https://developers.hotmart.com/security/oauth/token';
    
    console.log(`\n📡 Tentando autenticação com método e URL conforme documentação...`);
    console.log(`URL: ${authUrl}`);
    
    try {
      // Configurando parâmetros conforme a documentação
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      
      const response = await axios({
        method: 'post',
        url: authUrl,
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params,
        validateStatus: () => true // Não lançar exceção para status de erro
      });
      
      console.log(`Status da resposta: ${response.status} ${response.statusText}`);
      console.log('Detalhes da resposta:');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.status >= 200 && response.status < 300 && response.data.access_token) {
        console.log('\n✅ Autenticação bem-sucedida!');
        console.log(`Token: ${response.data.access_token.substring(0, 15)}...`);
        console.log(`Tipo: ${response.data.token_type}`);
        console.log(`Expira em: ${response.data.expires_in} segundos`);
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
    
    // Teste com URL alternativa (sandbox)
    const sandboxUrl = 'https://sandbox.hotmart.com/security/oauth/token';
    
    console.log(`\n📡 Tentando autenticação com ambiente de sandbox...`);
    console.log(`URL: ${sandboxUrl}`);
    
    try {
      // Configurando parâmetros conforme a documentação
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      
      const response = await axios({
        method: 'post',
        url: sandboxUrl,
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params,
        validateStatus: () => true // Não lançar exceção para status de erro
      });
      
      console.log(`Status da resposta: ${response.status} ${response.statusText}`);
      console.log('Detalhes da resposta:');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.status >= 200 && response.status < 300 && response.data.access_token) {
        console.log('\n✅ Autenticação bem-sucedida!');
        console.log(`Token: ${response.data.access_token.substring(0, 15)}...`);
        console.log(`Tipo: ${response.data.token_type}`);
        console.log(`Expira em: ${response.data.expires_in} segundos`);
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
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

testHotmartAuthentication();