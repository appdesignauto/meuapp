#!/bin/bash

# Este script usa curl para enviar um webhook simulado de SUBSCRIPTION_CANCELLATION

echo "Enviando webhook de teste para SUBSCRIPTION_CANCELLATION..."

curl -X POST "http://localhost:5000/api/webhooks/hotmart" \
  -H "Content-Type: application/json" \
  -d '{
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
        "email": "teste@email.com"
      },
      "subscription": {
        "id": 4148584,
        "plan": {
          "name": "Subscription Plan Name",
          "id": 114680
        }
      },
      "cancellation_date": 1609181285500
    },
    "hottok": "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719",
    "id": "test-'$(date +%s)'",
    "creation_date": '$(date +%s%3N)',
    "event": "SUBSCRIPTION_CANCELLATION",
    "version": "2.0.0"
  }'

echo "Webhook enviado. Verificando logs..."
echo "Consultando o log mais recente na tabela webhookLogs..."

# Aguarde um momento para o servidor processar
sleep 2

# Use a ferramenta SQL para verificar o log mais recente
echo "SELECT id, \"eventType\", status, email, \"errorMessage\", \"createdAt\" FROM \"webhookLogs\" ORDER BY id DESC LIMIT 1;" > /tmp/check_webhook.sql

echo "Resultado da consulta SQL:"