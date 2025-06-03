# Configuração de Domínio Personalizado para o DesignAuto

Esta documentação detalha como configurar o domínio personalizado `designauto.com.br` para a aplicação DesignAuto hospedada no Replit.

## Passo 1: Configuração no Replit

1. No painel de controle do Replit, vá até o projeto DesignAuto.
2. Clique na aba "Deployments" (se não estiver visível, primeiro clique nos três pontos no canto superior direito).
3. Na seção "Domains", insira `designauto.com.br` no campo de texto e clique em "Add Domain".
4. O Replit fornecerá um valor CNAME que você precisará configurar no seu provedor de DNS.

## Passo 2: Configuração de DNS

No seu provedor de DNS (onde o domínio designauto.com.br está registrado):

1. Adicione um registro CNAME para o domínio principal:
   - Tipo: CNAME
   - Nome/Host: `@` ou deixe em branco (depende do provedor)
   - Valor/Destino: [O valor CNAME fornecido pelo Replit]
   - TTL: 3600 (ou o recomendado pelo provedor)

2. Adicione um registro CNAME para o subdomínio www:
   - Tipo: CNAME
   - Nome/Host: `www`
   - Valor/Destino: [O valor CNAME fornecido pelo Replit]
   - TTL: 3600 (ou o recomendado pelo provedor)

## Passo 3: Configuração SSL (HTTPS)

O Replit gerencia automaticamente os certificados SSL para domínios personalizados. Após configurar os registros CNAME e aguardar a propagação do DNS (que pode levar até 48 horas), o HTTPS deve funcionar automaticamente.

## Verificação

Para verificar se a configuração foi concluída corretamente:

1. Aguarde a propagação do DNS (geralmente 15 minutos a 48 horas).
2. Acesse `https://designauto.com.br` em um navegador.
3. Verifique se o site carrega corretamente e se o certificado SSL está válido (deve mostrar um cadeado fechado na barra de endereço).

## Solução de Problemas

Se o domínio não estiver funcionando corretamente:

1. **Propagação do DNS**: Verifique se o DNS propagou usando ferramentas como [whatsmydns.net](https://www.whatsmydns.net/).
2. **Configuração CNAME**: Confirme se o registro CNAME está configurado corretamente no seu provedor de DNS.
3. **Revalidação no Replit**: No painel de Deployments do Replit, clique em "Revalidate" ao lado do domínio adicionado.
4. **Suporte Replit**: Se o problema persistir, contate o suporte do Replit com os detalhes da configuração.

## Configurações Adicionais de Segurança

As seguintes configurações já foram implementadas no código para garantir que o domínio personalizado funcione corretamente:

1. Configuração de CORS para permitir requisições de `designauto.com.br` e subdomínios.
2. Configuração de cookies para funcionar com o domínio `.designauto.com.br`.
3. Configuração de CSP (Content Security Policy) para permitir recursos de `designauto.com.br`.

Estas configurações garantem que a autenticação e outras funcionalidades funcionem corretamente com o domínio personalizado.