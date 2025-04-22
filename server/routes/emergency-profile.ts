import express, { Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

/**
 * Rota de emergência para atualização de perfil
 * Usa autenticação alternativa via userId no corpo da requisição
 */
router.post("/api/emergency/profile", async (req: Request, res: Response) => {
  try {
    const { userId, name, bio, avatarUrl, website, location } = req.body;
    
    if (!userId) {
      console.error("[EmergencyProfile] ID do usuário não fornecido");
      return res.status(400).json({ 
        success: false,
        error: "ID do usuário é obrigatório",
        code: "MISSING_USER_ID"
      });
    }

    console.log(`[EmergencyProfile] Tentando atualizar perfil para usuário ${userId}`);

    // Verificar se o usuário existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId.toString())))
      .execute();

    if (!existingUser) {
      console.error(`[EmergencyProfile] Usuário ${userId} não encontrado`);
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
        code: "USER_NOT_FOUND"
      });
    }

    // Preparar dados para atualização
    const updateData: any = {
      atualizadoem: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (location !== undefined) updateData.location = location;
    if (avatarUrl !== undefined) updateData.profileimageurl = avatarUrl;

    console.log(`[EmergencyProfile] Atualizando dados:`, updateData);

    // Realizar a atualização
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(userId.toString())))
      .returning();

    console.log(`[EmergencyProfile] Perfil atualizado com sucesso para usuário ${userId}`);

    return res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        bio: updatedUser.bio,
        website: updatedUser.website,
        location: updatedUser.location,
        profileImageUrl: updatedUser.profileimageurl,
        updatedAt: updatedUser.atualizadoem
      }
    });
  } catch (error) {
    console.error("[EmergencyProfile] Erro ao atualizar perfil:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno ao atualizar perfil",
      details: error instanceof Error ? error.message : "Erro desconhecido",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router; 