/**
 * Script para testar a conexão com a API da Doppus
 * usando as credenciais atualizadas do banco de dados
 */

import { Pool } from '@neondatabase/serverless';
import fetch from 'node-fetch';
import ws from 'ws';

// Configuração para o Neon Serverless
global.WebSocket = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testDoppusConnection() {
  console.log('==== TESTE DE CONEXÃO DOPPUS ====');
  
  try {
    // Buscar credenciais do banco de dados
    console.log('Buscando credenciais no banco de dados...');
    const client = await pool.connect();
    const result = await client.query(`
      SELECT "doppusClientId", "doppusClientSecret", "doppusSecretKey" 
      FROM "subscriptionSettings" 
      LIMIT 1
    `);
    client.release();
    
    if (result.rows.length === 0) {
      console.error('❌ Credenciais não encontradas no banco de dados');
      return;
    }
    
    const credentials = result.rows[0];
    console.log('✅ Credenciais encontradas:');
    console.log(`- Client ID: ${credentials.doppusClientId.substring(0, 4)}...${credentials.doppusClientId.slice(-4)}`);
    console.log(`- Client Secret: ${credentials.doppusClientSecret ? '(definido)' : 'não definido'}`);
    console.log(`- Secret Key: ${credentials.doppusSecretKey ? '(definido)' : 'não definido'}`);
    
    // Teste de conectividade com a API
    console.log('\nTestando conectividade com a API da Doppus...');
    const baseUrl = 'https://api.doppus.app/4.0';
    
    try {
      const testResponse = await fetch(`${baseUrl}/`);
      console.log(`✅ Conectividade básica: ${testResponse.status}`);
    } catch (error) {
      console.error('❌ Erro de conectividade:', error.message);
    }
    
    // Teste de autenticação
    console.log('\nTestando autenticação OAuth...');
    const authUrl = `${baseUrl}/Auth`;
    
    // Preparando params para o corpo
    const params = new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': credentials.doppusClientId,
      'client_secret': credentials.doppusClientSecret
    });
    
    // Autenticação básica
    const authString = Buffer.from(`${credentials.doppusClientId}:${credentials.doppusClientSecret}`).toString('base64');
    
    try {
      const authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`
        },
        body: params
      });
      
      console.log(`Status da resposta: ${authResponse.status}`);
      
      const authData = await authResponse.json();
      console.log('Resposta da autenticação:');
      console.log(JSON.stringify(authData, null, 2));
      
      if (authData.success && authData.data?.token) {
        console.log('✅ Autenticação bem-sucedida!');
        console.log(`- Token: ${authData.data.token.substring(0, 8)}...`);
        console.log(`- Tipo: ${authData.data.token_type}`);
        console.log(`- Expira em: ${authData.data.expire_in}`);
        
        // Teste de requisição autenticada
        console.log('\nTestando requisição autenticada...');
        try {
          // Testando vários endpoints possíveis para produtos
          console.log('Testando endpoints para produtos:');
          
          const endpoints = [
            '/Product', 
            '/Products',
            '/store/product',
            '/api/product',
            '/Products/List',
            '/Product/List'
          ];
          
          for (const endpoint of endpoints) {
            try {
              console.log(`\nTestando endpoint: ${endpoint}`);
              const testResponse = await fetch(`${baseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authData.data.token}`
                }
              });
              
              console.log(`Status: ${testResponse.status}`);
              if (testResponse.status !== 404) {
                const data = await testResponse.text();
                console.log(`Resposta: ${data.substring(0, 150)}...`);
                try {
                  const jsonData = JSON.parse(data);
                  console.log('Resposta JSON válida encontrada!');
                  if (jsonData.success) {
                    console.log('✅ Endpoint encontrado com sucesso!');
                  }
                } catch (e) {
                  console.log('Resposta não é JSON válido');
                }
              }
            } catch (e) {
              console.log(`Erro: ${e.message}`);
            }
          }
          
          // Finalizar o processo após testar todos os endpoints
        } catch (error) {
          console.error('❌ Erro na requisição autenticada:', error.message);
        }
      } else {
        console.log('❌ Autenticação falhou');
        console.log('Erro:', authData.error || 'Desconhecido');
      }
    } catch (error) {
      console.error('❌ Erro ao tentar autenticar:', error.message);
    }
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
  } finally {
    // Fechar o pool no final
    await pool.end();
  }
  
  console.log('\n==== TESTE CONCLUÍDO ====');
}

testDoppusConnection();