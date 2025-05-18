/**
 * Funções utilitárias para processamento de webhooks
 */

/**
 * Extrai o e-mail do payload do webhook
 * @param payload Payload do webhook
 * @returns E-mail extraído ou null se não encontrado
 */
export function extractEmailFromPayload(payload: any): string | null {
  if (!payload || typeof payload !== 'object') return null;
  
  // Buscar email em diferentes locais do payload, conforme o formato da Hotmart
  if (payload.data) {
    // Formato 1: data.buyer.email
    if (payload.data.buyer && payload.data.buyer.email) {
      return payload.data.buyer.email;
    }
    
    // Formato 2: data.subscription.subscriber.email
    if (payload.data.subscription && 
        payload.data.subscription.subscriber && 
        payload.data.subscription.subscriber.email) {
      return payload.data.subscription.subscriber.email;
    }
    
    // Formato 3: data.purchase.buyer.email
    if (payload.data.purchase && 
        payload.data.purchase.buyer && 
        payload.data.purchase.buyer.email) {
      return payload.data.purchase.buyer.email;
    }
    
    // Formato 4: data.purchase.subscription.subscriber.email
    if (payload.data.purchase && 
        payload.data.purchase.subscription && 
        payload.data.purchase.subscription.subscriber && 
        payload.data.purchase.subscription.subscriber.email) {
      return payload.data.purchase.subscription.subscriber.email;
    }
  }
  
  // Formatos mais simples/antigos
  if (payload.buyer && payload.buyer.email) {
    return payload.buyer.email;
  }
  
  if (payload.subscriber && payload.subscriber.email) {
    return payload.subscriber.email;
  }
  
  return null;
}

/**
 * Registra log de webhook no banco de dados
 * @param prisma Cliente Prisma para conexão com o banco
 * @param eventType Tipo de evento
 * @param status Status do processamento (success/error)
 * @param email Email associado ao evento (opcional)
 * @param payload Payload completo do webhook (opcional)
 * @param errorMessage Mensagem de erro (opcional)
 */
export async function logWebhookToDatabase(
  prisma: any,
  eventType: string,
  status: string,
  email: string | null = null,
  payload: any = null,
  errorMessage: string | null = null
): Promise<void> {
  try {
    // Extrair email do payload se não foi fornecido
    if (!email) {
      email = extractEmailFromPayload(payload);
    }

    // Converter payload para JSON string se for objeto
    const jsonPayload = typeof payload === 'object' ? JSON.stringify(payload) : payload;

    // Inserir log diretamente usando SQL para evitar problemas com Prisma
    await prisma.$executeRawUnsafe(`
      INSERT INTO webhook_logs (event_type, status, email, source, raw_payload, error_message)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, eventType, status, email, 'hotmart', jsonPayload, errorMessage);
    
    console.log(`✅ Log registrado na tabela webhook_logs: ${eventType} - ${status}`);
  } catch (error) {
    console.error('❌ Erro ao registrar log na tabela webhook_logs:', error);
    // Não propagar o erro para não interromper o fluxo
  }
}