import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-data";
import { createAdminUser } from "./init-admin";
import { SubscriptionService } from "./services/subscription-service";
import { validateR2Environment } from "./env-check";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuração para servir arquivos estáticos da pasta public
app.use(express.static(path.join(process.cwd(), 'public')));

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

// Configurar CORS para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
  });
}

async function startServer() {
  try {
    // Verificar configuração de ambiente (migrado para Supabase Storage)
    validateR2Environment();
    
    // Inicializar banco de dados
    await initializeDatabase();
    console.log('✅ Banco de dados inicializado');
    
    // Criar usuário admin se necessário
    await createAdminUser();
    
    // Registrar rotas
    const server = await registerRoutes(app);
    
    // Configurar porta
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Ouvir em todas as interfaces
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando em http://0.0.0.0:${port}`);
    });

    return server;
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
