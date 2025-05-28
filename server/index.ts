import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-data";
import { createAdminUser } from "./init-admin";
import { SubscriptionService } from "./services/subscription-service";
import { validateR2Environment } from "./env-check";
import { configureCors } from "./cors-config";
import adminRoutes from "./routes/admin";
import webhookHotmartFixedRoutes from "./routes/webhook-hotmart-fixed";

import { Pool } from "pg";

const app = express();

// Configurar CORS para o domínio customizado
configureCors(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuração para servir arquivos estáticos da pasta public
app.use(express.static(path.join(process.cwd(), 'public')));

// Configuração para servir arquivos de upload local (fallback quando Supabase falha)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 🚀 ENDPOINT DIRETO PARA DADOS DE ASSINATURAS - ANTES DO MIDDLEWARE SPA
app.get("/api/subscription-data", async (req, res) => {
  console.log("🚀 ENDPOINT DIRETO: Buscando dados de assinaturas...");
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        id, username, email, name, nivelacesso, 
        tipoplano, dataassinatura, dataexpiracao, origemassinatura, criadoem, isactive
      FROM users 
      WHERE isactive = true
      ORDER BY criadoem DESC
    `);
    
    await client.end();
    
    console.log(`🚀 ENDPOINT DIRETO - Encontrados: ${result.rows.length} usuários`);
    result.rows.forEach((user: any, index: any) => {
      console.log(`${index + 1}. ${user.email} (${user.nivelacesso})`);
    });
    
    // Calcular métricas reais
    const total = result.rows.length;
    const premium = result.rows.filter((user: any) => 
      ['designer', 'designer_adm', 'admin'].includes(user.nivelacesso)
    ).length;
    const conversion = ((premium / total) * 100).toFixed(1);
    
    const response = {
      success: true,
      users: result.rows,
      overview: {
        totalUsers: total,
        premiumUsers: premium,
        freeUsers: total - premium,
        conversionRate: `${conversion}%`
      },
      pagination: {
        total: result.rows.length,
        page: 1,
        limit: 50,
        totalPages: 1
      }
    };
    
    return res.status(200).json(response);
    
  } catch (error: any) {
    console.error("❌ ENDPOINT DIRETO - Erro:", error.message);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      users: [],
      overview: {
        totalUsers: 0,
        premiumUsers: 0,
        freeUsers: 0,
        conversionRate: '0%'
      },
      pagination: { total: 0, page: 1, limit: 50, totalPages: 0 }
    });
  }
});

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
    
    
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(allUsers);
        console.log('✅ Dados enviados como array direto');
      } catch (error) {
        console.error('❌ Erro no endpoint fixo:', error);
        res.status(500).json({ error: 'Erro interno' });
      }
    });

    // Registrar rotas de administração
    app.use('/api', adminRoutes);
    
    // 🚀 REGISTRAR WEBHOOK HOTMART AUTOMÁTICO - SISTEMA COMPLETO
    app.use('/webhook', webhookHotmartFixedRoutes);
    console.log('✅ Sistema de webhook Hotmart automático configurado com sucesso!');
    
    // Configurar verificação diária de assinaturas expiradas (executar a cada 24 horas)
    const VERIFICAR_ASSINATURAS_INTERVALO = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    
    // Iniciar verificador de assinaturas expiradas
    setInterval(async () => {
      try {
        const agora = new Date().toLocaleString('pt-BR');
        console.log(`🔄 [${agora}] Iniciando verificação automática de assinaturas expiradas (24h)...`);
        const downgradedCount = await SubscriptionService.checkExpiredSubscriptions();
        console.log(`✅ [${agora}] Verificação automática concluída: ${downgradedCount} usuários rebaixados para free`);
      } catch (error) {
        console.error(`❌ [${new Date().toLocaleString('pt-BR')}] Erro na verificação automática:`, error);
      }
    }, VERIFICAR_ASSINATURAS_INTERVALO);
    
    // Executar verificação inicial na inicialização do servidor
    console.log("🔄 Executando verificação inicial de assinaturas expiradas...");
    const initialDowngradedCount = await SubscriptionService.checkExpiredSubscriptions();
    console.log(`✅ Verificação inicial concluída: ${initialDowngradedCount} usuários rebaixados para free`);
    
    // Informar quando será a próxima verificação
    const proximaVerificacao = new Date(Date.now() + VERIFICAR_ASSINATURAS_INTERVALO);
    console.log(`⏰ Próxima verificação automática: ${proximaVerificacao.toLocaleString('pt-BR')} (em 24 horas)`);
    
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
    
    // Rota dedicada para webhook da Hotmart - implementação direta para garantir resposta JSON
    app.post('/webhook/hotmart', async (req, res) => {
      console.log('📩 Webhook da Hotmart recebido em', new Date().toISOString());
      
      try {
        // Capturar dados básicos do webhook
        const payload = req.body;
        const event = payload?.event || 'UNKNOWN';
        const email = null;
        const transactionId = null;
        
        // Registrar no banco de dados (log only)
        try {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          await pool.query(
            `INSERT INTO webhook_logs 
             (event_type, status, email, source, raw_payload, transaction_id, source_ip, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              event,
              'received',
              email,
              'hotmart',
              JSON.stringify(payload),
              transactionId,
              req.ip,
              new Date()
            ]
          );
          
          await pool.end();
        } catch (dbError) {
          console.error('❌ Erro ao registrar webhook:', dbError);
          // Continuar mesmo com erro de log
        }
        
        // Sempre retornar sucesso para a Hotmart não reenviar
        return res.status(200).json({
          success: true,
          message: 'Webhook recebido com sucesso',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
        
        // Mesmo com erro, retornar 200 para evitar reenvios
        return res.status(200).json({
          success: false,
          message: 'Erro ao processar webhook, mas confirmamos o recebimento',
          timestamp: new Date().toISOString()
        });
      }
    });
    

    
    console.log("✅ Configuração das rotas concluída com sucesso!");
    

    
    // Adicionar a rota corrigida para detalhes de webhook
    try {
      const webhookDetailFixModule = await import('./routes/webhooks-detail-fix');
      app.use(webhookDetailFixModule.default);
      console.log("✅ Rota de detalhes de webhook corrigida configurada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar rota de detalhes de webhook corrigida:", error);
    }
    

    
    // Manter a rota de status para diagnóstico
    app.get('/webhook/status', (req, res) => {
      res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        routes: [
          { path: '/webhook/hotmart', status: 'configured' },
          { path: '/webhook/hotmart-fixed', status: 'configured' },
          { path: '/webhook/hotmart-enhanced', status: 'configured', version: '2.0', recommended: true }
        ],
        integrationService: 'HotmartService',
        environment: process.env.HOTMART_SANDBOX === 'true' ? 'Sandbox' : 'Produção',
        recommendedEndpoint: '/webhook/hotmart-enhanced',
        message: 'Os webhooks estão configurados e funcionando. Recomendamos usar o endpoint aprimorado para melhor compatibilidade.'
      });
    });
    
    console.log("Rotas de webhook configuradas com sucesso");
    console.log("✅ Rotas de mapeamento de produtos implementadas diretamente");
    console.log("Serviço da Hotmart inicializado com sucesso no modo " + (process.env.HOTMART_SANDBOX === 'true' ? 'Sandbox' : 'Produção'));
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
