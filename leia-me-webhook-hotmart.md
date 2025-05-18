# Instruções para Ativar o Webhook da Hotmart no DesignAuto

Este documento contém instruções passo a passo para configurar o webhook da Hotmart no seu servidor designauto.com.br.

## O que você precisa saber

Implementamos um servidor webhook dedicado que:

1. Responde rapidamente (menos de 200ms)
2. Registra todos os webhooks no banco de dados
3. Extraí informações importantes (email, ID de transação, tipo de evento)
4. Processa os dados para atualizar assinaturas
5. Funciona independentemente do restante da aplicação (não é afetado pelo SPA)

## Passo 1: Abrir a porta 5001 no seu firewall

```bash
# Caso use ufw (Ubuntu)
sudo ufw allow 5001

# Caso use firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5001/tcp
sudo firewall-cmd --reload
```

## Passo 2: Configurar o Nginx

1. Abra seu arquivo de configuração do Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/designauto.com.br.conf
   ```

2. Adicione as seguintes linhas dentro do bloco `server`:
   ```nginx
   # Configuração do webhook da Hotmart
   location /webhook/hotmart {
       proxy_pass http://localhost:5001/hotmart;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_read_timeout 300;
       proxy_connect_timeout 300;
   }
   ```

3. Verifique e aplique a configuração:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Passo 3: Iniciar o servidor webhook

1. Configure para iniciar automaticamente (recomendado com PM2):
   ```bash
   # Instalar PM2 (se ainda não tiver)
   npm install -g pm2

   # Adicionar o servidor webhook ao PM2
   pm2 start server/standalone-webhook-server.js --name "hotmart-webhook"
   
   # Configurar para iniciar com o sistema
   pm2 startup
   pm2 save
   ```

2. Ou inicie manualmente (método alternativo):
   ```bash
   # Usando o script que criamos
   bash start-webhook-server.sh
   ```

## Passo 4: Configurar o webhook na Hotmart

1. Acesse [app-vlc.hotmart.com](https://app-vlc.hotmart.com/) e faça login
2. Vá para Ferramentas > Desenvolvedor > Webhooks
3. Configure a URL:
   ```
   https://designauto.com.br/webhook/hotmart
   ```
4. Ative todos os eventos relevantes:
   - PURCHASE_APPROVED
   - SUBSCRIPTION_CANCELLATION
   - PURCHASE_REFUNDED
   - SUBSCRIPTION_REACTIVATED

## Passo 5: Testar o webhook

1. Verifique se o servidor está rodando:
   ```bash
   curl http://localhost:5001/status
   ```

2. Consulte os logs:
   ```bash
   # Se estiver usando PM2
   pm2 logs hotmart-webhook

   # Se estiver usando o script
   cat webhook-server.log
   ```

3. Verifique os registros no banco de dados:
   ```sql
   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 5;
   ```

## Solução de Problemas

- **Erro 408 (Timeout)**: O servidor Hotmart não está recebendo resposta rápida o suficiente. Verifique se o servidor webhook está rodando e se o Nginx está configurado corretamente.

- **Porta 5001 ocupada**: Verifique se outro processo está usando a porta 5001:
  ```bash
  sudo lsof -i :5001
  ```

- **Servidor webhook não inicia**: Verifique os logs do servidor:
  ```bash
  cat webhook-server.log
  ```

## Conclusão

Seu servidor webhook da Hotmart está configurado! Todos os eventos serão recebidos na URL `https://designauto.com.br/webhook/hotmart` e processados pelo servidor dedicado na porta 5001, garantindo respostas rápidas e confiáveis.