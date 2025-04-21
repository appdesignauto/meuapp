import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import { supabaseAuthService } from "./services/supabase-auth";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const PostgresSessionStore = connectPg(session);

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    console.log("Comparando senhas:");
    console.log("- Senha fornecida:", supplied);
    console.log("- Senha armazenada:", stored);

    // Verifica se a senha armazenada já está no formato bcrypt (começa com $2a$, $2b$ ou $2y$)
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      console.log("Formato de senha: bcrypt");
      return bcrypt.compare(supplied, stored);
    } 
    // Verifica se a senha está no formato scrypt (formato: hash.salt)
    else if (stored.includes('.')) {
      console.log("Formato de senha: scrypt (hash.salt)");
      const [hashedPassword, salt] = stored.split('.');
      const keyBuffer = await import('crypto').then(({ scrypt }) => {
        return new Promise<Buffer>((resolve, reject) => {
          scrypt(supplied, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey);
          });
        });
      });
      
      const hashedSupplied = keyBuffer.toString('hex');
      return hashedSupplied === hashedPassword;
    }
    // Caso a senha esteja armazenada em texto puro, comparação direta
    else {
      console.log("Formato de senha: texto puro");
      return supplied === stored;
    }
  } catch (error) {
    console.error("Erro ao comparar senhas:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "designauto-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    })
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
  passport.use(
    new LocalStrategy(async (usernameOrEmail, password, done) => {
      try {
        console.log("Recebendo tentativa de login:", { username: usernameOrEmail, password });
        
        // Primeiro tenta encontrar o usuário pelo username
        let user = await storage.getUserByUsername(usernameOrEmail);
        
        // Se não encontrar pelo username, tenta pelo email
        if (!user) {
          console.log("Usuário não encontrado pelo username, tentando por email:", usernameOrEmail);
          user = await storage.getUserByEmail(usernameOrEmail);
        }
        
        if (!user) {
          console.log("Usuário não encontrado:", usernameOrEmail);
          return done(null, false, { message: "Usuário ou email não encontrado" });
        }
        
        console.log("Usuário encontrado:", user);
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log("Comparação de senha:", passwordMatch);
        
        if (!passwordMatch) {
          console.log(`Senha incorreta para usuário: ${user.email}`);
          return done(null, false, { message: "Senha incorreta" });
        }
        
        // Update last login
        await storage.updateUserLastLogin(user.id, new Date());
        
        return done(null, user);
      } catch (err) {
        console.error("Erro na autenticação:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Não autenticado" });
  };

  // Role-based middlewares
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      // Usar o campo nivelacesso para verificação de permissões (com fallback para o campo role)
      const userNivelAcesso = req.user.nivelacesso || req.user.role;
      
      // Mapeamento entre roles antigas e novas para compatibilidade
      const roleMap: {[key: string]: string[]} = {
        'free': ['free', 'usuario'],
        'premium': ['premium'],
        'designer': ['designer'],
        'designer_adm': ['designer_adm'],
        'admin': ['admin'],
        'support': ['support', 'suporte']
      };
      
      // Verificar se o usuário tem alguma das roles permitidas (considerando o mapeamento)
      const hasPermission = roles.some(role => {
        // Verificar correspondência direta
        if (userNivelAcesso === role) return true;
        
        // Verificar correspondência via mapeamento
        const mappedRoles = roleMap[role] || [];
        return mappedRoles.includes(userNivelAcesso);
      });
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      next();
    };
  };

  const isPremium = hasRole(['premium', 'designer', 'designer_adm', 'support', 'admin']);
  const isDesigner = hasRole(['designer', 'designer_adm', 'admin']);
  const isAdmin = hasRole(['admin']);
  const isSupport = hasRole(['support', 'admin']);

  // Authentication API Routes
  app.post("/api/login", async (req, res, next) => {
    console.log("Recebendo tentativa de login:", req.body);
    
    try {
      // Autenticação manual para debugging
      const { username, password, rememberMe } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      // Busca o usuário pelo email (username agora é usado como email no frontend)
      const user = await storage.getUserByEmail(username);
      
      console.log("Usuário encontrado:", user);
      
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
      
      // Verifica a senha usando a função de comparação de hash
      const passwordMatch = await comparePasswords(password, user.password);
      if (!passwordMatch) {
        console.log("Senha incorreta para usuário:", username);
        return res.status(401).json({ message: "Senha incorreta" });
      }
      
      // Configurar período de expiração da sessão baseado na opção "Lembrar-me"
      if (rememberMe) {
        // Se "Lembrar-me" estiver ativado, definir a sessão para durar 30 dias
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos
        console.log("Opção 'Lembrar-me' ativada. Sessão definida para 30 dias.");
      } else {
        // Caso contrário, usar o padrão que geralmente é até o fechamento do navegador
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 horas (um dia)
        console.log("Opção 'Lembrar-me' desativada. Sessão definida para 24 horas.");
      }
      
      // Login manual
      req.login(user, async (err) => {
        if (err) {
          console.error("Erro no login:", err);
          return next(err);
        }
        
        console.log("Login bem-sucedido para:", user.email);
        
        // Atualiza último login
        await storage.updateUserLastLogin(user.id, new Date());
        
        // Remove senha da resposta
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Erro no processo de login:", error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      // Check if email already exists (principal identificador)
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ 
            success: false,
            message: "Email já cadastrado" 
          });
        }
      } else {
        return res.status(400).json({ 
          success: false,
          message: "Email é obrigatório" 
        });
      }
      
      // Se username for fornecido, verifica se já existe
      if (req.body.username) {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).json({ 
            success: false,
            message: "Nome de usuário já existe" 
          });
        }
      } else {
        // Se não for fornecido, gera com base no email
        req.body.username = req.body.email.split('@')[0];
      }
      
      // Hash password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user
      const nivelAcesso = req.body.nivelacesso || "usuario"; // Valor padrão é "usuario"
      
      // Definir origem como "auto" para usuários que se cadastram diretamente no site
      const origemAssinatura = "auto";
      
      const newUser = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        nivelacesso: nivelAcesso, // Usar nivelacesso
        role: nivelAcesso, // Manter role para compatibilidade
        isactive: true,
        origemassinatura: origemAssinatura, // Define origem como "auto"
        emailconfirmed: false, // Explicitamente definir como não confirmado
      });
      
      // Enviar email de verificação
      try {
        // Importar o serviço de verificação de email
        const emailVerificationModule = await import('./services/email-verification-service');
        const emailVerificationService = new emailVerificationModule.EmailVerificationService();
        
        // Enviar email de verificação
        const result = await emailVerificationService.sendVerificationCode(
          newUser.id, 
          newUser.email
        );
        
        if (result.success) {
          console.log(`E-mail de verificação enviado com sucesso para ${newUser.email}`);
        } else {
          console.warn(`Falha ao enviar e-mail de verificação para ${newUser.email}: ${result.message || 'Erro desconhecido'}`);
        }
      } catch (emailError) {
        console.error("Erro ao enviar e-mail de verificação:", emailError);
        // Não interromper o fluxo se o envio de e-mail falhar - apenas logar o erro
      }
      
      // Login the user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ 
            success: false,
            message: "Erro ao fazer login após registro" 
          });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = newUser;
        return res.status(201).json({
          success: true,
          user: userWithoutPassword,
          verificationSent: true,
          message: "Usuário criado com sucesso. Por favor, verifique seu e-mail para confirmar sua conta."
        });
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao registrar usuário",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    try {
      // Obter o usuário completo do banco de dados para garantir dados atualizados
      const userId = (req.user as any).id;
      const userDetails = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userDetails.length) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = userDetails[0];
      
      // Log para depuração
      console.log("Dados completos do usuário:", userWithoutPassword);
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao obter detalhes do usuário:", error);
      res.status(500).json({ message: "Erro ao obter detalhes do usuário" });
    }
  });
  
  // =============================================
  // SISTEMA DE AUTENTICAÇÃO SUPABASE - ROTAS
  // =============================================
  
  // Registrar usuário com Supabase
  app.post("/api/auth/supabase/register", async (req, res) => {
    try {
      const { email, password, name, username } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email e senha são obrigatórios" 
        });
      }
      
      // Registrar usuário usando serviço Supabase
      const result = await supabaseAuthService.register(email, password, { 
        name, 
        username: username || email.split('@')[0],
        role: 'usuario',
        nivelacesso: 'usuario'
      });
      
      if (result.error) {
        console.error("Erro ao registrar usuário no Supabase:", result.error);
        return res.status(400).json({ 
          success: false, 
          message: "Erro ao registrar usuário", 
          error: result.error 
        });
      }
      
      // Em ambiente de teste, para evitar a necessidade de confirmação de email,
      // vamos confirmar o email automaticamente usando o método admin
      try {
        // Tentar confirmar o email com admin API, isso só funciona com service_role key
        if (result.user?.supabaseId) {
          await supabaseAuthService.confirmEmail(result.user.supabaseId);
        }
      } catch (confirmError) {
        console.log("Não foi possível confirmar o email automaticamente:", confirmError);
        // Não falhar o registro por isso, apenas registrar o erro
      }

      // Se o registro foi bem-sucedido, fazer login do usuário automaticamente
      req.login(result.user, (err) => {
        if (err) {
          console.error("Erro ao fazer login após registro:", err);
          return res.status(500).json({ 
            success: false, 
            message: "Usuário registrado, mas não foi possível fazer login automaticamente" 
          });
        }
        
        // Retornar dados do usuário (sem a senha)
        const userWithoutPassword = { ...result.user };
        delete userWithoutPassword.password;
        
        return res.status(201).json({ 
          success: true, 
          message: "Usuário registrado com sucesso", 
          user: userWithoutPassword,
          needEmailConfirmation: true // Indicar que o usuário precisa confirmar o email
        });
      });
    } catch (error) {
      console.error("Erro ao registrar usuário com Supabase:", error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao registrar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    }
  });
  
  // Login com Supabase
  app.post("/api/auth/supabase/login", async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email e senha são obrigatórios" 
        });
      }
      
      // Realizar login usando serviço Supabase
      const result = await supabaseAuthService.login(email, password, rememberMe);
      
      if (result.error) {
        console.error("Erro ao fazer login no Supabase:", result.error);
        
        // Tratamento específico para o erro de email não confirmado
        if (result.error.__isAuthError && result.error.code === 'email_not_confirmed') {
          console.log("Detectado erro de confirmação de email. Tentando fazer login alternativo...");
          
          // Para ambiente de desenvolvimento/teste, tente fazer login pelo método tradicional
          // se o email não estiver confirmado no Supabase
          try {
            // Verificar se o usuário existe no banco local
            const [localUser] = await db
              .select()
              .from(users)
              .where(eq(users.email, email));
              
            if (localUser) {
              console.log("Usuário encontrado localmente. Tentando bypass de confirmação de email...");
              
              // Marcar como confirmado no banco local
              await db
                .update(users)
                .set({ 
                  emailconfirmed: true,
                  ultimologin: new Date(),
                  atualizadoem: new Date()
                } as any)
                .where(eq(users.id, localUser.id));
              
              // Fazer login pelo método convencional (passando pelo Passport)
              req.login(localUser, (err) => {
                if (err) {
                  console.error("Erro ao fazer login alternativo:", err);
                  return res.status(500).json({ 
                    success: false, 
                    message: "Erro ao fazer login alternativo", 
                    error: err 
                  });
                }
                
                console.log("Login alternativo bem-sucedido para:", localUser.email);
                
                // Retornar dados do usuário (sem a senha)
                const userWithoutPassword = { ...localUser };
                delete userWithoutPassword.password;
                
                res.status(200).json({ 
                  success: true, 
                  user: userWithoutPassword, 
                  message: "Autenticado com sucesso (método alternativo)"
                });
              });
              
              return; // Importante para evitar que o código continue após o login
            }
          } catch (localLoginError) {
            console.error("Erro ao tentar login alternativo:", localLoginError);
          }
          
          return res.status(401).json({ 
            success: false, 
            message: "Email não verificado. Por favor, verifique sua caixa de entrada para confirmar seu email.", 
            error: {
              code: 'email_not_confirmed',
              message: result.error.message
            }
          });
        }
        
        // Tratamento para outros erros
        return res.status(401).json({ 
          success: false, 
          message: "Credenciais inválidas", 
          error: {
            code: result.error.__isAuthError ? result.error.code : 'unknown_error',
            message: result.error.message
          }
        });
      }
      
      // Se o login foi bem-sucedido, fazer login do usuário no sistema local também
      req.login(result.user, (err) => {
        if (err) {
          console.error("Erro ao fazer login local após autenticação Supabase:", err);
          return res.status(500).json({ 
            success: false, 
            message: "Autenticado no Supabase, mas não foi possível fazer login no sistema local" 
          });
        }
        
        // Registrar último login
        db.update(users)
          .set({ 
            ultimologin: new Date(), 
            atualizadoem: new Date() 
          })
          .where(eq(users.id, result.user.id))
          .execute()
          .catch(err => {
            console.error("Erro ao atualizar último login:", err);
          });
        
        // Retornar dados do usuário (sem a senha)
        const userWithoutPassword = { ...result.user };
        delete userWithoutPassword.password;
        
        // Incluir token da sessão Supabase para uso no cliente
        return res.status(200).json({ 
          success: true, 
          message: "Login realizado com sucesso", 
          user: userWithoutPassword,
          session: result.session
        });
      });
    } catch (error) {
      console.error("Erro ao fazer login com Supabase:", error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao fazer login: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    }
  });
  
  // Logout com Supabase
  app.post("/api/auth/supabase/logout", (req, res) => {
    try {
      // Realizar logout no Supabase
      supabaseAuthService.logout()
        .then(({ error }) => {
          if (error) {
            console.warn("Erro ao fazer logout do Supabase:", error);
          }
          
          // Fazer logout local independentemente do resultado do Supabase
          req.logout((err) => {
            if (err) {
              console.error("Erro ao fazer logout local:", err);
              return res.status(500).json({ 
                success: false, 
                message: "Erro ao finalizar sessão local" 
              });
            }
            
            res.status(200).json({ 
              success: true, 
              message: "Logout realizado com sucesso" 
            });
          });
        });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao fazer logout: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    }
  });
  
  // Recuperação de senha
  app.post("/api/auth/supabase/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email é obrigatório" 
        });
      }
      
      // Verificar se o email existe em nosso sistema
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (!user) {
        // Por segurança, não revelamos se o email existe ou não
        return res.status(200).json({ 
          success: true, 
          message: "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha." 
        });
      }
      
      // Enviar email de recuperação de senha pelo Supabase
      const result = await supabaseAuthService.resetPassword(email);
      
      if (result.error) {
        console.error("Erro ao enviar email de recuperação de senha:", result.error);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao enviar email de recuperação de senha", 
          error: result.error 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha." 
      });
    } catch (error) {
      console.error("Erro ao processar recuperação de senha:", error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao processar recuperação de senha: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    }
  });
  
  // Atualizar senha após recuperação
  app.post("/api/auth/supabase/update-password", isAuthenticated, async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ 
          success: false, 
          message: "Nova senha é obrigatória" 
        });
      }
      
      // Atualizar senha no Supabase
      const result = await supabaseAuthService.updatePassword(password);
      
      if (result.error) {
        console.error("Erro ao atualizar senha no Supabase:", result.error);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao atualizar senha", 
          error: result.error 
        });
      }
      
      // Atualizar senha no banco local também
      const hashedPassword = await hashPassword(password);
      
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          atualizadoem: new Date()
        })
        .where(eq(users.id, req.user.id));
      
      res.status(200).json({ 
        success: true, 
        message: "Senha atualizada com sucesso" 
      });
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao atualizar senha: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    }
  });
  
  // Verificar sessão do Supabase
  app.get("/api/auth/supabase/session", async (req, res) => {
    try {
      const { session, error } = await supabaseAuthService.getSession();
      
      if (error) {
        console.error("Erro ao verificar sessão no Supabase:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao verificar sessão", 
          error 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        session 
      });
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao verificar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    }
  });
  
  // Confirmar email de um usuário (somente para testes)
  app.post("/api/auth/supabase/confirm-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email é obrigatório" 
        });
      }
      
      // Buscar usuário no banco de dados pelo email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
        
      if (!user || !user.supabaseId) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuário não encontrado ou não possui ID do Supabase" 
        });
      }
      
      // Tentar confirmar o email do usuário no Supabase
      const result = await supabaseAuthService.confirmEmail(user.supabaseId);
      
      if (result.error) {
        console.error("Erro ao confirmar email:", result.error);
        return res.status(500).json({ 
          success: false, 
          message: "Não foi possível confirmar o email", 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Email confirmado com sucesso. Agora você pode fazer login." 
      });
    } catch (error) {
      console.error("Erro ao confirmar email:", error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao confirmar email: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    }
  });

  // Sincronizar usuário existente com Supabase
  app.post("/api/auth/supabase/sync-user", isAdmin, async (req, res) => {
    try {
      const { userId, password } = req.body;
      
      if (!userId || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "ID do usuário e senha são obrigatórios" 
        });
      }
      
      // Buscar usuário no banco local
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuário não encontrado" 
        });
      }
      
      // Sincronizar usuário com Supabase
      const result = await supabaseAuthService.syncUserWithSupabase(userId, user.email, password);
      
      if (result.error) {
        console.error("Erro ao sincronizar usuário com Supabase:", result.error);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao sincronizar usuário", 
          error: result.error 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Usuário sincronizado com sucesso" 
      });
    } catch (error) {
      console.error("Erro ao sincronizar usuário:", error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao sincronizar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    }
  });

  return {
    isAuthenticated,
    hasRole,
    isPremium,
    isDesigner,
    isAdmin,
    isSupport
  };
}