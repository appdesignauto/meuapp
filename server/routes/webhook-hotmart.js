const express = require("express");
const router = express.Router();
const SubscriptionService = require("../services/subscription-service");

router.post("/", async (req, res) => {
  try {
    console.log("Webhook da Hotmart recebido:", req.body);
    
    // Validação básica do webhook
    if (!req.body || !req.body.data || !req.body.event) {
      return res.status(400).json({ 
        success: false, 
        message: "Webhook inválido" 
      });
    }
    
    // Processar o webhook usando o serviço
    const result = await SubscriptionService.processHotmartWebhook(req.body);
    
    res.json({ 
      success: true, 
      message: "Webhook processado com sucesso", 
      result 
    });
  } catch (error) {
    console.error("Erro ao processar webhook da Hotmart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao processar webhook", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

module.exports = router;