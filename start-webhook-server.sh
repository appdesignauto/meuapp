#!/bin/bash
# Script para iniciar o servidor de webhook da Hotmart
# Para executar: bash start-webhook-server.sh

# Caminho completo para o servidor webhook
WEBHOOK_SERVER="./server/standalone-webhook-server.js"

# Verifica se o servidor já está rodando
PID=$(ps aux | grep standalone-webhook-server.js | grep -v grep | awk '{print $2}')

if [ ! -z "$PID" ]; then
    echo "🔄 Servidor webhook já está rodando (PID: $PID)"
else
    echo "🚀 Iniciando servidor webhook..."
    
    # Executa em background
    node $WEBHOOK_SERVER > webhook-server.log 2>&1 &
    
    # Aguarda 2 segundos para verificar se iniciou corretamente
    sleep 2
    
    # Obter o PID do novo processo
    NEW_PID=$(ps aux | grep standalone-webhook-server.js | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$NEW_PID" ]; then
        echo "✅ Servidor webhook iniciado com sucesso (PID: $NEW_PID)"
        echo "📋 Logs disponíveis em: webhook-server.log"
    else
        echo "❌ Falha ao iniciar o servidor webhook, verifique os logs"
    fi
fi

# Informações sobre uso
echo ""
echo "🌐 URL do webhook: https://designauto.com.br/webhook/hotmart"
echo "🔍 Status: http://localhost:5001/status"
echo ""
echo "⚠️ IMPORTANTE: Configure o servidor web (Nginx/Apache) conforme instruções-webhook-hotmart.md"