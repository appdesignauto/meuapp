// test-hotmart-token.js - Script simplificado para testar autenticação Hotmart
// Este script usa Axios, que é uma biblioteca HTTP mais robusta

import axios from 'axios';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testHotmartCredentials() {
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
    
    // Tentativa #1: URL base conforme api-sec-vlc.hotmart.com
    await testAuthentication(
      credentials,
      'https://api-sec-vlc.hotmart.com/oauth/token',
      'API Security VLC'
    );

    // Tentativa #2: URL base conforme developers.hotmart.com
    await testAuthentication(
      credentials,
      'https://developers.hotmart.com/oauth/token',
      'Developers API'
    );
    
    // Tentativa #3: URL base conforme sandbox.hotmart.com
    await testAuthentication(
      credentials,
      'https://sandbox.hotmart.com/oauth/token',
      'Sandbox API'
    );
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

async function testAuthentication(credentials, baseUrl, label) {
  console.log(`\n📡 Tentando conexão com ${label} (${baseUrl})...`);
  
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', credentials.clientId);
    params.append('client_secret', credentials.clientSecret);
    
    const response = await axios({
      method: 'post',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params,
      validateStatus: () => true // Não lançar exceção para status de erro
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Autenticação bem-sucedida!');
      console.log(`Token: ${response.data.access_token.substring(0, 15)}...`);
      console.log(`Tipo: ${response.data.token_type}`);
      console.log(`Expira em: ${response.data.expires_in} segundos`);
    } else {
      console.log('❌ Falha na autenticação:');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Erro na conexão:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Resposta:', error.response.data);
    } else if (error.request) {
      console.log('Sem resposta do servidor');
    } else {
      console.log('Erro:', error.message);
    }
  }
}

testHotmartCredentials();