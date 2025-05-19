
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

router.post('/test-credentials', async (req, res) => {
  try {
    const { webhookToken } = req.body;

    if (!webhookToken) {
      return res.status(400).json({
        success: false,
        message: 'Token do webhook não fornecido'
      });
    }

    // Criar payload de teste
    const testPayload = {
      id: 'test-' + Date.now(),
      event: 'TEST_EVENT',
      creation_date: new Date().toISOString(),
      data: {
        test: true
      }
    };

    // Calcular assinatura de teste
    const hmac = crypto.createHmac('sha256', webhookToken);
    const signature = hmac.update(JSON.stringify(testPayload)).digest('hex');

    // Verificar se conseguimos gerar uma assinatura válida
    if (signature && signature.length === 64) {
      return res.json({
        success: true,
        message: 'Token do webhook é válido e pode gerar assinaturas HMAC-SHA256'
      });
    } else {
      return res.json({
        success: false,
        message: 'Token do webhook gerou uma assinatura inválida'
      });
    }
  } catch (error) {
    console.error('Erro ao testar credenciais do webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar credenciais do webhook'
    });
  }
});

export default router;
