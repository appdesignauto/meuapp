const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota home para verificação
app.get("/", (req, res) => {
  res.send(`
    <h1>Webhook da Hotmart</h1>
    <p>Status: Online</p>
    <p>Endpoint: /api/webhook-hotmart</p>
    <p>Data: ${new Date().toISOString()}</p>
  `);
});

// Rota principal do webhook
app.post("/api/webhook-hotmart", (req, res) => {
  console.log("🔔 Webhook recebido:", req.body);
  
  // Garantir que o arquivo exista
  if (!fs.existsSync("webhook-logs.json")) {
    fs.writeFileSync("webhook-logs.json", "[\n", "utf8");
  }
  
  // Criar entrada de log
  const logEntry = {
    receivedAt: new Date().toISOString(),
    data: req.body
  };
  
  // Adicionar ao log
  const fileContent = fs.readFileSync("webhook-logs.json", "utf8");
  const appendData = fileContent.trim() === "[" 
    ? JSON.stringify(logEntry, null, 2) 
    : ",\n" + JSON.stringify(logEntry, null, 2);
  
  fs.appendFileSync("webhook-logs.json", appendData);
  
  // Sempre retornar 200 para Hotmart
  res.sendStatus(200);
});

// Iniciar o servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor webhook da Hotmart rodando na porta ${PORT}`);
});
