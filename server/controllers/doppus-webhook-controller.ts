/**
 * Controlador dedicado para o webhook da Doppus
 * 
 * Este controlador usa uma abordagem diferente para processar os webhooks da Doppus,
 * sem usar o middleware de análise de corpo do Express, evitando assim o erro
 * "stream is not readable".
 */

import * as http from 'http';
import { DoppusService } from '../services/doppus-service';
import { storage } from '../storage';

/**
 * Cria um servidor HTTP dedicado para processar webhooks da Doppus
 * Esta abordagem contorna o problema "stream is not readable" do Express
 * 
 * @param {number} port Porta para o servidor webhook (opcional, padrão 9000)
 * @returns {http.Server} Servidor HTTP
 */
function createDoppusWebhookServer(port = 9000) {
  const server = http.createServer(async (req, res) => {
    // Apenas processar requisições POST para o endpoint de webhook
    if (req.method !== 'POST' || req.url !== '/webhook') {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    
    // Responder imediatamente com 200 OK
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('OK');
    
    // Coletar o corpo da requisição
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    // Processar o webhook de forma assíncrona após receber todo o corpo
    req.on('end', async () => {
      try {
        const sourceIp = req.socket.remoteAddress || 'unknown';
        console.log("📦 Webhook Doppus recebido de IP:", sourceIp);
        
        // Tentar parsear o corpo JSON
        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
          console.log("📦 Webhook parseado com sucesso");
        } catch (e) {
          console.error("❌ Erro ao parsear webhook como JSON:", e);
          parsedBody = { _rawData: body };
        }
        
        // Adaptação para o formato de maio/2025 da Doppus
        if (parsedBody && 
            parsedBody.customer && 
            parsedBody.items && 
            Array.isArray(parsedBody.items) && 
            !parsedBody.data && 
            !parsedBody.event) {
          
          const originalBody = { ...parsedBody };
          parsedBody = {
            event: 'payment.approved',
            data: originalBody
          };
          console.log("✅ Detectado formato Doppus maio/2025, adaptado para processamento");
        }
        
        // Registar os cabeçalhos para diagnóstico
        const signature = req.headers['x-doppus-signature'];
        const eventType = req.headers['x-doppus-event'] || parsedBody?.event || 'unknown';
        
        // Extrair o ID da transação
        const transactionId = parsedBody?.data?.transaction?.code || 
                             parsedBody?.transaction?.code || 
                             parsedBody?.data?.code || 
                             parsedBody?.id || 
                             null;
        
        // Registrar o webhook no banco
        let webhookLog;
        try {
          webhookLog = await storage.createWebhookLog({
            eventType: parsedBody?.event || eventType,
            payloadData: JSON.stringify(parsedBody),
            status: 'received',
            source: 'doppus',
            errorMessage: null,
            sourceIp,
            transactionId
          });
          console.log("✅ Log de webhook registrado com ID:", webhookLog.id);
        } catch (dbError) {
          console.error("❌ Erro ao registrar log de webhook:", dbError);
        }
        
        // Validar assinatura se fornecida
        if (signature) {
          try {
            const payloadString = JSON.stringify(parsedBody);
            const isValid = await DoppusService.validateWebhookSignature(signature, payloadString);
            
            if (!isValid) {
              console.error("⚠️ Assinatura webhook Doppus inválida");
              if (webhookLog) {
                await storage.updateWebhookLog(webhookLog.id, {
                  status: 'error',
                  errorMessage: "Assinatura inválida"
                });
              }
              return;
            }
          } catch (error) {
            console.error("❌ Erro ao validar assinatura:", error);
            if (webhookLog) {
              await storage.updateWebhookLog(webhookLog.id, {
                status: 'error',
                errorMessage: `Erro na validação: ${error instanceof Error ? error.message : String(error)}`
              });
            }
            return;
          }
        }
        
        // Processar o webhook
        try {
          const result = await DoppusService.processWebhook(parsedBody);
          
          // Atualizar o log com sucesso
          if (webhookLog) {
            await storage.updateWebhookLog(webhookLog.id, {
              status: 'processed',
              processingResult: JSON.stringify(result)
            });
          }
          
          console.log("✅ Webhook processado com sucesso:", result);
        } catch (processingError) {
          console.error("❌ Erro ao processar webhook:", processingError);
          
          if (webhookLog) {
            await storage.updateWebhookLog(webhookLog.id, {
              status: 'error',
              errorMessage: processingError instanceof Error ? processingError.message : String(processingError)
            });
          }
        }
      } catch (error) {
        console.error("❌ ERRO CRÍTICO no processamento do webhook:", error);
      }
    });
  });
  
  // Iniciar o servidor na porta especificada
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor dedicado para webhooks da Doppus iniciado na porta ${port}`);
  });
  
  return server;
}

export { createDoppusWebhookServer };