import express, { Request, Response } from "express";
import { isAuthenticated } from "../middlewares/auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { supabaseStorageService } from "../services/supabase-storage";

const router = express.Router();

interface ProfileUpdateData {
  name?: string;
  bio?: string;
  website?: string;
  location?: string;
}

/**
 * Rota para atualização do perfil do usuário
 * Requer autenticação via Passport
 */
router.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.error("[ProfileUpdate] ID do usuário não encontrado na sessão");
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
        code: "UNAUTHORIZED"
      });
    }

    const { name, bio, website, location } = req.body as ProfileUpdateData;
    
    // Preparar dados para atualização
    const updateData: any = {
      atualizadoem: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (location !== undefined) updateData.location = location;

    console.log(`[ProfileUpdate] Atualizando perfil para usuário ${userId}:`, updateData);

    // Realizar a atualização
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error("Falha ao atualizar perfil");
    }

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
    console.error("[ProfileUpdate] Erro ao atualizar perfil:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno ao atualizar perfil",
      details: error instanceof Error ? error.message : "Erro desconhecido",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * Rota para upload de avatar
 * Requer autenticação via Passport
 */
router.post("/api/user/avatar", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.error("[AvatarUpload] ID do usuário não encontrado na sessão");
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
        code: "UNAUTHORIZED"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Nenhum arquivo enviado",
        code: "NO_FILE"
      });
    }

    console.log(`[AvatarUpload] Iniciando upload de avatar para usuário ${userId}`);

    // Upload para o Supabase Storage
    const result = await supabaseStorageService.uploadAvatar(req.file, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'webp'
    }, userId);

    // Atualizar URL do avatar no banco
    const [updatedUser] = await db
      .update(users)
      .set({
        profileimageurl: result.imageUrl,
        atualizadoem: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error("Falha ao atualizar URL do avatar");
    }

    console.log(`[AvatarUpload] Avatar atualizado com sucesso para usuário ${userId}`);

    return res.json({
      success: true,
      message: "Avatar atualizado com sucesso",
      data: {
        profileImageUrl: updatedUser.profileimageurl
      }
    });

  } catch (error) {
    console.error("[AvatarUpload] Erro ao fazer upload do avatar:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno ao fazer upload do avatar",
      details: error instanceof Error ? error.message : "Erro desconhecido",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router;