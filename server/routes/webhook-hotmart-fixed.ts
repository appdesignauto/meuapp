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
      payload?.event === 'SUBSCRIPTION_CANCELLATION';

    if (!isPurchaseApproved && !isCancellation) {
      console.log('❌ [WEBHOOK] Validação falhou - evento não suportado:', payload?.event);
      return res.status(200).json({ 
        success: true, 
        message: 'Evento processado - tipo não suportado',
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

    const full_name = buyer?.name;
    const email = buyer?.email?.toLowerCase().trim();
    const phone = buyer?.document;

    const planType = subscription?.plan?.name?.toLowerCase().includes('anual') ? 'anual' : 'mensal';
    const startDate = new Date(purchase?.order_date);
    const endDate = new Date(purchase?.date_next_charge);

    const transactionId = purchase?.transaction;
    const event = payload.event;
    const origin = "hotmart";

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

    // Conexão com banco
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

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

    // ✅ 4. INSERÇÃO NO BANCO PARA COMPRAS APROVADAS
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;

    if (existingUser.rowCount === 0) {
      // Criar novo usuário
      console.log('👤 [WEBHOOK] Criando novo usuário...');
      
      // Gerar username único
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const username = await generateUniqueUsername(baseUsername, pool);
      
      // Senha padrão criptografada
      const hashedPassword = await bcrypt.hash('auto@123', 10);
      
      const insertUser = await pool.query(`
        INSERT INTO users (
          username, name, email, phone, password, nivelacesso, origemassinatura,
          tipoplano, dataassinatura, dataexpiracao, acessovitalicio, isactive, emailconfirmed,
          criadoem, atualizadoem
        ) VALUES (
          $1, $2, $3, $4, $5, 'premium', $6,
          $7, $8, $9, false, true, true,
          $10, $11
        ) RETURNING id
      `, [
        username, full_name, email, phone, hashedPassword, origin,
        planType, startDate, endDate,
        new Date(), new Date()
      ]);

      userId = insertUser.rows[0].id;
      console.log(`✅ [WEBHOOK] Novo usuário criado! ID: ${userId}`);
      
    } else {
      // Atualizar usuário existente
      userId = existingUser.rows[0].id;
      console.log(`✅ [WEBHOOK] Usuário existente encontrado! ID: ${userId}`);

      await pool.query(`
        UPDATE users SET
          nivelacesso = 'premium',
          origemassinatura = $1,
          tipoplano = $2,
          dataassinatura = $3,
          dataexpiracao = $4,
          acessovitalicio = false,
          atualizadoem = $5
        WHERE id = $6
      `, [origin, planType, startDate, endDate, new Date(), userId]);
      
      console.log(`✅ [WEBHOOK] Usuário atualizado para premium!`);
    }

    // ✅ 4. CRIAÇÃO/ATUALIZAÇÃO DA ASSINATURA NA TABELA SUBSCRIPTIONS
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

    // ✅ 5. LOG DO WEBHOOK
    await pool.query(`
      INSERT INTO "webhookLogs" (
        email, "payloadData", status, "createdAt", source, "transactionId", "eventType"
      ) VALUES (
        $1, $2, 'processed', $3, 'hotmart', $4, $5
      )
    `, [email, JSON.stringify(payload), new Date(), transactionId, event]);

    await pool.end();

    console.log('🎉 [WEBHOOK] PROCESSAMENTO CONCLUÍDO COM SUCESSO!');
    
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      userId: userId,
      planType: planType,
      processed: true
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro durante processamento:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// 🔤 FUNÇÃO AUXILIAR - Gera username único
async function generateUniqueUsername(baseUsername: string, pool: Pool): Promise<string> {
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return username;
    }
    
    username = `${baseUsername}${counter}`;
    counter++;
  }
}

export default router;