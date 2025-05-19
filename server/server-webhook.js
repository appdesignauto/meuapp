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
import { processHotmartWebhook } from "./webhooks/hotmart-webhook.js";

const app = express();

// Configurações do servidor
app.use(cors()); // Libera CORS para todos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificar e criar o diretório de logs se não existir
const logsDir = path.join(process.cwd(), "logs");
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
app.post("/api/webhook-hotmart", processHotmartWebhook);

// Centralizar uso de app.listen em um único lugar
const PORT = process.env.PORT || 3000;

// IMPORTANTE: Usar apenas um único app.listen para evitar conflitos no Replit
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