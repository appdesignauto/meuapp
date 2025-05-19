import { Router } from 'express';
import axios from 'axios';
import type { Request, Response } from 'express';

const router = Router();

// Rota para testar as credenciais da Hotmart
router.post('/test-hotmart-credentials', async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret } = req.body;
    
    // Usar credenciais do request ou fallback para variáveis de ambiente
    const hotmartClientId = clientId || process.env.HOTMART_CLIENT_ID;
    const hotmartClientSecret = clientSecret || process.env.HOTMART_CLIENT_SECRET;
    
    if (!hotmartClientId || !hotmartClientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais não fornecidas.'
      });
    }
    
    // Preparar parâmetros para obter token Hotmart
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', hotmartClientId);
    params.append('client_secret', hotmartClientSecret);
    
    // Fazer requisição para a API da Hotmart
    const response = await axios.post(
      'https://api-sec-vlc.hotmart.com/security/oauth/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Se chegou aqui, deu certo
    return res.status(200).json({
      success: true,
      message: '✅ Credenciais válidas.',
      token_type: response.data.token_type,
      expires_in: response.data.expires_in
    });
  } catch (error: any) {
    console.error('Erro ao testar credenciais Hotmart:', error);
    
    // Verificar se é um erro de resposta da API
    if (error.response) {
      const errorMessage = error.response.data.error_description || 
                          error.response.data.error ||
                          'Erro ao validar credenciais.';
      
      return res.status(400).json({
        success: false,
        message: `❌ ${errorMessage}`
      });
    }
    
    // Erro genérico (rede, timeout, etc)
    return res.status(500).json({
      success: false,
      message: `❌ Erro de conexão: ${error.message || 'Erro desconhecido'}`
    });
  }
});

export default router;