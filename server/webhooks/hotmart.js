const fs = require("fs");

// Função para lidar com um webhook da Hotmart
async function processHotmartWebhook(req, res) {
  try {
    const payload = req.body;

    console.log("🔔 Webhook recebido da Hotmart:", payload);

    // 🔒 Se quiser validar origem, você pode usar IPs ou campos do payload
    // if (req.headers['user-agent'] !== 'Hotmart') return res.sendStatus(403);

    // 💾 Salvar no log
    if (!fs.existsSync("./logs")) {
      fs.mkdirSync("./logs", { recursive: true });
    }
    fs.appendFileSync("./logs/webhook-log.json", JSON.stringify({ receivedAt: new Date(), payload }, null, 2) + ",\n");

    // 🧠 Processamento baseado no tipo de evento
    const type = payload?.event;
    const email = payload?.data?.buyer?.email;

    switch (type) {
      case "PURCHASE_APPROVED":
      case "SUBSCRIPTION_ACTIVATED":
        console.log(`✅ Assinatura ativada para: ${email}`);
        // Criar ou ativar assinatura
        break;
      case "SUBSCRIPTION_CANCELLED":
      case "PURCHASE_CANCELED":
      case "PURCHASE_REFUNDED":
      case "SUBSCRIPTION_EXPIRED":
        console.log(`❌ Assinatura cancelada para: ${email}`);
        // Cancelar ou rebaixar assinatura
        break;
      default:
        console.log("⚠️ Evento não reconhecido:", type);
    }

    res.sendStatus(200); // Sempre responder OK
  } catch (error) {
    console.error("⚠️ Erro ao processar webhook:", error);
    
    // Mesmo em caso de erro, responder com 200
    // A Hotmart espera 200 para confirmar recebimento do webhook
    res.sendStatus(200);
  }
}

module.exports = { processHotmartWebhook };