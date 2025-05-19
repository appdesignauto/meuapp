/**
 * Rota para testar conectividade com a API da Hotmart
 */
import { Router } from 'express';
import axios from 'axios';
// @ts-ignore
import hotmartAPI from '../services/hotmart-api';

const router = Router();

// Middleware para verificar se o usuário é admin
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && (req.user.role === 'admin' || req.user.nivelacesso === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Acesso negado. É necessário ser administrador para acessar este recurso."
    });
  }
};

// Rota para testar conexão com a API da Hotmart
router.get('/test-connection', async (req, res) => {
  try {
    console.log("🧪 Iniciando teste de conexão com a API da Hotmart");
    
    // Usar o método de verificação de conectividade do cliente da API
    const connectionResult = await hotmartAPI.checkConnectivity();
    
    if (!connectionResult.success) {
      console.error("❌ Falha ao verificar conectividade com a API da Hotmart:", connectionResult.message);
      return res.status(400).json({
        success: false,
        message: "Falha ao conectar com a API da Hotmart",
        details: connectionResult.error || connectionResult.message
      });
    }
    
    // Se a conexão básica foi bem-sucedida, tentar uma chamada real à API
    try {
      // Obter a URL base correta (produção ou sandbox)
      const isSandbox = process.env.HOTMART_SANDBOX_MODE === 'true';
      const environmentName = isSandbox ? 'Sandbox' : 'Produção';
      
      // Tentar obter lista de produtos para verificar se a API está retornando dados
      const productData = await hotmartAPI.getProducts();
      
      console.log("✅ Conexão com a API da Hotmart bem-sucedida");
      return res.json({
        success: true,
        message: "Conexão com a API da Hotmart estabelecida com sucesso",
        environment: environmentName,
        timestamp: new Date().toISOString(),
        data: {
          // Retornamos apenas metadados da resposta, não os dados completos por segurança
          dataAvailable: productData && Array.isArray(productData.items),
          itemsCount: productData && Array.isArray(productData.items) ? productData.items.length : 0
        }
      });
    } catch (apiError: any) {
      console.error("⚠️ Autenticação bem-sucedida, mas falha ao acessar dados:", apiError);
      
      // Mesmo que não consiga obter dados, a autenticação funcionou
      return res.json({
        success: true,
        message: "Conexão autenticada com sucesso, mas não foi possível acessar dados",
        environment: process.env.HOTMART_SANDBOX_MODE === 'true' ? 'Sandbox' : 'Produção',
        timestamp: new Date().toISOString(),
        warning: apiError?.message || 'Erro desconhecido'
      });
    }
  } catch (error: any) {
    console.error("❌ Erro no teste de conexão com a API da Hotmart:", error);
    
    // Determinando o tipo de erro e formatando para retorno
    let errorMessage = "Erro desconhecido ao conectar com a API da Hotmart";
    let errorDetails = null;
    
    if (axios.isAxiosError(error)) {
      errorMessage = "Erro na comunicação com a API da Hotmart";
      
      if (error.response) {
        // Requisição foi feita e o servidor respondeu com status de erro
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      } else if (error.request) {
        // Requisição foi feita mas não houve resposta
        errorDetails = {
          message: "Sem resposta da API da Hotmart",
          request: {
            method: error.config?.method,
            url: error.config?.url
          }
        };
      } else {
        // Erro na configuração da requisição
        errorDetails = {
          message: error.message
        };
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      environment: process.env.HOTMART_SANDBOX_MODE === 'true' ? 'Sandbox' : 'Produção'
    });
  }
});

// Rota para listar assinaturas ativas da Hotmart
router.get('/active-subscriptions', async (req, res) => {
  try {
    console.log("🔍 Buscando assinaturas ativas na Hotmart");
    
    try {
      // Verificar se o token de acesso está disponível
      await hotmartAPI.getAccessToken();
      
      // Buscar assinaturas ativas
      // Parâmetros para filtrar apenas assinaturas ativas
      const params = {
        'status': 'ACTIVE',
        'max_results': 100 // Limitar para evitar sobrecarga
      };
      
      const subscriptions = await hotmartAPI.getSubscriptions(params);
      
      // Processar e formatar os dados para a resposta
      let formattedSubscriptions = [];
      
      if (subscriptions && subscriptions.items && Array.isArray(subscriptions.items)) {
        formattedSubscriptions = subscriptions.items.map((sub: any) => {
          return {
            id: sub.id || 'N/A',
            plan: sub.plan?.name || 'Plano não especificado',
            status: sub.status || 'Status desconhecido',
            customer: {
              name: sub.subscriber?.name || 'Nome não disponível',
              email: sub.subscriber?.email || 'Email não disponível'
            },
            product: {
              id: sub.product?.id || 'N/A',
              name: sub.product?.name || 'Produto não especificado'
            },
            startDate: sub.accessionDate || 'Data não disponível',
            nextPayment: sub.nextChargeDate || 'Data não disponível',
            price: {
              value: sub.price?.value || 0,
              currency: sub.price?.currency || 'BRL'
            }
          };
        });
      }
      
      return res.json({
        success: true,
        environment: process.env.HOTMART_SANDBOX_MODE === 'true' ? 'Sandbox' : 'Produção',
        timestamp: new Date().toISOString(),
        totalCount: formattedSubscriptions.length,
        subscriptions: formattedSubscriptions
      });
    } catch (apiError: any) {
      console.error("⚠️ Erro ao obter assinaturas:", apiError);
      
      return res.status(400).json({
        success: false,
        message: "Não foi possível obter as assinaturas ativas da Hotmart",
        error: apiError?.message || 'Erro desconhecido',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error("❌ Erro ao buscar assinaturas ativas:", error);
    
    return res.status(500).json({
      success: false,
      message: "Erro interno ao buscar assinaturas ativas",
      error: error?.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;