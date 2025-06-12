# Padronização de Senhas para Webhooks

## Resumo

Implementação da senha padrão unificada `auto@123` para usuários criados automaticamente via webhooks das plataformas Hotmart e Doppus.

## Implementação

### Hotmart
- **Arquivo:** `server/routes/webhook-hotmart-fixed.ts`
- **Linha 38:** `const tempPassword = 'auto@123';`
- **Status:** ✅ Implementado desde a versão inicial

### Doppus  
- **Arquivo:** `server/services/doppus-service.ts`
- **Linhas 192-194:** 
  ```typescript
  const defaultPassword = 'auto@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  ```
- **Status:** ✅ Implementado em 12/06/2025

## Comportamento Unificado

### Para Ambas as Plataformas:
1. **Novos usuários criados via webhook recebem:**
   - Email: conforme fornecido no webhook
   - Senha: `auto@123` (hash bcrypt)
   - Nível de acesso: `premium`
   - Origem: `hotmart` ou `doppus`

2. **Usuários existentes:**
   - Mantêm senha atual
   - Atualizam apenas dados de assinatura

## Validação

### Teste Realizado
```bash
# Usuário criado via Doppus
Email: teste.local.1749700862@doppus.com
Senha: auto@123
Status: ✅ Login bem-sucedido
```

### Verificação de Hash
```javascript
bcrypt.compare('auto@123', hashedPassword) // true
```

## Benefícios

1. **Consistência:** Mesma senha para ambas plataformas
2. **Simplicidade:** Fácil comunicação aos usuários
3. **Segurança:** Hash bcrypt com salt automático
4. **Manutenibilidade:** Padrão único para manter

## Acesso do Usuário

Usuários criados automaticamente podem:
1. Fazer login com email + `auto@123`
2. Usar "Esqueci minha senha" para definir nova senha
3. Acessar conteúdo premium imediatamente

## Status

- ✅ Hotmart: Funcional desde implementação inicial
- ✅ Doppus: Implementado e testado em 12/06/2025
- ✅ Documentação: Atualizada
- ✅ Testes: Validados com sucesso

**Data:** 12 de Junho de 2025  
**Versão:** 1.0  
**Responsável:** Sistema automatizado de webhooks