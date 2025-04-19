import { Router } from "express";
import { supabaseAuthService } from "../services/supabase-auth";
import { storage } from "../storage";

const router = Router();

// Rota para registrar um usuário diretamente no Supabase
router.post("/api/auth/supabase/register-test", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email e senha são obrigatórios" 
      });
    }
    
    // Verifica se o usuário já existe no banco de dados local
    const existingUser = await storage.getUserByEmail(email);
    
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
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email é obrigatório" 
      });
    }
    
    // Buscar usuário por email
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
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

export default router;