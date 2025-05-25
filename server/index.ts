import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-data";
import { createAdminUser } from "./init-admin";
import { SubscriptionService } from "./services/subscription-service";
import { validateR2Environment } from "./env-check";
import adminRoutes from "./routes/admin";
import cors from 'cors';

(async () => {
  const app = express();
  
  // Aplicar CORS básico
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Hotmart-Signature']
  }));
  
  // Parse JSON bodies
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  try {
    // Inicializar banco de dados
    await initializeDatabase();
    
    // Criar usuário administrador
    await createAdminUser();
    
    // Registrar rotas de administração
    app.use('/api', adminRoutes);
    
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
    
    // CONFIGURAR APENAS O ENDPOINT /webhook/hotmart-fixed conforme especificação
    console.log("🔧 Configurando integração Hotmart...");
    
    // Middleware de logging para webhooks
    app.use('/webhook', (req, res, next) => {
      console.log(`📝 [WEBHOOK] ${req.method} ${req.url}`);
      if (req.method === 'POST') {
        console.log(`📝 [WEBHOOK] Payload recebido:`, JSON.stringify(req.body, null, 2));
      }
      next();
    });
    
    // Configurar APENAS o endpoint /webhook/hotmart-fixed conforme especificação
    try {
      const hotmartFixedModule = await import('./routes/webhook-hotmart-fixed');
      app.use('/webhook', hotmartFixedModule.default);
      console.log("✅ Endpoint /webhook/hotmart-fixed configurado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar endpoint webhook Hotmart:", error);
    }
    
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