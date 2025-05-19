import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { users } from '../../../shared/schema';

// Criar uma instância do roteador
const router = Router();

router.post('/webhook-hotmart', async (req: Request, res: Response) => {
  try {
    console.log('===================== WEBHOOK HOTMART RECEBIDO =====================');
    console.log('Payload:', JSON.stringify(req.body, null, 2));
    
    // Extrair dados básicos do webhook para logging
    const payload = req.body;
    const eventType = payload.event || 'unknown';
    const transactionCode = payload.data?.purchase?.transaction || 'unknown';
    
    // Log simplificado
    console.log(`Evento: ${eventType}`);
    console.log(`Transação: ${transactionCode}`);
    console.log(`Hora: ${new Date().toISOString()}`);
    
    // Salvar webhook para análise posterior (com nome baseado no timestamp)
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      fs.writeFileSync(
        `webhook-${timestamp}.json`, 
        JSON.stringify(payload, null, 2)
      );
      console.log(`Webhook salvo em webhook-${timestamp}.json`);
    } catch (fileError) {
      console.error('Erro ao salvar arquivo de log do webhook:', fileError);
    }
    
    // Processamento básico do webhook para eventos de compra
    let processingResult = {
      success: false,
      message: 'Evento não processado'
    };
    
    // Processar evento de compra aprovada
    if (eventType === 'PURCHASE_APPROVED') {
      try {
        const buyerEmail = payload.data?.buyer?.email;
        
        if (buyerEmail) {
          // Verificar se o usuário existe
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, buyerEmail)
          });
          
          if (existingUser) {
            // Determinar a data de expiração (1 ano a partir de hoje)
            const dataAssinatura = new Date();
            const dataExpiracao = new Date();
            dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
            
            // Atualizar a assinatura do usuário
            await db.update(users)
              .set({
                origemassinatura: 'hotmart',
                tipoplano: 'premium',
                dataassinatura: dataAssinatura,
                dataexpiracao: dataExpiracao,
                acessovitalicio: false,
                isactive: true
              })
              .where(eq(users.id, existingUser.id));
            
            processingResult = {
              success: true,
              message: `Assinatura atualizada para o usuário ${existingUser.username} (ID: ${existingUser.id})`
            };
            
            console.log(`Assinatura do usuário ${existingUser.username} atualizada com sucesso!`);
          } else {
            processingResult = {
              success: false,
              message: `Usuário com email ${buyerEmail} não encontrado no sistema`
            };
            
            console.log(`Nenhum usuário encontrado com o email ${buyerEmail}`);
          }
        } else {
          processingResult = {
            success: false,
            message: 'Email do comprador não encontrado no payload'
          };
        }
      } catch (dbError) {
        console.error('Erro no banco de dados ao processar compra:', dbError);
        processingResult = {
          success: false,
          message: 'Erro ao processar compra no banco de dados'
        };
      }
    }
    
    // Sempre responder com 200 para a Hotmart não reenviar
    res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido e processado',
      processingResult
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    // Mesmo em caso de erro, retornar 200 para a Hotmart não reenviar
    res.status(200).json({ 
      success: false, 
      message: 'Erro ao processar webhook, mas foi recebido pelo servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;