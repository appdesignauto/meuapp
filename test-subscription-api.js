#!/usr/bin/env node

/**
 * Script para testar diretamente a API de usuários com assinatura
 */

const http = require('http');

async function testSubscriptionAPI() {
  console.log('🔍 Testando API de usuários com assinatura...');
  
  // Testar métricas
  console.log('\n📊 Testando métricas...');
  const metricsOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/subscription-metrics',
    method: 'GET',
    headers: {
      'Cookie': 'connect.sid=s%3AzQoNKGBfKXYCWZjmqhDnPgbUOQHYrjKL.VVVzLCPU9cKOEO6xKYpMVNrL3bZYGdPHCzEZjLnJJg0'
    }
  };

  try {
    const metricsResponse = await makeRequest(metricsOptions);
    console.log('✅ Métricas:', JSON.stringify(metricsResponse, null, 2));
  } catch (error) {
    console.error('❌ Erro nas métricas:', error.message);
  }

  // Testar usuários
  console.log('\n👥 Testando usuários...');
  const usersOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/subscription-users',
    method: 'GET',
    headers: {
      'Cookie': 'connect.sid=s%3AzQoNKGBfKXYCWZjmqhDnPgbUOQHYrjKL.VVVzLCPU9cKOEO6xKYpMVNrL3bZYGdPHCzEZjLnJJg0'
    }
  };

  try {
    const usersResponse = await makeRequest(usersOptions);
    console.log('✅ Usuários encontrados:', usersResponse.length || 0);
    if (usersResponse.length > 0) {
      console.log('📋 Primeiros usuários:');
      usersResponse.slice(0, 3).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.nivelacesso} ${user.acessovitalicio ? '(Vitalício)' : ''}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro nos usuários:', error.message);
  }
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Status ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

testSubscriptionAPI().catch(console.error);