import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { users } from '../../../shared/schema';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ambiente de ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar uma instância do roteador
const router = Router();

router.post('/webhook-hotmart', async (req: Request, res: Response) => {
  try {
    console.log('===================== WEBHOOK HOTMART RECEBIDO =====================');
    
    // Criar um arquivo de teste imediato para verificar se a rota está sendo acessada
    try {
      fs.writeFileSync('webhook-test.txt', `Webhook recebido em ${new Date().toISOString()}\n`);
    } catch (e) {
      console.error('Erro ao criar arquivo de teste:', e);
    }
    
    // Tentar extrair dados do payload
    const payload = req.body || {};
    console.log('Payload recebido:', JSON.stringify(payload, null, 2));
    
    // Extrair dados básicos do webhook para logging
    const eventType = payload.event || 'unknown';
    const transactionCode = payload.data?.purchase?.transaction || 'unknown';
    
    // Log simplificado
    console.log(`Evento: ${eventType}`);
    console.log(`Transação: ${transactionCode}`);
    console.log(`Hora: ${new Date().toISOString()}`);
    
    // Salvar webhook em vários formatos/locais para garantir que pelo menos um funcione
    try {
      // Tentar salvar no diretório atual
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const logData = {
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: payload
      };
      
      // Método 1: No diretório raiz
      fs.writeFileSync(
        `webhook-${timestamp}.json`, 
        JSON.stringify(logData, null, 2)
      );
      
      // Método 2: No diretório logs (criar se não existir)
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(logsDir, `webhook-log-${timestamp}.json`), 
        JSON.stringify(logData, null, 2)
      );
      
      // Método 3: Arquivo de log consolidado
      fs.appendFileSync(
        'webhook-log.txt',
        `\n--- WEBHOOK ${timestamp} ---\n${JSON.stringify(logData, null, 2)}\n-----------------------\n`
      );
      
      console.log(`Webhook salvo em vários arquivos de log`);
    } catch (fileError) {
      console.error('Erro ao salvar arquivo de log do webhook:', fileError);
    }
    
    // Processamento básico do webhook para eventos de compra
    let processingResult = {
      success: false,
      message: `Evento ${eventType} recebido mas não processado completamente`
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
      eventType,
      transactionCode,
      processingResult
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    // Tentar salvar informações do erro
    try {
      fs.appendFileSync(
        'webhook-errors.txt',
        `\n--- ERRO ${new Date().toISOString()} ---\n${error}\n${error instanceof Error ? error.stack : ''}\n-----------------------\n`
      );
    } catch (e) {
      console.error('Não foi possível salvar log de erro:', e);
    }
    
    // Mesmo em caso de erro, retornar 200 para a Hotmart não reenviar
    res.status(200).json({ 
      success: false, 
      message: 'Erro ao processar webhook, mas foi recebido para análise',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;