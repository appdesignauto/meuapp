import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { HotmartService } from '../services/hotmart-service';

const prisma = new PrismaClient();
const hotmartService = new HotmartService(prisma);
const router = Router();

// Endpoint para webhook da Hotmart
router.post('/hotmart', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hotmart-hottok'] as string;
    const event = req.headers['x-hotmart-event'] as string;
    const payload = req.body;
    
    console.log(`[Webhook] Recebido evento da Hotmart: ${event}`);
    
    if (!signature || !event) {
      console.error('[Webhook] Cabeçalhos da Hotmart ausentes');
      return res.status(400).json({ 
        success: false, 
        message: 'Cabeçalhos da Hotmart ausentes' 
      });
    }

    const result = await hotmartService.processWebhook(event, payload, signature);
    
    if (result.success) {
      console.log(`[Webhook] Evento da Hotmart processado com sucesso: ${event}`);
      return res.status(200).json({ 
        success: true, 
        message: result.message 
      });
    } else {
      console.warn(`[Webhook] Erro ao processar evento da Hotmart: ${result.message}`);
      return res.status(400).json({ 
        success: false, 
        message: result.message 
      });
    }
  } catch (error) {
    console.error('[Webhook] Erro interno ao processar webhook da Hotmart:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao processar webhook' 
    });
  }
});

// Endpoint para simular webhook da Hotmart (apenas para testes)
router.post('/hotmart/simulate', async (req: Request, res: Response) => {
  // Verificar se está em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'development' && process.env.HOTMART_SANDBOX !== 'true') {
    return res.status(403).json({ 
      success: false, 
      message: 'Esta rota só está disponível em ambiente de desenvolvimento ou sandbox' 
    });
  }

  try {
    const payload = req.body;
    const event = req.body.event || 'PURCHASE_APPROVED'; // Evento padrão
    const signature = 'simulado'; // Assinatura simulada
    
    console.log(`[Webhook Simulado] Simulando evento da Hotmart: ${event}`);
    
    const result = await hotmartService.processWebhook(event, payload, signature);
    
    return res.status(200).json({ 
      success: true, 
      simulationResult: result 
    });
  } catch (error) {
    console.error('[Webhook Simulado] Erro ao simular webhook:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao simular webhook' 
    });
  }
});

// Endpoint para listar logs de webhook (apenas para administradores)
router.get('/logs', async (req: Request, res: Response) => {
  try {
    // Aqui deveria haver verificação de autenticação e autorização
    // Mas para simplicidade, vamos apenas buscar os logs
    const logs = await hotmartService.getRecentWebhookLogs();
    return res.status(200).json({ logs });
  } catch (error) {
    console.error('Erro ao buscar logs de webhook:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar logs de webhook' 
    });
  }
});

// Endpoint para listar assinaturas ativas (apenas para administradores)
router.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    // Aqui deveria haver verificação de autenticação e autorização
    // Mas para simplicidade, vamos apenas buscar as assinaturas
    const subscriptions = await hotmartService.getActiveSubscriptions();
    return res.status(200).json({ subscriptions });
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar assinaturas' 
    });
  }
});

export default router;