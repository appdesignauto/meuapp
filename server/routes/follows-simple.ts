import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";

interface CustomRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    name?: string;
    profileimageurl?: string;
    bio?: string;
    nivelacesso: string;
    role?: string;
  }
}

// Criar conexão direta ao PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function setupFollowRoutesSimple(app: any, isAuthenticated: (req: Request, res: Response, next: NextFunction) => void) {
  
  // Rota para buscar os designers que o usuário segue
  app.get("/api/users/following", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      console.log(`Buscando designers seguidos pelo usuário ${userId}`);

      // Consulta SQL direta para buscar designers seguidos
      const query = `
        SELECT 
          u.id, u.username, u.name, u.profileimageurl, u.bio, u.nivelacesso,
          (SELECT COUNT(*) FROM arts WHERE designerid = u.id) as arts_count,
          (SELECT COUNT(*) FROM userfollows WHERE followingid = u.id) as followers_count
        FROM users u
        INNER JOIN userfollows uf ON u.id = uf.followingid
        WHERE uf.followerid = $1
        ORDER BY u.name
      `;
      
      const result = await pool.query(query, [userId]);
      
      const designers = result.rows.map(row => ({
        id: Number(row.id),
        username: row.username,
        name: row.name || row.username,
        profileimageurl: row.profileimageurl,
        bio: row.bio,
        role: row.nivelacesso,
        artsCount: Number(row.arts_count || 0),
        followersCount: Number(row.followers_count || 0),
        isFollowing: true
      }));

      console.log(`Retornando ${designers.length} designers seguidos`);
      return res.status(200).json({ following: designers });

    } catch (error) {
      console.error("Erro ao buscar designers seguidos:", error);
      return res.status(500).json({ message: "Erro ao buscar designers seguidos" });
    }
  });

  // Rota para seguir/deixar de seguir um designer
  app.post("/api/users/follow/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const targetId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      if (userId === targetId) {
        return res.status(400).json({ message: "Você não pode seguir a si mesmo" });
      }

      console.log(`Usuário ${userId} tentando seguir/deixar de seguir ${targetId}`);

      // Verificar se já segue
      const checkQuery = `SELECT id FROM userfollows WHERE followerid = $1 AND followingid = $2`;
      const checkResult = await pool.query(checkQuery, [userId, targetId]);
      
      let isFollowing = false;
      
      if (checkResult.rows.length > 0) {
        // Já segue, então remover
        const deleteQuery = `DELETE FROM userfollows WHERE followerid = $1 AND followingid = $2`;
        await pool.query(deleteQuery, [userId, targetId]);
        console.log(`Usuário ${userId} deixou de seguir ${targetId}`);
      } else {
        // Não segue, então adicionar
        const insertQuery = `INSERT INTO userfollows (followerid, followingid, createdat) VALUES ($1, $2, NOW())`;
        await pool.query(insertQuery, [userId, targetId]);
        isFollowing = true;
        console.log(`Usuário ${userId} começou a seguir ${targetId}`);
      }

      // Contar total de seguidores
      const countQuery = `SELECT COUNT(*) as count FROM userfollows WHERE followingid = $1`;
      const countResult = await pool.query(countQuery, [targetId]);
      const followersCount = Number(countResult.rows[0]?.count || 0);

      return res.status(200).json({ 
        success: true, 
        isFollowing,
        followersCount 
      });

    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      return res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  // Rota para obter artes recentes dos designers seguidos
  app.get("/api/following/arts", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      console.log(`Buscando artes dos designers seguidos pelo usuário ${userId}`);

      const artsQuery = `
        SELECT 
          a.id, a.title, a.imageurl, a.format, a.ispremium, 
          a.createdat, a.designerid,
          u.name as designer_name, u.username as designer_username, 
          u.profileimageurl as designer_profile
        FROM arts a
        LEFT JOIN users u ON a.designerid = u.id
        WHERE a.isvisible = true 
        AND a.designerid IN (
          SELECT followingid FROM userfollows WHERE followerid = $1
        )
        ORDER BY a.createdat DESC
        LIMIT 20
      `;
      
      const result = await pool.query(artsQuery, [userId]);
      
      const processedArts = result.rows.map(art => ({
        id: art.id,
        title: art.title,
        imageUrl: art.imageurl,
        format: art.format,
        isPremium: art.ispremium,
        createdAt: art.createdat,
        designerId: art.designerid,
        designer: {
          id: art.designerid,
          name: art.designer_name || art.designer_username,
          username: art.designer_username,
          profileimageurl: art.designer_profile,
        },
      }));

      console.log(`Retornando ${processedArts.length} artes dos designers seguidos`);
      return res.status(200).json({ arts: processedArts });
    } catch (error) {
      console.error("Erro ao buscar artes dos designers seguidos:", error);
      return res.status(500).json({ message: "Erro ao buscar artes dos designers seguidos" });
    }
  });

  // Rota para buscar designers populares
  app.get("/api/designers/popular", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      console.log("Buscando designers populares");

      const query = `
        SELECT 
          u.id, u.username, u.name, u.profileimageurl, u.bio, u.nivelacesso,
          (SELECT COUNT(*) FROM arts WHERE designerid = u.id) as arts_count,
          (SELECT COUNT(*) FROM userfollows WHERE followingid = u.id) as followers_count,
          ${userId ? `(SELECT COUNT(*) FROM userfollows WHERE followerid = ${userId} AND followingid = u.id) > 0 as is_following` : 'false as is_following'}
        FROM users u
        WHERE u.nivelacesso IN ('designer', 'designer_adm', 'premium')
        AND u.isactive = true
        ORDER BY followers_count DESC, arts_count DESC
        LIMIT 10
      `;
      
      const result = await pool.query(query);
      
      const designers = result.rows.map(row => ({
        id: Number(row.id),
        username: row.username,
        name: row.name || row.username,
        profileimageurl: row.profileimageurl,
        bio: row.bio,
        role: row.nivelacesso,
        artsCount: Number(row.arts_count || 0),
        followersCount: Number(row.followers_count || 0),
        isFollowing: userId ? Boolean(row.is_following) : false
      }));

      console.log(`Retornando ${designers.length} designers populares. Usuário logado: ${userId ? 'Sim' : 'Não'}`);
      return res.status(200).json({ designers });

    } catch (error) {
      console.error("Erro ao buscar designers populares:", error);
      return res.status(500).json({ message: "Erro ao buscar designers populares" });
    }
  });
}