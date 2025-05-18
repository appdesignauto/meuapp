/**
 * Script simples para testar o tratamento de cancelamento de assinatura
 * Este script envia um webhook simulado de SUBSCRIPTION_CANCELLATION para o endpoint local
 */

// Importações
import { request } from 'http';

// Dados de cancelamento baseados no exemplo real
const cancellationData = {
  "data": {
    "date_next_charge": 1617105600000,
    "product": {
      "name": "Product name com ç e á",
      "id": 788921
    },
    "actual_recurrence_value": 64.9,
    "subscriber": {
      "code": "0000aaaa",
      "name": "User name",
      "email": "teste@email.com" // Use um e-mail que existe no sistema
    },
    "subscription": {
      "id": 4148584,
      "plan": {
        "name": "Subscription Plan Name",
        "id": 114680
      }
    },
    "cancellation_date": Date.now()
  },
  "hottok": "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719",
  "id": "test-" + Date.now(),
  "creation_date": Date.now(),
  "event": "SUBSCRIPTION_CANCELLATION",
  "version": "2.0.0"
};

async function sendWebhook() {
  // Convertendo o objeto para string JSON
  const payload = JSON.stringify(cancellationData);
  
  // Configurando a requisição
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/webhooks/hotmart',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    // Enviando a requisição
    const req = request(options, (res) => {
      console.log(`Status da requisição: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Resposta completa:');
        try {
          const parsedData = JSON.parse(data);
          console.log(JSON.stringify(parsedData, null, 2));
          resolve(parsedData);
        } catch(e) {
          console.log(data);
          resolve(data);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`Problema com a requisição: ${e.message}`);
      reject(e);
    });
    
    // Enviando os dados
    req.write(payload);
    req.end();
    
    console.log('Webhook enviado com sucesso!');
  });
}

// Executar o envio
sendWebhook();