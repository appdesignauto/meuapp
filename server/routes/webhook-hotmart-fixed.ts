import express from 'express';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Função de validação de compra aprovada
const isValidPurchase = (payload: any) => {
  return (
    payload.event === 'PURCHASE_APPROVED' &&
    payload.data?.purchase?.status === 'APPROVED'
  );
};

router.post('/hotmart-fixed', async (req, res) => {
  const payload = req.body;
  console.log('📩 Webhook recebido:', payload.event);

  // Trata compra aprovada
  if (isValidPurchase(payload)) {
    try {
      const email = payload.data?.buyer?.email?.toLowerCase().trim();
      const name = payload.data?.buyer?.name || 'Usuário';
      const transactionId = payload.data?.purchase?.transaction;
      const planName = payload.data?.subscription?.plan?.name?.toLowerCase();
      const planType = planName?.includes('anual') ? 'anual' : 'mensal';
      const now = new Date();
      const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      // Verifica se usuário existe
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (existingUser.rowCount === 0) {
        // Cria novo usuário
        const username = email.split('@')[0]; // Username baseado no email
        const tempPassword = 'auto@123'; // Password padrão do sistema
        await pool.query(`
          INSERT INTO users (email, name, username, password, nivelacesso, origemassinatura, tipoplano, dataassinatura, dataexpiracao, acessovitalicio, isactive, emailconfirmed)
          VALUES ($1, $2, $3, $4, 'premium', 'hotmart', $5, $6, $7, false, true, true);
        `, [email, name, username, tempPassword, planType, now, endDate]);
        console.log(`✅ Novo usuário criado: ${name}`);
      } else {
        // Atualiza usuário existente
        await pool.query(`
          UPDATE users SET nivelacesso = 'premium', tipoplano = $2, dataexpiracao = $3, origemassinatura = 'hotmart'
          WHERE email = $1;
        `, [email, planType, endDate]);
        console.log(`✅ Usuário atualizado para premium: ${name}`);
      }

      // Cria ou atualiza assinatura
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      const userId = userResult.rows[0].id;
      
      const existingSubscription = await pool.query('SELECT id FROM subscriptions WHERE "userId" = $1', [userId]);
      
      if (existingSubscription.rowCount === 0) {
        // Cria nova assinatura
        await pool.query(`
          INSERT INTO subscriptions ("userId", "planType", "startDate", "endDate", status, transactionid, origin, lastevent, "createdAt")
          VALUES ($1, $2, $3, $4, 'active', $5, 'hotmart', 'PURCHASE_APPROVED', $6);
        `, [userId, planType, now, endDate, transactionId, now]);
        console.log(`✅ Nova assinatura criada para usuário ${userId}`);
      } else {
        // Atualiza assinatura existente
        await pool.query(`
          UPDATE subscriptions SET "planType" = $2, "endDate" = $3, status = 'active', transactionid = $4, lastevent = 'PURCHASE_APPROVED'
          WHERE "userId" = $1;
        `, [userId, planType, endDate, transactionId]);
        console.log(`✅ Assinatura atualizada para usuário ${userId}`);
      }

      return res.status(200).json({ success: true, message: 'Usuário criado ou atualizado com sucesso' });
    } catch (err) {
      console.error('❌ Erro ao processar PURCHASE_APPROVED:', err);
      return res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }

  // Trata cancelamento, protesto ou reembolso
  const cancelEvents = ['SUBSCRIPTION_CANCELLATION', 'PURCHASE_PROTEST', 'PURCHASE_REFUNDED', 'CHARGEBACK'];
  if (cancelEvents.includes(payload.event)) {
    try {
      const email = payload.data?.buyer?.email?.toLowerCase().trim() ||
                    payload.data?.subscriber?.email?.toLowerCase().trim();
      const transactionId = payload.data?.purchase?.transaction || null;

      console.log(`🚫 Processando cancelamento para: ${email}, evento: ${payload.event}`);

      // Rebaixar o usuário
      const userUpdateResult = await pool.query(`
        UPDATE users SET nivelacesso = 'free', tipoplano = NULL, acessovitalicio = false, dataexpiracao = CURRENT_DATE
        WHERE email = $1
        RETURNING id, name;
      `, [email]);

      if (userUpdateResult.rowCount > 0) {
        console.log(`✅ Usuário rebaixado: ${userUpdateResult.rows[0].name}`);
      } else {
        console.log(`⚠️ Usuário não encontrado: ${email}`);
      }

      // Atualizar assinatura
      if (transactionId) {
        await pool.query(`
          UPDATE subscriptions SET status = 'canceled', endDate = CURRENT_DATE, lastevent = $1
          WHERE transactionId = $2;
        `, [payload.event, transactionId]);
      }

      // Log do webhook (opcional) - removido temporariamente
      console.log(`📝 Log do webhook: ${email} - ${payload.event} processado com sucesso`);

      return res.status(200).json({ success: true, message: 'Usuário rebaixado com sucesso' });
    } catch (err) {
      console.error('❌ Erro ao processar evento de cancelamento:', err);
      return res.status(500).json({ error: 'Erro ao processar evento' });
    }
  }

  // Evento não tratado
  return res.status(200).json({ message: 'Evento ignorado' });
});

export default router;