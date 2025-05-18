// test-hotmart-credentials.js
// Script para testar as credenciais da Hotmart

import dotenv from 'dotenv';
import pg from 'pg';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

dotenv.config();
const { Pool } = pg;

// URLs da API
// Usando a URL da API de produção conforme documentação
const HOTMART_AUTH_URL = 'https://developers.hotmart.com/oauth/token';

async function getHotmartCredentials() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar configurações da Hotmart no banco de dados
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
    
    // Converter resultado para objeto
    result.rows.forEach(row => {
      if (row.key === 'client_id') {
        credentials.clientId = row.value;
      } else if (row.key === 'client_secret') {
        credentials.clientSecret = row.value;
      }
    });
    
    return credentials;
  } catch (error) {
    console.error('Erro ao buscar credenciais da Hotmart:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function testHotmartCredentials() {
  try {
    console.log('Obtendo credenciais da Hotmart do banco de dados...');
    const credentials = await getHotmartCredentials();
    
    if (!credentials.clientId || !credentials.clientSecret) {
      console.error('Credenciais da Hotmart não encontradas no banco de dados.');
      return;
    }
    
    console.log(`Credenciais encontradas:
- Client ID: ${credentials.clientId}
- Client Secret: ${credentials.clientSecret.substring(0, 4)}...${credentials.clientSecret.substring(credentials.clientSecret.length - 4)}`);
    
    // Parâmetros para autenticação OAuth2
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', credentials.clientId);
    params.append('client_secret', credentials.clientSecret);
    
    console.log('Tentando obter token de acesso da Hotmart...');
    
    // Fazer requisição para obter token
    const response = await fetch(HOTMART_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Erro ao obter token de acesso: ${response.status}`);
      console.error(`Resposta: ${responseText.substring(0, 500)}...`);
      return;
    }
    
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Autenticação bem sucedida!');
      console.log(`Token obtido: ${data.access_token.substring(0, 10)}...`);
      console.log(`Tipo de token: ${data.token_type}`);
      console.log(`Expira em: ${data.expires_in} segundos`);
      console.log('\nAs credenciais da Hotmart estão funcionando corretamente.');
    } catch (jsonError) {
      console.error('Erro ao analisar resposta JSON:', jsonError);
      console.error('Primeiros 1000 caracteres da resposta:');
      console.error(responseText.substring(0, 1000));
    }
  } catch (error) {
    console.error('Erro ao testar credenciais da Hotmart:', error);
  }
}

// Executar o teste
testHotmartCredentials();