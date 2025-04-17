import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
  // Verifica se a senha armazenada já está no formato bcrypt (começa com $2a$, $2b$ ou $2y$)
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(supplied, stored);
  } else {
    // Caso a senha esteja armazenada em texto puro, comparação direta
    return supplied === stored;
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
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Tentando autenticar:", username);
        
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log("Usuário não encontrado:", username);
          return done(null, false, { message: "Usuário não encontrado" });
        }
        
        console.log("Usuário encontrado:", user.username);
        console.log("Senha fornecida:", password);
        console.log("Senha armazenada:", user.password);
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log("Comparação de senha:", passwordMatch);
        
        if (!passwordMatch) {
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
      const { username, password } = req.body;
      
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
          return res.status(400).json({ message: "Email já cadastrado" });
        }
      } else {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      // Se username for fornecido, verifica se já existe
      if (req.body.username) {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).json({ message: "Nome de usuário já existe" });
        }
      } else {
        // Se não for fornecido, gera com base no email
        req.body.username = req.body.email.split('@')[0];
      }
      
      // Hash password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user
      const nivelAcesso = req.body.nivelacesso || "free"; // Valor padrão é "free"
      const newUser = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        nivelacesso: nivelAcesso, // Usar nivelacesso
        role: nivelAcesso, // Manter role para compatibilidade
        isactive: true,
      });
      
      // Login the user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login após registro" });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      return res.status(500).json({ message: "Erro ao registrar usuário" });
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

  return {
    isAuthenticated,
    hasRole,
    isPremium,
    isDesigner,
    isAdmin,
    isSupport
  };
}