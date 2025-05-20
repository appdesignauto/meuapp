const express = require('express');
const router = express.Router();
const { webhookRateLimiter, validateWebhookSignature } = require('../webhook-config');
const { db } = require('../db');

// Aplicar rate limiting
router.use(webhookRateLimiter);

router.post('/', async (req, res) => {
  try {
    console.log('📥 Webhook Hotmart recebido');

    // Validar assinatura
    const signature = req.headers['x-hotmart-signature'];
    if (!validateWebhookSignature(req.body, signature)) {
      console.error('❌ Assinatura inválida');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Registrar webhook
    await db.insert(db.webhookLogs).values({
      eventType: req.body.event || 'unknown',
      payload: JSON.stringify(req.body),
      status: 'received',
      source: 'hotmart',
      createdAt: new Date()
    });

    // Processar webhook
    // Adicione sua lógica de processamento aqui

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;