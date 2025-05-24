import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  users, 
  communityPosts, 
  communityComments, 
  communityLikes,
  communitySaves,
  communityPoints,
  communityLeaderboard,
  communitySettings,
  communityCommentLikes,
  userFollows
} from '../../shared/schema';
import { eq, and, gt, gte, lte, desc, asc, sql, inArray, count as countFn, or, ilike } from 'drizzle-orm';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { communityStorageService } from '../services/community-storage';

const router = Router();

// Tipos para corrigir problemas de TypeScript
interface DatabaseRow {
  [key: string]: any;
}

interface UserData {
  id: number;
  username: string;
  name: string;
  profileimageurl?: string;
  role?: string;
  nivelacesso?: string;
}

interface PostData {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  userId: number;
  status: string;
  createdAt: string | Date;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  isPinned?: boolean;
  editLink?: string;
}

/**
 * Função formatarDataCompleta
 * Formata uma data no formato completo para exibição no frontend
 */
function formatarDataCompleta(dateString: string | Date | null | undefined): string {
  if (!dateString) return "Data não disponível";
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      console.error("Data inválida:", dateString);
      return "Data não disponível";
    }
    
    const agora = new Date();
    const diff = agora.getTime() - date.getTime();
    
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (segundos < 60) {
      return "Agora mesmo";
    } else if (minutos < 60) {
      return minutos === 1 ? "Há 1 minuto" : `Há ${minutos} minutos`;
    } else if (horas < 24) {
      return horas === 1 ? "Há 1 hora" : `Há ${horas} horas`;
    } else if (dias < 7) {
      return dias === 1 ? "Há 1 dia" : `Há ${dias} dias`;
    } else {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo'
      }).format(date);
    }
  } catch (error) {
    console.error("Erro ao formatar data:", error, "Data:", dateString);
    return "Data não disponível";
  }
}

// GET: Buscar contagem total de posts na comunidade
router.get('/api/community/stats', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as total_posts
      FROM "communityPosts"
      WHERE status = 'approved'
    `);
    
    const totalPosts = Number((result.rows[0] as DatabaseRow)?.total_posts || 0);
    
    res.json({ totalPosts });
  } catch (error) {
    console.error('Erro ao buscar estatísticas da comunidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET: Buscar posts populares (nova URL)
router.get('/api/community/populares', async (req: Request, res: Response) => {
  try {
    console.log("==== BUSCANDO POSTS POPULARES (NOVA URL) ====");
    
    const limit = parseInt(String(req.query.limit || '5'));
    const validLimit = Math.min(Math.max(limit, 1), 50);
    console.log("Limite validado:", validLimit);
    
    const result = await db.execute(sql`
      SELECT 
        cp.id,
        cp.title,
        cp.content,
        cp."imageUrl",
        cp."userId",
        cp.status,
        cp."createdAt",
        cp."viewCount",
        cp."likeCount",
        cp."commentCount",
        COALESCE(cp."isPinned", false)::boolean as "isPinned",
        cp."editLink",
        u.username,
        u.name,
        u.profileimageurl,
        u.role,
        u.nivelacesso
      FROM "communityPosts" cp
      JOIN users u ON cp."userId" = u.id
      WHERE cp.status = 'approved'
      ORDER BY cp."likeCount" DESC, cp."viewCount" DESC, cp."createdAt" DESC
      LIMIT ${validLimit}
    `);
    
    const posts = result.rows.map((row: DatabaseRow) => ({
      post: {
        id: Number(row.id),
        title: String(row.title || ''),
        content: String(row.content || ''),
        imageUrl: row.imageUrl ? String(row.imageUrl) : null,
        userId: Number(row.userId),
        status: String(row.status || 'pending'),
        createdAt: String(row.createdAt || ''),
        viewCount: Number(row.viewCount || 0),
        likeCount: Number(row.likeCount || 0),
        commentCount: Number(row.commentCount || 0),
        isPinned: Boolean(row.isPinned),
        editLink: row.editLink ? String(row.editLink) : null,
        timeAgo: formatarDataCompleta(row.createdAt)
      },
      user: {
        id: Number(row.userId),
        username: String(row.username || ''),
        name: String(row.name || ''),
        profileimageurl: row.profileimageurl ? String(row.profileimageurl) : null,
        role: String(row.role || 'user'),
        nivelacesso: String(row.nivelacesso || 'free')
      }
    }));
    
    console.log(`Retornando ${posts.length} posts populares (nova URL)`);
    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts populares:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET: Buscar todos os posts
router.get('/api/community/posts', async (req: Request, res: Response) => {
  try {
    const userId = req.user ? Number(req.user.id) : null;
    const limit = parseInt(String(req.query.limit || '10'));
    const offset = parseInt(String(req.query.offset || '0'));
    const sort = String(req.query.sort || 'recent');
    
    const validLimit = Math.min(Math.max(limit, 1), 50);
    const validOffset = Math.max(offset, 0);
    
    let orderBy = 'cp."createdAt" DESC';
    if (sort === 'popular') {
      orderBy = 'cp."likeCount" DESC, cp."viewCount" DESC, cp."createdAt" DESC';
    } else if (sort === 'oldest') {
      orderBy = 'cp."createdAt" ASC';
    }
    
    const result = await db.execute(sql`
      SELECT 
        cp.id,
        cp.title,
        cp.content,
        cp."imageUrl",
        cp."userId",
        cp.status,
        cp."createdAt",
        cp."viewCount",
        cp."likeCount",
        cp."commentCount",
        COALESCE(cp."isPinned", false)::boolean as "isPinned",
        cp."editLink",
        u.username,
        u.name,
        u.profileimageurl,
        u.role,
        u.nivelacesso,
        ${userId ? sql`EXISTS(
          SELECT 1 FROM "communityLikes" cl 
          WHERE cl."postId" = cp.id AND cl."userId" = ${userId}
        ) as "isLiked",
        EXISTS(
          SELECT 1 FROM "communitySaves" cs 
          WHERE cs."postId" = cp.id AND cs."userId" = ${userId}
        ) as "isSaved"` : sql`false as "isLiked", false as "isSaved"`}
      FROM "communityPosts" cp
      JOIN users u ON cp."userId" = u.id
      WHERE cp.status = 'approved'
      ORDER BY 
        CASE WHEN COALESCE(cp."isPinned", false) = true THEN 0 ELSE 1 END,
        ${sql.raw(orderBy)}
      LIMIT ${validLimit} OFFSET ${validOffset}
    `);
    
    const posts = result.rows.map((row: DatabaseRow) => ({
      post: {
        id: Number(row.id),
        userId: Number(row.userId),
        title: String(row.title || ''),
        content: String(row.content || ''),
        imageUrl: row.imageUrl ? String(row.imageUrl) : null,
        status: String(row.status || 'pending'),
        createdAt: String(row.createdAt || ''),
        viewCount: Number(row.viewCount || 0),
        likeCount: Number(row.likeCount || 0),
        commentCount: Number(row.commentCount || 0),
        isPinned: Boolean(row.isPinned),
        editLink: row.editLink ? String(row.editLink) : null,
        timeAgo: formatarDataCompleta(row.createdAt),
        isLiked: Boolean(row.isLiked),
        isSaved: Boolean(row.isSaved)
      },
      user: {
        id: Number(row.userId),
        username: String(row.username || ''),
        name: String(row.name || ''),
        profileimageurl: row.profileimageurl ? String(row.profileimageurl) : null,
        role: String(row.role || 'user'),
        nivelacesso: String(row.nivelacesso || 'free')
      }
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Exportar o router
export default router;