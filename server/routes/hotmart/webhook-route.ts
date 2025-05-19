import { Router, Request, Response } from 'express';

// Criar uma instância do roteador
const router = Router();

router.post('/webhook-hotmart', async (req: Request, res: Response) => {
  try {
    // Log completo para análise da estrutura dos dados
    console.log('===================== WEBHOOK HOTMART RECEBIDO =====================');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    console.log('==================================================================');
    
    // Extrair dados mínimos para logging rápido
    const eventType = req.body?.event || req.body?.data?.purchase?.status || 'unknown';
    const transactionCode = req.body?.data?.purchase?.transaction || 
                           req.body?.data?.purchase?.transaction_code || 'unknown';
    
    console.log(`Tipo de evento: ${eventType}, Transação: ${transactionCode}`);
    
    // Responder imediatamente para não bloquear o servidor
    res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido e registrado com sucesso para análise',
      eventType,
      transactionCode
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook da Hotmart:', error);
    
    // Mesmo em caso de erro, retornar 200 para a Hotmart não reenviar
    res.status(200).json({ 
      success: false, 
      message: 'Erro ao processar webhook, mas foi recebido para análise',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;