# Sistema de Processamento Assíncrono de Webhooks da Hotmart

Este documento detalha o sistema implementado para processar webhooks da Hotmart de forma assíncrona, evitando bloqueios no servidor principal.

## Problema Resolvido

Os webhooks da Hotmart, quando processados de forma síncrona, podem causar bloqueios no servidor, especialmente:
- Quando muitos webhooks são recebidos simultaneamente
- Quando o processamento do webhook é complexo ou demorado
- Quando ocorrem falhas de rede ou indisponibilidade de serviços externos

## Solução Implementada

Implementamos um sistema de fila assíncrona que:
1. Recebe o webhook rapidamente e armazena no banco de dados
2. Responde imediatamente para a Hotmart (evitando reenvios)
3. Processa o webhook em segundo plano ou em intervalos programados

## Componentes do Sistema

### 1. Tabela de Fila de Webhooks
Uma tabela no banco de dados `hotmart_webhooks` para armazenar todos os webhooks recebidos com os seguintes campos:
- ID único
- Data/hora de recebimento
- Data/hora de processamento
- Status (pendente, concluído, falha)
- Tipo de evento
- Código da transação
- Payload completo do webhook
- Contagem de tentativas
- Erro de processamento (se houver)
- Resultado do processamento

### 2. Rota Otimizada para Recebimento
Endpoint `/api/webhook-hotmart` que:
- Recebe o webhook
- Armazena na tabela de fila
- Responde rapidamente (200 OK) sem bloqueio
- Opcionalmente inicia processamento em background após responder

### 3. Processador de Webhooks
Módulo `WebhookProcessor` que:
- Processa webhooks pendentes em lote
- Gerencia tentativas e erros
- Registra resultados no banco de dados
- Pode ser executado manualmente ou por agendamento

### 4. Jobs Programados
Script `process-webhook-queue.js` que:
- Processa webhooks pendentes periodicamente
- Pode ser agendado com cron ou outra solução
- Mantém log detalhado do processamento

## Como Utilizar

### Receber Webhooks da Hotmart
Configure a Hotmart para enviar webhooks para o endpoint:
```
https://seu-dominio.com/api/webhook-hotmart
```

### Processar Webhooks Periodicamente
Execute o script de processamento:
```
node process-webhook-queue.js
```

### Agendar Processamento Automático
Exemplo com cron (Linux/Mac):
```
*/10 * * * * cd /caminho/para/aplicacao && node process-webhook-queue.js >> /caminho/para/logs/webhook-processor.log 2>&1
```

## Benefícios

1. **Estabilidade**: O servidor principal não fica bloqueado processando webhooks
2. **Confiabilidade**: Nenhum webhook é perdido, mesmo em caso de falhas
3. **Rastreabilidade**: Histórico completo de webhooks e seu processamento
4. **Resiliência**: Tentativas automáticas para webhooks com falha
5. **Escalabilidade**: Processamento em lote permite otimização de recursos

## Monitoramento

Para monitorar o funcionamento do sistema:

1. **Verificar webhooks pendentes**:
   ```sql
   SELECT COUNT(*) FROM hotmart_webhooks WHERE status = 'pending';
   ```

2. **Verificar falhas de processamento**:
   ```sql
   SELECT * FROM hotmart_webhooks WHERE status = 'failed' ORDER BY received_at DESC LIMIT 10;
   ```

3. **Logs de processamento**:
   Os logs são gerados durante a execução do job de processamento e podem ser direcionados para um arquivo ou sistema de logs.

## Manutenção

- Considere implementar uma rotina para arquivar webhooks antigos já processados
- Monitore o crescimento da tabela `hotmart_webhooks` para garantir performance
- Ajuste a frequência de processamento conforme o volume de webhooks recebidos