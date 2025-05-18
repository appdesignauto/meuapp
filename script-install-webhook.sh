#!/bin/bash
# Script para instalar e configurar o webhook da Hotmart no servidor de produção
# Para executar: bash script-install-webhook.sh

echo "===== Instalação do Servidor Webhook da Hotmart para DesignAuto ====="
echo ""
echo "Este script vai configurar todos os componentes necessários para o webhook"
echo "funcionar corretamente em produção."
echo ""

# Verificar se está executando como root
if [ "$EUID" -ne 0 ]; then
  echo "⚠️ Este script deve ser executado como root para configurar o Nginx"
  echo "Por favor, execute novamente com: sudo bash script-install-webhook.sh"
  exit 1
fi

# Verificar se o PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando o PM2 (gerenciador de processos)..."
    npm install -g pm2
    
    if [ $? -ne 0 ]; then
        echo "❌ Falha ao instalar o PM2. Por favor, instale manualmente:"
        echo "npm install -g pm2"
        exit 1
    fi
fi

# Verificar se o nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "⚠️ Nginx não encontrado. Por favor, instale-o manualmente:"
    echo "sudo apt update && sudo apt install -y nginx"
    exit 1
fi

# Adicionar configuração do Nginx
echo "🔧 Configurando o Nginx..."

# Criar arquivo de configuração
NGINX_CONF="/etc/nginx/sites-available/webhook-hotmart.conf"
cat > $NGINX_CONF << EOF
# Configuração do webhook da Hotmart para o DesignAuto
# Este arquivo deve ser incluído no bloco server do seu arquivo principal

location /webhook/hotmart {
    proxy_pass http://localhost:5001/hotmart;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
}

location /webhook/status {
    proxy_pass http://localhost:5001/status;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
}
EOF

echo "📋 Arquivo de configuração do Nginx criado em: $NGINX_CONF"
echo "⚠️ IMPORTANTE: Inclua este arquivo no seu site principal com:"
echo "include $NGINX_CONF;"

# Verificar a configuração do Nginx
echo "🔍 Verificando a configuração do Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Configuração do Nginx inválida. Verifique o arquivo $NGINX_CONF"
    exit 1
fi

# Reiniciar o Nginx
echo "🔄 Reiniciando o Nginx..."
systemctl reload nginx

# Abrir porta no firewall (se ufw estiver ativo)
if command -v ufw &> /dev/null && ufw status | grep -q "active"; then
    echo "🔧 Abrindo porta 5001 no firewall..."
    ufw allow 5001/tcp
    
    if [ $? -ne 0 ]; then
        echo "⚠️ Não foi possível abrir a porta 5001 no firewall."
        echo "Por favor, abra manualmente: sudo ufw allow 5001/tcp"
    fi
fi

# Configurar o servidor webhook para iniciar com o sistema
echo "🚀 Configurando o servidor webhook para iniciar com PM2..."
cd /var/www/designauto || cd /home/ubuntu/designauto || cd /root/designauto

# Iniciar o servidor webhook com PM2
pm2 start server/standalone-webhook-server.js --name "hotmart-webhook"

if [ $? -ne 0 ]; then
    echo "❌ Falha ao iniciar o servidor webhook com PM2."
    echo "Verifique o caminho e tente novamente manualmente."
    exit 1
fi

# Configurar para iniciar automaticamente
pm2 save
pm2 startup

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "O servidor webhook da Hotmart agora está configurado e rodando em:"
echo "https://designauto.com.br/webhook/hotmart"
echo ""
echo "Para verificar o status do servidor webhook:"
echo "  - pm2 status hotmart-webhook"
echo "  - pm2 logs hotmart-webhook"
echo "  - curl http://localhost:5001/status"
echo ""
echo "Se precisar reiniciar manualmente:"
echo "  - pm2 restart hotmart-webhook"
echo ""
echo "⚠️ IMPORTANTE: Configure seu webhook na Hotmart para apontar para:"
echo "https://designauto.com.br/webhook/hotmart"
echo ""