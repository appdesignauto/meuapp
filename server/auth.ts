import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import MemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const MemStore = MemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "design-auto-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
    store: new MemStore({
      checkPeriod: 86400000 // limpar sessões expiradas a cada 24h
    })
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: "username",
      passwordField: "password"
    }, async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Usuário não encontrado" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Senha incorreta" });
        }
        
        // Atualizar o último login
        const now = new Date();
        await storage.updateUserLastLogin(user.id, now);
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      if (!user.isActive) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware para verificar autenticação em rotas protegidas
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Não autenticado" });
  };

  // Middleware para verificar perfil de usuário
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      if (roles.includes(req.user.role)) {
        return next();
      }
      
      res.status(403).json({ message: "Acesso negado" });
    };
  };

  // Middleware para verificar acesso de usuário premium
  const isPremium = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (['premium', 'admin', 'designer_adm', 'designer', 'support'].includes(req.user.role)) {
      return next();
    }
    
    res.status(403).json({ message: "Acesso apenas para assinantes premium" });
  };

  // Middleware para verificar acesso de administrador
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    res.status(403).json({ message: "Acesso apenas para administradores" });
  };

  // Middleware para verificar acesso de designer
  const isDesigner = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (['designer', 'designer_adm', 'admin'].includes(req.user.role)) {
      return next();
    }
    
    res.status(403).json({ message: "Acesso apenas para designers" });
  };
  
  // Rotas de autenticação
  // Rota de registro
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password, email, name } = req.body;
      
      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já está em uso" });
      }
      
      // Verificar se o email já existe
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      // Criar novo usuário
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name,
        role: "free", // Papel padrão para novos usuários
        isActive: true
      });
      
      // Remover a senha do resultado
      const { password: _, ...userWithoutPassword } = user;
      
      // Fazer login automaticamente
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  // Rota de login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "Login inválido" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Remover a senha do resultado
        const { password: _, ...userWithoutPassword } = user;
        
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Rota de logout
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Rota para obter informações do usuário atual
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Remover a senha do resultado
    const { password: _, ...userWithoutPassword } = req.user;
    
    res.json(userWithoutPassword);
  });
  
  // Rota para atualizar informações do perfil de usuário
  app.put("/api/auth/profile", isAuthenticated, async (req, res) => {
    try {
      const { name, bio, profileImageUrl } = req.body;
      
      const updatedUser = await storage.updateUserProfile(req.user.id, {
        name, 
        bio, 
        profileImageUrl
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remover a senha do resultado
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Rota para alterar senha
  app.put("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Verificar senha atual
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const isCorrectPassword = await comparePasswords(currentPassword, user.password);
      if (!isCorrectPassword) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      // Atualizar senha
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // Rota para atualizar papel de usuário (admin)
  app.put("/api/users/:id/role", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      // Verificar se o papel é válido
      const validRoles = ['free', 'premium', 'designer', 'designer_adm', 'support', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Papel inválido" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remover a senha do resultado
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao atualizar papel:", error);
      res.status(500).json({ message: "Erro ao atualizar papel do usuário" });
    }
  });

  // Retornar os middlewares para uso em outras partes da aplicação
  return {
    isAuthenticated,
    hasRole,
    isPremium,
    isAdmin,
    isDesigner
  };
}