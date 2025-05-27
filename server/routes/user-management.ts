import { Express } from "express";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export function setupUserManagementRoutes(app: Express) {
  // API moderna para listagem de usuários com filtros e estatísticas
  app.get("/api/admin/users", async (req, res) => {
    try {
      if (!req.user || req.user.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { search, status, role, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Construir query SQL com filtros
      let whereClause = "WHERE 1=1";
      const params: any[] = [];
      let paramIndex = 1;

      // Filtro de busca por nome, email ou username
      if (search && typeof search === 'string') {
        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Filtro por status
      if (status === 'active') {
        whereClause += ` AND isactive = $${paramIndex}`;
        params.push(true);
        paramIndex++;
      } else if (status === 'inactive') {
        whereClause += ` AND isactive = $${paramIndex}`;
        params.push(false);
        paramIndex++;
      }

      // Filtro por nível de acesso
      if (role && typeof role === 'string') {
        whereClause += ` AND nivelacesso = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      // Query principal para buscar usuários
      const usersQuery = `
        SELECT 
          id, username, email, name, profileimageurl, bio, nivelacesso,
          tipoplano, origemassinatura, dataassinatura, dataexpiracao,
          acessovitalicio, isactive, ultimologin, criadoem, atualizadoem
        FROM users 
        ${whereClause}
        ORDER BY criadoem DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(Number(limit), offset);

      // Query para contar total
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countParams = params.slice(0, -2); // Remove limit e offset

      // Executar queries
      const [usersResult, countResult, statsResult] = await Promise.all([
        sql(usersQuery, params),
        sql(countQuery, countParams),
        sql(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN isactive = true THEN 1 END) as active_users,
            COUNT(CASE WHEN nivelacesso = 'premium' THEN 1 END) as premium_users,
            COUNT(CASE WHEN nivelacesso = 'designer' THEN 1 END) as designers
          FROM users
        `)
      ]);

      const total = Number(countResult[0]?.total || 0);
      const stats = {
        totalUsers: Number(statsResult[0]?.total_users || 0),
        activeUsers: Number(statsResult[0]?.active_users || 0),
        premiumUsers: Number(statsResult[0]?.premium_users || 0),
        designers: Number(statsResult[0]?.designers || 0)
      };

      res.json({
        users: usersResult,
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