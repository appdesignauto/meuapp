# Integração Direta com API Hotmart

Este módulo implementa uma integração direta com a API da Hotmart, substituindo o sistema baseado em webhooks por uma abordagem mais robusta e confiável.

## Visão Geral

A integração direta com a API da Hotmart oferece várias vantagens sobre a abordagem baseada em webhooks:

1. **Maior confiabilidade**: Não depende de webhooks que podem ser bloqueados por firewalls ou falhar na entrega
2. **Controle ativo**: Verifica periodicamente o status das assinaturas ao invés de esperar por notificações
3. **Retrocompatibilidade**: Pode sincronizar dados históricos e recuperar o status atual de todos os usuários
4. **Facilidade de manutenção**: Simplifica o monitoramento e o diagnóstico de problemas

## Componentes

O sistema é composto pelos seguintes componentes:

1. **Servidor de Autenticação (auth-server.js)**: Gerencia a autenticação OAuth2 com a Hotmart e permite login de usuários
2. **Serviço de Sincronização (sync-service.js)**: Executa verificações periódicas para manter o status dos usuários atualizado
3. **API Server (api-server.js)**: Fornece endpoints para o frontend consultar dados de assinaturas
4. **Interface Web**: Interface simples para administradores gerenciarem a integração e visualizarem estatísticas

## Requisitos

- Node.js 16 ou superior
- Banco de dados PostgreSQL
- Credenciais de API da Hotmart (Client ID e Client Secret)

## Instalação

1. Clone o repositório ou copie os arquivos para o seu projeto
2. Execute o script de configuração:

```bash
node server/hotmart-integration/setup.js
```

3. Siga as instruções para configurar as credenciais da Hotmart e as demais opções
4. Inicie o servidor de integração:

```bash
node server/hotmart-integration/index.js
```

## Configuração da Hotmart

Para obter as credenciais da API Hotmart:

1. Acesse o [painel da Hotmart](https://app-vlc.hotmart.com/)
2. Vá para Ferramentas > Ferramentas de Desenvolvedor > Credenciais
3. Crie uma nova credencial com os seguintes escopos:
   - `payments.purchases.read`
   - `payments.subscriptions.read`
4. Anote o Client ID e Client Secret para usar na configuração

## Como Funciona

### 1. Sincronização Automática

O serviço de sincronização consulta a API da Hotmart a cada hora para obter o status mais recente das assinaturas e compras dos usuários. Quando uma alteração é detectada (nova assinatura, cancelamento, etc.), o sistema atualiza automaticamente o status do usuário no banco de dados.

### 2. Autenticação de Usuários

O servidor de autenticação verifica o status dos usuários durante o login, garantindo que o acesso seja concedido ou revogado conforme a situação atual da assinatura na Hotmart.

### 3. Painel Administrativo

A interface web fornece um painel administrativo para monitorar a saúde da integração, ver estatísticas e gerenciar configurações. Isso inclui:

- Visualização de estatísticas de assinaturas
- Logs de sincronização
- Configuração das credenciais da API
- Consulta de status de usuários específicos

## Troubleshooting

### Problema: A sincronização não está atualizando os usuários

1. Verifique se as credenciais da Hotmart estão corretas
2. Execute o teste de conexão no painel administrativo
3. Verifique os logs de sincronização para identificar erros específicos

### Problema: Usuários relatam que não têm acesso mesmo com assinatura ativa

1. Busque o usuário pelo e-mail no painel administrativo
2. Verifique o status da assinatura diretamente na API da Hotmart
3. Inicie uma sincronização manual e verifique se o status é atualizado

## Integração com o Sistema Existente

O sistema foi projetado para funcionar em paralelo com a abordagem baseada em webhooks, permitindo uma migração gradual. Recomendamos:

1. Implementar a integração direta em produção
2. Monitorar a sincronização por alguns dias para garantir estabilidade
3. Gradualmente desativar o sistema de webhooks quando a confiança na nova abordagem for estabelecida

## Suporte

Para suporte técnico ou dúvidas sobre a integração, entre em contato com a equipe de desenvolvimento.