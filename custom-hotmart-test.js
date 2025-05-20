/**
 * Script para testar o webhook da Hotmart com offerId e productId específicos
 */
const eventType = 'approved';
const email = 'example@test.com';
const name = 'Usuário de Teste Anual';
const transactionId = 'test-annual-' + Date.now();
const offerId = 'aukjngrt';
const productId = '5381714';
const planName = 'Premium Anual';
const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

const payload = {
  data: {
    buyer: { email, name },
    purchase: { 
      transaction: transactionId,
      offer: { code: offerId },
      product: { id: productId }
    },
    subscription: {
      plan: { name: planName },
      end_date: endDate
    }
  },
  event: 'PURCHASE_APPROVED'
};

const baseUrl = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}`
  : 'http://localhost:5000';

const token = 'afb3c81b-19a6-42f2-93b0-e3cd7def0b0c';

console.log(`Enviando webhook para ${baseUrl}/api/webhooks/hotmart`);
console.log(`Oferta: ${offerId}, Produto: ${productId}, Plano: ${planName}`);

fetch(`${baseUrl}/api/webhooks/hotmart`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => {
  console.log('Resposta do servidor:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(error => console.error('Erro ao testar webhook:', error));
