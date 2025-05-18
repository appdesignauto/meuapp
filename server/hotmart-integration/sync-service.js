// sync-service.js
import axios from 'axios';
import pg from 'pg';
import nodeCron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const cron = nodeCron;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

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

    // Log para o console
    console.log(`[sync-service] Token obtido com sucesso. Válido por ${Math.floor(expiresIn / 1000 / 60)} minutos.`);

    return token;
  } catch (error) {
    console.error('Erro ao obter token de acesso Hotmart:', error.message);
    throw error;
  }
}

// Função para registrar log da sincronização
async function logSync(status, message, details = null) {
  try {
    await pool.query(`
      INSERT INTO sync_logs (status, message, details, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [status, message, details ? JSON.stringify(details) : null]);
  } catch (error) {
    console.error('Erro ao registrar log de sincronização:', error.message);
  }
}

// Função para atualizar o status do usuário com base nos dados da Hotmart
async function updateUserStatus(email, subscriptionData, purchaseData) {
  try {
    // Buscar usuário pelo email
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return { success: false, message: 'Usuário não encontrado' };
    }
    
    const userId = userResult.rows[0].id;
    
    // Verificar se há assinaturas ativas
    const activeSubscriptions = (subscriptionData.items || []).filter(sub => 
      sub.status === 'ACTIVE' || sub.status === 'DELAYED'
    );
    
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
      const approvedPurchases = (purchaseData.items || []).filter(purchase => 
        purchase.status === 'APPROVED' || purchase.status === 'COMPLETE'
      );
      
      if (approvedPurchases.length > 0) {
        // Usuário tem compra aprovada (acesso vitalício)
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
        // Se o usuário tinha origem de assinatura 'hotmart', atualizar como free
        const userDetailResult = await pool.query('SELECT origemassinatura FROM users WHERE id = $1', [userId]);
        
        if (userDetailResult.rows.length > 0 && userDetailResult.rows[0].origemassinatura === 'hotmart') {
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
        
        return {
          success: true,
          message: 'Usuário mantido sem alterações (não é cliente Hotmart)'
        };
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error.message);
    return { success: false, message: error.message };
  }
}

// Função principal para sincronizar todos os usuários
async function syncAllUsers() {
  console.log('[sync-service] Iniciando sincronização de todos os usuários...');
  
  try {
    await logSync('started', 'Sincronização iniciada');
    
    // Obter token de acesso
    const token = await getAccessToken();
    
    // Buscar todos os usuários com email
    const usersResult = await pool.query(`
      SELECT id, email FROM users 
      WHERE email IS NOT NULL AND email != ''
      ORDER BY id LIMIT 100
    `);
    
    const stats = {
      total: usersResult.rows.length,
      success: 0,
      failed: 0,
      updated: 0,
      unchanged: 0,
      errors: []
    };
    
    // Processar cada usuário
    for (const user of usersResult.rows) {
      try {
        console.log(`[sync-service] Verificando usuário: ${user.email}`);
        
        // Consultar assinaturas na Hotmart
        const subscriptionResponse = await axios.get(`${HOTMART_SUBSCRIPTIONS_URL}?subscriber_email=${user.email}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Consultar compras na Hotmart
        const purchaseResponse = await axios.get(`${HOTMART_PURCHASES_URL}?email=${user.email}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Atualizar status do usuário
        const result = await updateUserStatus(
          user.email, 
          subscriptionResponse.data, 
          purchaseResponse.data
        );
        
        if (result.success) {
          stats.success++;
          
          if (result.message.includes('atualizado')) {
            stats.updated++;
          } else {
            stats.unchanged++;
          }
        } else {
          stats.failed++;
          stats.errors.push({
            email: user.email,
            error: result.message
          });
        }
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          email: user.email,
          error: error.message
        });
        console.error(`[sync-service] Erro ao sincronizar usuário ${user.email}:`, error.message);
      }
    }
    
    // Registrar resultados no log
    await logSync('completed', `Sincronização concluída. ${stats.updated} usuários atualizados.`, stats);
    
    console.log(`[sync-service] Sincronização concluída. Resultados: ${JSON.stringify(stats)}`);
    return stats;
  } catch (error) {
    console.error('[sync-service] Erro na sincronização:', error.message);
    await logSync('failed', `Sincronização falhou: ${error.message}`);
    throw error;
  }
}

// Verificar se a tabela de logs existe, ou criá-la
async function ensureSyncLogsTable() {
  try {
    // Verificar se a tabela sync_logs existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sync_logs'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('[sync-service] Criando tabela sync_logs...');
      
      // Criar a tabela
      await pool.query(`
        CREATE TABLE sync_logs (
          id SERIAL PRIMARY KEY,
          status VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          details JSONB,
          created_at TIMESTAMP NOT NULL
        );
      `);
      
      console.log('[sync-service] Tabela sync_logs criada com sucesso.');
    }
  } catch (error) {
    console.error('[sync-service] Erro ao verificar tabela de logs:', error.message);
  }
}

// Agendar sincronização a cada 60 minutos
cron.schedule('0 */1 * * *', async () => {
  try {
    await syncAllUsers();
  } catch (error) {
    console.error('[sync-service] Erro ao executar sincronização agendada:', error.message);
  }
});

// Função para inicializar o serviço
async function init() {
  try {
    // Garantir que a tabela de logs existe
    await ensureSyncLogsTable();
    
    // Executar primeira sincronização após 1 minuto
    setTimeout(async () => {
      try {
        await syncAllUsers();
      } catch (error) {
        console.error('[sync-service] Erro na sincronização inicial:', error.message);
      }
    }, 60000);
    
    console.log('[sync-service] Serviço de sincronização iniciado. Verificação agendada a cada hora.');
  } catch (error) {
    console.error('[sync-service] Erro ao inicializar serviço:', error.message);
  }
}

// Iniciar o serviço
init();

// Manter o módulo ativo para evitar que o processo filho seja encerrado
setInterval(() => {
  console.log('[sync-service] Mantendo o serviço ativo');
}, 60000);

// Exportar funções para uso externo se necessário
export { syncAllUsers, getAccessToken };