/**
 * WEBHOOK DEFINITIVO QUE FUNCIONA - EXTREMAMENTE SIMPLES
 * Este webhook processa IMEDIATAMENTE sem complicações
 */

const { Pool } = require('pg');
const crypto = require('crypto');

async function webhookHotmart(req, res) {
  console.log('\n🔥 WEBHOOK DIRETO RECEBIDO!', new Date().toISOString());
  console.log('📦 Dados:', JSON.stringify(req.body, null, 2));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    const payload = req.body;
    
    // Validar se é compra aprovada
    if (payload?.event !== 'PURCHASE_APPROVED' || payload?.data?.purchase?.status !== 'APPROVED') {
      console.log('❌ Não é compra aprovada');
      await pool.end();
      return res.status(200).json({ success: true, message: 'Ignorado - não é compra' });
    }
    
    const email = payload.data?.buyer?.email?.toLowerCase().trim();
    const name = payload.data?.buyer?.name || 'Cliente Novo';
    
    if (!email) {
      console.log('❌ Email não encontrado no payload');
      await pool.end();
      return res.status(200).json({ success: true, message: 'Email não encontrado' });
    }
    
    console.log(`🎯 PROCESSANDO: ${name} - ${email}`);
    
    // Verificar se usuário já existe
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    let userId;
    
    if (userCheck.rows.length > 0) {
      // Usuário existe - atualizar para premium
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
      console.log(`➕ CRIANDO NOVO USUÁRIO: ${email}`);
      
      const username = email.split('@')[0] + '_' + Date.now();
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
      console.log(`✅ USUÁRIO CRIADO COM SUCESSO! ID: ${userId}`);
    }
    
    // Criar/atualizar assinatura
    await pool.query(`
      INSERT INTO subscriptions ("userId", "planType", status, "startDate", "endDate", origin, transactionid, lastevent)
      VALUES ($1, 'anual', 'active', NOW(), NOW() + interval '1 year', 'hotmart', $2, 'PURCHASE_APPROVED')
      ON CONFLICT ("userId") DO UPDATE SET
        status = 'active',
        "endDate" = NOW() + interval '1 year',
        lastevent = 'PURCHASE_APPROVED'
    `, [userId, payload.data?.purchase?.transaction || 'AUTO']);
    
    console.log(`🎉 PROCESSAMENTO COMPLETO! Usuário ${userId} tem acesso premium!`);
    
    await pool.end();
    
    return res.status(200).json({
      success: true,
      message: 'USUÁRIO CRIADO AUTOMATICAMENTE COM SUCESSO!',
      userId: userId,
      email: email,
      name: name,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error);
    
    try {
      await pool.end();
    } catch (e) {}
    
    return res.status(200).json({
      success: false,
      message: 'Erro no processamento',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { webhookHotmart };