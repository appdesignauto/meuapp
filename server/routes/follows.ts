import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, userFollows, arts, communityPosts } from "../../shared/schema";
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

      console.log(`Buscando designers seguidos pelo usuário ${userId}`);

      // Retorna lista vazia por enquanto - será implementado após correção do Drizzle
      console.log("API temporariamente retornando lista vazia - será corrigida");
      return res.status(200).json({ following: [] });

    } catch (error) {
      console.error("Erro ao buscar designers seguidos:", error);
      return res.status(500).json({ message: "Erro ao buscar designers seguidos" });
    }
  });

  // Rota para buscar designers populares - público com funcionalidades extras para usuários logados
  app.get("/api/designers/popular", async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id; // Pode ser undefined se o usuário não estiver logado
      
      // Buscar usuários populares (premium e admin ativos)
      const designers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          bio: users.bio,
          nivelacesso: users.nivelacesso,
        })
        .from(users)
        .where(
          sql`(${users.nivelacesso} = 'premium' OR ${users.nivelacesso} = 'admin') AND ${users.isactive} = true`
        )
        .limit(12);

      // Para cada designer, obter contagem de artes e seguidores
      const designersWithCounts = await Promise.all(
        designers.map(async (designer) => {
          // Contagem de artes do designer - usando referência segura
          const [artsCount] = await db
            .select({ count: count() })
            .from(arts)
            .where(eq(arts.designerid, designer.id));
            
          // Contagem de posts do designer na comunidade
          const [postsCount] = await db
            .select({ count: count() })
            .from(communityPosts)
            .where(
              and(
                eq(communityPosts.userId, designer.id),
                eq(communityPosts.status, 'approved')
              )
            );

          // Contagem de seguidores do designer
          const [followersCount] = await db
            .select({ count: count() })
            .from(userFollows)
            .where(eq(userFollows.followingId, designer.id));

          // Verificar se o usuário logado segue este designer (se estiver logado)
          let isFollowing = false;
          if (userId) {
            const [followingResult] = await db
              .select({ count: count() })
              .from(userFollows)
              .where(
                and(
                  eq(userFollows.followerId, userId),
                  eq(userFollows.followingId, designer.id)
                )
              );
            isFollowing = Number(followingResult?.count || 0) > 0;
          }

          return {
            ...designer,
            name: designer.name || designer.username,
            role: designer.nivelacesso,
            artsCount: Number(artsCount?.count || 0),
            postsCount: Number(postsCount?.count || 0),
            followersCount: Number(followersCount?.count || 0),
            isFollowing: isFollowing,
          };
        })
      );

      // Ordenar por contagem de seguidores (mais populares primeiro)
      designersWithCounts.sort((a, b) => b.followersCount - a.followersCount);

      console.log(`Retornando ${designersWithCounts.length} designers populares. Usuário logado: ${userId ? 'Sim' : 'Não'}`);
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