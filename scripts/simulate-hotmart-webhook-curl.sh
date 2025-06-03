#!/bin/bash
# Script para simular um webhook da Hotmart usando curl
# Este script envia um webhook simulado para o endpoint local e mostra a resposta

# Cores para saída no terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem cor

# URL do endpoint local
WEBHOOK_URL="http://localhost:5000/api/webhooks/hotmart"

# Token secreto - obtém do .env ou usa o valor padrão
WEBHOOK_SECRET=$(grep HOTMART_WEBHOOK_SECRET .env | cut -d '=' -f2 || echo "teste-secreto")

# Gerar dados dinâmicos para o webhook
EMAIL="teste.$(date +%s)@designauto.com.br"
TRANSACTION_ID="TX-$(date +%s)"
SUBSCRIBER_CODE="SUB-$((RANDOM % 100000))"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

echo -e "${BLUE}🔧 Simulador de Webhook da Hotmart${NC}"
echo -e "${BLUE}==================================${NC}"
echo -e "${YELLOW}📦 Gerando payload de webhook...${NC}"

# Criar o payload JSON do webhook
PAYLOAD=$(cat <<EOF
{
  "data": {
    "purchase": {
      "transaction": "${TRANSACTION_ID}",
      "status": "APPROVED",
      "offer": {
        "code": "aukjngrt"
      },
      "subscription": {
        "subscriber": {
          "code": "${SUBSCRIBER_CODE}",
          "email": "${EMAIL}",
          "name": "Usuário de Teste"
        },
        "plan": {
          "name": "Plano Anual DesignAuto"
        },
        "status": "ACTIVE",
        "recurrenceNumber": 1,
        "accession": {
          "date": "${NOW}"
        }
      }
    },
    "product": {
      "id": "5381714",
      "name": "DesignAuto Premium"
    }
  },
  "event": "PURCHASE_APPROVED",
  "id": "webhook-test-$(date +%s)",
  "creationDate": "${NOW}"
}
EOF
)

echo -e "${YELLOW}🚀 Enviando webhook simulado para ${WEBHOOK_URL}${NC}"
echo -e "${YELLOW}📧 Email de teste: ${EMAIL}${NC}"
echo -e "${YELLOW}🔑 Token utilizado: ${WEBHOOK_SECRET:0:3}...${WEBHOOK_SECRET: -3}${NC}"

# Enviar o webhook usando curl
echo -e "${YELLOW}📡 Enviando requisição...${NC}"
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-hotmart-hottok: ${WEBHOOK_SECRET}" \
  -d "${PAYLOAD}" \
  "${WEBHOOK_URL}")

echo -e "${GREEN}✅ Resposta recebida:${NC}"
echo "${RESPONSE}" | python3 -m json.tool

# Verificar o status baseado na resposta
if echo "${RESPONSE}" | grep -q '"success":true'; then
  echo -e "${GREEN}🎉 Webhook processado com sucesso!${NC}"
else
  echo -e "${YELLOW}⚠️ Webhook processado com avisos ou erros.${NC}"
  echo "${RESPONSE}" | grep -o '"message":"[^"]*"' | cut -d '"' -f 4
fi

echo -e "${BLUE}📝 Os logs deste webhook devem ter sido registrados na tabela webhook_logs.${NC}"
echo -e "${BLUE}   Verifique o banco de dados para mais detalhes.${NC}"

# Verificar no banco de dados (opcional)
echo -e "${YELLOW}🔍 Deseja verificar no banco de dados? (s/n)${NC}"
read -n 1 CHECK_DB

if [[ "${CHECK_DB}" =~ ^[Ss]$ ]]; then
  echo -e "\n${YELLOW}🔍 Consultando logs no banco de dados...${NC}"
  DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2)
  
  if [ ! -z "${DB_URL}" ]; then
    PGPASSWORD=$(echo ${DB_URL} | awk -F'[:@/]' '{print $3}') \
    psql "$(echo ${DB_URL} | sed 's/postgres:/postgresql:/')" \
      -c "SELECT id, created_at, event_type, status, email FROM webhook_logs WHERE email = '${EMAIL}' ORDER BY created_at DESC LIMIT 1;"
  else
    echo -e "${RED}❌ Não foi possível conectar ao banco de dados. Verifique manualmente.${NC}"
  fi
fi

echo -e "${GREEN}✅ Simulação concluída!${NC}"