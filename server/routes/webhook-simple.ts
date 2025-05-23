/**
 * Webhook SIMPLES da Hotmart - Processa IMEDIATAMENTE na mesma requisição
 * SEM async, SEM delays, SEM complicações
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import * as crypto from 'crypto';

const router = Router();

// Função para processar webhook IMEDIATAMENTE
router.post('/', async (req: Request, res: Response) => {
  console.log('\n🔥 WEBHOOK SIMPLES RECEBIDO:', new Date().toISOString());
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    const payload = req.body;
    
    // Validar se é compra aprovada
    const isValid = payload?.event === 'PURCHASE_APPROVED' && 
                   payload?.data?.purchase?.status === 'APPROVED';
    
    if (!isValid) {
      console.log('❌ Webhook não é de compra aprovada');
      return res.status(200).json({ success: true, message: 'Webhook ignorado' });
    }
    
    // Extrair dados
    const email = payload.data?.buyer?.email?.toLowerCase().trim();
    const name = payload.data?.buyer?.name || 'Cliente';
    const transactionId = payload.data?.purchase?.transaction || `TX-${Date.now()}`;
    
    if (!email) {
      console.log('❌ Email não encontrado');
      return res.status(200).json({ success: true, message: 'Email não encontrado' });
    }
    
    console.log(`✅ Dados extraídos: ${name} - ${email} - ${transactionId}`);
    
    // 1. REGISTRAR WEBHOOK LOG
    const logResult = await pool.query(
      `INSERT INTO webhook_logs (event_type, status, email, source, raw_payload, transaction_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['PURCHASE_APPROVED', 'processing', email, 'hotmart', JSON.stringify(payload), transactionId, new Date()]
    );
    
    const webhookId = logResult.rows[0].id;
    console.log(`📝 Webhook registrado com ID: ${webhookId}`);
    
    // 2. VERIFICAR SE USUÁRIO JÁ EXISTE
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    let userId;
    
    if (userCheck.rows.length > 0) {
      // Usuário existe - atualizar
      userId = userCheck.rows[0].id;
      console.log(`🔄 Atualizando usuário existente ID: ${userId}`);
      
      await pool.query(`
        UPDATE users SET 
          nivelacesso = 'premium',
          origemassinatura = 'hotmart',
          tipoplano = 'anual',
          dataassinatura = NOW(),
          dataexpiracao = NOW() + interval '1 year'
        WHERE id = $1
      `, [userId]);
      
    } else {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário: ${email}`);
      
      const username = `${email.split('@')[0]}_${Math.random().toString(16).slice(2, 8)}`;
      const password = 'auto@123';
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto.scryptSync(password, salt, 64).toString("hex");
      const hashedPassword = `${hash}.${salt}`;
      
      const userResult = await pool.query(`
        INSERT INTO users (
          username, email, name, password, nivelacesso, origemassinatura,
          tipoplano, dataassinatura, dataexpiracao, isactive, emailconfirmed
        ) VALUES (
          $1, $2, $3, $4, 'premium', 'hotmart',
          'anual', NOW(), NOW() + interval '1 year', true, true
        ) RETURNING id
      `, [username, email, name, hashedPassword]);
      
      userId = userResult.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
    }
    
    // 3. CRIAR/ATUALIZAR ASSINATURA
    await pool.query(`
      INSERT INTO subscriptions ("userId", "planType", status, "startDate", "endDate", origin, transactionid, lastevent)
      VALUES ($1, 'anual', 'active', NOW(), NOW() + interval '1 year', 'hotmart', $2, 'PURCHASE_APPROVED')
      ON CONFLICT ("userId") DO UPDATE SET
        status = 'active',
        "endDate" = NOW() + interval '1 year',
        transactionid = $2,
        lastevent = 'PURCHASE_APPROVED'
    `, [userId, transactionId]);
    
    console.log(`✅ Assinatura criada/atualizada para usuário ${userId}`);
    
    // 4. MARCAR WEBHOOK COMO PROCESSADO
    await pool.query('UPDATE webhook_logs SET status = $1 WHERE id = $2', ['processed', webhookId]);
    
    console.log(`🎉 PROCESSAMENTO COMPLETO! Usuário ${userId} criado com sucesso!`);
    
    // Resposta final
    const response = {
      success: true,
      message: 'Usuário criado automaticamente com sucesso!',
      userId: userId,
      email: email,
      webhookId: webhookId,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Resposta:', JSON.stringify(response, null, 2));
    
    await pool.end();
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error);
    
    try {
      await pool.end();
    } catch (e) {}
    
    return res.status(200).json({
      success: false,
      message: 'Erro interno, mas webhook confirmado',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;