const express = require("express");
const fs = require("fs");
const cors = require("cors");

// Função para lidar com um webhook da Hotmart
async function processHotmartWebhook(req, res) {
  try {
    // Log do recebimento do webhook com timestamp
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Webhook da Hotmart recebido`);

    // Em desenvolvimento, log do payload completo
    if (process.env.NODE_ENV !== 'production') {
      console.log("Dados do webhook:", JSON.stringify(req.body, null, 2));
    }

    // Validação básica
    if (!req.body || !req.body.event) {
      console.error(`Webhook inválido, estrutura ou campos obrigatórios ausentes`);
      return res.status(200).json({
        success: false,
        message: "Webhook inválido, campos obrigatórios ausentes"
      });
    }

    // Identificar o tipo de evento recebido
    const event = req.body.event;
    console.log(`Evento recebido: ${event}`);

    // Salvar webhook para auditoria (opcional, em produção usar banco de dados)
    const logsDir = './logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Gerar nome de arquivo único baseado em timestamp
    const filename = `${logsDir}/hotmart-webhook-${Date.now()}.json`;
    
    // Salvar payload para análise posterior (em produção, considere usar um banco de dados)
    fs.writeFileSync(filename, JSON.stringify(req.body, null, 2));

    // Responder com sucesso (conforme documentação da Hotmart)
    // A resposta 200 indica que o webhook foi recebido com sucesso
    return res.status(200).json({
      success: true,
      event: event,
      message: "Webhook recebido com sucesso"
    });

  } catch (error) {
    console.error("Erro ao processar webhook da Hotmart:", error);
    
    // Mesmo em caso de erro, retornar 200 para confirmar recebimento
    // A Hotmart considera que o webhook foi entregue se receber 200
    return res.status(200).json({
      success: false,
      message: "Erro ao processar webhook, mas foi recebido"
    });
  }
}

module.exports = { processHotmartWebhook };