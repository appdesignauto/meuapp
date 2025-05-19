/**
 * Manipulador de webhooks da Hotmart
 * 
 * Este arquivo contém a função que processa os webhooks recebidos da Hotmart
 */

const fs = require("fs");
const path = require("path");

/**
 * Processa os webhooks recebidos da Hotmart
 * @param {import('express').Request} req - Requisição Express
 * @param {import('express').Response} res - Resposta Express
 */
async function processHotmartWebhook(req, res) {
  try {
    const payload = req.body;
    
    console.log("🔔 Webhook recebido da Hotmart:", JSON.stringify(payload, null, 2));

    // 🔒 Se quiser validar origem, você pode usar IPs ou campos do payload
    // if (req.headers['user-agent'] !== 'Hotmart') return res.sendStatus(403);

    // 💾 Salvar no log
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logPath = path.join(logsDir, "webhook-log.json");
    fs.appendFileSync(logPath, JSON.stringify({ receivedAt: new Date(), payload }, null, 2) + ",\n");

    // 🧠 Processamento baseado no tipo de evento
    const type = payload?.event;
    const email = payload?.data?.buyer?.email || payload?.buyer?.email;

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