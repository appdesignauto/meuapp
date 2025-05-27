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

      // Construir query SQL básica sem parâmetros complexos
      let baseQuery = `
        SELECT 
          id, username, email, name, profileimageurl, bio, nivelacesso,
          tipoplano, origemassinatura, dataassinatura, dataexpiracao,
          acessovitalicio, isactive, ultimologin, criadoem, atualizadoem
        FROM users 
        WHERE 1=1
      `;

      // Aplicar filtros simples
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        baseQuery += ` AND (LOWER(name) LIKE '%${searchTerm}%' OR LOWER(email) LIKE '%${searchTerm}%' OR LOWER(username) LIKE '%${searchTerm}%')`;
      }

      if (status === 'active') {
        baseQuery += ` AND isactive = true`;
      } else if (status === 'inactive') {
        baseQuery += ` AND isactive = false`;
      }

      if (role && typeof role === 'string') {
        baseQuery += ` AND nivelacesso = '${role}'`;
      }

      // Finalizar query com ordenação e paginação
      const finalQuery = `${baseQuery} ORDER BY criadoem DESC LIMIT ${Number(limit)} OFFSET ${offset}`;
      const countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1` + baseQuery.split('WHERE 1=1')[1].split('ORDER BY')[0];

      // Executar queries uma por vez para evitar problemas
      console.log("[USER MANAGEMENT] Executando query principal:", finalQuery);
      const usersResult = await sql(finalQuery);
      
      console.log("[USER MANAGEMENT] Executando query de contagem:", countQuery);
      const countResult = await sql(countQuery);
      
      console.log("[USER MANAGEMENT] Executando query de estatísticas");
      const statsResult = await sql(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN isactive = true THEN 1 END) as active_users,
          COUNT(CASE WHEN nivelacesso = 'premium' THEN 1 END) as premium_users,
          COUNT(CASE WHEN nivelacesso = 'designer' THEN 1 END) as designers
        FROM users
      `);

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
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  // API para atualizar usuário
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      if (!req.user || req.user.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const userId = parseInt(req.params.id);
      const { nivelacesso, isactive, tipoplano, acessovitalicio, dataexpiracao, observacaoadmin } = req.body;

      // Construir query de atualização dinamicamente
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (nivelacesso !== undefined) {
        updates.push(`nivelacesso = $${paramIndex}`);
        params.push(nivelacesso);
        paramIndex++;
      }

      if (isactive !== undefined) {
        updates.push(`isactive = $${paramIndex}`);
        params.push(isactive);
        paramIndex++;
      }

      if (tipoplano !== undefined) {
        updates.push(`tipoplano = $${paramIndex}`);
        params.push(tipoplano || null);
        paramIndex++;
      }

      if (acessovitalicio !== undefined) {
        updates.push(`acessovitalicio = $${paramIndex}`);
        params.push(acessovitalicio);
        paramIndex++;
      }

      if (dataexpiracao !== undefined) {
        updates.push(`dataexpiracao = $${paramIndex}`);
        params.push(dataexpiracao || null);
        paramIndex++;
      }

      if (observacaoadmin !== undefined) {
        updates.push(`observacaoadmin = $${paramIndex}`);
        params.push(observacaoadmin || null);
        paramIndex++;
      }

      // Sempre atualizar atualizadoem
      updates.push(`atualizadoem = $${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      if (updates.length === 1) { // Apenas atualizadoem
        return res.status(400).json({ message: "Nenhum campo para atualizar" });
      }

      // Adicionar userId no final
      params.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, username, email, name, nivelacesso, isactive, atualizadoem
      `;

      const result = await sql(updateQuery, params);

      if (result.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ 
        message: "Usuário atualizado com sucesso",
        user: result[0]
      });

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

      // Não permitir deletar o próprio usuário
      if (req.user.id === userId) {
        return res.status(400).json({ message: "Não é possível deletar seu próprio usuário" });
      }

      const deleteQuery = `DELETE FROM users WHERE id = $1 RETURNING username`;
      const result = await sql(deleteQuery, [userId]);

      if (result.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ 
        message: `Usuário ${result[0].username} foi deletado com sucesso`
      });

    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}