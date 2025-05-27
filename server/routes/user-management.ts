import { Express } from "express";
import { db } from "../storage";
import { users } from "../../shared/schema";
import { desc, count, eq, or, like } from "drizzle-orm";

export function setupUserManagementRoutes(app: Express) {
  // API moderna para listagem de usuários com filtros e estatísticas
  app.get("/api/admin/users", async (req, res) => {
    try {
      if (!req.user || req.user.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { search, status, role, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Construir query base
      let whereConditions = [];
      
      // Filtro de busca por nome, email ou username
      if (search && typeof search === 'string') {
        whereConditions.push(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.username, `%${search}%`)
          )
        );
      }

      // Filtro por status
      if (status === 'active') {
        whereConditions.push(eq(users.isactive, true));
      } else if (status === 'inactive') {
        whereConditions.push(eq(users.isactive, false));
      }

      // Filtro por nível de acesso
      if (role && typeof role === 'string') {
        whereConditions.push(eq(users.nivelacesso, role));
      }

      // Buscar usuários com paginação
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          profileimageurl: users.profileimageurl,
          bio: users.bio,
          nivelacesso: users.nivelacesso,
          tipoplano: users.tipoplano,
          origemassinatura: users.origemassinatura,
          dataassinatura: users.dataassinatura,
          dataexpiracao: users.dataexpiracao,
          acessovitalicio: users.acessovitalicio,
          isactive: users.isactive,
          ultimologin: users.ultimologin,
          criadoem: users.criadoem,
          atualizadoem: users.atualizadoem
        })
        .from(users)
        .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
        .orderBy(desc(users.criadoem))
        .limit(Number(limit))
        .offset(offset);

      // Contar total de usuários para paginação
      const totalResult = await db
        .select({ count: count() })
        .from(users)
        .where(whereConditions.length > 0 ? whereConditions[0] : undefined);
      
      const total = totalResult[0]?.count || 0;

      // Estatísticas gerais
      const statsResult = await Promise.all([
        // Total de usuários
        db.select({ count: count() }).from(users),
        // Usuários ativos
        db.select({ count: count() }).from(users).where(eq(users.isactive, true)),
        // Usuários premium
        db.select({ count: count() }).from(users).where(eq(users.nivelacesso, 'premium')),
        // Designers
        db.select({ count: count() }).from(users).where(eq(users.nivelacesso, 'designer'))
      ]);

      const stats = {
        totalUsers: statsResult[0][0]?.count || 0,
        activeUsers: statsResult[1][0]?.count || 0,
        premiumUsers: statsResult[2][0]?.count || 0,
        designers: statsResult[3][0]?.count || 0
      };

      res.json({
        users: allUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        stats
      });

    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // API para atualizar usuário
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      if (!req.user || req.user.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const userId = parseInt(req.params.id);
      const updates = req.body;

      // Campos permitidos para atualização
      const allowedFields = [
        'nivelacesso', 'isactive', 'tipoplano', 'acessovitalicio',
        'dataexpiracao', 'observacaoadmin'
      ];

      const updateData: any = {};
      for (const field of allowedFields) {
        if (field in updates) {
          updateData[field] = updates[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Nenhum campo válido para atualização" });
      }

      updateData.atualizadoem = new Date();

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      res.json({ message: "Usuário atualizado com sucesso" });

    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // API para deletar usuário
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      if (!req.user || req.user.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const userId = parseInt(req.params.id);

      // Verificar se não é o próprio usuário admin
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Não é possível excluir seu próprio usuário" });
      }

      await db
        .delete(users)
        .where(eq(users.id, userId));

      res.json({ message: "Usuário excluído com sucesso" });

    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}