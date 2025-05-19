/**
 * Script para listar assinaturas ativas da Hotmart usando o serviço existente
 */

import hotmartAPI from './server/services/hotmart-api.js';

// Função principal que obtém e exibe as assinaturas
async function listarAssinaturasAtivas() {
  try {
    console.log('🔍 Buscando assinaturas ativas na Hotmart...');
    
    // Parâmetros para filtrar apenas assinaturas ativas
    const params = {
      'status': 'ACTIVE',
      'max_results': 100 // Limitar para evitar sobrecarga
    };
    
    // Buscar assinaturas ativas usando o serviço existente
    const subscriptions = await hotmartAPI.getSubscriptions(params);
    
    // Processar e formatar os dados para exibição
    if (!subscriptions || !subscriptions.items || !Array.isArray(subscriptions.items)) {
      console.log('❌ Nenhuma assinatura ativa encontrada ou formato de resposta inesperado.');
      return;
    }
    
    // Formatar as assinaturas para exibição
    const formattedSubscriptions = subscriptions.items.map(sub => {
      return {
        id: sub.id || 'N/A',
        plano: sub.plan?.name || 'Plano não especificado',
        status: sub.status || 'Status desconhecido',
        cliente: {
          nome: sub.subscriber?.name || 'Nome não disponível',
          email: sub.subscriber?.email || 'Email não disponível'
        },
        produto: {
          id: sub.product?.id || 'N/A',
          nome: sub.product?.name || 'Produto não especificado'
        },
        dataInicio: sub.accessionDate || 'Data não disponível',
        proximoPagamento: sub.nextChargeDate || 'Data não disponível',
        preco: {
          valor: sub.price?.value || 0,
          moeda: sub.price?.currency || 'BRL'
        }
      };
    });
    
    // Exibir os resultados
    console.log('✅ ASSINATURAS ATIVAS NA HOTMART');
    console.log('=================================');
    console.log(JSON.stringify(formattedSubscriptions, null, 2));
    console.log('---------------------------------');
    console.log(`Total: ${formattedSubscriptions.length} assinaturas ativas`);
    console.log('=================================');
    
  } catch (error) {
    console.error('❌ Erro ao buscar assinaturas ativas:', error.message);
    if (error.cause && error.cause.response) {
      console.error('Status:', error.cause.response.status);
      console.error('Detalhes:', error.cause.response.data);
    }
  }
}

// Executar a função principal
listarAssinaturasAtivas();