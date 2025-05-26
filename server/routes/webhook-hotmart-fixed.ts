import { Router } from 'express';
import { db } from '../storage';
import { sql } from 'drizzle-orm';

const router = Router();

// 🎯 ENDPOINT PRINCIPAL DO WEBHOOK HOTMART - AUTOMAÇÃO COMPLETA
router.post('/hotmart-fixed', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`🚀 [${timestamp}] WEBHOOK HOTMART RECEBIDO - PROCESSAMENTO INICIADO`);
  
  try {
    const payload = req.body;
    console.log('📦 [WEBHOOK] Payload completo recebido:', JSON.stringify(payload, null, 2));

    // ✅ 1. VALIDAÇÃO DO EVENTO - Só processa PURCHASE_APPROVED
    if (!isValidPurchase(payload)) {
      console.log('❌ [WEBHOOK] Evento não é uma compra aprovada. Ignorando...');
      return res.status(200).json({ 
        success: true, 
        message: 'Evento processado - não é compra aprovada',
        processed: false
      });
    }

    console.log('✅ [WEBHOOK] Compra aprovada detectada! Iniciando processamento...');

    // ✅ 2. EXTRAÇÃO DOS DADOS DO COMPRADOR
    const userData = extractUserData(payload);
    console.log('👤 [WEBHOOK] Dados do comprador extraídos:', userData);

    if (!userData.email || !userData.name) {
      console.error('❌ [WEBHOOK] Dados obrigatórios ausentes (email/nome)');
      return res.status(400).json({ 
        success: false, 
        error: 'Email ou nome do comprador não encontrado no payload' 
      });
    }

    // ✅ 3. VERIFICAÇÃO SE USUÁRIO JÁ EXISTE
    console.log(`🔍 [WEBHOOK] Verificando se usuário ${userData.email} já existe...`);
    const existingUserResult = await db.execute(sql`
      SELECT id, nivelacesso FROM users WHERE email = ${userData.email}
    `);

    let userId: number;
    
    if (existingUserResult.rows.length > 0) {
      // Usuário já existe - atualizar para premium
      const existingUser = existingUserResult.rows[0] as any;
      userId = existingUser.id;
      
      console.log(`👤 [WEBHOOK] Usuário existente encontrado (ID: ${userId}). Atualizando para premium...`);
      
      await db.execute(sql`
        UPDATE users 
        SET 
          nivelacesso = 'premium',
          origemassinatura = 'hotmart',
          tipoplano = 'anual',
          dataassinatura = ${new Date()},
          dataexpiracao = ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)},
          isactive = true,
          emailconfirmed = true,
          atualizadoem = ${new Date()}
        WHERE id = ${userId}
      `);
      
      console.log(`✅ [WEBHOOK] Usuário ${userData.email} atualizado para premium com sucesso!`);
      
    } else {
      // Criar novo usuário
      console.log(`👤 [WEBHOOK] Usuário não existe. Criando novo usuário premium...`);
      
      // Gerar username único baseado no email
      const baseUsername = userData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const username = await generateUniqueUsername(baseUsername);
      
      const insertResult = await db.execute(sql`
        INSERT INTO users (
          username, email, name, password, nivelacesso, 
          origemassinatura, tipoplano, dataassinatura, 
          dataexpiracao, acessovitalicio, isactive, emailconfirmed,
          criadoem, atualizadoem
        ) VALUES (
          ${username},
          ${userData.email},
          ${userData.name},
          'temp_password_123',
          'premium',
          'hotmart',
          'anual',
          ${new Date()},
          ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)},
          false,
          true,
          true,
          ${new Date()},
          ${new Date()}
        ) RETURNING id
      `);
      
      userId = (insertResult.rows[0] as any).id;
      console.log(`✅ [WEBHOOK] Novo usuário criado com sucesso! ID: ${userId}, Username: ${username}`);
    }

    // ✅ 4. REGISTRAR ASSINATURA
    console.log(`📋 [WEBHOOK] Registrando assinatura para usuário ID: ${userId}...`);
    
    await db.execute(sql`
      INSERT INTO subscriptions (
        userId, planType, startDate, endDate, 
        isActive, transactionId, source, createdAt
      ) VALUES (
        ${userId},
        'anual',
        ${new Date()},
        ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)},
        true,
        ${userData.transactionId},
        'hotmart',
        ${new Date()}
      )
    `);

    console.log(`✅ [WEBHOOK] Assinatura registrada com sucesso!`);

    // ✅ 5. LOG DO WEBHOOK PARA MONITORAMENTO
    await db.execute(sql`
      INSERT INTO webhookLogs (
        email, payload, status, processedAt, source, transactionId
      ) VALUES (
        ${userData.email},
        ${JSON.stringify(payload)},
        'success',
        ${new Date()},
        'hotmart',
        ${userData.transactionId}
      )
    `);

    console.log(`🎉 [WEBHOOK] PROCESSAMENTO CONCLUÍDO COM SUCESSO!`);
    console.log(`📊 [WEBHOOK] Resumo: Usuário ${userData.email} (ID: ${userId}) agora tem acesso premium por 1 ano`);

    // ✅ 6. RESPOSTA DE SUCESSO PARA A HOTMART
    return res.status(200).json({
      success: true,
      message: 'Compra processada com sucesso',
      userId: userId,
      email: userData.email,
      planType: 'anual',
      processed: true
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] ERRO CRÍTICO:', error);
    
    // Log do erro no banco
    try {
      await db.execute(sql`
        INSERT INTO webhookLogs (
          email, payload, status, processedAt, source, errorMessage
        ) VALUES (
          'error',
          ${JSON.stringify(req.body)},
          'error',
          ${new Date()},
          'hotmart',
          ${error instanceof Error ? error.message : String(error)}
        )
      `);
    } catch (logError) {
      console.error('❌ [WEBHOOK] Erro ao salvar log de erro:', logError);
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// 🔍 FUNÇÃO DE VALIDAÇÃO - Verifica se é uma compra aprovada
function isValidPurchase(payload: any): boolean {
  const event = payload.event || payload.tipo_evento;
  const status = payload.data?.purchase?.status || payload.data?.compra?.status || payload.status;
  
  console.log(`🔍 [VALIDAÇÃO] Event: ${event}, Status: ${status}`);
  
  return event === 'PURCHASE_APPROVED' && status === 'APPROVED';
}

// 📋 FUNÇÃO DE EXTRAÇÃO - Pega os dados essenciais do comprador
function extractUserData(payload: any): {
  email: string;
  name: string;
  transactionId: string;
} {
  const buyer = payload.data?.buyer || payload.data?.comprador || {};
  const purchase = payload.data?.purchase || payload.data?.compra || {};
  
  return {
    email: buyer.email || buyer.email_comprador || '',
    name: buyer.name || buyer.nome || buyer.nome_comprador || '',
    transactionId: purchase.transaction || purchase.transacao || purchase.id || 'unknown'
  };
}

// 🔤 FUNÇÃO AUXILIAR - Gera username único
async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const result = await db.execute(sql`
      SELECT id FROM users WHERE username = ${username}
    `);
    
    if (result.rows.length === 0) {
      return username;
    }
    
    username = `${baseUsername}${counter}`;
    counter++;
  }
}

export default router;