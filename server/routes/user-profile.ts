import express, { Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { flexibleAuth } from "../auth-flexible";

const router = express.Router();

/**
 * Versão simplificada para atualização de perfil
 * Implementada conforme exemplo do cliente
 */
router.patch("/api/user/profile", flexibleAuth, async (req: Request, res: Response) => {
  try {
    const { name, avatarUrl } = req.body;
    const userId = req.user?.id; // vem da autenticação

    if (!userId) {
      return res.status(401).json({ error: "Usuário não identificado" });
    }

    console.log(`[Profile] Atualizando perfil do usuário ${userId}: nome=${name}, avatar=${avatarUrl}`);

    await db
      .update(users)
      .set({ 
        name: name || null,
        profileimageurl: avatarUrl || null,
        atualizadoem: new Date()
      })
      .where(eq(users.id, userId));

    return res.json({ message: "Perfil atualizado com sucesso." });
  } catch (error) {
    console.error("[Profile] Erro ao atualizar perfil:", error);
    return res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
});

export default router;