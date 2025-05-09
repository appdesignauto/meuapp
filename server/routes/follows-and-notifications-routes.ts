import { Router, Request, Response } from "express";
import { and, count, desc, eq, exists, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  userFollows,
  notifications,
  users,
  communityPosts,
  InsertUserFollow,
  communityComments,
  insertUserFollowSchema,
  insertNotificationSchema,
} from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../auth";

// Função para verificar se um userId é válido
async function isValidUserId(userId: number): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  
  return !!user;
}

// Função para verificar se um usuário segue outro
async function isFollowing(followerId: number, followedId: number): Promise<boolean> {
  const follow = await db.query.userFollows.findFirst({
    where: and(
      eq(userFollows.followerId, followerId),
      eq(userFollows.followedId, followedId)
    ),
  });
  
  return !!follow;
}

export const registerFollowAndNotificationRoutes = (router: Router) => {
  // Rota para seguir um usuário
  router.post("/follows", auth, async (req: Request, res: Response) => {
    try {
      // Validar corpo da requisição
      const parsed = insertUserFollowSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: parsed.error.format() 
        });
      }
      
      const followerId = req.user!.id;
      const followedId = parsed.data.followedId;
      
      // Não permitir seguir a si mesmo
      if (followerId === followedId) {
        return res.status(400).json({ 
          error: "Você não pode seguir a si mesmo" 
        });
      }
      
      // Verificar se o usuário a ser seguido existe
      if (!(await isValidUserId(followedId))) {
        return res.status(404).json({ 
          error: "Usuário não encontrado" 
        });
      }

      // Verificar se já segue
      if (await isFollowing(followerId, followedId)) {
        return res.status(400).json({ 
          error: "Você já segue este usuário" 
        });
      }
      
      // Criar a relação de seguidor
      const [follow] = await db.insert(userFollows)
        .values({
          followerId,
          followedId,
        })
        .returning();
      
      // Criar uma notificação para o usuário que está sendo seguido
      await db.insert(notifications)
        .values({
          userId: followedId,
          type: "new_follower",
          content: `${req.user!.username} começou a seguir você`,
          sourceUserId: followerId,
          read: false,
        });
      
      // Buscar dados do usuário seguido para retornar informações completas
      const followedUser = await db.query.users.findFirst({
        where: eq(users.id, followedId),
        columns: {
          id: true,
          username: true,
          name: true,
          profileimageurl: true,
          nivelacesso: true,
        },
      });
      
      res.status(201).json({
        follow,
        followedUser,
      });
    } catch (error) {
      console.error("Erro ao seguir usuário:", error);
      res.status(500).json({ error: "Erro ao seguir usuário" });
    }
  });

  // Rota para deixar de seguir um usuário
  router.delete("/follows/:followedId", auth, async (req: Request, res: Response) => {
    try {
      const followerId = req.user!.id;
      const followedId = parseInt(req.params.followedId);
      
      if (isNaN(followedId)) {
        return res.status(400).json({ error: "ID de usuário inválido" });
      }

      // Verificar se a relação existe
      if (!(await isFollowing(followerId, followedId))) {
        return res.status(404).json({ error: "Você não segue este usuário" });
      }
      
      // Remover a relação
      await db.delete(userFollows)
        .where(and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followedId, followedId)
        ));

      res.status(200).json({ success: true, message: "Deixou de seguir com sucesso" });
    } catch (error) {
      console.error("Erro ao deixar de seguir usuário:", error);
      res.status(500).json({ error: "Erro ao deixar de seguir usuário" });
    }
  });

  // Rota para verificar se o usuário segue outro usuário
  router.get("/follows/check/:followedId", auth, async (req: Request, res: Response) => {
    try {
      const followerId = req.user!.id;
      const followedId = parseInt(req.params.followedId);
      
      if (isNaN(followedId)) {
        return res.status(400).json({ error: "ID de usuário inválido" });
      }
      
      const isUserFollowing = await isFollowing(followerId, followedId);
      
      res.status(200).json({ isFollowing: isUserFollowing });
    } catch (error) {
      console.error("Erro ao verificar relação de seguidor:", error);
      res.status(500).json({ error: "Erro ao verificar relação de seguidor" });
    }
  });

  // Rota para listar os usuários que o usuário segue
  router.get("/follows/following", auth, async (req: Request, res: Response) => {
    try {
      const followerId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Buscar os usuários seguidos com informações de perfil
      const following = await db.select({
        followId: userFollows.id,
        followedId: userFollows.followedId,
        createdAt: userFollows.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          nivelacesso: users.nivelacesso,
        }
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followedId, users.id))
      .where(eq(userFollows.followerId, followerId))
      .orderBy(desc(userFollows.createdAt))
      .limit(limit)
      .offset(offset);
      
      // Contar o total de usuários seguidos para paginação
      const [{ total }] = await db
        .select({ total: count(userFollows.id) })
        .from(userFollows)
        .where(eq(userFollows.followerId, followerId));

      res.status(200).json({
        following,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      console.error("Erro ao listar usuários seguidos:", error);
      res.status(500).json({ error: "Erro ao listar usuários seguidos" });
    }
  });

  // Rota para listar os seguidores do usuário
  router.get("/follows/followers", auth, async (req: Request, res: Response) => {
    try {
      const followedId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Buscar os seguidores com informações de perfil
      const followers = await db.select({
        followId: userFollows.id,
        followerId: userFollows.followerId,
        createdAt: userFollows.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          nivelacesso: users.nivelacesso,
        }
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followedId, followedId))
      .orderBy(desc(userFollows.createdAt))
      .limit(limit)
      .offset(offset);
      
      // Contar o total de seguidores para paginação
      const [{ total }] = await db
        .select({ total: count2(userFollows.id) })
        .from(userFollows)
        .where(eq(userFollows.followedId, followedId));

      res.status(200).json({
        followers,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      console.error("Erro ao listar seguidores:", error);
      res.status(500).json({ error: "Erro ao listar seguidores" });
    }
  });

  // Rota para listar as notificações do usuário
  router.get("/notifications", auth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const unreadOnly = req.query.unread === "true";
      
      // Construir a condição onde baseada no parâmetro unreadOnly
      const whereClause = unreadOnly
        ? and(eq(notifications.userId, userId), eq(notifications.read, false))
        : eq(notifications.userId, userId);
      
      // Buscar as notificações com informações relacionadas
      const userNotifications = await db.select({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        read: notifications.read,
        createdAt: notifications.createdAt,
        sourceUser: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
        },
        relatedPostId: notifications.relatedPostId,
        relatedCommentId: notifications.relatedCommentId,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.sourceUserId, users.id))
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
      
      // Contar o total de notificações para paginação
      const [{ total }] = await db
        .select({ total: count2(notifications.id) })
        .from(notifications)
        .where(whereClause);

      // Contar o total de notificações não lidas
      const [{ unreadCount }] = await db
        .select({ unreadCount: count2(notifications.id) })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ));

      res.status(200).json({
        notifications: userNotifications,
        unreadCount,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      console.error("Erro ao listar notificações:", error);
      res.status(500).json({ error: "Erro ao listar notificações" });
    }
  });

  // Rota para marcar notificações como lidas
  router.post("/notifications/mark-read", auth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const schema = z.object({
        notificationIds: z.array(z.number()).optional(),
        all: z.boolean().optional(),
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: parsed.error.format() 
        });
      }
      
      const { notificationIds, all } = parsed.data;
      
      if (all) {
        // Marcar todas as notificações como lidas
        await db.update(notifications)
          .set({ read: true })
          .where(and(
            eq(notifications.userId, userId),
            eq(notifications.read, false)
          ));
      } else if (notificationIds && notificationIds.length > 0) {
        // Marcar apenas as notificações especificadas como lidas
        await db.update(notifications)
          .set({ read: true })
          .where(and(
            eq(notifications.userId, userId),
            eq(notifications.read, false),
            sql`${notifications.id} IN (${notificationIds.join(",")})`
          ));
      } else {
        return res.status(400).json({ 
          error: "Você deve especificar notificationIds ou all=true" 
        });
      }
      
      // Retornar o número de notificações não lidas atualizado
      const [{ unreadCount }] = await db
        .select({ unreadCount: count2(notifications.id) })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ));
      
      res.status(200).json({ 
        success: true, 
        message: "Notificações marcadas como lidas com sucesso",
        unreadCount
      });
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error);
      res.status(500).json({ error: "Erro ao marcar notificações como lidas" });
    }
  });

  // Rota para obter o contador de notificações não lidas
  router.get("/notifications/unread-count", auth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Contar o total de notificações não lidas
      const [{ unreadCount }] = await db
        .select({ unreadCount: count2(notifications.id) })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ));
      
      res.status(200).json({ unreadCount });
    } catch (error) {
      console.error("Erro ao obter contador de notificações não lidas:", error);
      res.status(500).json({ error: "Erro ao obter contador de notificações não lidas" });
    }
  });
};