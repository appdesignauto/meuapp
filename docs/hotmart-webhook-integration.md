# Documentação de Integração com Webhooks da Hotmart

## Visão Geral

A integração com a Hotmart permite gerenciar automaticamente as assinaturas dos usuários do DesignAuto com base em eventos recebidos via webhooks da plataforma Hotmart. Esta documentação descreve os componentes, fluxos e processos implementados para esta integração.

## Componentes Principais

### 1. Tabela de Logs de Webhooks (webhookLogs)

A tabela `webhookLogs` armazena informações sobre todos os webhooks recebidos da Hotmart, permitindo rastreabilidade, depuração e auditoria.

Colunas principais:
- `id`: Identificador único do log
- `createdAt`: Data e hora de recebimento do webhook
- `eventType`: Tipo de evento recebido (ex: PURCHASE_APPROVED, SUBSCRIPTION_CANCELED)
- `payloadData`: Dados completos recebidos no webhook (JSON)
- `status`: Status do processamento (success, error, pending)
- `errorMessage`: Mensagem de erro, se houver
- `userId`: ID do usuário afetado, se identificado
- `sourceIp`: Endereço IP de origem da requisição
- `retryCount`: Número de tentativas de processamento
- `updatedAt`: Data da última atualização

### 2. HotmartService

Serviço responsável pela comunicação com a API da Hotmart e processamento de webhooks.

Métodos principais:
- `initialize()`: Configura o serviço com credenciais da Hotmart
- `getAccessToken()`: Obtém token de acesso para API da Hotmart
- `getSubscriptionByEmail()`: Busca assinatura pelo e-mail do usuário
- `hasActiveSubscription()`: Verifica se um usuário tem assinatura ativa
- `logWebhook()`: Registra detalhes de um webhook recebido
- `processWebhook()`: Processa eventos recebidos via webhook
- `updateWebhookLogWithUser()`: Atualiza o log quando o usuário é identificado

### 3. SubscriptionService

Serviço responsável por gerenciar assinaturas e níveis de acesso dos usuários.

Métodos relacionados a webhooks:
- `processHotmartWebhook()`: Processa eventos da Hotmart e atualiza assinaturas
- `upgradeUserToHotmart()`: Atualiza usuário para acesso premium via Hotmart
- `downgradeUser()`: Rebaixa usuário quando sua assinatura expira

### 4. Rotas de API

Endpoints implementados para receber webhooks e gerenciar logs:

#### Webhooks
- `POST /api/webhooks/hotmart`: Recebe notificações da Hotmart

#### Administração (requer autenticação admin)
- `GET /api/admin/webhook-logs`: Lista todos os logs de webhooks
- `GET /api/admin/webhook-logs/:id`: Obtém detalhes de um webhook específico
- `POST /api/admin/webhook-logs/:id/retry`: Tenta reprocessar um webhook

## Fluxo de Processamento

1. **Recebimento do Webhook**
   - A Hotmart envia um POST para `/api/webhooks/hotmart`
   - O endpoint valida o token de segurança no cabeçalho `X-Hotmart-Webhook-Token`
   - O IP de origem é capturado para rastreabilidade

2. **Registro do Webhook**
   - Os dados do webhook são registrados na tabela `webhookLogs`
   - Status inicial: `pending`

3. **Processamento**
   - O evento é classificado (compra, cancelamento, etc.)
   - O e-mail do usuário é extraído dos dados
   - O usuário é identificado no sistema pelo e-mail

4. **Atualização do Status do Usuário**
   - Se for uma compra/aprovação: o usuário é promovido para nível premium
   - Se for um cancelamento/chargeback: o usuário é rebaixado para nível básico
   - Se o usuário não existir: um novo usuário é criado automaticamente

5. **Finalização**
   - O log é atualizado com o resultado do processamento
   - Status final: `success` ou `error`

## Eventos Suportados

- `PURCHASE_APPROVED`: Nova compra aprovada
- `SUBSCRIPTION_CANCELED`: Assinatura cancelada
- `PURCHASE_REFUNDED`: Compra reembolsada
- `PURCHASE_CHARGEBACK`: Estorno via cartão de crédito
- `PAYMENT_OVERDUE`: Pagamento em atraso
- `PURCHASE_DELAYED`: Compra com pagamento pendente
- `PURCHASE_COMPLETE`: Compra concluída (para pagamentos não instantâneos)
- `PURCHASE_BILLET_PRINTED`: Boleto bancário impresso

## Segurança

A integração implementa as seguintes medidas de segurança:

1. **Validação de Token**
   - Todo webhook deve incluir o token secreto no cabeçalho
   - Configurado via variável de ambiente `HOTMART_SECRET`

2. **Registro de IP**
   - O IP de origem de cada webhook é registrado
   - Permite identificar e bloquear origens não autorizadas

3. **Validação de Payload**
   - Estrutura básica do webhook é validada antes do processamento
   - Evita processamento de dados malformados

4. **Criação Segura de Usuários**
   - Usuários criados automaticamente recebem uma senha aleatória forte
   - Exige verificação de e-mail antes de acesso completo

## Recuperação de Erros

A arquitetura permite tratamento de falhas através de:

1. **Logs Detalhados**
   - Todas as tentativas de processamento são registradas
   - Mensagens de erro são armazenadas para diagnóstico

2. **Reprocessamento Manual**
   - Administradores podem reprocessar webhooks que falharam
   - Interface dedicada no painel administrativo

3. **Contagem de Tentativas**
   - O sistema rastreia quantas vezes um webhook foi processado
   - Evita loops infinitos em casos problemáticos

## Painel Administrativo

O painel de administração oferece as seguintes funcionalidades:

1. **Listagem de Webhooks**
   - Visualização de todos os webhooks recebidos
   - Filtros por status, tipo de evento e data

2. **Detalhes do Webhook**
   - Visualização completa dos dados recebidos
   - Informações do usuário afetado
   - Histórico de processamento

3. **Ações**
   - Reprocessamento manual de webhooks que falharam
   - Atualização manual de status de assinatura

## Testes e Depuração

Para testar a integração:

1. **Script de Teste**
   - Use `test-hotmart-webhook-log.js` para simular webhooks
   - Configure o token em `.env` ou diretamente no script

2. **Sandbox da Hotmart**
   - Configure o endpoint de produção para apontar para o ambiente de sandbox
   - Use a URL: `https://sandbox.hotmart.com`

3. **Logs do Sistema**
   - Monitore os logs do servidor durante testes
   - Verifique a tabela `webhookLogs` para resultados

## Configuração

Variáveis de ambiente necessárias:

```
HOTMART_CLIENT_ID=seu_client_id
HOTMART_CLIENT_SECRET=seu_client_secret
HOTMART_SECRET=seu_token_webhook
```

## Limitações e Considerações

- Os webhooks são processados de forma assíncrona, o que pode resultar em pequenos atrasos na atualização de status.
- A Hotmart pode reenviar o mesmo evento múltiplas vezes; o sistema é projetado para lidar com essa redundância.
- Eventos de teste da Hotmart são processados normalmente, mas identificados com um flag especial nos logs.