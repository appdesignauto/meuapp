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

      // Cria ou atualiza usuário
      await pool.query(`
        INSERT INTO users (email, name, nivelacesso, origemassinatura, tipoplano, dataassinatura, dataexpiracao, acessovitalicio, isactive, emailconfirmed)
        VALUES ($1, $2, 'premium', 'hotmart', $3, $4, $5, false, true, true)
        ON CONFLICT (email)
        DO UPDATE SET nivelacesso = 'premium', tipoplano = $3, dataexpiracao = $5;
      `, [email, name, planType, now, endDate]);

      // Cria ou atualiza assinatura
      await pool.query(`
        INSERT INTO subscriptions (userId, planType, startDate, endDate, isActive, transactionId, source, lastevent)
        SELECT id, $1, $2, $3, true, $4, 'hotmart', 'PURCHASE_APPROVED'
        FROM users WHERE email = $5
        ON CONFLICT (transactionId)
        DO UPDATE SET isActive = true, endDate = $3, lastevent = 'PURCHASE_APPROVED';
      `, [planType, now, endDate, transactionId, email]);

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

      // Log do webhook (opcional)
      await pool.query(`
        INSERT INTO "webhookLogs" (email, "eventType", status, "payloadData", "createdAt", source)
        VALUES ($1, $2, 'processed', $3, $4, 'hotmart');
      `, [email, payload.event, JSON.stringify(payload), new Date()]);

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