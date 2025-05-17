/**
 * Script para testar a autenticação com a API Doppus
 * Este script testa diretamente a integração com a API Doppus usando
 * as credenciais armazenadas no banco de dados
 */

import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

const { Pool } = pg;
dotenv.config();

// Função principal
async function testDoppusAuth() {
  try {
    console.log('==== INICIANDO TESTE DE AUTENTICAÇÃO DOPPUS ====');
    
    // Obter credenciais do banco de dados
    const credentials = await getCredentialsFromDB();
    
    if (!credentials) {
      console.error('❌ Não foi possível obter as credenciais do banco de dados');
      return;
    }
    
    console.log('✅ Credenciais obtidas com sucesso do banco de dados');
    console.log(`- Client ID: ${credentials.doppusClientId.substring(0, 4)}...${credentials.doppusClientId.slice(-4)}`);
    console.log(`- Client Secret: ${credentials.doppusClientSecret ? 'definido' : 'não definido'}`);
    console.log(`- Secret Key: ${credentials.doppusSecretKey ? 'definido' : 'não definido'}`);
    
    // Testar a autenticação com a API
    await testAuthentication(credentials);
    
  } catch (error) {
    console.error('❌ Erro no teste de autenticação:', error);
  }
}

// Obter credenciais do banco de dados
async function getCredentialsFromDB() {
  console.log('Conectando ao banco de dados...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    const result = await pool.query(`
      SELECT "doppusClientId", "doppusClientSecret", "doppusSecretKey"
      FROM "subscriptionSettings"
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.error('❌ Nenhuma configuração encontrada na tabela subscriptionSettings');
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Erro ao consultar o banco de dados:', error);
    return null;
  } finally {
    await pool.end();
  }
}

// Testar autenticação com a API Doppus
async function testAuthentication(credentials) {
  console.log('\nTestando autenticação com a API Doppus...');
  
  // URL base da API (conforme documentação)
  const baseUrl = 'https://api.doppus.app/4.0';
  console.log(`- URL base: ${baseUrl}`);
  
  // Endpoint de autenticação
  const authEndpoint = `${baseUrl}/Auth`;
  console.log(`- Endpoint: ${authEndpoint}`);
  
  // Parâmetros da requisição
  const params = new URLSearchParams({
    'grant_type': 'client_credentials'
  });
  
  // Autenticação Basic
  const authString = Buffer.from(`${credentials.doppusClientId}:${credentials.doppusClientSecret}`).toString('base64');
  console.log(`- Autenticação: Basic ${authString.substring(0, 8)}...`);
  
  try {
    console.log('Enviando requisição...');
    
    const response = await fetch(authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: params
    });
    
    console.log(`- Status da resposta: ${response.status}`);
    
    const data = await response.text();
    
    // Tentar converter para JSON se possível
    try {
      const jsonData = JSON.parse(data);
      console.log('- Resposta (JSON):');
      console.log(JSON.stringify(jsonData, null, 2));
      
      // Verificar se a autenticação foi bem-sucedida
      if (jsonData.success) {
        console.log('\n✅ AUTENTICAÇÃO BEM-SUCEDIDA!');
        console.log(`- Token: ${jsonData.data.token.substring(0, 10)}...`);
        console.log(`- Tipo: ${jsonData.data.token_type}`);
        console.log(`- Expira em: ${jsonData.data.expire_in}`);
      } else {
        console.log('\n❌ AUTENTICAÇÃO FALHOU!');
        console.log(`- Mensagem: ${jsonData.message || 'Nenhuma mensagem de erro'}`);
      }
    } catch (e) {
      // Se não for JSON, mostrar o texto da resposta
      console.log('- Resposta (texto):');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Erro ao fazer requisição:', error);
  }
}

// Executar o teste
const run = async () => {
  try {
    await testDoppusAuth();
    console.log('\n==== TESTE CONCLUÍDO ====');
  } catch (err) {
    console.error('Erro fatal:', err);
  }
};

run();