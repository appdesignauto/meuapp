/**
 * Cliente de API da Hotmart
 * 
 * Este serviço permite comunicação direta com a API da Hotmart,
 * possibilitando consultas de assinaturas e compras sem depender de webhooks.
 */

import fetch from 'node-fetch';
import { Pool } from 'pg';

// URLs da API
const HOTMART_API_BASE_URL = 'https://developers.hotmart.com';
const HOTMART_AUTH_URL = `${HOTMART_API_BASE_URL}/oauth/token`;
const HOTMART_PURCHASES_URL = `${HOTMART_API_BASE_URL}/payments/api/v1/sales`;
const HOTMART_SUBSCRIPTIONS_URL = `${HOTMART_API_BASE_URL}/payments/api/v1/subscriptions`;

/**
 * Obtém credenciais da Hotmart do banco de dados
 */
async function getHotmartCredentials() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar configurações da Hotmart no banco de dados
    const result = await pool.query(`
      SELECT key, value 
      FROM integration_settings
      WHERE provider = 'hotmart'
      AND (key = 'client_id' OR key = 'client_secret')
    `);
    
    const credentials = {
      clientId: null,
      clientSecret: null
    };
    
    // Converter resultado para objeto
    result.rows.forEach(row => {
      if (row.key === 'client_id') {
        credentials.clientId = row.value;
      } else if (row.key === 'client_secret') {
        credentials.clientSecret = row.value;
      }
    });
    
    // Usar variáveis de ambiente como fallback
    if (!credentials.clientId) {
      credentials.clientId = process.env.HOTMART_CLIENT_ID;
    }
    
    if (!credentials.clientSecret) {
      credentials.clientSecret = process.env.HOTMART_CLIENT_SECRET;
    }
    
    return credentials;
  } catch (error) {
    console.error('Erro ao buscar credenciais da Hotmart:', error);
    
    // Fallback para variáveis de ambiente
    return {
      clientId: process.env.HOTMART_CLIENT_ID,
      clientSecret: process.env.HOTMART_CLIENT_SECRET
    };
  } finally {
    await pool.end();
  }
}

/**
 * Obtém token de acesso da API da Hotmart
 */
async function getAccessToken() {
  try {
    const credentials = await getHotmartCredentials();
    
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error('Credenciais da Hotmart não configuradas');
    }
    
    // Parâmetros para autenticação OAuth2
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', credentials.clientId);
    params.append('client_secret', credentials.clientSecret);
    
    // Fazer requisição para obter token
    const response = await fetch(HOTMART_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao obter token de acesso: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Erro na autenticação com a Hotmart:', error);
    throw error;
  }
}

/**
 * Armazena um token de acesso no banco de dados
 */
async function storeAccessToken(token, expiresIn) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn - 300); // 5 minutos de margem
    
    // Verificar se já existe um token
    const checkResult = await pool.query(`
      SELECT id FROM integration_settings
      WHERE provider = 'hotmart' AND key = 'access_token'
    `);
    
    if (checkResult.rows.length > 0) {
      // Atualizar token existente
      await pool.query(`
        UPDATE integration_settings
        SET value = $1, updated_at = NOW(), metadata = $2
        WHERE provider = 'hotmart' AND key = 'access_token'
      `, [token, JSON.stringify({ expires_at: expiresAt.toISOString() })]);
    } else {
      // Inserir novo token
      await pool.query(`
        INSERT INTO integration_settings (provider, key, value, metadata, created_at, updated_at)
        VALUES ('hotmart', 'access_token', $1, $2, NOW(), NOW())
      `, [token, JSON.stringify({ expires_at: expiresAt.toISOString() })]);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao armazenar token de acesso:', error);
    return false;
  } finally {
    await pool.end();
  }
}

/**
 * Consulta as compras de um usuário pelo e-mail
 */
async function getPurchasesByEmail(email) {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('Não foi possível obter token de acesso');
    }
    
    // Montar URL com parâmetros
    const url = new URL(HOTMART_PURCHASES_URL);
    url.searchParams.append('email', email);
    
    // Fazer requisição à API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao consultar compras: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao consultar compras na Hotmart:', error);
    throw error;
  }
}

/**
 * Consulta as assinaturas de um usuário pelo e-mail
 */
