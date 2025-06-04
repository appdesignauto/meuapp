# Documentação da Integração Hotmart - DesignAuto

Esta documentação descreve a implementação do sistema de webhooks e integração com a Hotmart para processamento de assinaturas no DesignAuto.

## 1. Configuração do Ambiente

### Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias para o funcionamento da integração:

```
HOTMART_WEBHOOK_SECRET=seu_token_secreto
HOTMART_SANDBOX=true_ou_false
```

- **HOTMART_WEBHOOK_SECRET**: Token de autenticação fornecido pela Hotmart
- **HOTMART_SANDBOX**: Define se o ambiente está em modo de teste (true) ou produção (false)

## 2. Endpoints Disponíveis

### Webhooks da Hotmart

- **URL**: `/api/webhooks/hotmart`
- **Método**: POST
- **Descrição**: Processa webhooks enviados pela Hotmart (compras, renovações, cancelamentos, etc.)
- **Autenticação**: Token no cabeçalho `x-hotmart-hottok` ou no corpo como `hottok`

### Visualização de Logs

- **URL**: `/api/webhooks/logs`
- **Método**: GET
- **Descrição**: Lista os logs de webhooks recebidos com filtros e paginação
- **Parâmetros**:
  - `page`: Número da página (padrão: 1)
  - `limit`: Registros por página (padrão: 10)
  - `status`: Filtro por status (success, error)
  - `eventType`: Filtro por tipo de evento
  - `source`: Filtro por fonte (hotmart, doppus)
  - `search`: Busca por email

### Visualização de Assinaturas

- **URL**: `/api/webhooks/subscriptions`
- **Método**: GET
- **Descrição**: Lista as assinaturas ativas com filtros e paginação
- **Parâmetros**:
  - `page`: Número da página (padrão: 1)
  - `limit`: Registros por página (padrão: 10)
  - `planType`: Filtro por tipo de plano (mensal, anual, etc.)
  - `status`: Filtro por status (active, expired)
  - `search`: Busca por email ou nome de usuário

## 3. Mapeamento de Produtos

O sistema utiliza a tabela `hotmart_product_mappings` para associar produtos da Hotmart aos planos do DesignAuto.

### Estrutura da Tabela

```sql
CREATE TABLE hotmart_product_mappings (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  offer_id VARCHAR(50),
  plan_type VARCHAR(50) NOT NULL,
  days_valid INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, offer_id)
);
```

### Mapeamentos Padrão

| Product ID | Offer ID | Plano DesignAuto | Validade (dias) |
|------------|----------|------------------|-----------------|
| 5381714    | null     | mensal           | 30              |
| 5381714    | aukjngrt | anual            | 365             |

## 4. Processamento de Eventos

O sistema é capaz de processar os seguintes tipos de eventos da Hotmart:

- **PURCHASE_APPROVED**: Nova compra aprovada
- **PURCHASE_REFUNDED**: Compra reembolsada
- **PURCHASE_CANCELED**: Compra cancelada
- **PURCHASE_COMPLETE**: Compra completada
- **SUBSCRIPTION_CANCELED**: Assinatura cancelada
- **ASSINATURA_RECORRENCIA**: Renovação de assinatura

## 5. Scripts de Manutenção

Os seguintes scripts estão disponíveis para manutenção do sistema:

### add-hotmart-product-mapping-table.js
```bash
node add-hotmart-product-mapping-table.js
```
Cria e popula a tabela de mapeamentos de produtos da Hotmart.

### test-webhook-logs.js
```bash
node test-webhook-logs.js
```
Testa o sistema de logs de webhook, enviando um webhook simulado e verificando o registro.

### test-specific-hotmart-webhook.js
```bash
node test-specific-hotmart-webhook.js
```
Testa especificamente o webhook para o produto 5381714 com oferta aukjngrt.

## 6. Logs e Diagnóstico

Os logs de webhook são armazenados na tabela `webhook_logs` com os seguintes campos:

- `id`: ID único do log
- `created_at`: Data e hora do recebimento
- `event_type`: Tipo de evento recebido
- `status`: Status do processamento (success/error)
- `email`: E-mail do assinante (quando disponível)
- `source`: Fonte do webhook (hotmart/doppus)
- `raw_payload`: Payload completo recebido no webhook
- `error_message`: Mensagem de erro (quando aplicável)

## 7. Troubleshooting

### Webhook não está sendo registrado

1. Verifique se o token no painel da Hotmart corresponde à variável `HOTMART_WEBHOOK_SECRET` no ambiente
2. Confirme se a URL configurada na Hotmart está correta (com https)
3. Verifique os logs do servidor para identificar erros específicos

### Assinatura não está sendo atualizada

1. Verifique se existe um mapeamento na tabela `hotmart_product_mappings` para o produto e oferta
2. Confirme se o campo `active` está definido como `true` para o mapeamento
3. Verifique os logs na tabela `webhook_logs` para identificar possíveis erros

### Testando com Dados Reais

Para testar com dados reais sem acionar o webhook da Hotmart:

```bash
node test-specific-hotmart-webhook.js
```

Este script simula um webhook com o produto ID 5381714 e oferta aukjngrt, verificando se o sistema processa corretamente.