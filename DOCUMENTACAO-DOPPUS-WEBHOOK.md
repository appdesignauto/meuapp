# Documentação da Integração com Webhooks da Doppus

## Visão Geral

A integração com a plataforma Doppus permite que usuários sejam automaticamente criados e promovidos a premium quando realizarem compras aprovadas através da plataforma. Esta integração segue o mesmo padrão arquitetural da integração existente com a Hotmart.

## Funcionalidades Implementadas

### ✅ Processamento Automático de Webhooks
- Endpoint `/webhook/doppus` configurado e funcional
- Processamento de eventos de compra aprovada (`status.code === "approved"`)
- Criação automática de usuários premium
- Logging completo para auditoria

### ✅ Gestão de Usuários
- Criação automática de usuários quando não existem
- Atualização de usuários existentes para premium
- Configuração de expiração de assinatura (30 dias)
- Origem da assinatura marcada como "doppus"

### ✅ Sistema de Logs
- Registro completo de todos os webhooks recebidos
- Rastreamento de transações por ID
- Logs de erro para depuração
- Auditoria completa na tabela `webhook_logs`

## Arquitetura

### Arquivos Principais

1. **`server/services/doppus-service.ts`** - Serviço principal da integração
2. **`server/services/subscription-service.ts`** - Serviço unificado de assinaturas
3. **`server/index.ts`** - Endpoint do webhook

### Fluxo de Processamento

```
Webhook Doppus → Validação → Extração de dados → Criação/Atualização de usuário → Log → Resposta
```

## Configuração do Webhook

### URL do Webhook
```
POST https://seu-dominio.com/webhook/doppus
```

### Headers Necessários
```
Content-Type: application/json
```

### Formato do Payload Esperado
```json
{
  "id": "transaction_id",
  "customer": {
    "email": "cliente@exemplo.com",
    "name": "Nome do Cliente"
  },
  "status": {
    "code": "approved",
    "message": "Pagamento aprovado"
  },
  "transaction": {
    "amount": 2997,
    "id": "doppus_txn_123"
  }
}
```

## Validação e Testes

### Status do Sistema
```bash
# Verificar status dos webhooks
curl -X GET https://seu-dominio.com/webhook/status
```

### Teste Manual
```bash
# Simular webhook da Doppus
curl -X POST https://seu-dominio.com/webhook/doppus \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_transaction",
    "customer": {
      "email": "teste@exemplo.com",
      "name": "Usuario Teste"
    },
    "status": {
      "code": "approved",
      "message": "Pagamento aprovado"
    },
    "transaction": {
      "amount": 2997
    }
  }'
```

### Resposta de Sucesso
```json
{
  "success": true,
  "message": "Webhook da Doppus processado com sucesso",
  "result": {
    "success": true,
    "message": "Compra processada com sucesso",
    "user": {
      "id": 124,
      "email": "teste@exemplo.com",
      "nivelacesso": "premium",
      "origemassinatura": "doppus",
      "dataexpiracao": "2025-07-12T03:44:36.453Z"
    },
    "action": "created"
  },
  "timestamp": "2025-06-12T03:44:37.078Z"
}
```

## Monitoramento e Logs

### Verificar Logs de Webhook
```sql
SELECT 
  id, 
  source, 
  event_type, 
  status, 
  email, 
  transaction_id, 
  created_at 
FROM webhook_logs 
WHERE source = 'doppus' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verificar Usuários Criados pela Doppus
```sql
SELECT 
  id, 
  email, 
  name, 
  nivelacesso, 
  origemassinatura, 
  dataassinatura, 
  dataexpiracao 
FROM users 
WHERE origemassinatura = 'doppus' 
ORDER BY criadoem DESC;
```

## Configuração de Produção

### 1. Configurar URL na Doppus
- Acesse o painel da Doppus
- Configure a URL do webhook: `https://seu-dominio.com/webhook/doppus`
- Selecione eventos de compra aprovada

### 2. Verificar Conectividade
```bash
# Testar conectividade
curl -I https://seu-dominio.com/webhook/status
```

### 3. Monitorar Logs
- Acompanhe os logs da aplicação
- Verifique a tabela `webhook_logs` regularmente
- Configure alertas para falhas de processamento

## Tratamento de Erros

### Códigos de Erro Comuns

| Código | Descrição | Solução |
|--------|-----------|---------|
| 400 | Payload inválido | Verificar formato JSON |
| 500 | Erro interno | Verificar logs do servidor |
| 422 | Dados faltando | Verificar campos obrigatórios |

### Logs de Debugging
Os logs incluem:
- 📩 Webhook recebido
- 📦 Status da transação
- 📧 Email extraído
- 🔄 Início do processamento
- ✅ Sucesso na criação/atualização
- 📝 Log registrado no banco

## Segurança

### Validações Implementadas
- Verificação de formato JSON válido
- Validação de campos obrigatórios
- Sanitização de dados de entrada
- Logging completo para auditoria

### Recomendações
- Configure HTTPS em produção
- Monitore tentativas de acesso malicioso
- Implemente rate limiting se necessário
- Mantenha logs por período adequado

## Integração com Outros Sistemas

### Compatibilidade
- ✅ Funciona junto com webhooks da Hotmart
- ✅ Utiliza o mesmo sistema de gerenciamento de assinaturas
- ✅ Compatível com sistema de logs unificado
- ✅ Integrado ao fluxo de autenticação existente

### Escalabilidade
- Suporte a múltiplas transações simultâneas
- Processamento assíncrono
- Sistema de logs otimizado
- Estrutura preparada para novos eventos

## Manutenção

### Tarefas Regulares
1. Verificar logs de webhook semanalmente
2. Monitorar usuários criados automaticamente
3. Validar integridade dos dados de assinatura
4. Limpar logs antigos conforme política de retenção

### Atualizações Futuras
A estrutura permite facilmente:
- Adicionar novos tipos de eventos da Doppus
- Implementar webhooks de cancelamento
- Expandir sistema de notificações
- Integrar com outros provedores de pagamento

## Status da Implementação

### ✅ Concluído
- [x] Endpoint de webhook funcional
- [x] Processamento de compras aprovadas
- [x] Criação automática de usuários premium
- [x] Sistema de logging completo
- [x] Testes de integração
- [x] Documentação completa

### 🔮 Possíveis Expansões Futuras
- [ ] Webhooks de cancelamento
- [ ] Webhooks de renovação
- [ ] Notificações por email
- [ ] Dashboard de monitoramento
- [ ] Relatórios de conversão

---

**Data de Implementação:** 12 de Junho de 2025  
**Versão:** 1.0  
**Status:** ✅ Produção