// auth-server.js
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração da API Hotmart
const HOTMART_BASE_URL = 'https://developers.hotmart.com';
const HOTMART_AUTH_URL = `${HOTMART_BASE_URL}/oauth/token`;
const HOTMART_PURCHASES_URL = `${HOTMART_BASE_URL}/payments/api/v1/sales`;
const HOTMART_SUBSCRIPTIONS_URL = `${HOTMART_BASE_URL}/payments/api/v1/subscriptions`;

// Cache para o token
let accessTokenCache = {
  token: null,
  expiresAt: 0
};

// Função para obter token de acesso
async function getAccessToken() {
  // Verificar se o token em cache ainda é válido
  const now = Date.now();
  if (accessTokenCache.token && accessTokenCache.expiresAt > now) {
    return accessTokenCache.token;
  }

  try {
    // Buscar credenciais do banco de dados
    const credResult = await pool.query(`
      SELECT key, value FROM integration_settings
      WHERE provider = 'hotmart'
      AND (key = 'client_id' OR key = 'client_secret')
    `);

    const credentials = {
      clientId: null,
      clientSecret: null
    };

    credResult.rows.forEach(row => {
      if (row.key === 'client_id') {
        credentials.clientId = row.value;
      } else if (row.key === 'client_secret') {
        credentials.clientSecret = row.value;
      }
    });

    // Verificar se as credenciais estão presentes
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error('Credenciais da Hotmart não configuradas no banco de dados');
    }

    // Parâmetros para obter token
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', credentials.clientId);
    params.append('client_secret', credentials.clientSecret);

    // Requisição para obter o token
    const response = await axios.post(HOTMART_AUTH_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Armazenar token em cache
    const token = response.data.access_token;
    const expiresIn = response.data.expires_in * 1000; // Converter para milissegundos
    accessTokenCache = {
      token,
      expiresAt: now + expiresIn - 60000 // 1 minuto de margem
    };

    return token;
  } catch (error) {
    console.error('Erro ao obter token de acesso Hotmart:', error.message);
    throw error;
  }
}

// Rota para autenticação do usuário
app.post('/auth', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  try {
    // Verificar se o usuário existe
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];

    // Verificar assinatura na Hotmart
    try {
      const token = await getAccessToken();
      
      // Consultar assinaturas na Hotmart
      const subscriptionResponse = await axios.get(`${HOTMART_SUBSCRIPTIONS_URL}?subscriber_email=${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const subscriptions = subscriptionResponse.data.items || [];
      const activeSubscription = subscriptions.find(sub => 
        sub.status === 'ACTIVE' || sub.status === 'DELAYED'
      );

      // Atualizar status do usuário se necessário
      if (activeSubscription) {
        // Usuário tem assinatura ativa
        await pool.query(`
          UPDATE users 
          SET tipoplano = $1, 
              origemassinatura = 'hotmart', 
              dataassinatura = $2, 
              dataexpiracao = $3,
              atualizadoem = NOW()
          WHERE id = $4
        `, [
          activeSubscription.plan?.name || 'Plano Premium',
          new Date(activeSubscription.start_date || new Date()),
          new Date(activeSubscription.end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
          user.id
        ]);
      } else {
        // Verificar compras avulsas
        const purchaseResponse = await axios.get(`${HOTMART_PURCHASES_URL}?email=${email}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const purchases = purchaseResponse.data.items || [];
        const approvedPurchase = purchases.find(purchase => 
          purchase.status === 'APPROVED' || purchase.status === 'COMPLETE'
        );

        if (approvedPurchase) {
          // Usuário tem compra aprovada (acesso vitalício)
          await pool.query(`
            UPDATE users 
            SET tipoplano = 'Acesso Vitalício', 
                origemassinatura = 'hotmart', 
                dataassinatura = $1,
                acessovitalicio = true, 
                atualizadoem = NOW()
            WHERE id = $2
          `, [
            new Date(approvedPurchase.approved_date || new Date()),
            user.id
          ]);
        }
      }

      // Buscar usuário atualizado
      const updatedUserResult = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
      const updatedUser = updatedUserResult.rows[0];

      // Gerar token JWT
      const jwtSecret = process.env.JWT_SECRET || 'hotmart-integration-secret';
      const token = jwt.sign(
        { id: updatedUser.id, email: updatedUser.email },
        jwtSecret,
        { expiresIn: '24h' }
      );

      // Preparar dados do usuário para retorno (excluir senha)
      const { password, ...userWithoutPassword } = updatedUser;

      // Adicionar informações da assinatura
      const userSubscriptions = [];
      if (activeSubscription) {
        userSubscriptions.push({
          id: activeSubscription.id,
          status: activeSubscription.status,
          plan: activeSubscription.plan?.name || 'Plano Premium',
          startDate: activeSubscription.start_date,
          expiryDate: activeSubscription.end_date
        });
      }

      return res.json({
        user: {
          ...userWithoutPassword,
          subscriptions: userSubscriptions
        },
        token
      });

    } catch (hotmartError) {
      console.error('Erro ao consultar Hotmart:', hotmartError.message);
      
      // Falha graciosa - retornar usuário sem verificar assinatura
      const { password, ...userWithoutPassword } = user;
      
      // Gerar token JWT mesmo sem verificação Hotmart
      const jwtSecret = process.env.JWT_SECRET || 'hotmart-integration-secret';
      const token = jwt.sign(
        { id: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '24h' }
      );
      
      return res.json({
        user: userWithoutPassword,
        token,
        warning: 'Não foi possível verificar assinatura na Hotmart.'
      });
    }
  } catch (error) {
    console.error('Erro no servidor de autenticação:', error.message);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar o status da assinatura
app.get('/subscription/:email', async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  try {
    const token = await getAccessToken();
    
    // Consultar assinaturas na Hotmart
    const subscriptionResponse = await axios.get(`${HOTMART_SUBSCRIPTIONS_URL}?subscriber_email=${email}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return res.json({
      success: true,
      subscriptions: subscriptionResponse.data.items || []
    });
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error.message);
    return res.status(500).json({ error: 'Erro ao verificar assinatura' });
  }
});

// Manter o módulo ativo para evitar que o processo filho seja encerrado
setInterval(() => {
  console.log('[auth-server] Mantendo o serviço ativo');
}, 60000);

// Exportar o app para ser usado pelo index.js
module.exports = app;