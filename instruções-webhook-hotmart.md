# Instruções para Configuração do Webhook Hotmart

Este documento explica como configurar corretamente a integração de webhooks da Hotmart com o DesignAuto.

## 1. Setup do Servidor

O sistema está configurado com um servidor webhook dedicado na porta 5001 para processar 
eventos da Hotmart, garantindo respostas rápidas e confiáveis mesmo durante alto tráfego.

### Configuração do Servidor Webhook Dedicado

Em ambiente de produção, você precisa:

1. **Iniciar o servidor webhook standalone**:
   ```bash
   # Opção usando node diretamente
   node server/standalone-webhook-server.js &
   
   # OU usando PM2 (recomendado)
   pm2 start server/standalone-webhook-server.js --name "webhook-server"
   ```

2. **Configurar o Nginx/Apache**:
   
   Adicione a seguinte configuração no seu arquivo Nginx:
   ```nginx
   location /webhook/hotmart {
       proxy_pass http://localhost:5001/hotmart;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

   Ou no Apache:
   ```apache
   ProxyPass /webhook/hotmart http://localhost:5001/hotmart
   ProxyPassReverse /webhook/hotmart http://localhost:5001/hotmart
   ```

## 2. Configuração na Hotmart

1. Acesse sua conta Hotmart
2. Navegue até Ferramentas > Desenvolvedor > Webhooks
3. Configure a URL do webhook para:
   ```
   https://designauto.com.br/webhook/hotmart
   ```
4. Selecione todos os eventos relevantes (compra aprovada, assinatura cancelada, etc)
5. Salve as configurações

## 3. Diagnóstico

Para verificar se o servidor webhook está funcionando:

1. **Verificar status**:
   ```
   curl http://localhost:5001/status
   ```

2. **Testar com webhooks simulados**:
   ```
   node simulate-webhook-test.js
   ```
   
3. **Verificar logs**:
   ```
   # Visualizar registros no banco de dados
   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
   ```

## 4. Resolução de Problemas

Se os webhooks da Hotmart não estiverem funcionando:

1. Verifique se o servidor webhook está rodando:
   ```
   ps aux | grep standalone-webhook-server
   ```

2. Confirme que a porta 5001 está aberta no firewall:
   ```
   sudo ufw status
   ```

3. Verifique os logs do servidor:
   ```
   pm2 logs webhook-server
   ```

4. Teste a conexão diretamente:
   ```
   curl -X POST -H "Content-Type: application/json" -d '{"test":"payload"}' http://localhost:5001/hotmart
   ```

## Observações

- O servidor webhook responde sempre com status 200 mesmo em caso de erro para evitar reenvios pela Hotmart
- O processamento dos eventos ocorre de forma assíncrona, com o log sendo registrado imediatamente
- A URL pública deve ser sempre `https://designauto.com.br/webhook/hotmart`, com o redirecionamento sendo feito internamente