/**
 * Serviço para integração com a API da Hotmart
 * Permite verificar o status de assinaturas e processamento de webhooks
 */

const fetch = require('node-fetch');
const { pool } = require('../db');
const { SubscriptionService } = require('./subscription-service');

class HotmartService {
  /**
   * Processa uma compra aprovada da Hotmart
   * @param webhookData Dados do webhook
   * @param email Email do comprador
   */
  static async processPurchase(webhookData, email) {
    console.log('🔄 Processando compra Hotmart para:', email);
    
    try {
      // Extrair dados importantes do webhook
      const data = webhookData.data || webhookData;
      const name = data.buyer?.name || data.subscriber?.name || undefined;
      
      // Identificar o tipo de plano (mensal, anual, semestral)
      let planType = 'mensal'; // Padrão é mensal
      
      try {
        // Tentar identificar o tipo de plano pelo ID do produto e oferta
        const productId = data.product?.id || data.purchase?.product?.id;
        const offerId = data.purchase?.offer?.code;
        
        if (productId) {
          console.log(`🔍 Verificando mapeamento para productId: ${productId}, offerId: ${offerId || 'não informado'}`);
          
          // Consultar mapeamento no banco de dados
          let query = `SELECT * FROM "hotmartProductMappings" WHERE "productId" = $1`;
          const queryParams = [String(productId)];
          
          // Adicionar offerId à consulta se disponível
          if (offerId) {
            query += ` AND "offerId" = $2`;
            queryParams.push(String(offerId));
          }
          
          // Executar consulta
          const result = await pool.query(query, queryParams);
          
          if (result.rows && result.rows.length > 0) {
            const mapping = result.rows[0];
            console.log(`✅ Mapeamento encontrado: ${JSON.stringify(mapping)}`);
            
            if (mapping.planType) {
              planType = mapping.planType;
              console.log(`✅ Plano identificado via mapeamento: ${planType}`);
            }
          } else {
            console.log('⚠️ Nenhum mapeamento encontrado para este produto/oferta');
          }
        }
        
        // Verificar pelo nome do plano se disponível
        if (data.subscription?.plan?.name) {
          const planName = data.subscription.plan.name.toLowerCase();
          if (planName.includes('anual')) {
            planType = 'anual';
          } else if (planName.includes('semestr')) {
            planType = 'semestral';
          }
          console.log(`✅ Plano identificado pelo nome: ${planType}`);
        }
        
        // Verificar pelo valor do plano como último recurso
        if (data.purchase?.price?.value) {
          const price = parseFloat(data.purchase.price.value);
          if (price >= 250) {
            planType = 'anual';
          } else if (price >= 150) {
            planType = 'semestral';
          }
          console.log(`✅ Plano estimado pelo valor (${price}): ${planType}`);
        }
      } catch (dbError) {
        console.error('❌ Erro ao verificar mapeamento:', dbError);
        // Continuar com o tipo padrão em caso de erro
      }
      
      // Extrair informações de datas
      let startDate = new Date();
      let endDate = undefined;
      
      if (data.purchase?.approved_date) {
        startDate = new Date(parseInt(data.purchase.approved_date));
      }
      
      if (data.subscription?.end_date) {
        endDate = new Date(parseInt(data.subscription.end_date));
      }
      
      // Extrair ID da transação
      const transactionId = data.purchase?.transaction || 
                          data.subscription?.code || 
                          webhookData.id || 
                          `hotmart-${Date.now()}`;
      
      // Criar ou atualizar assinatura
      const result = await SubscriptionService.createOrUpdateSubscription(
        email,
        planType,
        'hotmart',
        transactionId,
        startDate,
        endDate,
        name
      );
      
      console.log(`✅ Assinatura processada com sucesso: ${email}, ${planType}`);
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao processar compra Hotmart:', error);
      throw error;
    }
  }
  
  /**
   * Processa um cancelamento de assinatura da Hotmart
   * @param webhookData Dados do webhook
   * @param email Email do assinante
   */
  static async processCancellation(webhookData, email) {
    console.log('🔄 Processando cancelamento Hotmart para:', email);
    
    try {
      // Extrair o motivo do cancelamento, se houver
      const data = webhookData.data || webhookData;
      const reason = data.cancellation_reason || 'Cancelamento via Hotmart';
      
      // Chamar o serviço de assinaturas para cancelar
      const result = await SubscriptionService.cancelSubscription(email, reason);
      
      console.log(`✅ Cancelamento processado com sucesso: ${email}`);
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao processar cancelamento Hotmart:', error);
      throw error;
    }
  }
  
  /**
   * Processa um reembolso ou chargeback da Hotmart
   * @param webhookData Dados do webhook
   * @param email Email do comprador
   */
  static async processRefund(webhookData, email) {
    console.log('🔄 Processando reembolso Hotmart para:', email);
    
    try {
      // Tratamos reembolso como um cancelamento com motivo específico
      const data = webhookData.data || webhookData;
      const event = webhookData.event || 'REFUND';
      
      const reason = event === 'PURCHASE_CHARGEBACK' 
        ? 'Chargeback detectado'
        : 'Reembolso processado';
      
      // Chamar o serviço de assinaturas para cancelar
      const result = await SubscriptionService.cancelSubscription(email, reason);
      
      console.log(`✅ Reembolso processado com sucesso: ${email}`);
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao processar reembolso Hotmart:', error);
      throw error;
    }
  }
  
  /**
   * Processa uma renovação de assinatura da Hotmart
   * @param webhookData Dados do webhook
   * @param email Email do assinante
   */
  static async processRenewal(webhookData, email) {
    console.log('🔄 Processando renovação Hotmart para:', email);
    
    try {
      // Em uma renovação, temos uma nova compra, mas queremos manter o mesmo tipo de plano
      // Vamos reutilizar a lógica de processPurchase
      const result = await this.processPurchase(webhookData, email);
      
      console.log(`✅ Renovação processada com sucesso: ${email}`);
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao processar renovação Hotmart:', error);
      throw error;
    }
  }
}

module.exports = { HotmartService };