async function getSubscriptionsByEmail(email) {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('Não foi possível obter token de acesso');
    }
    
    // Montar URL com parâmetros
    const url = new URL(HOTMART_SUBSCRIPTIONS_URL);
    url.searchParams.append('subscriber_email', email);
    
    // Fazer requisição à API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao consultar assinaturas: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao consultar assinaturas na Hotmart:', error);
    throw error;
  }
}

/**
 * Atualiza o status do usuário com base nos dados da Hotmart
 */
async function updateUserSubscriptionStatus(email) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar usuário pelo email
    const userResult = await pool.query(`
      SELECT id, email FROM users WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      return { success: false, message: 'Usuário não encontrado' };
    }
    
    const userId = userResult.rows[0].id;
    
    // Consultar assinaturas ativas na Hotmart
    const subscriptionsData = await getSubscriptionsByEmail(email);
    
    // Verificar se há assinaturas ativas
    const activeSubscriptions = subscriptionsData.items?.filter(sub => 
      sub.status === 'ACTIVE' || sub.status === 'DELAYED'
    ) || [];
    
    if (activeSubscriptions.length > 0) {
      // Usuário tem assinatura ativa
      const subscription = activeSubscriptions[0]; // Pegar a primeira assinatura ativa
      
      // Atualizar usuário como premium
      await pool.query(`
        UPDATE users 
        SET tipoplano = $1, 
            origemassinatura = 'hotmart', 
            dataassinatura = $2, 
            dataexpiracao = $3,
            atualizadoem = NOW()
        WHERE id = $4
      `, [
        subscription.plan?.name || 'Plano Premium',
        new Date(subscription.start_date || new Date()),
        new Date(subscription.end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
        userId
      ]);
      
      return { 
        success: true, 
        message: 'Usuário atualizado como premium', 
        subscription: subscription 
      };
    } else {
      // Verificar se tem compras avulsas sem assinatura
      const purchasesData = await getPurchasesByEmail(email);
      const approvedPurchases = purchasesData.items?.filter(purchase => 
        purchase.status === 'APPROVED' || purchase.status === 'COMPLETE'
      ) || [];
      
      if (approvedPurchases.length > 0) {
        // Usuário tem compra aprovada
        const purchase = approvedPurchases[0]; // Pegar a primeira compra aprovada
        
        // Atualizar usuário como acesso vitalício
        await pool.query(`
          UPDATE users 
          SET tipoplano = 'Acesso Vitalício', 
              origemassinatura = 'hotmart', 
              dataassinatura = $1,
              acessovitalicio = true, 
              atualizadoem = NOW()
          WHERE id = $2
        `, [
          new Date(purchase.approved_date || new Date()),
          userId
        ]);
        
        return { 
          success: true, 
          message: 'Usuário atualizado com acesso vitalício', 
          purchase: purchase 
        };
      } else {
        // Usuário não tem assinatura ativa nem compra aprovada
        // Atualizar como usuário free
        await pool.query(`
          UPDATE users 
          SET tipoplano = NULL, 
              dataexpiracao = NOW(),
              atualizadoem = NOW()
          WHERE id = $1
        `, [userId]);
        
        return { 
          success: true, 
          message: 'Usuário atualizado como gratuito' 
        };
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    return { success: false, message: error.message };
  } finally {
    await pool.end();
  }
}

/**
 * Verifica e atualiza o status de todos os usuários
 */
async function syncAllUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar todos os usuários com email
    const usersResult = await pool.query(`
      SELECT id, email FROM users 
      WHERE email IS NOT NULL AND email != ''
      LIMIT 100
    `);
    
    const results = {
      total: usersResult.rows.length,
      success: 0,
      failed: 0,
      details: []
    };
    
    // Processar cada usuário
    for (const user of usersResult.rows) {
      try {
        const result = await updateUserSubscriptionStatus(user.email);
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
        }
        
        results.details.push({
          email: user.email,
          result
        });
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.details.push({
          email: user.email,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erro ao sincronizar todos os usuários:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exportar funções do módulo
export {
  getAccessToken,
  getPurchasesByEmail,
  getSubscriptionsByEmail,
  updateUserSubscriptionStatus,
  syncAllUsers
};