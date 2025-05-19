import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { users } from '../../../shared/schema';

// Criar uma instância do roteador
const router = Router();

// Interface para o payload do webhook da Hotmart
interface HotmartWebhookPayload {
  id: string;
  creation_date: number;
  event: string;
  version: string;
  data: {
    product: {
      id: number;
      ucode: string;
      name: string;
      // outros campos do produto
    };
    buyer: {
      email: string;
      name: string;
      first_name: string;
      last_name: string;
      // outros campos do comprador
    };
    purchase: {
      approved_date: number;
      status: string;
      transaction: string;
      // outros campos da compra
    };
    subscription?: {
      status: string;
      plan: {
        id: number;
        name: string;
      };
      subscriber: {
        code: string;
      };
    };
  };
}

router.post('/webhook-hotmart', async (req: Request, res: Response) => {
  try {
    console.log('===================== WEBHOOK HOTMART RECEBIDO =====================');
    
    // Extrair dados do webhook
    const payload = req.body as HotmartWebhookPayload;
    const eventType = payload.event;
    const transactionCode = payload.data.purchase.transaction;
    const buyerEmail = payload.data.buyer.email;
    const status = payload.data.purchase.status;
    const productName = payload.data.product.name;
    const subscriberCode = payload.data?.subscription?.subscriber?.code || null;
    
    console.log(`Evento: ${eventType}`);
    console.log(`Transação: ${transactionCode}`);
    console.log(`Email do comprador: ${buyerEmail}`);
    console.log(`Status: ${status}`);
    console.log(`Produto: ${productName}`);
    console.log(`Código de assinante: ${subscriberCode}`);
    
    // Salvar webhook em arquivo para análise
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFile = path.join(process.cwd(), `webhook-${timestamp}.json`);
    
    try {
      fs.writeFileSync(logFile, JSON.stringify(payload, null, 2));
      console.log(`Webhook salvo em ${logFile}`);
    } catch (fileError) {
      console.error('Erro ao salvar arquivo de webhook:', fileError);
    }
    
    // INÍCIO DO PROCESSAMENTO REAL DO WEBHOOK
    // Esta parte só executa para eventos de compra aprovada
    if (eventType === 'PURCHASE_APPROVED' && status === 'APPROVED') {
      console.log('Processando compra aprovada...');
      
      try {
        // Verificar se o usuário existe com este email
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, buyerEmail)
        });
        
        if (existingUser) {
          console.log(`Usuário encontrado: ${existingUser.username} (ID: ${existingUser.id})`);
          
          // Determinar a data de expiração da assinatura (1 ano a partir de hoje)
          const dataAssinatura = new Date();
          const dataExpiracao = new Date();
          dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
          
          // Determinar o tipo de plano baseado no nome do produto
          const tipoPlanoPadrao = 'premium'; // Pode ser ajustado conforme os produtos reais
          
          // Atualizar assinatura do usuário
          await db.update(users)
            .set({
              origemassinatura: 'hotmart',
              tipoplano: tipoPlanoPadrao,
              dataassinatura: dataAssinatura,
              dataexpiracao: dataExpiracao,
              codigoassinante: subscriberCode || transactionCode,
              transaction_code: transactionCode,
              acessovitalicio: false
            })
            .where(eq(users.id, existingUser.id));
          
          console.log(`Assinatura atualizada para o usuário ${existingUser.username}`);
          console.log(`Plano: ${tipoPlanoPadrao}, Válido até: ${dataExpiracao.toISOString()}`);
        } else {
          console.log(`Usuário com email ${buyerEmail} não encontrado no sistema`);
          // Aqui poderia implementar a criação automática de usuários se necessário
        }
        
      } catch (dbError) {
        console.error('Erro ao processar assinatura no banco de dados:', dbError);
      }
    }
    // FIM DO PROCESSAMENTO REAL DO WEBHOOK
    
    // Responder imediatamente para a Hotmart
    res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido e processado com sucesso',
      eventType,
      transactionCode
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook da Hotmart:', error);
    
    // Mesmo em caso de erro, retornar 200 para a Hotmart não reenviar
    res.status(200).json({ 
      success: false, 
      message: 'Erro no processamento do webhook',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;