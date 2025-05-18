import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-data";
import { createAdminUser } from "./init-admin";
import { SubscriptionService } from "./services/subscription-service";
import { validateR2Environment } from "./env-check";
import { configureCors } from "./cors-config";
// Removemos a dependência do arquivo webhook-routes-setup.js
// e implementamos as rotas diretamente nesse arquivo

const app = express();

// Configurar CORS para o domínio customizado
configureCors(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuração para servir arquivos estáticos da pasta public
app.use(express.static(path.join(process.cwd(), 'public')));

// Configuração para servir arquivos de upload local (fallback quando Supabase falha)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middleware para adicionar cabeçalhos de cache-control apropriados
app.use((req, res, next) => {
  // Gerar timestamp único para forçar revalidação
  const uniqueTimestamp = Date.now().toString();
  
  // Para recursos estáticos e assets, permitir cache
  if (
    req.path.match(/\.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)
  ) {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 dias
  } 
  // Para TODAS as rotas, não permitir cache de forma alguma
  else {
    // Cabeçalhos extremamente agressivos contra cache para todas as rotas
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Vary', '*');
    res.setHeader('X-No-Cache', uniqueTimestamp);
    res.setHeader('ETag', uniqueTimestamp);
  }
  
  // Adicionar cabeçalho de timestamp em todas as respostas para prevenir cache
  res.setHeader('X-Timestamp', Date.now().toString());
  
  // Estender o objeto response com método personalizado para desativar cache
  // @ts-ignore - Adicionando método personalizado
  res.disableCache = function() {
    this.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    this.setHeader('Pragma', 'no-cache');
    this.setHeader('Expires', '-1');
    this.setHeader('Surrogate-Control', 'no-store');
    this.setHeader('Vary', '*');
    this.setHeader('X-No-Cache', Date.now().toString());
    return this;
  };
  
  next();
});

// Redirecionar HTTP para HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Verificar se estamos no domínio designauto.com.br e se a conexão não é HTTPS
    if (
      req.hostname && 
      req.hostname.includes('designauto.com.br') && 
      !req.secure && 
      req.headers['x-forwarded-proto'] !== 'https'
    ) {
      // Redirecionar para HTTPS
      return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
    next();
  });
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Verificar configuração de ambiente (migrado para Supabase Storage)
    validateR2Environment();
    
    // Inicializar o banco de dados com dados
    await initializeDatabase();
    console.log("Banco de dados inicializado com sucesso");
    
    // Criar usuário administrador
    await createAdminUser();
    
    // Configurar verificação diária de assinaturas expiradas (executar a cada 12 horas)
    const VERIFICAR_ASSINATURAS_INTERVALO = 12 * 60 * 60 * 1000; // 12 horas em milissegundos
    
    // Iniciar verificador de assinaturas expiradas
    setInterval(async () => {
      try {
        console.log("Verificando assinaturas expiradas...");
        const downgradedCount = await SubscriptionService.checkExpiredSubscriptions();
        console.log(`Verificação concluída: ${downgradedCount} usuários rebaixados para free`);
      } catch (error) {
        console.error("Erro ao verificar assinaturas expiradas:", error);
      }
    }, VERIFICAR_ASSINATURAS_INTERVALO);
    
    // Executar verificação inicial na inicialização do servidor
    console.log("Executando verificação inicial de assinaturas expiradas...");
    const initialDowngradedCount = await SubscriptionService.checkExpiredSubscriptions();
    console.log(`Verificação inicial concluída: ${initialDowngradedCount} usuários rebaixados para free`);
    
    // IMPORTANTE: Configurar rotas de webhook ANTES de qualquer fallback para o SPA
    // Isso garante que webhooks da Hotmart e Doppus sejam processados corretamente
    console.log("Configurando rotas de webhook dedicadas...");
    
    // Middleware de logging para Debug dos webhooks
    app.use('/webhook', (req, res, next) => {
      console.log(`📝 [DEBUG WEBHOOK] ${req.method} ${req.url} - Headers:`, JSON.stringify(req.headers, null, 2));
      if (req.method === 'POST') {
        console.log(`📝 [DEBUG WEBHOOK] Body:`, JSON.stringify(req.body, null, 2));
      }
      
      // Salvar o método original
      const originalJson = res.json;
      
      // Sobrescrever o método para fazer log
      res.json = function(body) {
        console.log(`📝 [DEBUG WEBHOOK] Response:`, JSON.stringify(body, null, 2));
        return originalJson.call(this, body);
      };
      
      next();
    });
    
    // Configurando webhook da Hotmart diretamente no index.ts usando processador unificado
    app.post('/webhook/hotmart', async (req, res) => {
      try {
        console.log('⚡ Webhook da Hotmart recebido no caminho /webhook/hotmart');
        
        // Importar o processador unificado de webhooks
        try {
          const { processHotmartWebhook } = await import('./unifiedHotmartWebhook');
          return await processHotmartWebhook(req, res);
        } catch (importError) {
          console.error('❌ Erro ao importar processador unificado:', importError);
          
          // Continuar com a implementação anterior como fallback
          let email = null;
          if (req.body?.data?.buyer?.email) {
            email = req.body.data.buyer.email;
          } else if (req.body?.buyer?.email) {
            email = req.body.buyer.email;
          } else if (req.body?.data?.subscriber?.email) {
            email = req.body.data.subscriber.email;
          } else if (req.body?.subscriber?.email) {
            email = req.body.subscriber.email;
          }
          
          let transactionId = null;
          if (req.body?.data?.purchase?.transaction) {
            transactionId = req.body.data.purchase.transaction;
          } else if (req.body?.data?.subscription?.code) {
            transactionId = req.body.data.subscription.code;
          } else if (req.body?.purchase?.transaction) {
            transactionId = req.body.purchase.transaction;
          }
          
          const eventType = req.body?.event || 'UNKNOWN';
          
          // Salvar webhook diretamente no banco usando SQL
          let webhookLogId = null;
          try {
            // Usando o módulo pg diretamente para evitar problemas com importações
            const { Client } = require('pg');
            const client = new Client({
              connectionString: process.env.DATABASE_URL
            });
            
            await client.connect();
            
            // Log detalhado do webhook para diagnóstico
            console.log('📊 [DIAGNÓSTICO WEBHOOK HOTMART]');
            console.log('- ID do evento:', req.body?.id || 'não encontrado');
            console.log('- Tipo de evento:', eventType);
            console.log('- Email do comprador:', email);
            console.log('- ID da transação:', transactionId);
            console.log('- Data de recebimento:', new Date().toISOString());
            console.log('- Status do processamento: em andamento');
            
            console.log('📝 Salvando webhook no banco via SQL direto:', { 
              eventType, 
              email, 
              transactionId
            });
            
            // Usar SQL direto para garantir compatibilidade
            const query = `
              INSERT INTO "webhookLogs" 
              ("eventType", "payloadData", "status", "source", "sourceIp", "transactionId", "email", "errorMessage", "createdAt", "updatedAt") 
              VALUES 
              ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
              RETURNING id;
            `;
            
            // Certifique-se de que sourceIp seja uma string, não um array
            const sourceIp = typeof req.ip === 'string' ? 
                           req.ip : 
                           (typeof req.headers['x-forwarded-for'] === 'string' ? 
                            req.headers['x-forwarded-for'] : 'unknown');
                            
            const values = [
              eventType,
              JSON.stringify(req.body),
              'processing', // Mudamos para 'processing' enquanto processamos
              'hotmart',
              sourceIp,
              transactionId,
              email,
              null
            ];
            
            const result = await client.query(query, values);
            webhookLogId = result.rows[0].id;
            console.log('✅ Log de webhook criado com sucesso via SQL direto:', webhookLogId);
            
            await client.end();
          } catch (logError) {
            console.error('❌ Erro ao criar log de webhook:', logError);
            console.error('Detalhes do erro:', logError);
          }
          
          // Processar o webhook usando o SubscriptionService
          let processResult = null;
          try {
            const { SubscriptionService } = await import('./services/subscription-service');
            processResult = await SubscriptionService.processHotmartWebhook(req.body);
            console.log('✅ Webhook processado com sucesso:', processResult);
            
            // Atualizar o status do log para sucesso
            if (webhookLogId) {
              const { Client } = require('pg');
              const client = new Client({
                connectionString: process.env.DATABASE_URL
              });
              
              await client.connect();
              
              await client.query(
                `UPDATE "webhookLogs" SET status = 'success', "updatedAt" = NOW() WHERE id = $1`,
                [webhookLogId]
              );
              
              console.log(`Status do webhook ${webhookLogId} atualizado para success`);
              
              await client.end();
            }
          } catch (processError) {
            console.error('❌ Erro ao processar webhook via SubscriptionService:', processError);
            
            // Atualizar o status do log para erro
            if (webhookLogId) {
              try {
                const { Client } = require('pg');
                const client = new Client({
                  connectionString: process.env.DATABASE_URL
                });
                
                await client.connect();
                
                await client.query(
                  `UPDATE "webhookLogs" SET status = 'error', "errorMessage" = $1, "updatedAt" = NOW() WHERE id = $2`,
                  [processError.message || 'Erro desconhecido', webhookLogId]
                );
                
                console.log(`Status do webhook ${webhookLogId} atualizado para error`);
                
                await client.end();
              } catch (updateError) {
                console.error('❌ Erro ao atualizar status do log de webhook:', updateError);
              }
            }
          }
          
          // Retornar 200 para confirmar recebimento do webhook
          return res.status(200).json({
            success: true,
            message: 'Webhook processado com sucesso',
            result: processResult,
            webhookLogId
          });
        }
      } catch (error) {
        console.error('❌ Erro ao processar webhook da Hotmart:', error);
        
        // Retornar 200 mesmo em caso de erro para evitar retentativas
        return res.status(200).json({
          success: false,
          message: 'Erro ao processar webhook, mas confirmando recebimento'
        });
      }
    });
    
    // Rota de diagnóstico para verificação básica de webhooks
    app.get('/webhook/status', (req, res) => {
      res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        routes: [
          { path: '/webhook/hotmart', status: 'configured' }
        ],
        message: 'Os webhooks estão configurados e funcionando. Use o painel de Admin para diagnósticos avançados.'
      });
    });
    
    console.log("Rotas de webhook configuradas com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
