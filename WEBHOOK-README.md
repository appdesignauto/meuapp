# Webhook da Hotmart - Guia Rápido

## Como funciona

Este webhook é um receptor de eventos da Hotmart que:

1. Recebe notificações de compras, assinaturas, cancelamentos, etc.
2. Registra todas as solicitações em `webhook-logs.json`
3. Responde sempre com status 200 (requisito da Hotmart)

## Como iniciar

Para iniciar o servidor webhook manualmente:

```bash
./run-webhook-server.sh
```

O servidor iniciará em segundo plano e registrará logs em `logs/webhook-server.log`.

## Endpoint do Webhook

Ao configurar na Hotmart, use a URL:

```
https://seu-replit.replit.app/api/webhook-hotmart
```

## Verificar logs

Para visualizar os logs do webhook em tempo real:

```bash
tail -f logs/webhook-server.log
```

Para ver os eventos recebidos da Hotmart:

```bash
cat webhook-logs.json
```

## Simulação de testes

Para testar o webhook localmente:

```bash
node simulate-webhook.js
```

## Tipos de eventos suportados

- `PURCHASE_APPROVED`: Compra aprovada
- `SUBSCRIPTION_ACTIVATED`: Assinatura ativada
- `SUBSCRIPTION_CANCELLED`: Assinatura cancelada
- `PURCHASE_CANCELED`: Compra cancelada
- `PURCHASE_REFUNDED`: Compra reembolsada
- `SUBSCRIPTION_EXPIRED`: Assinatura expirada

## Configuração no painel da Hotmart

1. Acesse o painel da Hotmart (https://app-vlc.hotmart.com)
2. Vá em "Integrações" > "Webhooks"
3. Adicione um novo webhook com a URL do seu Replit
4. Selecione os eventos que deseja receber
5. Salve a configuração