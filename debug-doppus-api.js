/**
 * Script para diagnóstico profundo da conexão com a API da Doppus
 * 
 * Este script testa diferentes cenários de conexão com a Doppus
 * para identificar o problema específico que está ocorrendo.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

dotenv.config();

// Conexão com o banco de dados
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function getCredentialsFromDB() {
  console.log('Buscando credenciais no banco de dados...');
  try {
    const [row] = await db.execute(
      'SELECT * FROM "subscriptionSettings" LIMIT 1'
    );

    if (!row) {
      throw new Error('Configurações de subscrição não encontradas no banco de dados');
    }

    console.log('Configurações encontradas:');
    console.log('- doppusClientId:', row.doppusClientId ? `${row.doppusClientId.substring(0, 4)}...${row.doppusClientId.slice(-4)}` : 'não definido');
    console.log('- doppusClientSecret:', row.doppusClientSecret ? 'definido (valor oculto)' : 'não definido');
    console.log('- doppusSecretKey:', row.doppusSecretKey ? 'definido (valor oculto)' : 'não definido');

    return {
      doppusClientId: row.doppusClientId,
      doppusClientSecret: row.doppusClientSecret,
      doppusSecretKey: row.doppusSecretKey
    };
  } catch (error) {
    console.error('Erro ao buscar credenciais:', error);
    throw error;
  }
}

async function testRawOauthConnection(clientId, clientSecret) {
  console.log('\n===== TESTE DIRETO DE AUTENTICAÇÃO OAUTH =====');
  const baseUrl = 'https://api.doppus.com/v4';
  const authUrl = `${baseUrl}/token`;
  
  console.log('URL da requisição:', authUrl);
  console.log('Client ID:', clientId ? `${clientId.substring(0, 4)}...${clientId.slice(-4)}` : 'não fornecido');
  console.log('Client Secret:', clientSecret ? '[valor oculto]' : 'não fornecido');

  try {
    const params = new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': clientId,
      'client_secret': clientSecret
    });

    console.log('Body da requisição:', params.toString().replace(clientSecret, '[VALOR_SECRETO]'));
    
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'DesignAuto-IntegrationTest/1.0'
      },
      body: params
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:');
    response.headers.forEach((value, name) => {
      console.log(`- ${name}: ${value}`);
    });

    const text = await response.text();
    console.log('Corpo da resposta:', text);

    try {
      // Tentar analisar como JSON
      const data = JSON.parse(text);
      console.log('Resposta em formato JSON:', JSON.stringify(data, null, 2));
      
      if (data.access_token) {
        console.log('✅ Token obtido com sucesso!');
        return true;
      } else {
        console.log('❌ Falha: Token não encontrado na resposta');
        return false;
      }
    } catch (e) {
      console.log('❌ Falha: Resposta não é um JSON válido');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return false;
  }
}

async function testBasicURLFetch() {
  console.log('\n===== TESTE BÁSICO DE CONECTIVIDADE =====');
  const url = 'https://api.doppus.com';
  console.log(`Testando conectividade básica com ${url}...`);
  
  try {
    const response = await fetch(url);
    console.log('Status da resposta:', response.status);
    console.log('✅ Conectividade básica OK!');
    return true;
  } catch (error) {
    console.error('❌ Erro de conectividade básica:', error);
    return false;
  }
}

async function runTests() {
  console.log('===== DIAGNÓSTICO DA CONEXÃO DOPPUS =====');
  console.log('Data e hora:', new Date().toISOString());
  
  // Teste 1: Verificar conectividade básica
  const connectivityOk = await testBasicURLFetch();
  if (!connectivityOk) {
    console.log('⚠️ Falha de conectividade básica - verifique a conexão de rede');
  }
  
  // Teste 2: Obter credenciais do banco
  let credentials;
  try {
    credentials = await getCredentialsFromDB();
  } catch (error) {
    console.log('⚠️ Não foi possível obter credenciais do banco de dados');
    return;
  }
  
  // Teste 3: Testar autenticação direta
  if (credentials.doppusClientId && credentials.doppusClientSecret) {
    await testRawOauthConnection(credentials.doppusClientId, credentials.doppusClientSecret);
  } else {
    console.log('⚠️ Credenciais incompletas no banco de dados');
  }
  
  // Teste 4: Testar autenticação com valores fixos (apenas para diagnóstico)
  console.log('\n===== TESTE COM VALORES FIXOS (PARA DIAGNÓSTICO) =====');
  console.log('Para verificar se o problema está nas credenciais ou na conexão');
  
  // Valores de teste para fins de diagnóstico - use valores fictícios se preferir
  const testClientId = '619f23648b96ee0ef30214921f3f9b01';
  const testClientSecret = 'f58c3a727ac70b8217d01407febd0dc6';
  
  console.log('AVISO: Este teste usa credenciais fixas apenas para diagnóstico');
  console.log('Client ID fixo:', `${testClientId.substring(0, 4)}...${testClientId.slice(-4)}`);
  
  await testRawOauthConnection(testClientId, testClientSecret);
  
  console.log('\n===== DIAGNÓSTICO CONCLUÍDO =====');
  
  // Fechar conexão com o banco
  await pool.end();
}

runTests().catch(console.error);