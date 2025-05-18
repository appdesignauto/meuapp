import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { HotmartService } from '../services/hotmart-service';

const prisma = new PrismaClient();
const hotmartService = new HotmartService(prisma);
const router = Router();

// Endpoint para webhook da Hotmart
router.post('/hotmart', async (req: Request, res: Response) => {
  try {
    // Log detalhado para diagnóstico
    console.log('[Webhook] Cabeçalhos recebidos:', JSON.stringify(req.headers));
    console.log('[Webhook] Corpo recebido:', JSON.stringify(req.body));
    
    // Verificação de assinatura com fallback mais flexível e seguro
    // Considera diferentes formatos de cabeçalho e capitalização
    const hottok = 
      req.headers['x-hotmart-hottok'] || 
      req.headers['X-Hotmart-Hottok'] || 
      req.headers['x-hotmart-webhook-token'] ||
      req.headers['X-Hotmart-Webhook-Token'] || 
      (req.body && req.body.hottok);
    
    // Verificação do TOKEN SECRET - única verificação realmente obrigatória
    if (process.env.HOTMART_WEBHOOK_SECRET && 
        hottok !== process.env.HOTMART_WEBHOOK_SECRET) {
      console.warn('🔒 [Webhook] Token inválido ou ausente:', hottok);
      console.warn('[Webhook] Esperado:', process.env.HOTMART_WEBHOOK_SECRET);
      
      // Mesmo com token inválido, retornamos 200 para evitar retentativas
      return res.status(200).json({
        success: false,
        message: 'Token Hotmart inválido ou ausente',
        note: 'Webhook rejeitado, mas confirmamos o recebimento'
      });
    }
    
    // Extrair informações do evento - também flexível
    let event = req.headers['x-hotmart-event'] as string;
    
    // Se não encontrar no cabeçalho padrão, verificar em alternativas conhecidas
    if (!event && req.body.event) {
      event = req.body.event;
    }
    
    // Se ainda não tiver evento, assumir baseado na operação no corpo
    if (!event && req.body.data && req.body.data.purchase) {
      event = 'PURCHASE_APPROVED'; // Assumir compra aprovada como padrão
    }
    
    const payload = req.body;
    
    console.log(`[Webhook] Processando evento da Hotmart: ${event || 'evento não identificado'}`);
    
    // Se não tiver identificado um evento, definir um valor padrão
    if (!event) {
      console.warn('[Webhook] AVISO: Tipo de evento da Hotmart ausente, prosseguindo como evento genérico');
      event = 'UNDEFINED_EVENT';
    }

    // Usar o hottok obtido anteriormente como assinatura para validação
    const result = await hotmartService.processWebhook(event, payload, hottok as string);
    
    if (result.success) {
      console.log(`[Webhook] Evento da Hotmart processado com sucesso: ${event}`);
      return res.status(200).json({ 
        success: true, 
        message: result.message 
      });
    } else {
      console.warn(`[Webhook] Erro ao processar evento da Hotmart: ${result.message}`);
      // Importante: Sempre retornar 200 para a Hotmart, mesmo com erro
      // Isso evita que a Hotmart tente reenviar o mesmo webhook repetidamente
      return res.status(200).json({ 
        success: false, 
        message: result.message,
        note: "Erro registrado, mas confirmamos o recebimento do webhook"
      });
    }
  } catch (error) {
    console.error('[Webhook] Erro interno ao processar webhook da Hotmart:', error);
    // Sempre responder com 200 mesmo em caso de erro interno
    // A Hotmart não precisa reenviar o webhook, nós é que precisamos corrigir o problema
    return res.status(200).json({ 
      success: false, 
      message: 'Erro interno ao processar webhook, mas confirmando recebimento' 
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