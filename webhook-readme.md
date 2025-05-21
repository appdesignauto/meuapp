# Sistema de Webhooks Hotmart - Documentação

## Visão Geral

O sistema de Webhooks Hotmart foi implementado para processar automaticamente notificações de pagamento e assinatura enviadas pela plataforma Hotmart. O sistema é capaz de:

1. Receber webhooks em tempo real
2. Processar automaticamente os dados
3. Criar ou atualizar usuários no sistema
4. Gerenciar assinaturas
5. Manter registro completo de todas as notificações

## Componentes Principais

### 1. Endpoint de Recebimento

O endpoint principal para receber webhooks da Hotmart está em:

```
/webhook/hotmart
```

Este endpoint processa o payload recebido, registra no banco de dados e dispara o processamento automático.

### 2. Scripts de Processamento

- `fix-webhook-processor.mjs` - Processa webhooks pendentes e atualiza usuários/assinaturas
- `process-webhook-fixed.js` - Versão alternativa para processamento manual

### 3. Tabelas de Dados

O sistema utiliza as seguintes tabelas:

- `webhook_logs` - Armazena todos os webhooks recebidos
- `users` - Gerencia usuários atualizados pelos webhooks
- `subscriptions` - Gerencia assinaturas de usuários

## Fluxo de Processamento

1. Hotmart envia notificação para o endpoint
2. Sistema registra o webhook no banco de dados (status 'received')
3. Sistema responde imediatamente à Hotmart (HTTP 200)
4. Processamento assíncrono é iniciado após a resposta
5. Se processamento for bem-sucedido, webhook é marcado como 'processed'
6. Se ocorrer erro, webhook é marcado como 'error' com mensagem

## Tipos de Eventos Suportados

- `PURCHASE_APPROVED` - Compra aprovada (cria/atualiza usuário e assinatura)
- Outros eventos são registrados mas não processados automaticamente

## Configuração de Webhook no Hotmart

1. Acesse sua conta Hotmart
2. Vá para Configurações > Desenvolvedor > Webhooks
3. Adicione um novo webhook com a URL completa do seu endpoint
4. Selecione os eventos PURCHASE_APPROVED e outros desejados
5. Salve a configuração

## Teste e Depuração

Para testar manualmente o processamento de um webhook:

```bash
node fix-webhook-processor.mjs <ID_DO_WEBHOOK>
```

Para verificar webhooks recebidos:

```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

## Solução de Problemas

Se um webhook for recebido mas não processado automaticamente:

1. Verifique o status na tabela `webhook_logs`
2. Se o status for 'received', processe manualmente usando o script
3. Verifique qualquer mensagem de erro na coluna `error_message`

## Considerações de Segurança

- O sistema não valida assinaturas em ambiente de desenvolvimento
- Em produção, todas as assinaturas são validadas
- Todas as operações são registradas com IP de origem