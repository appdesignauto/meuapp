import { Router } from "express";
import { supabaseAuthService } from "../services/supabase-auth";
import { storage } from "../storage";

const router = Router();

// Rota para registrar um usuário diretamente no Supabase
router.post("/api/auth/supabase/register-test", async (req, res) => {
  try {
    console.log("Requisição de registro recebida:", req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email e senha são obrigatórios" 
      });
    }
    
    // Verifica se o usuário já existe no banco de dados local
    const existingUser = await storage.getUserByEmail(email);
    console.log("Usuário existente:", existingUser ? "Sim" : "Não");
    
    // Registrar no Supabase usando o serviço
    const { user, error } = await supabaseAuthService.register(email, password, {
      username: email.split('@')[0],
      name: req.body.name || "Novo Usuário",
      role: "usuario"
    });
    
    if (error) {
      console.error("Erro ao registrar no Supabase:", error);
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Falha ao registrar usuário no Supabase - nenhum usuário retornado"
      });
    }
    
    // Se o usuário já existe localmente, atualize o supabaseId
    if (existingUser) {
      await storage.updateUserSupabaseId(existingUser.id, user.supabaseId || null);
      
      return res.status(200).json({
        success: true,
        message: "Usuário atualizado no Supabase",
        user: {
          ...existingUser,
          supabaseId: user.supabaseId
        }
      });
    }
    
    // Retornar o novo usuário registrado
    return res.status(201).json({
      success: true,
      message: "Usuário registrado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        supabaseId: user.supabaseId
      }
    });
    
  } catch (error: any) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao registrar usuário"
    });
  }
});

// Rota para confirmar email manualmente (para testes)
router.post("/api/auth/supabase/confirm-email-test", async (req, res) => {
  try {
    console.log("Requisição de confirmação de email recebida:", req.body);
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email é obrigatório" 
      });
    }
    
    // Buscar usuário por email
    const user = await storage.getUserByEmail(email);
    console.log("Usuário encontrado para confirmação:", user?.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }
    
    if (user.supabaseId) {
      // Tentar confirmar o email no Supabase também
      const { success, error } = await supabaseAuthService.confirmEmail(user.supabaseId);
      console.log("Resultado da confirmação no Supabase:", { success, error });
    }
    
    // Atualizar o campo emailconfirmed
    await storage.updateUserEmailConfirmed(user.id, true);
    
    return res.status(200).json({
      success: true,
      message: "Email confirmado com sucesso"
    });
    
  } catch (error: any) {
    console.error("Erro ao confirmar email:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao confirmar email"
    });
  }
});

// Rota para teste de verificação do status do Supabase Auth
router.get("/api/auth/supabase/status-test", async (req, res) => {
  try {
    const isInitialized = supabaseAuthService.isInitialized();
    
    // Verificar sessão atual
    const { session, error: sessionError } = await supabaseAuthService.getSession();
    
    // Verificar usuário atual
    const { user, error: userError } = await supabaseAuthService.getCurrentUser();
    
    return res.json({
      success: true,
      status: {
        initialized: isInitialized,
        session: {
          exists: !!session,
          error: sessionError ? String(sessionError) : null,
          details: session ? {
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at
          } : null
        },
        currentUser: {
          exists: !!user,
          error: userError ? String(userError) : null,
          details: user ? {
            id: user.id,
            email: user.email,
            emailConfirmed: user.email_confirmed_at ? true : false,
            metadata: user.user_metadata
          } : null
        }
      }
    });
  } catch (error: any) {
    console.error("Erro ao verificar status do Supabase Auth:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao verificar status do Supabase Auth"
    });
  }
});

export default router;