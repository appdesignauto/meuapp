import axios from 'axios';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

// Configuração
const HOTMART_BASE_URL = process.env.HOTMART_SANDBOX === 'true' 
  ? "https://sandbox.hotmart.com" 
  : "https://api-sec-vlc.hotmart.com";

let accessToken = null;
let tokenExpiry = 0;

// Função para obter token de acesso
async function getAccessToken() {
  const now = Date.now();
  
  if (accessToken && tokenExpiry > now + 60000) {
    return accessToken;
  }
  
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.HOTMART_CLIENT_ID);
    params.append("client_secret", process.env.HOTMART_CLIENT_SECRET);
    
    const response = await axios.post(`${HOTMART_BASE_URL}/security/oauth/token`, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    
    accessToken = response.data.access_token;
    tokenExpiry = now + (response.data.expires_in * 1000);
    
    console.log("Novo token obtido, expira em:", new Date(tokenExpiry).toISOString());
    return accessToken;
  } catch (error) {
    console.error("Erro ao obter token:", error.response?.data || error.message);
    throw new Error("Falha na autenticação com a Hotmart");
  }
}

// Função principal de sincronização
export async function syncHotmartData() {
  console.log("Iniciando sincronização de assinaturas com a Hotmart...");
  
  const result = {
    errors: 0,
    users_processed: 0,
    subscriptions_updated: 0,
    transactions_processed: 0
  };
  
  try {
    // Obter token de acesso
    const token = await getAccessToken();
    
    // Buscar vendas dos últimos 7 dias
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const response = await axios.get(`${HOTMART_BASE_URL}/payments/api/v1/sales/history`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      params: {
        "start_date": startDate.toISOString().split("T")[0],
        "end_date": new Date().toISOString().split("T")[0],
        "transaction_status": "APPROVED",
        "max_results": 100
      }
    });
    
    const transactions = response.data.items || [];
    console.log(`Encontradas ${transactions.length} transações aprovadas`);
    
    // Processar cada transação
    for (const transaction of transactions) {
      try {
        await processTransaction(transaction, result);
      } catch (error) {
        console.error(`Erro ao processar transação ${transaction.transaction || transaction.purchase?.transaction}:`, error);
        result.errors++;
      }
    }
    
    console.log("Sincronização concluída:", result);
    return result;
  } catch (error) {
    console.error("Erro na sincronização:", error);
    result.errors++;
    return result;
  }
}

