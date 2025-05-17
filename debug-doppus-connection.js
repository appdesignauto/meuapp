/**
 * Script para depuração da conexão com a API da Doppus
 * 
 * Este script testa diretamente a conexão com a API da Doppus, 
 * sem passar pela rota do Express, para identificar onde está o problema.
 */

// Importar as dependências necessárias
import { pool } from './server/db.js';
import fetch from 'node-fetch';

async function testDoppusConnection() {
  console.log('===== INICIANDO DEPURAÇÃO DA CONEXÃO COM DOPPUS =====');
  console.log('Data e hora:', new Date().toISOString());
  
  try {
    // PASSO 1: Consultar credenciais no banco de dados
    console.log('\nPASSO 1: Consultando credenciais...');
    
    // Verificar se a tabela subscriptionSettings existe
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'subscriptionSettings'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    if (!tableExists) {
      console.error('✗ Tabela subscriptionSettings não existe no banco de dados');
      return;
    }
    
    // Verificar as colunas da tabela
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'subscriptionSettings';
    `);
    
    const columns = columnsResult.rows.map(row => row.column_name);
    console.log('Colunas encontradas na tabela:', columns);
    
    // Consultar as credenciais diretamente
    const credentialsResult = await pool.query(`
      SELECT "doppusClientId", "doppusClientSecret", "doppusSecretKey"
      FROM "subscriptionSettings" 
      LIMIT 1;
    `);
    
    if (credentialsResult.rows.length === 0) {
      console.error('✗ Nenhuma configuração encontrada na tabela subscriptionSettings');
      return;
    }
    
    const credentials = credentialsResult.rows[0];
    console.log('Credenciais encontradas:', {
      doppusClientId: credentials.doppusClientId ? `${credentials.doppusClientId.substring(0, 4)}...${credentials.doppusClientId.slice(-4)}` : null,
      doppusClientSecret: credentials.doppusClientSecret ? 'definido' : null,
      doppusSecretKey: credentials.doppusSecretKey ? 'definido' : null
    });
    
    if (!credentials.doppusClientId || !credentials.doppusClientSecret) {
      console.error('✗ Credenciais da Doppus incompletas');
      return;
    }
    
    // PASSO 2: Testar a API básica da Doppus
    console.log('\nPASSO 2: Testando URL e endpoint de token...');
    
    const baseUrl = 'https://api.doppus.com/v4';
    console.log('URL base da API:', baseUrl);
    
    // Tentar obter token de acesso
    console.log('Solicitando token de acesso...');
    console.log(`Enviando requisição para ${baseUrl}/token`);
    
    const tokenResponse = await fetch(`${baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': credentials.doppusClientId,
        'client_secret': credentials.doppusClientSecret
      })
    });
    
    console.log('Resposta recebida. Status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('✗ Erro na resposta da API:', errorText);
      
      if (tokenResponse.status === 401) {
        console.error('✗ Credenciais inválidas');
      } else if (tokenResponse.status === 400) {
        console.error('✗ Requisição inválida');
      } else if (tokenResponse.status === 404) {
        console.error('✗ Endpoint não encontrado - URL incorreta?');
      }
      
      return;
    }
    
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    
    if (!token) {
      console.error('✗ Token não encontrado na resposta');
      console.log('Resposta completa:', tokenData);
      return;
    }
    
    console.log('✓ Token obtido com sucesso:', token.substring(0, 10) + '...');
    
    // PASSO 3: Testar um endpoint de API real
    console.log('\nPASSO 3: Testando endpoint de produtos...');
    
    const apiResponse = await fetch(`${baseUrl}/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Resposta recebida. Status:', apiResponse.status);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('✗ Erro ao acessar endpoint de produtos:', errorText);
      return;
    }
    
    const productData = await apiResponse.json();
    console.log('✓ Dados de produtos obtidos com sucesso:', 
      productData.data ? `${productData.data.length} produtos encontrados` : 'Formato de resposta inesperado');
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL durante o teste:', error);
  } finally {
    // Encerrar a pool de conexões do banco de dados
    await pool.end();
    console.log('\n===== FIM DA DEPURAÇÃO =====');
  }
}

// Executar o teste
testDoppusConnection();