import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.post('/test-hotmart-credentials', async (req: Request, res: Response) => {
  try {
    // Obter as credenciais do corpo da requisição ou usar as variáveis de ambiente
    const clientId = req.body.clientId || process.env.HOTMART_CLIENT_ID;
    const clientSecret = req.body.clientSecret || process.env.HOTMART_CLIENT_SECRET;

    // Validar se as credenciais foram fornecidas
    if (!clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Cliente ID e Cliente Secret são obrigatórios. Forneça-os no corpo da requisição ou configure-os nas variáveis de ambiente.'
      });
    }

    // Construir os parâmetros da requisição para a API da Hotmart (autenticação OAuth2)
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    // Tentar autenticar com a API da Hotmart
    const response = await axios.post('https://api-sec-vlc.hotmart.com/security/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Se não ocorrer nenhum erro e receber o access_token, as credenciais são válidas
    if (response.data && response.data.access_token) {
      return res.status(200).json({
        success: true,
        message: 'Credenciais da Hotmart validadas com sucesso.',
        tokenInfo: {
          expiraEm: response.data.expires_in,
          tipo: response.data.token_type
        }
      });
    } else {
      // Se não receber um access_token mas a requisição não falhou, algo estranho aconteceu
      return res.status(400).json({
        success: false,
        message: 'Resposta inesperada da API da Hotmart. Verifique suas credenciais.'
      });
    }
  } catch (error) {
    console.error('Erro ao testar credenciais da Hotmart:', error);
    
    // Verificar se é um erro do Axios para tratamento personalizado
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      
      if (statusCode === 401 || statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: 'Credenciais inválidas. Verifique seu Client ID e Client Secret da Hotmart.',
          details: responseData
        });
      }
      
      return res.status(500).json({
        success: false,
        message: `Erro na comunicação com a API da Hotmart: ${error.message}`,
        status: statusCode
      });
    }
    
    // Erro genérico
    return res.status(500).json({
      success: false,
      message: `Erro ao testar credenciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    });
  }
});

export default router;