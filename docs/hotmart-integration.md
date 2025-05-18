# Integração Hotmart - Documentação

Este documento descreve a implementação da integração com a Hotmart para processar pagamentos, assinaturas e eventos relacionados à plataforma.

## Visão Geral

A integração Hotmart permite que a plataforma DesignAuto receba e processe webhooks da Hotmart para:

1. Criar novas assinaturas quando uma compra é aprovada
2. Atualizar assinaturas existentes quando são renovadas
3. Cancelar assinaturas quando são canceladas ou expiram
4. Rastrear eventos da Hotmart para diagnóstico e suporte

## Estrutura da Integração

A integração é composta por:

- **Tabelas do Banco de Dados**:
  - `hotmart_webhook_log`: Armazena todos os webhooks recebidos da Hotmart
  - `hotmart_subscription`: Armazena informações sobre assinaturas ativas

- **Classes de Serviço**:
  - `HotmartService`: Classe principal que gerencia a integração, processamento de webhooks e gerenciamento de assinaturas

- **Endpoints**:
  - `/webhook/hotmart`: Endpoint principal para receber webhooks da Hotmart
  - `/webhook/hotmart/simulate`: Endpoint para simular eventos da Hotmart (apenas em desenvolvimento)
  - `/webhook/logs`: Endpoint para visualizar logs de webhooks recebidos
  - `/webhook/subscriptions`: Endpoint para listar assinaturas ativas

## Configuração

Para configurar a integração, é necessário definir as seguintes variáveis de ambiente:

```
# Configurações Gerais
HOTMART_SANDBOX=true    # Use 'true' para ambiente de sandbox, 'false' para produção

# Segurança do Webhook
HOTMART_WEBHOOK_SECRET=your_webhook_secret_here  # Token de segurança para validar os webhooks

# IDs dos Produtos na Hotmart
HOTMART_MENSAL_PRODUCT_ID=123456    # ID do produto mensal na Hotmart
HOTMART_ANUAL_PRODUCT_ID=654321     # ID do produto anual na Hotmart
HOTMART_SEMESTRAL_PRODUCT_ID=789012 # ID do produto semestral na Hotmart
```

## Fluxo de Processamento de Webhook

1. A Hotmart envia um webhook para o endpoint `/webhook/hotmart` com um evento específico.
2. O sistema verifica a assinatura do webhook usando HMAC-SHA256 com o segredo compartilhado.
3. O evento é registrado na tabela `hotmart_webhook_log` para diagnóstico e auditoria.
4. Com base no tipo de evento, o sistema realiza uma ação específica:
   - `PURCHASE_APPROVED` / `PURCHASE_COMPLETE`: Cria ou atualiza uma assinatura.
   - `SUBSCRIPTION_REACTIVATED`: Reativa uma assinatura cancelada.
   - `SUBSCRIPTION_CANCELLATION` / `SUBSCRIPTION_EXPIRED`: Cancela uma assinatura.
5. O usuário na plataforma DesignAuto é atualizado com o novo status de assinatura.

## Teste da Integração

### Testar Compra Aprovada

Para testar um evento de compra aprovada, execute:

```bash
node test-webhook-hotmart.js
```

### Testar Cancelamento de Assinatura

Para testar um evento de cancelamento de assinatura, execute:

```bash
node test-webhook-cancellation.js
```

## Configuração na Hotmart

Na plataforma Hotmart, configure o webhook com os seguintes parâmetros:

1. **URL do Webhook**: `https://seudominio.com/webhook/hotmart`
2. **Eventos para Notificar**:
   - `PURCHASE_APPROVED`
   - `PURCHASE_COMPLETE`
   - `SUBSCRIPTION_CANCELLATION`
   - `SUBSCRIPTION_EXPIRED`
   - `SUBSCRIPTION_REACTIVATED`
3. **Segredo do Webhook**: O mesmo valor definido em `HOTMART_WEBHOOK_SECRET`

## Diagnóstico e Solução de Problemas

### Verificar Logs de Webhook

Para verificar os logs de webhooks recebidos, acesse a rota `/webhook/logs` no painel administrativo.

### Verificar Assinaturas Ativas

Para verificar as assinaturas ativas, acesse a rota `/webhook/subscriptions` no painel administrativo.

### Problemas Comuns

1. **Webhook não validado**: Verifique se o segredo configurado na Hotmart é o mesmo definido em `HOTMART_WEBHOOK_SECRET`.
2. **Produto não mapeado**: Verifique se os IDs dos produtos estão corretamente configurados nas variáveis de ambiente.
3. **Assinatura não atualizada**: Verifique os logs de webhook para ver se houve algum erro no processamento.

## Segurança

A integração implementa as seguintes medidas de segurança:

1. **Validação de Assinatura**: Todos os webhooks são validados usando HMAC-SHA256 para garantir que foram enviados pela Hotmart.
2. **Segredo do Webhook**: Um segredo compartilhado é usado para validar os webhooks.
3. **Logging Detalhado**: Todos os webhooks são registrados para auditoria e diagnóstico.