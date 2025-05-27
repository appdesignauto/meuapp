import { Express } from "express";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export function setupUserManagementRoutes(app: Express) {
  // API moderna para listagem de usuários - VERSÃO CORRIGIDA
  app.get("/api/admin/users", async (req, res) => {
    try {
      console.log("[USER MANAGEMENT] Iniciando busca de usuários");
      
      if (!req.user || req.user.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { search, status, role, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      console.log("[USER MANAGEMENT] Parâmetros:", { search, status, role, page, limit });

      // Query básica e segura
      let baseQuery = `
        SELECT 
          id, username, email, name, profileimageurl, bio, nivelacesso,
          tipoplano, origemassinatura, dataassinatura, dataexpiracao,
          acessovitalicio, isactive, ultimologin, criadoem, atualizadoem
        FROM users 
        WHERE 1=1
      `;

      // Aplicar filtros de forma segura
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = search.toLowerCase().trim();
        baseQuery += ` AND (LOWER(COALESCE(name, '')) LIKE '%${searchTerm}%' OR LOWER(email) LIKE '%${searchTerm}%' OR LOWER(username) LIKE '%${searchTerm}%')`;
      }

      if (status === 'active') {
        baseQuery += ` AND isactive = true`;
      } else if (status === 'inactive') {
        baseQuery += ` AND isactive = false`;
      }

      if (role && typeof role === 'string') {
        baseQuery += ` AND nivelacesso = '${role}'`;
      }

      // Query final com paginação
      const finalQuery = `${baseQuery} ORDER BY criadoem DESC LIMIT ${Number(limit)} OFFSET ${offset}`;
      const countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1` + baseQuery.split('WHERE 1=1')[1].split('ORDER BY')[0];

      console.log("[USER MANAGEMENT] Executando consulta de usuários");
      
      // Executar queries
      const usersResult = await sql(finalQuery);
      console.log("[USER MANAGEMENT] Usuários encontrados:", usersResult.length);
      
      const countResult = await sql(countQuery);
      console.log("[USER MANAGEMENT] Total contado:", countResult[0]?.total);
      
      const statsResult = await sql(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN isactive = true THEN 1 END) as active_users,
          COUNT(CASE WHEN nivelacesso = 'premium' THEN 1 END) as premium_users,
          COUNT(CASE WHEN nivelacesso = 'designer' THEN 1 END) as designers
        FROM users
      `);
      console.log("[USER MANAGEMENT] Estatísticas calculadas");

      const total = Number(countResult[0]?.total || 0);
      const stats = {
        totalUsers: Number(statsResult[0]?.total_users || 0),
        activeUsers: Number(statsResult[0]?.active_users || 0),
        premiumUsers: Number(statsResult[0]?.premium_users || 0),
        designers: Number(statsResult[0]?.designers || 0)
      };

      console.log("[USER MANAGEMENT] Retornando resposta com", usersResult.length, "usuários");

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
      console.error("[USER MANAGEMENT] Erro detalhado:", error);
      res.status(500).json({ 
        message: "Erro ao listar usuários",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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

      // Construir query de atualização
      const updates: string[] = [];
      const values: any[] = [];
      let index = 1;

      if (nivelacesso !== undefined) {
        updates.push(`nivelacesso = $${index}`);
        values.push(nivelacesso);
        index++;
      }

      if (isactive !== undefined) {
        updates.push(`isactive = $${index}`);
        values.push(isactive);
        index++;
      }

      if (tipoplano !== undefined) {
        updates.push(`tipoplano = $${index}`);
        values.push(tipoplano || null);
        index++;
      }

      if (acessovitalicio !== undefined) {
        updates.push(`acessovitalicio = $${index}`);
        values.push(acessovitalicio);
        index++;
      }

      if (dataexpiracao !== undefined) {
        updates.push(`dataexpiracao = $${index}`);
        values.push(dataexpiracao || null);
        index++;
      }

      if (observacaoadmin !== undefined) {
        updates.push(`observacaoadmin = $${index}`);
        values.push(observacaoadmin || null);
        index++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "Nenhuma atualização fornecida" });
      }

      // Sempre atualizar a data de modificação
      updates.push(`atualizadoem = $${index}`);
      values.push(new Date());
      values.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${index + 1}
        RETURNING id, username, email, name, nivelacesso, isactive, tipoplano, acessovitalicio, dataexpiracao, observacaoadmin
      `;

      const result = await sql(updateQuery, values);

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

      // Verificar se não é o próprio admin
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Não é possível deletar seu próprio usuário" });
      }

      const result = await sql(
        "DELETE FROM users WHERE id = $1 RETURNING username",
        [userId]
      );

      if (result.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        message: `Usuário ${result[0].username} deletado com sucesso`
      });

    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}