// Função para processar uma transação
async function processTransaction(transaction, result) {
  const transactionId = transaction.transaction || transaction.purchase?.transaction;
  
  if (!transactionId) {
    console.warn("Transação sem ID, ignorando");
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Verificar se a transação já foi processada
    const existingTransactionResult = await pool.query(`
      SELECT id FROM webhook_logs 
      WHERE transaction_id = $1 LIMIT 1
    `, [transactionId]);
    
    if (existingTransactionResult.rows.length > 0) {
      console.log(`Transação ${transactionId} já processada anteriormente`);
      return;
    }
    
    // Extrair dados da transação
    const buyer = {
      email: transaction.buyer?.email || transaction.email,
      name: transaction.buyer?.name || transaction.name
    };
    
    const subscription = transaction.subscription || {
      code: transaction.subscriber_code,
      plan: {
        id: transaction.plan_id || "0",
        name: transaction.plan_name || "Plano Padrão"
      }
    };
    
    const product = {
      id: transaction.product?.id || transaction.prod,
      name: transaction.product?.name || "Produto Padrão"
    };
    
    const purchase = {
      transaction: transactionId,
      approvedDate: transaction.purchase?.approvedDate || transaction.approved_date || new Date(),
      nextChargeDate: transaction.purchase?.nextChargeDate || transaction.next_charge_date,
      price: {
        value: parseFloat(transaction.purchase?.price?.value || transaction.full_price || 0),
        currency: transaction.purchase?.price?.currency || "BRL"
      }
    };
    
    // Buscar usuário pelo email
    const userResult = await pool.query(`
      SELECT * FROM users WHERE email = $1
    `, [buyer.email.toLowerCase()]);
    
    let userId;
    
    if (userResult.rows.length === 0) {
      // Criar novo usuário se não existir
      const newUserResult = await pool.query(`
        INSERT INTO users (
          username, email, name, password, nivelacesso, tipoplano, 
          origemassinatura, dataassinatura, dataexpiracao, acessovitalicio,
          criadoem, atualizadoem, isactive, emailconfirmed
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), true, true
        ) RETURNING id
      `, [
        buyer.email.split('@')[0], // username baseado no email
        buyer.email.toLowerCase(),
        buyer.name,
        '!senha_temporaria!', // senha temporária
        'premium', // nível de acesso
        product.name, // tipo de plano
        'hotmart', // origem assinatura
        new Date(), // data assinatura
        new Date(purchase.nextChargeDate || Date.now() + 30 * 24 * 60 * 60 * 1000), // data expiração
        false // acesso vitalício
      ]);
      
      userId = newUserResult.rows[0].id;
      console.log(`Novo usuário criado: ${buyer.email} (ID: ${userId})`);
      result.users_processed++;
    } else {
      // Atualizar usuário existente
      userId = userResult.rows[0].id;
      
      await pool.query(`
        UPDATE users SET
          nivelacesso = $1,
          tipoplano = $2,
          origemassinatura = 'hotmart',
          dataassinatura = $3,
          dataexpiracao = $4,
          atualizadoem = NOW()
        WHERE id = $5
      `, [
        'premium',
        product.name,
        new Date(),
        new Date(purchase.nextChargeDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId
      ]);
      
      console.log(`Usuário atualizado: ${buyer.email} (ID: ${userId})`);
      result.users_processed++;
    }
    
    // Registrar webhook/transação
    await pool.query(`
      INSERT INTO webhook_logs (
        source, transaction_id, status, message, details, created_at
      ) VALUES (
        'hotmart_sync', $1, 'completed', 'Transação processada via sincronização', $2, NOW()
      )
    `, [
      transactionId,
      JSON.stringify({
        transaction: transactionId,
        product: product,
        subscription: subscription,
        purchase: purchase
      })
    ]);
    
    result.transactions_processed++;
    console.log(`Transação ${transactionId} processada com sucesso`);
  } catch (error) {
    console.error(`Erro ao processar transação ${transactionId}:`, error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Função para iniciar sincronização programada
export function startScheduledSync() {
  // Sincronizar a cada hora
  cron.schedule('0 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Iniciando sincronização programada...`);
    
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      // Registrar log de início da sincronização programada
      const syncLogResult = await pool.query(`
        INSERT INTO sync_logs (status, message, details, created_at)
        VALUES ('started', 'Sincronização programada automática', $1, NOW())
        RETURNING id
      `, [JSON.stringify({ automatic: true, startedAt: new Date().toISOString() })]);
      
      const syncId = syncLogResult.rows[0].id;
      
      await pool.end();
      
      // Executar sincronização
      const result = await syncHotmartData();
      
      // Atualizar log com resultados
      const updatePool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      await updatePool.query(`
        UPDATE sync_logs
        SET status = 'completed',
            message = 'Sincronização automática concluída',
            details = $1
        WHERE id = $2
      `, [JSON.stringify(result), syncId]);
      
      await updatePool.end();
      
      console.log(`Sincronização programada concluída com sucesso. ID: ${syncId}`);
    } catch (error) {
      console.error("Erro na sincronização programada:", error);
      
      try {
        const errorPool = new Pool({
          connectionString: process.env.DATABASE_URL
        });
        
        // Registrar erro no log
        await errorPool.query(`
          UPDATE sync_logs
          SET status = 'failed',
              message = 'Falha na sincronização automática',
              details = $1
          WHERE id = $2
        `, [JSON.stringify({ error: error.message }), syncId]);
        
        await errorPool.end();
      } catch (dbError) {
        console.error("Erro ao registrar falha no banco de dados:", dbError);
      }
    }
  });
  
  console.log("Serviço de sincronização iniciado. Verificação agendada a cada hora.");
}

// Iniciar sincronização programada automaticamente
startScheduledSync();