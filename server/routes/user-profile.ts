import express, { Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../middlewares/auth";

const router = express.Router();

/**
 * Rota para atualização de perfil do usuário
 */
router.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { name, bio, phone, location } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não identificado" });
    }

    console.log(`[Profile] Atualizando perfil do usuário ${userId}`);

    // Atualizar apenas os campos que foram fornecidos
    const updateData: any = {
      atualizadoem: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return res.json({ 
      success: true,
      message: "Perfil atualizado com sucesso.",
      data: updateData
    });
  } catch (error) {
    console.error("[Profile] Erro ao atualizar perfil:", error);
    return res.status(500).json({ 
      success: false,
      error: "Erro ao atualizar perfil.",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;