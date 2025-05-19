# Webhook da Hotmart - Guia de Implementação

Este documento descreve a implementação do webhook da Hotmart para processamento de eventos relacionados a compras e assinaturas.

## Visão Geral

O servidor dedicado para webhooks da Hotmart foi criado para:

1. Evitar interferência do ambiente Replit com o processamento dos webhooks
2. Garantir que os webhooks sejam sempre processados, mesmo se o servidor principal estiver ocupado
3. Manter um registro detalhado de todas as notificações recebidas
4. Processar eventos relacionados a assinaturas (aprovações, cancelamentos, etc.)

## Arquivos do Sistema

- **server/webhook-hotmart.cjs**: Servidor dedicado para webhooks (formato CommonJS)
- **test-webhook.js**: Utilitário para testar o funcionamento do webhook
- **start-webhook-server.sh**: Script para iniciar o servidor de webhook
- **logs/webhook-log.json**: Registro de todos os eventos recebidos

## Como Iniciar o Servidor

```bash
# Opção 1: Usando o script shell
sh start-webhook-server.sh

# Opção 2: Iniciando diretamente com Node.js
node server/webhook-hotmart.cjs
```

## Como Testar o Webhook

```bash
# Teste com evento de compra aprovada (padrão)
node test-webhook.js

# Teste com evento de cancelamento
node test-webhook.js SUBSCRIPTION_CANCELLED
```

## Tipos de Eventos Suportados

- `PURCHASE_APPROVED`: Compra aprovada
- `SUBSCRIPTION_ACTIVATED`: Assinatura ativada
- `SUBSCRIPTION_CANCELLED`: Assinatura cancelada
- `PURCHASE_CANCELED`: Compra cancelada
- `PURCHASE_REFUNDED`: Compra reembolsada
- `SUBSCRIPTION_EXPIRED`: Assinatura expirada

## Configuração na Hotmart

1. Acesse o painel da Hotmart (https://app-vlc.hotmart.com)
2. Vá em "Integrações" > "Webhooks"
3. Adicione um novo webhook com a URL: `https://seu-dominio.com/api/webhook-hotmart`
4. Selecione os eventos que deseja receber
5. Salve a configuração

## Estrutura do Log

Os logs são armazenados em formato JSON no arquivo `logs/webhook-log.json`. Cada entrada contém:

- `receivedAt`: Data e hora em que o webhook foi recebido
- `payload`: Corpo completo da requisição recebida da Hotmart

## Segurança

Para melhorar a segurança, considere implementar as seguintes medidas:

1. Validação por IP: A Hotmart utiliza IPs específicos para enviar webhooks
2. Validação de origem: Verificar headers específicos da Hotmart
3. Implementar um token de segurança compartilhado entre sua aplicação e a Hotmart

## Solução de Problemas

Se os webhooks não estiverem sendo processados corretamente:

1. Verifique se o servidor está em execução
2. Confira o arquivo de log para ver se as requisições estão sendo recebidas
3. Teste o webhook localmente usando o script `test-webhook.js`
4. Verifique a configuração na plataforma Hotmart

---

**Importante**: O servidor responde sempre com status 200, mesmo em caso de erro interno, conforme requerido pela Hotmart. Isso evita que a Hotmart tente reenviar webhooks que não puderam ser processados por problemas internos da aplicação.