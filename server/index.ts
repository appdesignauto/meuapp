import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-data";
import { createAdminUser } from "./init-admin";
import { SubscriptionService } from "./services/subscription-service";
import { validateR2Environment } from "./env-check";
import { configureCors } from "./cors-config";

const app = express();

// Configurar CORS para o domínio customizado
configureCors(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para impedir caching de conteúdo dinâmico
app.use((req, res, next) => {
  // Aplicar headers anti-cache para rotas dinâmicas
  if (req.path.startsWith('/api') || 
      req.path.includes('/admin') ||
      req.path.includes('/comunidade') ||
      req.path.includes('/painel')) {
    // Headers para evitar cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    console.log(`Aplicando no-cache para rota: ${req.path}`);
  }
  next();
});

// Configuração para servir arquivos estáticos da pasta public
app.use(express.static(path.join(process.cwd(), 'public')));

// Configuração para servir arquivos de upload local (fallback quando Supabase falha)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
