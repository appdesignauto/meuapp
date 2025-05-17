#!/bin/bash

# Script simples para simular um webhook da Doppus
# Este script envia um payload no novo formato que a Doppus está usando

echo "=== TESTE DE WEBHOOK DOPPUS ==="
echo "Preparando payload de teste..."

# Payload no novo formato Doppus
PAYLOAD='{
  "customer": {
    "name": "Cliente Teste Doppus",
    "email": "teste.doppus@exemplo.com"
  },
  "status": {
    "code": "approved",
    "date": "2025-05-17T16:30:00.000Z"
  },
  "transaction": {
    "code": "TX123456789",
    "total": 297.00,
    "payment_type": "credit_card"
  },
  "items": [
    {
      "code": "designauto-product",
      "name": "Design Auto Premium",
      "offer": "anual-platinum",
      "offer_name": "Plano Anual Platinum"
    }
  ],
  "recurrence": {
    "code": "REC123456",
    "periodicy": "yearly",
    "expiration_date": "2026-05-17T16:30:00.000Z"
  }
}'

echo "Enviando webhook para servidor local..."
echo "URL: http://localhost:3000/api/webhooks/doppus"
echo "Payload: $PAYLOAD"

# Enviar webhook usando curl
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  http://localhost:3000/api/webhooks/doppus)

echo "Status da resposta: $RESPONSE"

if [ "$RESPONSE" == "200" ]; then
  echo "✅ Webhook enviado com sucesso!"
else
  echo "❌ Erro ao enviar webhook: código $RESPONSE"
fi

echo ""
echo "Verificando logs de webhook no banco de dados..."

# Verificar os logs de webhook no banco
LATEST_LOG=$(node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkLatestWebhookLog() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM \"webhookLogs\" ORDER BY id DESC LIMIT 1');
    if (res.rows.length > 0) {
      const log = res.rows[0];
      console.log(JSON.stringify({
        id: log.id,
        eventType: log.eventtype,
        source: log.source,
        status: log.status,
        createdAt: log.createdat
      }, null, 2));
    } else {
      console.log('Nenhum log de webhook encontrado');
    }
  } catch (err) {
    console.error('Erro ao verificar logs:', err.message);
  } finally {
    await client.end();
  }
}

checkLatestWebhookLog();
")

echo "Último log de webhook:"
echo "$LATEST_LOG"

echo "=== TESTE CONCLUÍDO ==="
