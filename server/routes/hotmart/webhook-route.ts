import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { hotmartWebhookProcessor } from '../../services/hotmart-webhook-processor';

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
    
    // Registrar informações principais para logging
    const payload = req.body as HotmartWebhookPayload;
    const eventType = payload.event;
    const transactionCode = payload.data?.purchase?.transaction || 'unknown';
    
    // Log básico das informações de cabeçalho
    console.log(`Evento: ${eventType}`);
    console.log(`Transação: ${transactionCode}`);
    console.log(`Hora de recebimento: ${new Date().toISOString()}`);
    
    // Salvar webhook em arquivo para análise posterior
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFile = path.join(process.cwd(), `webhook-${timestamp}.json`);
    
    try {
      fs.writeFileSync(logFile, JSON.stringify({
        receivedAt: new Date().toISOString(),
        headers: req.headers,
        body: payload
      }, null, 2));
      
      console.log(`Webhook salvo em ${logFile}`);
    } catch (fileError) {
      console.error('Erro ao salvar arquivo de webhook:', fileError);
    }
    
    // Processar o webhook usando o processador dedicado
    const processingResult = await hotmartWebhookProcessor.processWebhook(payload);
    
    // Log do resultado do processamento
    if (processingResult.success) {
      console.log(`Webhook processado com sucesso: ${processingResult.message}`);
      if (processingResult.details) {
        console.log('Detalhes:', JSON.stringify(processingResult.details, null, 2));
      }
    } else {
      console.error(`Erro no processamento do webhook: ${processingResult.message}`);
      if (processingResult.details) {
        console.error('Detalhes do erro:', processingResult.details);
      }
    }
    
    // Sempre responder com 200 para a Hotmart não reenviar o webhook
    res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido pelo servidor',
      eventType,
      transactionCode,
      processingResult: {
        success: processingResult.success,
        message: processingResult.message
      }
    });
    
  } catch (error) {
    console.error('Erro não tratado no handler do webhook:', error);
    
    // Mesmo em caso de erro grave, retornar 200 para a Hotmart não reenviar
    res.status(200).json({ 
      success: false, 
      message: 'Erro ao processar webhook, mas foi recebido pelo servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;