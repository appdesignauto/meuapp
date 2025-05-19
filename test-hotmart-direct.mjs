/**
 * Script para testar diretamente as credenciais da Hotmart
 * Este script faz uma chamada direta para a API da Hotmart sem passar pelo frontend
 */

import axios from 'axios';
import https from 'https';
import { URLSearchParams } from 'url';

// Credenciais da Hotmart (diretamente no script para teste)
const clientId = '8c126e59-7bd0-49af-a402-ec7849a686d8';
const clientSecret = '90bf5921-9565-4f1e-9763-19f7f2457d00';
const environment = 'production'; // 'production' ou 'sandbox'

// Configurações do cliente HTTP
const baseURL = environment === 'production' 
  ? 'https://developers.hotmart.com' 
  : 'https://sandbox.hotmart.com';

// Configuração do agente HTTPS para evitar problemas de SSL
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
});

// Função para testar as credenciais diretamente
async function testCredentialsDirect() {
  try {
    console.log(`\n🔑 Testando credenciais da Hotmart diretamente`);
    console.log(`- Ambiente: ${environment}`);
    console.log(`- Client ID: ${clientId.substring(0, 8)}...`);
    console.log(`- URL Base: ${baseURL}`);
    
    // Criar token de autenticação básica
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    console.log(`- Token Basic Auth: ${basicAuth.substring(0, 15)}...`);
    
    // Preparar parâmetros para solicitação de token
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'payments sales subscriptions users reports webhook campaigns catalogs');
    
    console.log(`\n📡 Enviando requisição para ${baseURL}/security/oauth/token`);
    console.log(`- Headers de requisição:`);
    console.log(`  * Authorization: Basic ${basicAuth.substring(0, 10)}...`);
    console.log(`  * Content-Type: application/x-www-form-urlencoded`);
    
    // Fazer a requisição com timeout longo para debug
    const response = await axios({
      method: 'post',
      url: `${baseURL}/security/oauth/token`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'DesignAuto-DirectTest/1.0'
      },
      data: params,
      timeout: 30000, // 30 segundos
      httpsAgent, // Usar agente HTTPS configurado
      validateStatus: () => true // Aceitar qualquer status de resposta
    });
    
    // Exibir resposta completa
    console.log(`\n📊 Resposta recebida (Status: ${response.status}):`);
    
    // Verificar se temos uma resposta HTML em vez de JSON
    const isHtmlResponse = typeof response.data === 'string' && 
      response.data.toLowerCase().includes('<!doctype html');
    
    if (isHtmlResponse) {
      console.log(`- ❌ A API retornou HTML em vez de JSON`);
      console.log(`- Primeiros 300 caracteres da resposta HTML:`);
      console.log(response.data.substring(0, 300));
      
      // Verificar headers específicos
      console.log(`\n📋 Headers de resposta importantes:`);
      console.log(`- Content-Type: ${response.headers['content-type']}`);
      if (response.headers['location']) {
        console.log(`- Location (redirecionamento): ${response.headers['location']}`);
      }
    } else {
      // Resposta JSON válida
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.data.access_token) {
        console.log(`\n✅ Sucesso! Token OAuth obtido: ${response.data.access_token.substring(0, 10)}...`);
      } else {
        console.log(`\n❌ Falha: Resposta válida, mas sem token de acesso`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao testar credenciais:');
    
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status diferente de 2xx
      console.error(`- Status: ${error.response.status}`);
      console.error(`- Headers:`, error.response.headers);
      
      if (typeof error.response.data === 'string' && 
          error.response.data.toLowerCase().includes('<!doctype html')) {
        console.error(`- Dados: [Conteúdo HTML]`);
      } else {
        console.error(`- Dados:`, error.response.data);
      }
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      console.error(`- Nenhuma resposta recebida do servidor`);
      console.error(error.request);
    } else {
      // Algo aconteceu na configuração da requisição que causou o erro
      console.error(`- Erro de configuração:`, error.message);
    }
    
    if (error.config) {
      console.error(`\n📝 Detalhes da requisição que falhou:`);
      console.error(`- URL: ${error.config.url}`);
      console.error(`- Método: ${error.config.method.toUpperCase()}`);
      console.error(`- Headers:`, error.config.headers);
    }
  }
}

// Executar o teste
testCredentialsDirect()
  .then(() => console.log('\nTeste concluído!'))
  .catch(err => console.error('\nErro não tratado:', err));