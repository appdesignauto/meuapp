import { Router } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const router = Router();

// 🎯 WEBHOOK HOTMART - PROCESSO CORRETO CONFORME ESPECIFICAÇÃO
router.post('/hotmart-fixed', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`🚀 [${timestamp}] WEBHOOK HOTMART RECEBIDO - PROCESSO CORRETO`);

  try {
    const payload = req.body;
    console.log('📦 [WEBHOOK] Payload completo:', JSON.stringify(payload, null, 2));

    // ✅ 1. VALIDAÇÃO CORRETA DO WEBHOOK (compra aprovada OU cancelamento)
    const isPurchaseApproved = 
      payload?.event === 'PURCHASE_APPROVED' &&
      payload?.data?.purchase?.status === 'APPROVED';

    const isCancellation = 
      payload?.event === 'PURCHASE_PROTEST' ||
      payload?.event === 'PURCHASE_REFUNDED' ||
      payload?.event === 'SUBSCRIPTION_CANCELLATION' ||
      payload?.event === 'PURCHASE_CANCELED' ||
      payload?.event === 'PURCHASE_CHARGEBACK' ||
      (payload?.data?.subscription?.status === 'CANCELED') ||
      (payload?.data?.purchase?.status === 'CANCELED') ||
      (payload?.data?.purchase?.status === 'DISPUTE');

    console.log('🔍 [WEBHOOK] Debug validação:', {
      event: payload?.event,
      isPurchaseApproved: isPurchaseApproved,
      isCancellation: isCancellation,
      subscriptionStatus: payload?.data?.subscription?.status,
      purchaseStatus: payload?.data?.purchase?.status,
      eventIsSubscriptionCancellation: payload?.event === 'SUBSCRIPTION_CANCELLATION'
    });

    // Conexão com banco
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    if (!isPurchaseApproved && !isCancellation) {
      console.log('❌ [WEBHOOK] Validação falhou - evento não suportado:', payload?.event);
      console.log('🔍 [WEBHOOK] Debug completo da validação:', {
        event: payload?.event,
        isPurchaseApproved,
        isCancellation,
        eventCheck: payload?.event === 'SUBSCRIPTION_CANCELLATION'
      });
      
      // Registrar webhook não processado para análise
      try {
        await pool.query(`
          INSERT INTO "webhookLogs" (
            "eventType", status, source, "payloadData", "createdAt"
          ) VALUES (
            $1, 'not_processed', 'hotmart', $2, $3
          )
        `, [payload?.event || 'UNKNOWN', JSON.stringify(payload), new Date()]);
      } catch (logError) {
        console.error('Erro ao registrar webhook não processado:', logError);
      }
      
      await pool.end();
      return res.status(200).json({ 
        success: true, 
        message: 'Evento processado - não é compra aprovada nem cancelamento',
        processed: false
      });
    }

    if (isPurchaseApproved) {
      console.log('✅ [WEBHOOK] Validação OK - compra aprovada detectada!');
    } else if (isCancellation) {
      console.log('🚫 [WEBHOOK] Validação OK - cancelamento detectado!');
    }

    // ✅ 2. EXTRAÇÃO CORRETA DOS DADOS DO WEBHOOK
    const buyer = payload.data.buyer;
    const purchase = payload.data.purchase;
    const subscription = payload.data.subscription;
    const subscriber = payload.data.subscriber;

    const full_name = buyer?.name || subscriber?.name;
    const email = (buyer?.email || subscriber?.email)?.toLowerCase().trim();
    const phone = buyer?.document;
    const transactionId = purchase?.transaction || subscription?.id;
    const event = payload.event;
    const origin = "hotmart";

    // ✅ 3. PROCESSAR CANCELAMENTO SE FOR EVENTO DE CANCELAMENTO
    if (isCancellation) {
      console.log('🚫 [WEBHOOK] Processando cancelamento de assinatura...');
      
      if (!email || !transactionId) {
        console.error('❌ [WEBHOOK] Dados insuficientes para cancelamento');
        return res.status(400).json({ 
          success: false, 
          error: 'Email ou ID de transação ausente para cancelamento' 
        });
      }

      try {
        // Rebaixar usuário para free
        const userUpdateResult = await pool.query(`
          UPDATE users SET
            nivelacesso = 'free',
            acessovitalicio = false,
            tipoplano = NULL,
            dataexpiracao = CURRENT_DATE
          WHERE email = $1
          RETURNING id, name
        `, [email]);

        if (userUpdateResult.rowCount === 0) {
          console.log('⚠️ [WEBHOOK] Usuário não encontrado para cancelamento:', email);
        } else {
          console.log('✅ [WEBHOOK] Usuário rebaixado para free:', userUpdateResult.rows[0]);
        }

        // Cancelar assinatura
        const subscriptionUpdateResult = await pool.query(`
          UPDATE subscriptions SET
            status = 'canceled',
            "endDate" = CURRENT_DATE,
            lastevent = $1
          WHERE transactionid = $2
          RETURNING id, "planType"
        `, [payload.event, transactionId]);

        if (subscriptionUpdateResult.rowCount === 0) {
          console.log('⚠️ [WEBHOOK] Assinatura não encontrada para cancelamento:', transactionId);
        } else {
          console.log('✅ [WEBHOOK] Assinatura cancelada:', subscriptionUpdateResult.rows[0]);
        }

        // Log do webhook de cancelamento
        await pool.query(`
          INSERT INTO "webhookLogs" (
            email, "payloadData", status, "createdAt", source, "transactionId", "eventType"
          ) VALUES (
            $1, $2, 'processed', $3, 'hotmart', $4, $5
          )
        `, [email, JSON.stringify(payload), payload.event, new Date(), transactionId]);

        await pool.end();

        console.log('🎉 [WEBHOOK] Cancelamento processado com sucesso!');
        return res.status(200).json({
          success: true,
          message: 'Assinatura cancelada e usuário rebaixado com sucesso',
          event: payload.event,
          email: email,
          transactionId: transactionId
        });

      } catch (error) {
        console.error('❌ [WEBHOOK] Erro ao processar cancelamento:', error);
        await pool.end();
        return res.status(500).json({ 
          success: false, 
          error: 'Erro interno ao cancelar assinatura' 
        });
      }
    }

    // ✅ 4. VALIDAÇÃO E PROCESSAMENTO DE COMPRAS APROVADAS
    const planType = subscription?.plan?.name?.toLowerCase().includes('anual') ? 'anual' : 'mensal';
    const startDate = new Date(purchase?.order_date);
    const endDate = new Date(purchase?.date_next_charge);

    console.log('👤 [WEBHOOK] Dados extraídos:', {
      full_name, email, phone, planType, startDate, endDate, transactionId
    });

    if (!email || !full_name) {
      console.error('❌ [WEBHOOK] Dados obrigatórios ausentes');
      return res.status(400).json({ 
        success: false, 
        error: 'Email ou nome ausente no payload' 
      });
    }

    // ✅ 5. INSERÇÃO NO BANCO PARA COMPRAS APROVADAS
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;

    if (existingUser.rowCount === 0) {
      // Criar novo usuário
      console.log('👤 [WEBHOOK] Criando novo usuário...');
      const hashedPassword = await bcrypt.hash('designauto2024', 10);
      
      const newUser = await pool.query(`
        INSERT INTO users (
          name, email, username, password, nivelacesso, tipoplano, 
          origemassinatura, dataassinatura, dataexpiracao, isactive, 
          criadoem, atualizadoem
        ) VALUES (
          $1, $2, $3, $4, 'premium', $5, 
          'hotmart', $6, $7, true, 
          $8, $9
        ) RETURNING id
      `, [
        full_name, email, email.split('@')[0], hashedPassword, planType,
        startDate, endDate, new Date(), new Date()
      ]);
      
      userId = newUser.rows[0].id;
      console.log('✅ [WEBHOOK] Novo usuário criado! ID:', userId);
    } else {
      // Atualizar usuário existente
      userId = existingUser.rows[0].id;
      console.log('👤 [WEBHOOK] Atualizando usuário existente... ID:', userId);
      
      await pool.query(`
        UPDATE users SET
          nivelacesso = 'premium', tipoplano = $2, origemassinatura = 'hotmart',
          dataassinatura = $3, dataexpiracao = $4, atualizadoem = $5
        WHERE id = $1
      `, [userId, planType, startDate, endDate, new Date()]);
    }

    // ✅ 6. CRIAR OU ATUALIZAR ASSINATURA
    console.log('📝 [WEBHOOK] Verificando assinatura existente...');
    const existingSubscription = await pool.query(`
      SELECT id FROM subscriptions WHERE "userId" = $1
    `, [userId]);

    if (existingSubscription.rows.length > 0) {
      console.log('📝 [WEBHOOK] Atualizando assinatura existente...');
      await pool.query(`
        UPDATE subscriptions SET
          "planType" = $2, status = 'active', "startDate" = $3, "endDate" = $4,
          origin = 'hotmart', transactionid = $5, lastevent = $6, 
          "webhookData" = $7, "updatedAt" = $8
        WHERE "userId" = $1
      `, [
        userId, planType, startDate, endDate,
        transactionId, event, JSON.stringify(payload), new Date()
      ]);
    } else {
      console.log('📝 [WEBHOOK] Criando nova assinatura...');
      await pool.query(`
        INSERT INTO subscriptions (
          "userId", "planType", status, "startDate", "endDate",
          origin, transactionid, lastevent, "webhookData", "createdAt"
        ) VALUES (
          $1, $2, 'active', $3, $4,
          'hotmart', $5, $6, $7, $8
        )
      `, [
        userId, planType, startDate, endDate,
        transactionId, event, JSON.stringify(payload), new Date()
      ]);
    }

    console.log('✅ [WEBHOOK] Assinatura criada com sucesso!');

    // ✅ 7. LOG DO WEBHOOK
    await pool.query(`
      INSERT INTO "webhookLogs" (
        email, "payloadData", status, "createdAt", source, "transactionId", "eventType"
      ) VALUES (
        $1, $2, 'processed', $3, 'hotmart', $4, $5
      )
    `, [email, JSON.stringify(payload), event, new Date(), transactionId]);

    // Fechar conexão
    await pool.end();

    console.log('🎉 [WEBHOOK] PROCESSAMENTO CONCLUÍDO COM SUCESSO!');
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      event: event,
      userId: userId,
      planType: planType,
      transactionId: transactionId
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;