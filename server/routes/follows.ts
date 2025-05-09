import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, userFollows, arts } from "../../shared/schema";
import { eq, and, sql, count, desc } from "drizzle-orm";
import { FollowRequest } from "../../shared/interfaces/follows";
import { storage } from "../storage";

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

export function setupFollowRoutes(app: any, isAuthenticated: (req: Request, res: Response, next: NextFunction) => void) {
  // Rota para obter artes recentes dos designers seguidos
  app.get("/api/following/arts", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      
      // Implementação direta em vez de usar o storage para fins de depuração
      // Busca os IDs dos designers que o usuário segue
      const followings = await db.select({
        followingId: userFollows.followingId
      })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));

      if (followings.length === 0) {
        return res.status(200).json({ arts: [] });
      }
      
      // Extrai os IDs dos designers seguidos
      const designerIds = followings.map(f => f.followingId);
      
      // Busca as artes mais recentes desses designers usando parâmetros SQL seguros
      const result = await db.execute(sql`
        SELECT 
          a.id, 
          a."createdAt", 
          a."updatedAt", 
          a.designerid, 
          a.viewcount,
          a.width, 
          a.height, 
          a."isPremium",
          a."isVisible", 
          a."categoryId", 
          a."collectionId", 
          a.title, 
          a."imageUrl", 
          a.format, 
          a."fileType", 
          a."editUrl", 
          a.aspectratio,
          u.username AS designer_username,
          u.name AS designer_name,
          u.profileimageurl AS designer_avatar
        FROM arts a
        JOIN users u ON a.designerid = u.id
        WHERE a.designerid IN (${sql.join(designerIds, sql`,`)})
          AND a."isVisible" = TRUE
        ORDER BY a."createdAt" DESC
        LIMIT ${limit}
      `);
      
      // Mapear as colunas para o formato esperado, incluindo informações do designer
      const arts = result.rows.map(art => ({
        id: art.id,
        title: art.title,
        imageUrl: art.imageUrl,
        width: art.width,
        height: art.height,
        aspectRatio: art.aspectratio,
        format: art.format,
        fileType: art.fileType,
        isPremium: art.isPremium,
        editUrl: art.editUrl,
        viewCount: art.viewcount,
        designer: {
          id: art.designerid,
          username: art.designer_username,
          name: art.designer_name,
          profileimageurl: art.designer_avatar
        }
      }));
      
      console.log(`Encontradas ${arts.length} artes dos designers seguidos por ${userId}`);
      return res.status(200).json({ arts });
    } catch (error) {
      console.error("Erro ao buscar artes dos designers seguidos:", error);
      return res.status(500).json({ message: "Erro ao buscar artes dos designers seguidos" });
    }
  });
  // Rota para buscar os designers que o usuário segue
  app.get("/api/users/following", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Buscar IDs dos designers que o usuário segue
      const followingRecords = await db
        .select({ designerId: userFollows.followingId })
        .from(userFollows)
        .where(eq(userFollows.followerId, userId));
      
      if (followingRecords.length === 0) {
        return res.status(200).json({ following: [] });
      }
      
      const followingIds = followingRecords.map(record => record.designerId);
      
      // Buscar dados completos dos designers usando parâmetros SQL seguros
      const designersData = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          bio: users.bio,
          nivelacesso: users.nivelacesso,
          role: users.role,
        })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(followingIds, sql`,`)})`);
      
      // Recuperar designers completos com dados adicionais
      const designers = await Promise.all(
        designersData.map(async (designer) => {
          // Contagem de artes do designer - usando referência segura
          const [artsCount] = await db
            .select({ count: count() })
            .from(arts)
            .where(eq(arts.designerid, designer.id));

          // Contagem de seguidores do designer
          const [followersCount] = await db
            .select({ count: count() })
            .from(userFollows)
            .where(eq(userFollows.followingId, designer.id));

          return {
            id: designer.id,
            username: designer.username,
            name: designer.name || designer.username,
            profileimageurl: designer.profileimageurl,
            bio: designer.bio,
            role: designer.role || designer.nivelacesso,
            artsCount: Number(artsCount?.count || 0),
            followersCount: Number(followersCount?.count || 0),
            isFollowing: true, // Já que estamos buscando os designers que o usuário segue
          };
        })
      );

      return res.status(200).json({ following: designers });
    } catch (error) {
      console.error("Erro ao buscar designers seguidos:", error);
      return res.status(500).json({ message: "Erro ao buscar designers seguidos" });
    }
  });

  // Rota para buscar designers populares
  app.get("/api/designers/popular", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Buscar designers (usuários com nivelacesso = 'designer' ou 'designer_adm')
      const designers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          bio: users.bio,
          nivelacesso: users.nivelacesso,
          role: users.role,
        })
        .from(users)
        .where(
          sql`(${users.nivelacesso} = 'designer' OR ${users.nivelacesso} = 'designer_adm' OR ${users.role} = 'designer' OR ${users.role} = 'designer_adm') AND ${users.isactive} = true`
        )
        .limit(12);

      // Para cada designer, obter contagem de artes e seguidores e verificar se o usuário o segue
      const designersWithCounts = await Promise.all(
        designers.map(async (designer) => {
          // Contagem de artes do designer - usando referência segura
          const [artsCount] = await db
            .select({ count: count() })
            .from(arts)
            .where(eq(arts.designerid, designer.id));

          // Contagem de seguidores do designer
          const [followersCount] = await db
            .select({ count: count() })
            .from(userFollows)
            .where(eq(userFollows.followingId, designer.id));

          // Verificar se o usuário segue este designer
          const [isFollowing] = await db
            .select({ count: count() })
            .from(userFollows)
            .where(
              and(
                eq(userFollows.followerId, userId),
                eq(userFollows.followingId, designer.id)
              )
            );

          return {
            ...designer,
            name: designer.name || designer.username,
            role: designer.role || designer.nivelacesso,
            artsCount: Number(artsCount?.count || 0),
            followersCount: Number(followersCount?.count || 0),
            isFollowing: Number(isFollowing?.count || 0) > 0,
          };
        })
      );

      // Ordenar por contagem de seguidores (mais populares primeiro)
      designersWithCounts.sort((a, b) => b.followersCount - a.followersCount);

      return res.status(200).json({ designers: designersWithCounts });
    } catch (error) {
      console.error("Erro ao buscar designers populares:", error);
      return res.status(500).json({ message: "Erro ao buscar designers populares" });
    }
  });

  // Rota para seguir/deixar de seguir um designer
  app.post("/api/users/follow/:id", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      // Validação segura do parâmetro ID
      const designerId = parseInt(req.params.id);
      if (isNaN(designerId)) {
        return res.status(400).json({ message: "ID de designer inválido" });
      }
      
      const { action } = req.body as FollowRequest;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      if (userId === designerId) {
        return res.status(400).json({ message: "Você não pode seguir a si mesmo" });
      }

      // Verificar se o designer existe
      const designer = await db.query.users.findFirst({
        where: eq(users.id, designerId),
      });

      if (!designer) {
        return res.status(404).json({ message: "Designer não encontrado" });
      }

      // Seguir ou deixar de seguir conforme a ação solicitada
      if (action === "follow") {
        // Verificar se já segue
        const existingFollow = await db.query.userFollows.findFirst({
          where: and(
            eq(userFollows.followerId, userId),
            eq(userFollows.followingId, designerId)
          ),
        });

        if (!existingFollow) {
          // Adicionar relação de seguir
          await db.insert(userFollows).values({
            followerId: userId,
            followingId: designerId,
          });
        }

        return res.status(200).json({ message: "Designer seguido com sucesso" });
      } else if (action === "unfollow") {
        // Remover relação de seguir
        await db
          .delete(userFollows)
          .where(
            and(
              eq(userFollows.followerId, userId),
              eq(userFollows.followingId, designerId)
            )
          );

        return res.status(200).json({ message: "Deixou de seguir o designer com sucesso" });
      } else {
        return res.status(400).json({ message: "Ação inválida" });
      }
    } catch (error) {
      console.error("Erro ao processar ação de seguir/deixar de seguir:", error);
      return res.status(500).json({ message: "Erro ao processar ação de seguir/deixar de seguir" });
    }
  });
}