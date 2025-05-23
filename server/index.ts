import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-data";
import { createAdminUser } from "./init-admin";
import { SubscriptionService } from "./services/subscription-service";
import { validateR2Environment } from "./env-check";
import { configureCors } from "./cors-config";
// Importar o novo manipulador de webhook aprimorado
import enhancedHotmartWebhook from "./routes/webhook-hotmart-enhanced";
import adminRoutes from "./routes/admin";
import { Pool } from "pg";
import crypto from "crypto";

// Função para encontrar email em qualquer parte do payload da Hotmart
function findEmailInPayload(payload: any): string | null {
  if (!payload) return null;
  
  // Função recursiva para buscar emails em objetos aninhados
  function searchEmail(obj: any): string | null {
    // Caso base: é uma string e parece um email
    if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
      return obj;
    }
    
    // Caso recursivo: objeto
    if (typeof obj === 'object' && obj !== null) {
      // Verificar chaves que provavelmente contêm email
      if (obj.email && typeof obj.email === 'string') return obj.email;
      if (obj.buyer && obj.buyer.email) return obj.buyer.email;
      if (obj.customer && obj.customer.email) return obj.customer.email;
      if (obj.data && obj.data.buyer && obj.data.buyer.email) return obj.data.buyer.email;
      
      // Buscar em todas as propriedades
      for (const key in obj) {
        const result = searchEmail(obj[key]);
        if (result) return result;
      }
    }
    
    // Caso recursivo: array
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const result = searchEmail(obj[i]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchEmail(payload);
}

// Função para encontrar ID da transação no payload
function findTransactionId(payload: any): string | null {
  if (!payload) return null;
  
  // Verificar locais comuns primeiro
  if (payload.data?.purchase?.transaction) return payload.data.purchase.transaction;
  if (payload.data?.transaction) return payload.data.transaction;
  if (payload.transaction) return payload.transaction;
  
  // Função recursiva para busca profunda
  function searchTransactionId(obj: any): string | null {
    if (!obj || typeof obj !== 'object') return null;
    
    // Procurar por chaves que possam conter o ID da transação
    for (const key in obj) {
      if (
        (key.toLowerCase().includes('transaction') || 
         key.toLowerCase().includes('order') || 
         key.toLowerCase().includes('pedido')) && 
        typeof obj[key] === 'string'
      ) {
        return obj[key];
      }
      
      // Buscar recursivamente
      if (typeof obj[key] === 'object') {
        const result = searchTransactionId(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchTransactionId(payload);
}

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
    
    // 🔥 WEBHOOK ULTRA-SIMPLES QUE REALMENTE FUNCIONA!
    app.post('/webhook/hotmart', async (req, res) => {
      console.log('\n🚀 WEBHOOK RECEBIDO!', new Date().toISOString());
      
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      try {
        const payload = req.body;
        
        // Validar se é compra aprovada
        if (payload?.event !== 'PURCHASE_APPROVED' || payload?.data?.purchase?.status !== 'APPROVED') {
          console.log('❌ Não é compra aprovada');
          return res.status(200).json({ success: true, message: 'Ignorado' });
        }
        
        const email = payload.data?.buyer?.email?.toLowerCase().trim();
        const name = payload.data?.buyer?.name || 'Cliente';
        
        if (!email) {
          console.log('❌ Email não encontrado');
          return res.status(200).json({ success: true, message: 'Email não encontrado' });
        }
        
        console.log(`✅ PROCESSANDO: ${name} - ${email}`);
        
        // Verificar se usuário existe
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        
        let userId;
        
        if (userCheck.rows.length > 0) {
          userId = userCheck.rows[0].id;
          console.log(`🔄 Atualizando usuário ${userId}`);
          
          await pool.query(`
            UPDATE users SET 
              nivelacesso = 'premium',
              origemassinatura = 'hotmart',
              tipoplano = 'anual'
            WHERE id = $1
          `, [userId]);
        } else {
          console.log(`➕ CRIANDO USUÁRIO: ${email}`);
          
          const username = `${email.split('@')[0]}_${Date.now()}`;
          // Usar senha simples por enquanto - o usuário pode alterar depois
          const hashedPassword = 'temp_password_hash';
          
          const userResult = await pool.query(`
            INSERT INTO users (
              username, email, name, password, nivelacesso, origemassinatura,
              tipoplano, isactive, emailconfirmed
            ) VALUES (
              $1, $2, $3, $4, 'premium', 'hotmart',
              'anual', true, true
            ) RETURNING id
          `, [username, email, name, hashedPassword]);
          
          userId = userResult.rows[0].id;
          console.log(`✅ USUÁRIO CRIADO: ID ${userId}`);
        }
        
        console.log(`🎉 SUCESSO! Usuário ${userId} processado!`);
        await pool.end();
        
        return res.status(200).json({
          success: true,
          message: 'USUÁRIO CRIADO AUTOMATICAMENTE!',
          userId: userId,
          email: email
        });
        
      } catch (error) {
        console.error('💥 ERRO:', error);
        try { await pool.end(); } catch(e) {}
        return res.status(200).json({ success: false, message: 'Erro processando' });
      }
    });
    
    // Configurar rota principal de webhook Hotmart
    try {
      const hotmartFixedModule = await import('./routes/webhook-hotmart-fixed');
      app.use('/webhook/hotmart', hotmartFixedModule.default);
      console.log("✅ Rota principal de webhook da Hotmart configurada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar rota Hotmart principal:", error);
    }
    
    // Inicializar o serviço da Hotmart
    // Importações serão feitas de forma dinâmica para evitar problemas
    const initHotmartService = async () => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const { default: mappingRoutes } = await import('./routes/mapping-routes');
        const { HotmartService } = await import('./services/hotmart-service');
        
        const prisma = new PrismaClient();
        const hotmartService = new HotmartService(prisma);
        
        // Registrar rotas para mapeamento de produtos Hotmart
        app.use(mappingRoutes);
        
        console.log("Serviço da Hotmart inicializado com sucesso no modo " + 
                   (process.env.HOTMART_SANDBOX === 'true' ? 'Sandbox' : 'Produção'));
        
        // NOTA: Não registramos '/webhook' rotas aqui, pois
        // já temos uma implementação direta acima que deve ter precedência
      } catch (error) {
        console.error("Erro ao inicializar serviço da Hotmart:", error);
      }
    };
    
    // Iniciar serviço de forma assíncrona
    await initHotmartService();
    
    console.log("✅ Configuração da rota do webhook da Hotmart concluída com sucesso!");
    
    // NOVA SOLUÇÃO: Utilizar a rota fixa para webhooks diretamente no servidor principal
    // Isto elimina a necessidade do servidor standalone e simplifica a arquitetura
    try {
      const hotmartFixedModule = await import('./routes/webhook-hotmart-fixed');
      app.use('/webhook/hotmart', hotmartFixedModule.default);
      console.log("✅ Rota principal de webhook da Hotmart configurada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar rota Hotmart principal:", error);
    }
    
    // Manter a rota fixa pelo caminho alternativo para compatibilidade
    try {
      const hotmartFixedModule = await import('./routes/webhook-hotmart-fixed');
      app.use('/webhook/hotmart-fixed', hotmartFixedModule.default);
      console.log("✅ Rota Hotmart fixa (alternativa) configurada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar rota Hotmart fixa alternativa:", error);
    }
    
    // Adicionar a rota corrigida para detalhes de webhook
    try {
      const webhookDetailFixModule = await import('./routes/webhooks-detail-fix');
      app.use(webhookDetailFixModule.default);
      console.log("✅ Rota de detalhes de webhook corrigida configurada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar rota de detalhes de webhook corrigida:", error);
    }
    
    // Configurar a nova rota de webhook APRIMORADA para Hotmart
    try {
      // Usar o manipulador de webhook aprimorado importado no início do arquivo
      app.use('/webhook/hotmart-enhanced', enhancedHotmartWebhook);
      console.log("✅ Rota de webhook Hotmart aprimorada configurada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar rota de webhook Hotmart aprimorada:", error);
    }
    
    // Adicionar a rota de DEBUG para capturar qualquer webhook
    try {
      const webhookDebugModule = await import('./routes/webhook-debug');
      app.use('/webhook', webhookDebugModule.default);
      console.log("✅ Rota de diagnóstico de webhook configurada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar rota de diagnóstico de webhook:", error);
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
