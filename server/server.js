/**
 * Configuração do servidor dedicado para receber webhooks da Hotmart
 * 
 * Este arquivo implementa um servidor Express independente e focado,
 * garantindo que não haja interferência da plataforma Replit
 */

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurações do servidor
app.use(cors()); // Libera CORS para todos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificar e criar o diretório de logs se não existir
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Rota de verificação (healthcheck)
app.get("/", (req, res) => {
  res.json({ 
    status: "online", 
    message: "Servidor de webhooks da Hotmart", 
    time: new Date().toISOString() 
  });
});

// Rota principal para webhook da Hotmart
app.post("/api/webhook-hotmart", async (req, res) => {
  try {
    const payload = req.body;
    
    console.log("🔔 Webhook recebido da Hotmart:", JSON.stringify(payload, null, 2));

    // 🔒 Se quiser validar origem, você pode usar IPs ou campos do payload
    // if (req.headers['user-agent'] !== 'Hotmart') return res.sendStatus(403);

    // 💾 Salvar no log
    const logPath = path.join(logsDir, "webhook-log.json");
    fs.appendFileSync(logPath, JSON.stringify({ receivedAt: new Date(), payload }, null, 2) + ",\n");

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
});

// Centralizar uso de app.listen em um único lugar
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor de webhooks escutando na porta ${PORT}`);
  console.log(`🔗 Webhook da Hotmart disponível em: /api/webhook-hotmart`);
  console.log(`📊 Logs sendo salvos em: ${path.join(logsDir, "webhook-log.json")}`);
});

// Tratamento de erros não capturados
process.on("uncaughtException", (error) => {
  console.error("❌ Erro não capturado:", error);
  // Não encerra o processo para manter o servidor online
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Promise rejeitada sem tratamento:", reason);
  // Não encerra o processo para manter o servidor online
});