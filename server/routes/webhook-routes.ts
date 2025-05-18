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
    
    // Verificação de token simplificada
    // Prioriza o corpo da requisição primeiro, depois tenta os cabeçalhos
    const token = 
      (req.body && req.body.hottok) || // Busca primeiro no corpo (formato mais comum na Hotmart)
      req.headers['x-hotmart-hottok']?.toString() || 
      req.headers['x-hotmart-webhook-token']?.toString() ||
      null;
    
    console.log('🔑 [Webhook] Token recebido:', token);
    console.log('🔑 [Webhook] Token esperado:', process.env.HOTMART_WEBHOOK_SECRET);
    
    // Verificação do token - validação desativada temporariamente para debugging
    // Remova o comentário abaixo quando estiver tudo funcionando
    /*
    if (!token || token !== process.env.HOTMART_WEBHOOK_SECRET) {
      console.warn("🔒 [Webhook] Token de autenticação ausente ou inválido");
      return res.status(200).json({
        success: false,
        message: 'Token inválido ou ausente',
        note: 'Webhook rejeitado, mas confirmamos o recebimento'
      });
    }
    */
    
    // ATENÇÃO: VALIDAÇÃO DE TOKEN TEMPORARIAMENTE DESATIVADA
    // Esta linha abaixo deve ser removida quando a integração estiver funcionando!
    console.warn("⚠️ [AVISO] Validação de token Hotmart está temporariamente desativada para testes");
    
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

    // Usar o token obtido anteriormente como assinatura para validação
    const result = await hotmartService.processWebhook(event, payload, token as string);
    
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