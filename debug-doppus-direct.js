/**
 * Script para testar diretamente a conexão com a API da Hotmart para integração Doppus
 * Este script usa abordagens diferentes para tentar identificar o problema exato
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

dotenv.config();

// Conexão com o banco de dados
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function getCredentialsFromDB() {
  try {
    console.log('Buscando credenciais no banco de dados...');
    const [row] = await db.execute(
      'SELECT "doppusClientId", "doppusClientSecret", "doppusSecretKey", "hotmartClientId", "hotmartClientSecret" FROM "subscriptionSettings" LIMIT 1'
    );

    if (!row) {
      throw new Error('Configurações de subscrição não encontradas');
    }

    console.log('Credenciais encontradas:');
    for (const key in row) {
      if (row[key]) {
        console.log(`- ${key}: ${key.includes('Secret') ? '(valor oculto)' : row[key].substring(0, 4) + '...' + row[key].slice(-4)}`);
      } else {
        console.log(`- ${key}: não definido`);
      }
    }

    return row;
  } catch (error) {
    console.error('Erro ao buscar credenciais:', error);
    throw error;
  }
}

// Teste com as credenciais do Doppus
async function testDoppusCredentials(clientId, clientSecret) {
  console.log('\n===== TESTE COM CREDENCIAIS DOPPUS =====');
  const url = 'https://api.hotmart.com/oauth/token';
  
  console.log('URL: ' + url);
  console.log('Client ID: ' + (clientId ? clientId.substring(0, 4) + '...' + clientId.slice(-4) : 'não definido'));
  console.log('Client Secret: ' + (clientSecret ? '(valor oculto)' : 'não definido'));
  
  try {
    const params = new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': clientId,
      'client_secret': clientSecret
    });
    
    console.log('Parâmetros enviados: ' + params.toString().replace(clientSecret, '[SECRET]'));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });
    
    console.log('Status: ' + response.status);
    console.log('Headers:');
    response.headers.forEach((value, name) => {
      console.log(`- ${name}: ${value}`);
    });
    
    const text = await response.text();
    console.log('Resposta: ' + text);
    
    try {
      const json = JSON.parse(text);
      console.log('Resposta em JSON: ' + JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Resposta não é um JSON válido');
    }
    
    return response.ok;
  } catch (error) {
    console.error('Erro na requisição:', error);
    return false;
  }
}

// Teste com as credenciais Hotmart (que já sabemos que funcionam)
async function testHotmartCredentials(clientId, clientSecret) {
  console.log('\n===== TESTE COM CREDENCIAIS HOTMART (CONTROLE) =====');
  const url = 'https://api.hotmart.com/oauth/token';
  
  console.log('URL: ' + url);
  console.log('Client ID: ' + (clientId ? clientId.substring(0, 4) + '...' + clientId.slice(-4) : 'não definido'));
  console.log('Client Secret: ' + (clientSecret ? '(valor oculto)' : 'não definido'));
  
  try {
    const params = new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': clientId,
      'client_secret': clientSecret
    });
    
    console.log('Parâmetros enviados: ' + params.toString().replace(clientSecret, '[SECRET]'));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });
    
    console.log('Status: ' + response.status);
    console.log('Headers:');
    response.headers.forEach((value, name) => {
      console.log(`- ${name}: ${value}`);
    });
    
    const text = await response.text();
    console.log('Resposta: ' + text);
    
    try {
      const json = JSON.parse(text);
      console.log('Resposta em JSON: ' + JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Resposta não é um JSON válido');
    }
    
    return response.ok;
  } catch (error) {
    console.error('Erro na requisição:', error);
    return false;
  }
}

// Função principal que vai executar todos os testes
async function runAllTests() {
  console.log('=== DIAGNÓSTICO COMPLETO DA CONEXÃO DOPPUS/HOTMART ===');
  console.log('Data/hora: ' + new Date().toISOString());
  
  try {
    // Obter credenciais do banco de dados
    const creds = await getCredentialsFromDB();
    
    // Primeiro testa com as credenciais da Doppus
    const doppusResult = await testDoppusCredentials(creds.doppusClientId, creds.doppusClientSecret);
    console.log('Resultado do teste Doppus: ' + (doppusResult ? 'SUCESSO' : 'FALHA'));
    
    // Depois testa com as credenciais da Hotmart como controle
    const hotmartResult = await testHotmartCredentials(creds.hotmartClientId, creds.hotmartClientSecret);
    console.log('Resultado do teste Hotmart: ' + (hotmartResult ? 'SUCESSO' : 'FALHA'));
    
    console.log('\n=== CONCLUSÃO ===');
    if (doppusResult) {
      console.log('✅ Conexão com API da Hotmart usando credenciais Doppus funcionou!');
    } else {
      console.log('❌ Conexão com API da Hotmart usando credenciais Doppus falhou.');
      if (hotmartResult) {
        console.log('⚠️ Como o teste com Hotmart funcionou, o problema está nas credenciais da Doppus.');
        console.log('Verifique se os IDs e segredos da Doppus estão corretos.');
      } else {
        console.log('⚠️ Ambos os testes falharam. Pode haver um problema geral de conectividade ou com a API.');
      }
    }
  } catch (error) {
    console.error('Erro ao executar testes:', error);
  } finally {
    await pool.end();
  }
}

// Executa todos os testes
runAllTests().catch(console.error);