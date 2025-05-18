# Plano de Integração da Hotmart com Aplicação no Replit

Este documento apresenta um plano detalhado para integrar a API da Hotmart com uma aplicação hospedada no Replit. O objetivo é criar uma solução funcional que permita acessar dados da plataforma Hotmart, processar informações de vendas, produtos e assinaturas, além de receber notificações em tempo real através de webhooks.

## 1. Requisitos Mínimos para Aplicação no Replit

Para criar uma integração funcional entre a Hotmart e uma aplicação no Replit, precisamos estabelecer alguns requisitos fundamentais:

### Linguagem e Framework

Python é a escolha ideal para esta integração devido à sua simplicidade e amplo suporte para integrações API. Utilizaremos o framework Flask para criar uma aplicação web capaz de processar requisições HTTP e expor endpoints para webhooks. O Python no Replit já vem com várias bibliotecas pré-instaladas, facilitando o desenvolvimento.

### Bibliotecas Necessárias

Para nossa integração, precisaremos das seguintes bibliotecas:
- `requests`: Para realizar chamadas HTTP à API da Hotmart
- `flask`: Para criar a aplicação web e endpoints para webhooks
- `python-dotenv`: Para gerenciar variáveis de ambiente e credenciais
- `flask-cors`: Para lidar com requisições cross-origin, se necessário
- `pyjwt`: Para validar tokens JWT, caso a Hotmart os utilize

### Armazenamento de Credenciais

O Replit oferece um sistema de variáveis de ambiente seguro que utilizaremos para armazenar credenciais sensíveis como `client_id` e `client_secret`. Isso evita que essas informações sejam expostas no código-fonte ou em repositórios públicos.

## 2. Fluxo de Autenticação e Obtenção de Credenciais

A Hotmart utiliza o protocolo OAuth 2.0 para autenticação, o que requer um processo específico para obter e renovar tokens de acesso. Vamos detalhar esse processo:

### Criação de Credenciais na Plataforma Hotmart

1. Acesse a plataforma Hotmart e navegue até "Ferramentas > Credenciais Developers"
2. Clique no botão "Criar Credencial" e forneça um nome para sua credencial
3. Decida se deseja usar o ambiente de sandbox (para testes) ou produção
4. Após a criação, você receberá três informações essenciais:
   - `client_id`: Identificador único da sua aplicação
   - `client_secret`: Chave secreta para autenticação
   - `token` do tipo Basic: Token inicial para autenticação

### Implementação do Fluxo OAuth 2.0 no Replit

Criaremos um arquivo `auth.py` para gerenciar o processo de autenticação:

```python
import requests
import os
import time
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Configurações de autenticação
CLIENT_ID = os.getenv('HOTMART_CLIENT_ID')
CLIENT_SECRET = os.getenv('HOTMART_CLIENT_SECRET')
BASE_URL = os.getenv('HOTMART_BASE_URL', 'https://developers.hotmart.com')
SANDBOX_URL = os.getenv('HOTMART_SANDBOX_URL', 'https://sandbox.hotmart.com')

# Variáveis para armazenar o token
access_token = None
token_expiry = 0

def get_access_token(use_sandbox=False):
    """
    Obtém um token de acesso da API Hotmart.
    Verifica se já existe um token válido antes de solicitar um novo.
    """
    global access_token, token_expiry
    
    # Verifica se o token atual ainda é válido
    current_time = time.time()
    if access_token and token_expiry > current_time:
        return access_token
    
    # Define a URL base de acordo com o ambiente
    base_url = SANDBOX_URL if use_sandbox else BASE_URL
    
    # Prepara a requisição para obter o token
    url = f"{base_url}/security/oauth/token?grant_type=client_credentials"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Basic {os.getenv("HOTMART_BASIC_TOKEN")}'
    }
    
    try:
        response = requests.post(url, headers=headers)
        response.raise_for_status()  # Levanta exceção para erros HTTP
        
        data = response.json()
        access_token = data['access_token']
        # Converte o tempo de expiração para timestamp e subtrai 60 segundos por segurança
        token_expiry = current_time + data['expires_in'] - 60
        
        return access_token
    except requests.exceptions.RequestException as e:
        print(f"Erro ao obter token de acesso: {e}")
        return None

def get_auth_header(use_sandbox=False):
    """
    Retorna o cabeçalho de autorização com o token de acesso.
    """
    token = get_access_token(use_sandbox)
    if token:
        return {'Authorization': f'Bearer {token}'}
    return {}
```

