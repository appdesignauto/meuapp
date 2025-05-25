import { Router } from 'express';
import { db } from '../db';
import { users, subscriptions } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Endpoint principal do webhook Hotmart
router.post('/hotmart-fixed', async (req, res) => {
  try {
    console.log('[WEBHOOK HOTMART] Recebido:', JSON.stringify(req.body, null, 2));

    const { event, data } = req.body;

    // 🚨 Validação: Evento válido
    if (event !== 'PURCHASE_APPROVED') {
      console.log('[WEBHOOK HOTMART] Evento não processado:', event);
      return res.status(200).json({ 
        success: false, 
        message: 'Evento não processado',
        event 
      });
    }

    // 🚨 Validação: Status de compra
    if (data?.purchase?.status !== 'APPROVED') {
      console.log('[WEBHOOK HOTMART] Status não aprovado:', data?.purchase?.status);
      return res.status(200).json({ 
        success: false, 
        message: 'Status não aprovado',
        status: data?.purchase?.status 
      });
    }

    // 🧾 Extração de dados
    const buyer = data.buyer;
    const purchase = data.purchase;
    const subscription = data.subscription;
    const product = data.product;

    // 🚨 Validação: Campos obrigatórios
    if (!buyer?.email || !buyer?.name) {
      console.log('[WEBHOOK HOTMART] Campos obrigatórios ausentes');
      return res.status(400).json({ 
        success: false, 
        message: 'Email ou nome do comprador ausente' 
      });
    }

    const email = buyer.email.toLowerCase().trim();
    const name = buyer.name.trim();
    const transactionId = purchase.transaction;
    const planName = subscription?.plan?.name || 'Plano Premium';

    // 🚨 Validação: Duplicidade de transactionId
    if (transactionId) {
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.transactionId, transactionId))
        .limit(1);

      if (existingSubscription.length > 0) {
        console.log('[WEBHOOK HOTMART] Transação já processada:', transactionId);
        return res.status(200).json({ 
          success: false, 
          message: 'Transação já processada',
          transactionId 
        });
      }
    }

    // Processar datas
    const orderDate = purchase.order_date ? new Date(purchase.order_date) : new Date();
    const nextChargeDate = purchase.date_next_charge ? new Date(purchase.date_next_charge) : null;
    
    // Calcular data de expiração (1 ano a partir da compra)
    const expirationDate = new Date(orderDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    // Verificar se usuário já existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: number;

    if (existingUser.length > 0) {
      // Atualizar usuário existente
      userId = existingUser[0].id;
      
      await db
        .update(users)
        .set({
          nivelacesso: 'premium',
          origemassinatura: 'hotmart',
          tipoplano: planName,
          dataassinatura: orderDate,
          dataexpiracao: expirationDate,
          acessovitalicio: false,
          isactive: true,
          emailconfirmed: true,
          atualizadoem: new Date()
        })
        .where(eq(users.id, userId));

      console.log('[WEBHOOK HOTMART] Usuário atualizado:', email);
    } else {
      // 👤 Criar novo usuário
      const newUser = await db
        .insert(users)
        .values({
          username: email.split('@')[0], // Usar parte antes do @ como username
          email: email,
          name: name,
          password: 'temp123', // Senha temporária, usuário pode redefinir
          nivelacesso: 'premium',
          origemassinatura: 'hotmart',
          tipoplano: planName,
          dataassinatura: orderDate,
          dataexpiracao: expirationDate,
          acessovitalicio: false,
          isactive: true,
          emailconfirmed: true,
          criadoem: new Date(),
          atualizadoem: new Date()
        })
        .returning({ id: users.id });

      userId = newUser[0].id;
      console.log('[WEBHOOK HOTMART] Novo usuário criado:', email);
    }

    // 🔐 Registrar assinatura
    await db
      .insert(subscriptions)
      .values({
        userId: userId,
        planType: planName,
        startDate: orderDate,
        endDate: nextChargeDate,
        isActive: true,
        transactionId: transactionId || null,
        source: 'hotmart',
        productId: product.id?.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

    console.log('[WEBHOOK HOTMART] Assinatura criada para usuário:', userId);

    // ✅ Resposta de sucesso
    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      user: {
        id: userId,
        email: email,
        name: name,
        plan: planName
      },
      transaction: transactionId
    });

  } catch (error) {
    console.error('[WEBHOOK HOTMART] Erro ao processar:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;