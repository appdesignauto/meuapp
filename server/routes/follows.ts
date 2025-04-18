import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, userFollows } from "../../shared/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { FollowRequest } from "../../shared/interfaces/follows";

export function setupFollowRoutes(app: any, isAuthenticated: (req: Request, res: Response, next: NextFunction) => void) {
  // Rota para buscar os designers que o usuário segue
  app.get("/api/users/following", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Buscar designers que o usuário segue incluindo contagem de artes e seguidores
      const following = await db.query.userFollows.findMany({
        where: eq(userFollows.followerId, userId),
        with: {
          following: {
            columns: {
              id: true,
              username: true,
              name: true,
              profileimageurl: true,
              bio: true,
              nivelacesso: true,
              role: true,
            },
          },
        },
      });

      // Recuperar designers completos com dados adicionais
      const designers = await Promise.all(
        following.map(async (follow) => {
          // Contagem de artes do designer
          const [artsCount] = await db
            .select({ count: count() })
            .from(sql`arts`)
            .where(eq(sql`designerid`, follow.following.id));

          // Contagem de seguidores do designer
          const [followersCount] = await db
            .select({ count: count() })
            .from(userFollows)
            .where(eq(userFollows.followingId, follow.following.id));

          return {
            id: follow.following.id,
            username: follow.following.username,
            name: follow.following.name || follow.following.username,
            profileimageurl: follow.following.profileimageurl,
            bio: follow.following.bio,
            role: follow.following.role || follow.following.nivelacesso,
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
  app.get("/api/designers/popular", isAuthenticated, async (req: Request, res: Response) => {
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
          // Contagem de artes do designer
          const [artsCount] = await db
            .select({ count: count() })
            .from(sql`arts`)
            .where(eq(sql`designerid`, designer.id));

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
  app.post("/api/users/follow/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const designerId = parseInt(req.params.id);
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