import express, { Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { flexibleAuth } from "../auth-flexible";

const router = express.Router();

/**
 * Rota flexível para atualização de perfil
 * Aceita diferentes métodos de autenticação e pode ser acessada via PATCH
 */
router.patch("/api/user/profile", flexibleAuth, async (req: Request, res: Response) => {
  try {
    const { name, bio, website, location, avatarUrl } = req.body;
    
    // Obter ID do usuário do middleware flexível
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Usuário não identificado" 
      });
    }
    
    console.log(`[Profile] Atualizando perfil do usuário ${userId}`);
    
    // Construir objeto de atualização
    const updateData: Record<string, any> = {
      atualizadoem: new Date()
    };
    
    if (name !== undefined) updateData.name = name || null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (website !== undefined) updateData.website = website || null;
    if (location !== undefined) updateData.location = location || null;
    
    // Se avatarUrl for fornecido, atualizar profileimageurl
    if (avatarUrl !== undefined) {
      updateData.profileimageurl = avatarUrl || null;
    }
    
    // Atualizar usuário no banco de dados
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
    
    // Recuperar usuário atualizado
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!updatedUser) {
      return res.status(500).json({ 
        success: false,
        message: "Erro ao recuperar dados atualizados" 
      });
    }
    
    // Retornar sucesso com dados atualizados
    return res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        bio: updatedUser.bio,
        website: updatedUser.website,
        location: updatedUser.location,
        profileImageUrl: updatedUser.profileimageurl
      }
    });
  } catch (error) {
    console.error("[Profile] Erro ao atualizar perfil:", error);
    return res.status(500).json({ 
      success: false,
      message: "Erro ao atualizar perfil",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;