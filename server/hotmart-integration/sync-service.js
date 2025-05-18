import dotenv from 'dotenv';
import pg from 'pg';
import cron from 'node-cron';
import https from 'https';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';

// Configuração de ambiente
dotenv.config();

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do pool de conexão
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Verificar modo manual (para chamadas diretas via API)
const args = process.argv.slice(2);
const isManual = args.includes('--manual');
const syncIdArg = args.find(arg => arg.startsWith('--sync-id='));
const syncId = syncIdArg ? syncIdArg.split('=')[1] : null;

// Função para obter token de acesso da Hotmart
async function getAccessToken() {
  try {
    // Buscar credenciais no banco de dados
    const settingsResult = await pool.query('SELECT client_id, client_secret FROM integration_settings WHERE provider = $1', ['hotmart']);
    
    if (settingsResult.rows.length === 0) {
      throw new Error('Credenciais da Hotmart não encontradas no banco de dados');
    }
    
    const { client_id, client_secret } = settingsResult.rows[0];
    
    // Solicitar token de acesso
    const tokenUrl = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na autenticação Hotmart: ${errorData.error_description || 'Falha na solicitação'}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Erro ao obter token de acesso:', error.message);
    throw error;
  }
}

// Função para registrar logs de sincronização
async function logSync(status, message, details = null) {
  try {
    // Se for uma sincronização manual, atualizar o log existente
    if (isManual && syncId) {
      await pool.query(
        'UPDATE sync_logs SET status = $1, message = $2, details = $3, updated_at = NOW() WHERE id = $4',
        [status, message, JSON.stringify(details), syncId]
      );
    } else {
      // Caso contrário, criar novo log
      await pool.query(
        'INSERT INTO sync_logs (status, message, details) VALUES ($1, $2, $3)',
        [status, message, JSON.stringify(details)]
      );
    }
  } catch (error) {
    console.error('Erro ao registrar log de sincronização:', error.message);
  }
}

// Função para atualizar status de usuário com base em dados da Hotmart
async function updateUserStatus(email, subscriptionData, purchaseData) {
  try {
    // Verificar se o usuário existe
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return { status: 'skipped', message: 'Usuário não encontrado', email };
    }
    
    const user = userResult.rows[0];
    
    // Definir dados de assinatura
    const tipoplano = subscriptionData.plan?.name || 'Hotmart Standard';
    const dataAssinatura = new Date(subscriptionData.dateCreated || purchaseData.dateApproved);
    
    // Calcular data de expiração - 12 meses após a aprovação
    const dataExpiracao = new Date(dataAssinatura);
    dataExpiracao.setMonth(dataExpiracao.getMonth() + 12);
    
    // Atualizar dados do usuário
    await pool.query(
      `UPDATE users SET 
         tipoplano = $1, 
         dataassinatura = $2,
         dataexpiracao = $3,
         origemassinatura = 'hotmart',
         atualizadoem = NOW()
       WHERE id = $4`,
      [tipoplano, dataAssinatura, dataExpiracao, user.id]
    );
    
    return { 
      status: 'updated', 
      message: 'Usuário atualizado com sucesso', 
      userId: user.id, 
      email, 
      plan: tipoplano,
      expiryDate: dataExpiracao
    };
  } catch (error) {
    console.error(`Erro ao atualizar usuário ${email}:`, error.message);
    return { status: 'error', message: error.message, email };
  }
}

// Função principal de sincronização de todos os usuários
async function syncAllUsers() {
  try {
    await logSync('started', 'Iniciando sincronização com a Hotmart');
    
    // Obter token de acesso
    const accessToken = await getAccessToken();
    
    // Buscar assinaturas ativas
    const subscriptionsUrl = 'https://developers.hotmart.com/payments/api/v1/subscriptions';
    const subscriptionsResponse = await fetch(subscriptionsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!subscriptionsResponse.ok) {
      const errorData = await subscriptionsResponse.json();
      throw new Error(`Erro ao buscar assinaturas: ${errorData.message || 'Falha na solicitação'}`);
    }
    
    const subscriptionsData = await subscriptionsResponse.json();
    const subscriptions = subscriptionsData.items || [];
    
    // Buscar compras aprovadas
    const purchasesUrl = 'https://developers.hotmart.com/payments/api/v1/sales/history';
    const purchasesResponse = await fetch(purchasesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!purchasesResponse.ok) {
      const errorData = await purchasesResponse.json();
      throw new Error(`Erro ao buscar compras: ${errorData.message || 'Falha na solicitação'}`);
    }
    
    const purchasesData = await purchasesResponse.json();
    const purchases = purchasesData.items || [];
    
    // Processar e atualizar usuários
    const results = {
      totalProcessed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };
    
    // Processar assinaturas
    for (const subscription of subscriptions) {
      const email = subscription.subscriber?.email;
      
      if (email) {
        results.totalProcessed++;
        const purchase = purchases.find(p => p.buyer?.email === email);
        const result = await updateUserStatus(email, subscription, purchase || {});
        
        results.details.push(result);
        
        if (result.status === 'updated') results.updated++;
        else if (result.status === 'skipped') results.skipped++;
        else if (result.status === 'error') results.errors++;
      }
    }
    
    // Processar compras que não são assinaturas
    const subscriptionEmails = subscriptions.map(s => s.subscriber?.email).filter(Boolean);
    for (const purchase of purchases) {
      const email = purchase.buyer?.email;
      
      if (email && !subscriptionEmails.includes(email)) {
        results.totalProcessed++;
        const result = await updateUserStatus(email, {}, purchase);
        
        results.details.push(result);
        
        if (result.status === 'updated') results.updated++;
        else if (result.status === 'skipped') results.skipped++;
        else if (result.status === 'error') results.errors++;
      }
    }
    
    // Registrar conclusão da sincronização
    await logSync(
      'completed', 
      `Sincronização concluída: ${results.updated} usuários atualizados, ${results.skipped} ignorados, ${results.errors} erros`,
      results
    );
    
    return results;
  } catch (error) {
    console.error('Erro na sincronização:', error.message);
    await logSync('failed', `Erro na sincronização: ${error.message}`, { error: error.message });
    throw error;
  }
}

// Função para garantir que a tabela de logs existe
async function ensureSyncLogsTable() {
  try {
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sync_logs'
      );
    `);
    
    // Se a tabela não existir, criar
    if (!tableExists.rows[0].exists) {
      await pool.query(`
        CREATE TABLE sync_logs (
          id SERIAL PRIMARY KEY,
          status VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          details JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Tabela sync_logs criada com sucesso.');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar tabela sync_logs:', error.message);
  }
}

// Função de inicialização
async function init() {
  try {
    // Garantir que a tabela de logs existe
    await ensureSyncLogsTable();
    
    // Se for chamada manual, executar sincronização imediatamente
    if (isManual) {
      console.log('Executando sincronização manual...');
      await syncAllUsers();
      process.exit(0);
    }
    
    // Agendar sincronização automática a cada hora
    cron.schedule('0 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Executando sincronização agendada...`);
      try {
        await syncAllUsers();
        console.log(`[${new Date().toISOString()}] Sincronização agendada concluída com sucesso.`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na sincronização agendada:`, error.message);
      }
    });
    
    console.log('[sync-service] Serviço de sincronização iniciado. Verificação agendada a cada hora.');
  } catch (error) {
    console.error('Erro ao inicializar serviço de sincronização:', error.message);
  }
}

// Iniciar o serviço
init();