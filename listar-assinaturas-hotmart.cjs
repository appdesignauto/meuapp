/**
 * Script para listar assinaturas ativas da Hotmart (CommonJS)
 */

const axios = require('axios');
require('dotenv').config();

// Token Basic de autenticação da Hotmart
const BASIC_TOKEN = 'Basic OGMxMjZlNTktN2JkMC00OWFmLWE0MDItZWM3ODQ5YTY4NmQ4OjkwYmY1OTIxLTk1NjUtNGYxZS05NzYzLTE5ZjdmMjQ1N2QwMA==';
const AUTH_URL = 'https://developers.hotmart.com/security/oauth/token';
const SUBSCRIPTIONS_URL = 'https://developers.hotmart.com/payments/api/v1/subscriptions';

async function getAccessToken() {
  try {
    console.log('Obtendo token de acesso da Hotmart...');
    
    // Parâmetros para solicitação de token
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    
    // Configuração da requisição
    const config = {
      method: 'post',
      url: AUTH_URL,
      headers: {
        'Authorization': BASIC_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    };
    
    // Faz a requisição
    const response = await axios(config);
    
    // Verifica se a resposta contém um token de acesso
    if (response.data && response.data.access_token) {
      console.log('Token de acesso obtido com sucesso!');
      return response.data.access_token;
    } else {
      throw new Error('Resposta não contém token de acesso');
    }
  } catch (error) {
    console.error('Erro ao obter token de acesso:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
    throw new Error(`Falha na autenticação Hotmart: ${error.message}`);
  }
}

async function getActiveSubscriptions() {
  try {
    // Obter token de acesso
    const token = await getAccessToken();
    
    console.log('Buscando assinaturas ativas...');
    
    // Parâmetros para filtrar apenas assinaturas ativas
    const params = {
      'status': 'ACTIVE',
      'max_results': 100 // Limitar para evitar sobrecarga
    };
    
    // Construir a URL com os parâmetros
    let url = SUBSCRIPTIONS_URL;
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        queryParams.append(key, value);
      }
      url = `${url}?${queryParams.toString()}`;
    }
    
    // Configuração da requisição
    const config = {
      method: 'get',
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Faz a requisição
    const response = await axios(config);
    
    // Processar os resultados
    const subscriptions = response.data;
    
    if (!subscriptions || !subscriptions.items || !Array.isArray(subscriptions.items)) {
      console.log('Nenhuma assinatura ativa encontrada ou formato de resposta inesperado.');
      return [];
    }
    
    // Formatar as assinaturas para exibição
    const formattedSubscriptions = subscriptions.items.map(sub => {
      return {
        id: sub.id || 'N/A',
        plan: sub.plan?.name || 'Plano não especificado',
        status: sub.status || 'Status desconhecido',
        customer: {
          name: sub.subscriber?.name || 'Nome não disponível',
          email: sub.subscriber?.email || 'Email não disponível'
        },
        product: {
          id: sub.product?.id || 'N/A',
          name: sub.product?.name || 'Produto não especificado'
        },
        startDate: sub.accessionDate || 'Data não disponível',
        nextPayment: sub.nextChargeDate || 'Data não disponível',
        price: {
          value: sub.price?.value || 0,
          currency: sub.price?.currency || 'BRL'
        }
      };
    });
    
    console.log(`${formattedSubscriptions.length} assinaturas ativas encontradas.`);
    return formattedSubscriptions;
  } catch (error) {
    console.error('Erro ao buscar assinaturas ativas:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
    throw error;
  }
}

// Executar o script e exibir os resultados
getActiveSubscriptions()
  .then(subscriptions => {
    console.log('===== ASSINATURAS ATIVAS NA HOTMART =====');
    console.log(JSON.stringify(subscriptions, null, 2));
    console.log(`Total: ${subscriptions.length} assinaturas ativas`);
  })
  .catch(error => {
    console.error('Falha ao listar assinaturas:', error);
    process.exit(1);
  });