### Armazenamento Seguro no Replit

Para armazenar as credenciais com segurança no Replit, utilizaremos o sistema de variáveis de ambiente:

1. No seu projeto Replit, acesse a aba "Secrets" (ou "Variáveis de Ambiente")
2. Adicione as seguintes variáveis:
   - `HOTMART_CLIENT_ID`: Seu client_id da Hotmart
   - `HOTMART_CLIENT_SECRET`: Seu client_secret da Hotmart
   - `HOTMART_BASIC_TOKEN`: O token Basic fornecido pela Hotmart
   - `HOTMART_BASE_URL`: URL base da API (https://developers.hotmart.com)
   - `HOTMART_SANDBOX_URL`: URL do sandbox (https://sandbox.hotmart.com)

## 3. Estrutura da Aplicação no Replit

Vamos criar uma estrutura básica para nossa aplicação de integração:

### Arquivo Principal (main.py)

```python
from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from auth import get_auth_header
import requests

# Carrega variáveis de ambiente
load_dotenv()

# Configuração da aplicação Flask
app = Flask(__name__)

# Configurações da API Hotmart
BASE_URL = os.getenv('HOTMART_BASE_URL', 'https://developers.hotmart.com')
SANDBOX_URL = os.getenv('HOTMART_SANDBOX_URL', 'https://sandbox.hotmart.com')
USE_SANDBOX = os.getenv('USE_SANDBOX', 'False').lower() == 'true'

# Define a URL base de acordo com o ambiente
api_base_url = SANDBOX_URL if USE_SANDBOX else BASE_URL

@app.route('/')
def home():
    return "Integração Hotmart - Aplicação funcionando!"

@app.route('/products', methods=['GET'])
def get_products():
    """
    Obtém a lista de produtos do usuário na Hotmart
    """
    url = f"{api_base_url}/products/api/v1/products"
    headers = get_auth_header(USE_SANDBOX)
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sales', methods=['GET'])
def get_sales():
    """
    Obtém o histórico de vendas do usuário na Hotmart
    """
    url = f"{api_base_url}/payments/api/v1/sales"
    headers = get_auth_header(USE_SANDBOX)
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/webhook', methods=['POST'])
def webhook_handler():
    """
    Endpoint para receber notificações webhook da Hotmart
    """
    data = request.json
    
    # Aqui você pode processar diferentes tipos de eventos
    # Por exemplo, verificar o tipo de evento e executar ações específicas
    event_type = data.get('event')
    
    print(f"Webhook recebido: {event_type}")
    print(f"Dados: {data}")
    
    # Implemente sua lógica de processamento aqui
    
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    # Inicia a aplicação na porta 8080, padrão do Replit
    app.run(host='0.0.0.0', port=8080)
```

### Arquivo de Requisitos (requirements.txt)

```
flask==2.0.1
requests==2.26.0
python-dotenv==0.19.0
flask-cors==3.0.10
pyjwt==2.1.0
```

## 4. Consumo de Endpoints da API Hotmart

Vamos criar um módulo específico para interagir com os principais endpoints da API Hotmart:

### Arquivo hotmart_api.py

```python
import requests
from auth import get_auth_header
import os

# Configurações da API
BASE_URL = os.getenv('HOTMART_BASE_URL', 'https://developers.hotmart.com')
SANDBOX_URL = os.getenv('HOTMART_SANDBOX_URL', 'https://sandbox.hotmart.com')
USE_SANDBOX = os.getenv('USE_SANDBOX', 'False').lower() == 'true'

# Define a URL base de acordo com o ambiente
api_base_url = SANDBOX_URL if USE_SANDBOX else BASE_URL

def get_products(page_token=None, max_results=50):
    """
    Obtém a lista de produtos do usuário na Hotmart
    
    Args:
        page_token: Token para paginação
        max_results: Número máximo de resultados por página
    
    Returns:
        dict: Dados dos produtos ou mensagem de erro
    """
    url = f"{api_base_url}/products/api/v1/products"
    params = {'max_results': max_results}
    
    if page_token:
        params['page_token'] = page_token
        
    headers = get_auth_header(USE_SANDBOX)
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao obter produtos: {e}")
        return {"error": str(e)}

def get_sales_history(page_token=None, max_results=50, start_date=None, end_date=None):
    """
    Obtém o histórico de vendas do usuário na Hotmart
    
    Args:
        page_token: Token para paginação
        max_results: Número máximo de resultados por página
        start_date: Data inicial para filtro (formato: YYYY-MM-DD)
        end_date: Data final para filtro (formato: YYYY-MM-DD)
    
    Returns:
        dict: Dados das vendas ou mensagem de erro
    """
    url = f"{api_base_url}/payments/api/v1/sales"
    params = {'max_results': max_results}
    
    if page_token:
        params['page_token'] = page_token
    
    if start_date:
        params['start_date'] = start_date
    
    if end_date:
        params['end_date'] = end_date
        
    headers = get_auth_header(USE_SANDBOX)
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao obter histórico de vendas: {e}")
        return {"error": str(e)}

def get_subscriptions(page_token=None, max_results=50, status=None):
    """
    Obtém as assinaturas do usuário na Hotmart
    
    Args:
        page_token: Token para paginação
        max_results: Número máximo de resultados por página
        status: Status das assinaturas para filtro
    
    Returns:
        dict: Dados das assinaturas ou mensagem de erro
    """
    url = f"{api_base_url}/payments/api/v1/subscriptions"
    params = {'max_results': max_results}
    
    if page_token:
        params['page_token'] = page_token
    
    if status:
        params['status'] = status
        
    headers = get_auth_header(USE_SANDBOX)
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao obter assinaturas: {e}")
        return {"error": str(e)}
```

## 5. Configuração de Webhooks

A Hotmart oferece um sistema de webhooks (também chamado de Postback) para notificar sua aplicação sobre eventos em tempo real. Vamos configurar isso:

### Configuração na Plataforma Hotmart

1. Acesse a plataforma Hotmart e navegue até "Ferramentas > Webhook"
2. Clique em "Adicionar URL" e insira a URL do seu endpoint de webhook no Replit
   - Formato: `https://seu-projeto.replit.app/webhook`
3. Selecione os eventos que deseja receber (ex: PURCHASE_APPROVED, SUBSCRIPTION_CANCELED)
4. Salve as configurações

### Implementação do Processador de Webhooks

Vamos criar um arquivo específico para processar os eventos de webhook:

```python
# webhook_handler.py
import hmac
import hashlib
import os

def validate_webhook_signature(request_data, signature_header):
    """
    Valida a assinatura do webhook da Hotmart (se disponível)
    """
    # Verifique se a Hotmart fornece um mecanismo de validação
    # Este é um exemplo genérico que pode precisar de ajustes
    webhook_secret = os.getenv('HOTMART_WEBHOOK_SECRET')
    
    if not webhook_secret or not signature_header:
        # Se não houver segredo ou assinatura, pule a validação
        return True
    
    computed_signature = hmac.new(
        webhook_secret.encode('utf-8'),
        request_data.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed_signature, signature_header)

def process_purchase_event(data):
    """
    Processa eventos de compra
    """
    # Extrair informações relevantes
    transaction_id = data.get('transaction', {}).get('id')
    product_id = data.get('product', {}).get('id')
    buyer_email = data.get('buyer', {}).get('email')
    
    # Lógica para processar a compra
    print(f"Nova compra: {transaction_id} - Produto: {product_id} - Comprador: {buyer_email}")
    
    # Aqui você pode adicionar o comprador a uma lista de e-mails,
    # atualizar um banco de dados, enviar um e-mail de boas-vindas, etc.
    
    return True

def process_subscription_event(data):
    """
    Processa eventos de assinatura
    """
    # Extrair informações relevantes
    subscription_id = data.get('subscription', {}).get('id')
    status = data.get('subscription', {}).get('status')
    
    # Lógica para processar a assinatura
    print(f"Atualização de assinatura: {subscription_id} - Status: {status}")
    
    # Aqui você pode atualizar o status da assinatura em seu banco de dados,
    # enviar e-mails de notificação, etc.
    
    return True

def process_webhook_event(event_type, data):
    """
    Processa diferentes tipos de eventos de webhook
    """
    if event_type in ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']:
        return process_purchase_event(data)
    
    elif event_type in ['SUBSCRIPTION_CANCELED', 'SUBSCRIPTION_RESTARTED', 'SUBSCRIPTION_DELAYED']:
        return process_subscription_event(data)
    
    else:
        # Evento não reconhecido ou não implementado
        print(f"Evento não processado: {event_type}")
        return False
```

## 6. Interface Web Simples

Para facilitar o teste e visualização dos dados, vamos criar uma interface web simples:

### Estrutura de Diretórios

```
/
├── main.py
├── auth.py
├── hotmart_api.py
├── webhook_handler.py
├── requirements.txt
└── templates/
    ├── index.html
    ├── products.html
    └── sales.html
```

### Exemplo de Template HTML (templates/index.html)

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integração Hotmart - Replit</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #f27623;
            border-bottom: 2px solid #f27623;
            padding-bottom: 10px;
        }
        .card {
            background: #f9f9f9;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .btn {
            display: inline-block;
            background: #f27623;
            color: white;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 4px;
            margin-right: 10px;
        }
        .btn:hover {
            background: #d35f0f;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Integração Hotmart - Replit</h1>
        
        <div class="card">
            <h2>Dados da Hotmart</h2>
            <p>Acesse os dados da sua conta Hotmart:</p>
            <a href="/products" class="btn">Ver Produtos</a>
            <a href="/sales" class="btn">Ver Vendas</a>
            <a href="/subscriptions" class="btn">Ver Assinaturas</a>
        </div>
        
        <div class="card">
            <h2>Status da Integração</h2>
            <p>Ambiente: <strong id="environment">Carregando...</strong></p>
            <p>Status da API: <strong id="api-status">Verificando...</strong></p>
        </div>
    </div>
    
    <script>
        // Script para verificar o status da API
        fetch('/api/status')
            .then(response => response.json())
            .then(data => {
                document.getElementById('environment').textContent = data.environment;
                document.getElementById('api-status').textContent = data.status;
            })
            .catch(error => {
                document.getElementById('api-status').textContent = 'Erro ao conectar';
                console.error('Erro:', error);
            });
    </script>
</body>
</html>
```

## 7. Atualização do Arquivo Principal para Suportar a Interface Web

```python
from flask import Flask, request, jsonify, render_template
import os
from dotenv import load_dotenv
from auth import get_auth_header, get_access_token
import hotmart_api
from webhook_handler import process_webhook_event, validate_webhook_signature

# Carrega variáveis de ambiente
load_dotenv()

# Configuração da aplicação Flask
app = Flask(__name__)

# Configurações da API Hotmart
USE_SANDBOX = os.getenv('USE_SANDBOX', 'False').lower() == 'true'

# Rotas para a interface web
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/products')
def products_page():
    return render_template('products.html')

@app.route('/sales')
def sales_page():
    return render_template('sales.html')

@app.route('/subscriptions')
def subscriptions_page():
    return render_template('subscriptions.html')

# Rotas da API
@app.route('/api/status')
def api_status():
    """
    Verifica o status da conexão com a API Hotmart
    """
    token = get_access_token(USE_SANDBOX)
    environment = "Sandbox" if USE_SANDBOX else "Produção"
    
    if token:
        return jsonify({
            "status": "Conectado",
            "environment": environment
        })
    else:
        return jsonify({
            "status": "Erro de conexão",
            "environment": environment
        }), 500

@app.route('/api/products')
def get_products_api():
    """
    API para obter produtos
    """
    page_token = request.args.get('page_token')
    max_results = request.args.get('max_results', 50, type=int)
    
    result = hotmart_api.get_products(page_token, max_results)
    return jsonify(result)

@app.route('/api/sales')
def get_sales_api():
    """
    API para obter vendas
    """
    page_token = request.args.get('page_token')
    max_results = request.args.get('max_results', 50, type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = hotmart_api.get_sales_history(page_token, max_results, start_date, end_date)
    return jsonify(result)

@app.route('/api/subscriptions')
def get_subscriptions_api():
    """
    API para obter assinaturas
    """
    page_token = request.args.get('page_token')
    max_results = request.args.get('max_results', 50, type=int)
    status = request.args.get('status')
    
    result = hotmart_api.get_subscriptions(page_token, max_results, status)
    return jsonify(result)

@app.route('/webhook', methods=['POST'])
def webhook_handler():
    """
    Endpoint para receber notificações webhook da Hotmart
    """
    # Obter dados da requisição
    data = request.json
    
    # Validar assinatura do webhook (se disponível)
    signature = request.headers.get('X-Hotmart-Signature')
    if not validate_webhook_signature(request.data.decode('utf-8'), signature):
        return jsonify({"error": "Invalid signature"}), 403
    
    # Processar o evento
    event_type = data.get('event')
    if event_type:
        success = process_webhook_event(event_type, data)
        if success:
            return jsonify({"status": "success"}), 200
    
    return jsonify({"status": "unprocessed"}), 200

if __name__ == '__main__':
    # Inicia a aplicação na porta 8080, padrão do Replit
    app.run(host='0.0.0.0', port=8080)
```

## 8. Instruções para Implantação no Replit

1. Crie um novo Repl no Replit, selecionando Python como linguagem
2. Crie os arquivos conforme a estrutura apresentada acima
3. Adicione as variáveis de ambiente necessárias na seção "Secrets" do Replit:
   - `HOTMART_CLIENT_ID`
   - `HOTMART_CLIENT_SECRET`
   - `HOTMART_BASIC_TOKEN`
   - `HOTMART_BASE_URL`
   - `HOTMART_SANDBOX_URL`
   - `USE_SANDBOX` (defina como "True" para testes iniciais)
4. Execute o comando para instalar as dependências:
   ```
   pip install -r requirements.txt
   ```
5. Inicie a aplicação clicando no botão "Run"
6. Após a inicialização, o Replit fornecerá uma URL para sua aplicação
7. Configure esta URL nos webhooks da Hotmart, adicionando `/webhook` ao final

## 9. Testes e Validação

Para garantir que sua integração está funcionando corretamente, siga estes passos:

1. Acesse a URL da sua aplicação no Replit
2. Verifique se a página inicial carrega corretamente
3. Clique em "Ver Produtos" para testar a conexão com a API
4. Se estiver usando o ambiente sandbox, crie algumas transações de teste na Hotmart
5. Verifique se os webhooks estão sendo recebidos corretamente (monitore os logs do Replit)

## 10. Migração para Produção

Quando estiver pronto para migrar para o ambiente de produção:

1. Crie novas credenciais na Hotmart para o ambiente de produção
2. Atualize as variáveis de ambiente no Replit:
   - Atualize `HOTMART_CLIENT_ID`, `HOTMART_CLIENT_SECRET` e `HOTMART_BASIC_TOKEN` com as novas credenciais
   - Defina `USE_SANDBOX` como "False"
3. Teste novamente a aplicação para garantir que está funcionando corretamente
4. Configure os webhooks na Hotmart para apontar para sua aplicação em produção

## Considerações Finais

Esta integração permite que você acesse dados da Hotmart, processe vendas e receba notificações em tempo real. Você pode expandir esta base para criar dashboards personalizados, automatizar processos de pós-venda, ou integrar com outros sistemas.

Lembre-se de manter suas credenciais seguras e considerar implementar medidas adicionais de segurança, como validação de IP e monitoramento de atividades suspeitas.

Para mais informações, consulte a [documentação oficial da API Hotmart](https://developers.hotmart.com/docs/).
