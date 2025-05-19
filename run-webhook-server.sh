#!/bin/bash

# Script para iniciar o servidor webhook de forma robusta
echo "Iniciando servidor webhook da Hotmart..."

# Criando diretório de logs se não existir
mkdir -p logs

# Iniciando o servidor com redirecionamento de logs
node index.cjs >> logs/webhook-server.log 2>&1 &

# Salvando o PID para uso posterior
echo $! > .webhook-server.pid

echo "Servidor webhook iniciado! PID: $(cat .webhook-server.pid)"
echo "Logs disponíveis em: logs/webhook-server.log"