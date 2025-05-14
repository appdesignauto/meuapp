# Integração com Webhooks da Hotmart - Documentação

## Visão Geral

Esta documentação explica como configurar e usar a integração de webhooks da Hotmart com o DesignAuto. 

O webhook permite sincronizar automaticamente o status de assinaturas entre a Hotmart e o DesignAuto, garantindo que:

1. Novas compras aprovadas sejam registradas e os usuários ganhem acesso premium automaticamente
2. Assinaturas canceladas, reembolsadas ou expiradas percam o acesso premium
3. Novos usuários sejam criados automaticamente quando fazem a primeira compra

## Configuração na Hotmart

### Passo 1: Obtenha suas credenciais da Hotmart

Para integrar o webhook da Hotmart, você precisará de:

- **Token Secreto**: Usado para validar a autenticidade dos webhooks (definido por você)

### Passo 2: Configure o Webhook na Hotmart

1. Acesse o [Painel da Hotmart](https://app-vlc.hotmart.com/)
2. Navegue até seu produto
3. Vá para **Ferramentas de Produtor > Webhooks**
4. Clique em **Adicionar Webhook**
5. Configure os seguintes parâmetros:
   - **URL**: `https://seu-dominio.com/api/webhooks/hotmart`
   - **Token**: Insira o mesmo valor que você definiu como `HOTMART_SECRET` no .env
   - **Eventos a serem notificados**: Selecione todos os seguintes:
     - Compra aprovada
     - Compra cancelada
     - Compra reembolsada
     - Assinatura cancelada
     - Assinatura expirada
     - Compra com pagamento atrasado
6. Clique em **Salvar**

### Passo 3: Configure o ambiente do DesignAuto

Certifique-se de que as seguintes variáveis de ambiente estejam configuradas:

```
# Chave secreta para validar webhooks da Hotmart (defina um valor seguro)
HOTMART_SECRET=seu_token_secreto_aqui

# Credenciais da API da Hotmart (necessárias para consultar assinaturas)
HOTMART_CLIENT_ID=seu_client_id
HOTMART_CLIENT_SECRET=seu_client_secret
```

## Eventos suportados

O webhook do DesignAuto processa os seguintes eventos da Hotmart:

| Evento Hotmart | Ação no DesignAuto | Descrição |
|----------------|---------------------|-----------|
| PURCHASE_APPROVED | Criar/atualizar usuário como premium | Quando uma compra é aprovada |
| SUBSCRIPTION_CANCELED | Downgrade para free | Quando uma assinatura é cancelada pelo cliente |
| PURCHASE_REFUNDED | Downgrade para free | Quando uma compra é reembolsada |
| PURCHASE_EXPIRED | Downgrade para free | Quando uma assinatura expira |
| PURCHASE_DELAYED | Registrar somente (sem ação) | Quando uma assinatura está com pagamento atrasado |

## Comportamento da integração

1. **Criação de usuários**
   - Se o usuário não existe no sistema, um novo usuário será criado automaticamente
   - O nome de usuário será baseado no email do comprador
   - Uma senha aleatória será gerada (o usuário precisará usar "Esqueci minha senha" para definir uma nova)

2. **Tipos de plano**
   - Os planos são mapeados com base no nome do plano da Hotmart:
     - Planos contendo "mensal" → premium_mensal
     - Planos contendo "semestral" → premium_semestral
     - Planos contendo "anual" → premium_anual
     - Planos contendo "vitalicio" ou "lifetime" → vitalício (sem data de expiração)

3. **Eventos de cancelamento/reembolso**
   - O usuário é rebaixado imediatamente para o nível "free"
   - O acesso a conteúdo premium é revogado instantaneamente

## Testando o webhook

Para testar a integração localmente, você pode usar o script `test-hotmart-webhook.js`:

```bash
# Simular uma compra aprovada
node test-hotmart-webhook.js approved

# Simular um cancelamento
node test-hotmart-webhook.js canceled

# Simular um reembolso
node test-hotmart-webhook.js refunded

# Simular uma expiração
node test-hotmart-webhook.js expired
```

Por padrão, o script usa o email `example@test.com`. Para testar com outro email:

```bash
TEST_EMAIL=usuario@exemplo.com node test-hotmart-webhook.js approved
```

## Solução de problemas

### Webhook não está funcionando

1. Verifique se a URL do webhook está correta no painel da Hotmart
2. Confirme que o token secreto é o mesmo no painel da Hotmart e na variável HOTMART_SECRET
3. Verifique os logs do servidor para mensagens de erro específicas
4. Teste o webhook localmente usando o script de teste

### Usuários não estão sendo atualizados corretamente

1. Verifique se o email do usuário na Hotmart corresponde ao email no sistema DesignAuto
2. Confirme que o servidor está processando corretamente os webhooks (verifique os logs)
3. Teste manualmente criando um usuário com o mesmo email e processando um webhook

## Segurança

O sistema de webhook implementa as seguintes medidas de segurança:

1. **Validação de token**: Cada requisição de webhook é validada com o token secreto
2. **Verificação de origem**: Apenas requisições com o cabeçalho correto são processadas
3. **Criação segura de usuários**: Senhas geradas aleatoriamente e armazenadas com hash seguro