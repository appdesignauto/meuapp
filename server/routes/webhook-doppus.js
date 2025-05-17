const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  try {
    const body = req.body;

    // Verificação mínima
    if (!body || !body.customer || !body.items) {
      console.error("❌ Webhook malformado da Doppus");
      return res.status(400).json({ error: "Invalid payload" });
    }

    // ✅ Sucesso no recebimento
    console.log("✅ Webhook Doppus recebido com sucesso:");
    console.log(JSON.stringify(body, null, 2));

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("❌ Erro no webhook da Doppus:", err.message);
    res.status(500).json({ error: "Erro interno ao processar webhook" });
  }
});

module.exports = router;