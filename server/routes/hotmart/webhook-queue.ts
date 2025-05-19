/**
 * Rota otimizada para receber webhooks da Hotmart
 * 
 * Esta implementação salva os webhooks para processamento assíncrono,
 * evitando bloqueios no servidor principal.
 */
import { Router, Request, Response } from 'express';
import { WebhookProcessor } from '../../services/webhook-processor';

const router = Router();

// Endpoint para receber webhooks da Hotmart
router.post('/webhook-hotmart', async (req: Request, res: Response) => {
  try {
    // Log mínimo para não sobrecarregar servidor
    console.log('Webhook da Hotmart recebido. Adicionando à fila de processamento...');
    
    // Extrair dados mínimos para logging
    const eventType = req.body?.event || req.body?.data?.purchase?.status || 'unknown';
    const transactionCode = req.body?.data?.purchase?.transaction || 
                           req.body?.data?.purchase?.transaction_code || 'unknown';
    
    console.log(`Tipo de evento: ${eventType}, Transação: ${transactionCode}`);
    
    // Salvar webhook para processamento assíncrono
    const webhookId = await WebhookProcessor.saveWebhook(req.body);
    
    // Responder imediatamente para não bloquear o servidor
    res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido e adicionado à fila de processamento',
      webhookId: webhookId
    });
    
    // Opcionalmente, iniciar processamento em background
    setTimeout(async () => {
      try {
        // Processar apenas este webhook
        await WebhookProcessor.processWebhookQueue(1);
      } catch (error) {
        console.error('Erro ao iniciar processamento em background:', error);
        // Não afeta a resposta HTTP, pois já foi enviada
      }
    }, 100); // Pequeno delay para garantir que a resposta seja enviada primeiro
    
  } catch (error) {
    console.error('Erro ao receber webhook da Hotmart:', error);
    
    // Mesmo em caso de erro, retornar 200 para a Hotmart não reenviar
    // Responder com erro 500 faria a Hotmart tentar novamente
    res.status(200).json({ 
      success: false, 
      message: 'Erro ao processar webhook, mas foi recebido',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;