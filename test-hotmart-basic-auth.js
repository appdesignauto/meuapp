// test-hotmart-basic-auth.js
// Testando a autenticação da Hotmart com Basic Auth

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
    
    const basicAuth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');
    
    // Testa o endpoint de token com Basic Auth
    console.log('\n📡 Testando sandbox com Basic Auth...');
    
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      
      const response = await axios({
        method: 'post',
        url: 'https://sandbox.hotmart.com/oauth/token',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params,
        validateStatus: () => true // Não lançar exceção para status de erro
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Autenticação bem-sucedida!');
        console.log(`Token: ${response.data.access_token.substring(0, 10)}...`);
        console.log(`Tipo: ${response.data.token_type}`);
        console.log(`Expira em: ${response.data.expires_in} segundos`);
      } else {
        console.log('❌ Falha na autenticação:');
        console.log(JSON.stringify(response.data, null, 2));
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
    
    // Testa o endpoint da API de ambiente de produção
    console.log('\n📡 Testando produção com Basic Auth...');
    
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      
      const response = await axios({
        method: 'post',
        url: 'https://developers.hotmart.com/oauth/token',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params,
        validateStatus: () => true // Não lançar exceção para status de erro
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Autenticação bem-sucedida!');
        console.log(`Token: ${response.data.access_token.substring(0, 10)}...`);
        console.log(`Tipo: ${response.data.token_type}`);
        console.log(`Expira em: ${response.data.expires_in} segundos`);
      } else {
        console.log('❌ Falha na autenticação:');
        console.log(JSON.stringify(response.data, null, 2));
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
  } catch (error) {
    console.error('Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

testHotmartCredentials();