import express from 'express';
import { db } from '../db';
import { socialNetworks, socialGrowthData, socialGoals, insertSocialNetworkSchema, insertSocialGrowthDataSchema, insertSocialGoalSchema } from '@shared/schema';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Middleware para verificar autenticação
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  next();
};

// GET /api/social-growth/networks - Listar redes sociais do usuário
router.get('/networks', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const networks = await db
      .select()
      .from(socialNetworks)
      .where(eq(socialNetworks.userId, userId))
      .orderBy(asc(socialNetworks.platform));

    res.json(networks);
  } catch (error) {
    console.error('Erro ao buscar redes sociais:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/social-growth/networks - Adicionar nova rede social
router.post('/networks', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const validatedData = insertSocialNetworkSchema.parse({
      ...req.body,
      userId
    });

    // Verificar se já existe uma rede com a mesma plataforma e username
    const existing = await db
      .select()
      .from(socialNetworks)
      .where(
        and(
          eq(socialNetworks.userId, userId),
          eq(socialNetworks.platform, validatedData.platform),
          eq(socialNetworks.username, validatedData.username)
        )
      );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Rede social já cadastrada' });
    }

    const [network] = await db
      .insert(socialNetworks)
      .values(validatedData)
      .returning();

    res.status(201).json(network);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao criar rede social:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/social-growth/networks/:id - Atualizar rede social
router.put('/networks/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const networkId = parseInt(req.params.id);
    
    const updateSchema = insertSocialNetworkSchema.partial().omit({ userId: true });
    const validatedData = updateSchema.parse(req.body);

    const [updated] = await db
      .update(socialNetworks)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(socialNetworks.id, networkId),
          eq(socialNetworks.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ message: 'Rede social não encontrada' });
    }

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao atualizar rede social:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/social-growth/networks/:id - Remover rede social
router.delete('/networks/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const networkId = parseInt(req.params.id);

    const [deleted] = await db
      .delete(socialNetworks)
      .where(
        and(
          eq(socialNetworks.id, networkId),
          eq(socialNetworks.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: 'Rede social não encontrada' });
    }

    res.json({ message: 'Rede social removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover rede social:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/social-growth/history - Obter todo o histórico do usuário
router.get('/history', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const data = await db
      .select({
        id: socialGrowthData.id,
        socialNetworkId: socialGrowthData.socialNetworkId,
        recordDate: socialGrowthData.recordDate,
        followers: socialGrowthData.followers,
        averageLikes: socialGrowthData.averageLikes,
        averageComments: socialGrowthData.averageComments,
        salesFromPlatform: socialGrowthData.salesFromPlatform,
        usedDesignAutoArts: socialGrowthData.usedDesignAutoArts,
        notes: socialGrowthData.notes,
        networkPlatform: socialNetworks.platform,
        networkUsername: socialNetworks.username
      })
      .from(socialGrowthData)
      .innerJoin(socialNetworks, eq(socialGrowthData.socialNetworkId, socialNetworks.id))
      .where(eq(socialNetworks.userId, userId))
      .orderBy(desc(socialGrowthData.recordDate));

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/social-growth/data/:networkId - Obter dados de crescimento
router.get('/data/:networkId', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const networkId = parseInt(req.params.networkId);
    const { startDate, endDate } = req.query;

    // Verificar se a rede pertence ao usuário
    const network = await db
      .select()
      .from(socialNetworks)
      .where(
        and(
          eq(socialNetworks.id, networkId),
          eq(socialNetworks.userId, userId)
        )
      );

    if (network.length === 0) {
      return res.status(404).json({ message: 'Rede social não encontrada' });
    }

    let query = db
      .select()
      .from(socialGrowthData)
      .where(eq(socialGrowthData.socialNetworkId, networkId));

    if (startDate) {
      query = query.where(gte(socialGrowthData.recordDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(socialGrowthData.recordDate, endDate));
    }

    const data = await query.orderBy(asc(socialGrowthData.recordDate));

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados de crescimento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/social-growth/data - Adicionar dados de crescimento
router.post('/data', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const validatedData = insertSocialGrowthDataSchema.parse({
      ...req.body,
      userId
    });

    // Verificar se a rede pertence ao usuário
    const network = await db
      .select()
      .from(socialNetworks)
      .where(
        and(
          eq(socialNetworks.id, validatedData.socialNetworkId),
          eq(socialNetworks.userId, userId)
        )
      );

    if (network.length === 0) {
      return res.status(404).json({ message: 'Rede social não encontrada' });
    }

    // Verificar se já existe dados para esta data
    const existing = await db
      .select()
      .from(socialGrowthData)
      .where(
        and(
          eq(socialGrowthData.socialNetworkId, validatedData.socialNetworkId),
          eq(socialGrowthData.recordDate, validatedData.recordDate)
        )
      );

    if (existing.length > 0) {
      // Atualizar dados existentes
      const [updated] = await db
        .update(socialGrowthData)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(socialGrowthData.socialNetworkId, validatedData.socialNetworkId),
            eq(socialGrowthData.recordDate, validatedData.recordDate)
          )
        )
        .returning();

      return res.json(updated);
    } else {
      // Criar novos dados
      const [created] = await db
        .insert(socialGrowthData)
        .values(validatedData)
        .returning();

      return res.status(201).json(created);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao salvar dados de crescimento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/social-growth/data/:id - Atualizar dados de crescimento
router.put('/data/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const dataId = parseInt(req.params.id);
    const validatedData = insertSocialGrowthDataSchema.parse({
      ...req.body,
      userId
    });

    // Verificar se os dados pertencem ao usuário
    const existingData = await db
      .select()
      .from(socialGrowthData)
      .innerJoin(socialNetworks, eq(socialGrowthData.socialNetworkId, socialNetworks.id))
      .where(
        and(
          eq(socialGrowthData.id, dataId),
          eq(socialNetworks.userId, userId)
        )
      );

    if (existingData.length === 0) {
      return res.status(404).json({ message: 'Dados não encontrados' });
    }

    const [updated] = await db
      .update(socialGrowthData)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(socialGrowthData.id, dataId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/social-growth/data/:id - Excluir dados de crescimento
router.delete('/data/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const dataId = parseInt(req.params.id);

    // Verificar se os dados pertencem ao usuário
    const existingData = await db
      .select()
      .from(socialGrowthData)
      .innerJoin(socialNetworks, eq(socialGrowthData.socialNetworkId, socialNetworks.id))
      .where(
        and(
          eq(socialGrowthData.id, dataId),
          eq(socialNetworks.userId, userId)
        )
      );

    if (existingData.length === 0) {
      return res.status(404).json({ message: 'Dados não encontrados' });
    }

    await db
      .delete(socialGrowthData)
      .where(eq(socialGrowthData.id, dataId));

    res.json({ message: 'Dados excluídos com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir dados:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/social-growth/analytics - Obter análises de crescimento
router.get('/analytics', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { period = '6' } = req.query; // Período em meses

    const monthsAgo = parseInt(period as string);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsAgo);
    
    // Buscar todas as redes do usuário
    const userNetworks = await db
      .select()
      .from(socialNetworks)
      .where(eq(socialNetworks.userId, userId));

    if (userNetworks.length === 0) {
      return res.json({
        totalNetworks: 0,
        totalFollowers: 0,
        monthlyGrowth: 0,
        platforms: [],
        growthTrend: []
      });
    }

    const networkIds = userNetworks.map(n => n.id);

    // Dados mais recentes por rede
    const latestData = await db
      .select({
        socialNetworkId: socialGrowthData.socialNetworkId,
        platform: socialNetworks.platform,
        username: socialNetworks.username,
        followers: socialGrowthData.followers,
        recordDate: socialGrowthData.recordDate,
        salesFromPlatform: socialGrowthData.salesFromPlatform
      })
      .from(socialGrowthData)
      .innerJoin(socialNetworks, eq(socialGrowthData.socialNetworkId, socialNetworks.id))
      .where(
        and(
          eq(socialNetworks.userId, userId),
          gte(socialGrowthData.recordDate, startDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(socialGrowthData.recordDate));

    // Agrupar por plataforma
    const platforms = userNetworks.reduce((acc, network) => {
      const networkData = latestData.filter(d => d.socialNetworkId === network.id);
      const totalFollowers = networkData.reduce((sum, d) => sum + d.followers, 0);
      const totalSales = networkData.reduce((sum, d) => sum + (d.salesFromPlatform || 0), 0);

      acc.push({
        platform: network.platform,
        username: network.username,
        followers: totalFollowers,
        sales: totalSales,
        lastUpdate: networkData[0]?.recordDate || null
      });

      return acc;
    }, [] as any[]);

    // Calcular totais
    const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);
    const totalSales = platforms.reduce((sum, p) => sum + p.sales, 0);

    // Tendência de crescimento (últimos 6 meses)
    const growthTrend = await db
      .select({
        month: sql<string>`to_char(${socialGrowthData.recordDate}, 'YYYY-MM')`,
        totalFollowers: sql<number>`sum(${socialGrowthData.followers})`,
        totalSales: sql<number>`sum(${socialGrowthData.salesFromPlatform})`
      })
      .from(socialGrowthData)
      .innerJoin(socialNetworks, eq(socialGrowthData.socialNetworkId, socialNetworks.id))
      .where(
        and(
          eq(socialNetworks.userId, userId),
          gte(socialGrowthData.recordDate, startDate.toISOString().split('T')[0])
        )
      )
      .groupBy(sql`to_char(${socialGrowthData.recordDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${socialGrowthData.recordDate}, 'YYYY-MM')`);

    // Calcular crescimento mensal
    let monthlyGrowth = 0;
    if (growthTrend.length >= 2) {
      const current = growthTrend[growthTrend.length - 1]?.totalFollowers || 0;
      const previous = growthTrend[growthTrend.length - 2]?.totalFollowers || 0;
      monthlyGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    }

    // Buscar metas ativas (não expiradas)
    const activeGoals = await db
      .select({
        id: socialGoals.id,
        goalType: socialGoals.goalType,
        deadline: socialGoals.deadline
      })
      .from(socialGoals)
      .innerJoin(socialNetworks, eq(socialGoals.networkId, socialNetworks.id))
      .where(
        and(
          eq(socialNetworks.userId, userId),
          gte(socialGoals.deadline, new Date().toISOString().split('T')[0])
        )
      );

    // Organizar dados por plataforma específica
    const platformSpecific = {
      instagram: platforms.find(p => p.platform === 'instagram')?.followers || 0,
      facebook: platforms.find(p => p.platform === 'facebook')?.followers || 0,
      tiktok: platforms.find(p => p.platform === 'tiktok')?.followers || 0,
      youtube: platforms.find(p => p.platform === 'youtube')?.followers || 0,
      linkedin: platforms.find(p => p.platform === 'linkedin')?.followers || 0,
      twitter: platforms.find(p => p.platform === 'twitter')?.followers || 0
    };

    res.json({
      totalNetworks: userNetworks.length,
      totalFollowers,
      totalSales,
      activeGoals: activeGoals.length,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      platforms: platforms.sort((a, b) => b.followers - a.followers),
      platformSpecific,
      growthTrend: growthTrend.map(item => ({
        month: item.month,
        followers: item.totalFollowers || 0,
        sales: item.totalSales || 0
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ROTAS PARA METAS SOCIAIS =====

// GET /api/social-growth/goals - Listar metas do usuário
router.get('/goals', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const goals = await db
      .select({
        id: socialGoals.id,
        goalType: socialGoals.goalType,
        targetValue: socialGoals.targetValue,
        deadline: socialGoals.deadline,
        description: socialGoals.description,
        isActive: socialGoals.isActive,
        createdAt: socialGoals.createdAt,
        network: {
          id: socialNetworks.id,
          platform: socialNetworks.platform,
          username: socialNetworks.username
        }
      })
      .from(socialGoals)
      .innerJoin(socialNetworks, eq(socialGoals.networkId, socialNetworks.id))
      .where(
        and(
          eq(socialGoals.userId, userId),
          eq(socialGoals.isActive, true)
        )
      )
      .orderBy(asc(socialGoals.deadline));

    // Buscar progresso atual para cada meta
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        let currentValue = 0;
        
        // Buscar valor atual baseado no tipo de meta
        if (goal.goalType === 'followers') {
          const latestData = await db
            .select({ followers: socialGrowthData.followers })
            .from(socialGrowthData)
            .where(eq(socialGrowthData.socialNetworkId, goal.network.id))
            .orderBy(desc(socialGrowthData.recordDate))
            .limit(1);
          
          currentValue = latestData[0]?.followers || 0;
        } else if (goal.goalType === 'sales') {
          const salesData = await db
            .select({ sales: sql<number>`sum(${socialGrowthData.salesFromPlatform})` })
            .from(socialGrowthData)
            .where(
              and(
                eq(socialGrowthData.socialNetworkId, goal.network.id),
                gte(socialGrowthData.recordDate, new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
              )
            );
          
          currentValue = salesData[0]?.sales || 0;
        } else if (goal.goalType === 'engagement') {
          const engagementData = await db
            .select({ 
              avgLikes: sql<number>`avg(${socialGrowthData.averageLikes})`,
              avgComments: sql<number>`avg(${socialGrowthData.averageComments})`
            })
            .from(socialGrowthData)
            .where(
              and(
                eq(socialGrowthData.socialNetworkId, goal.network.id),
                gte(socialGrowthData.recordDate, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              )
            );
          
          currentValue = Math.round((engagementData[0]?.avgLikes || 0) + (engagementData[0]?.avgComments || 0));
        }

        // Calcular progresso
        const progress = goal.targetValue > 0 ? Math.min((currentValue / goal.targetValue) * 100, 100) : 0;
        
        // Calcular dias restantes
        const today = new Date();
        const deadline = new Date(goal.deadline);
        const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determinar se precisa de atenção (meta não atingida e prazo próximo)
        const needsAttention = progress < 70 && daysRemaining <= 30 && daysRemaining > 0;
        
        return {
          ...goal,
          currentValue,
          progress: Math.round(progress * 100) / 100,
          daysRemaining,
          needsAttention
        };
      })
    );

    res.json(goalsWithProgress);
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/social-growth/goals - Criar nova meta
router.post('/goals', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const validatedData = insertSocialGoalSchema.parse({
      ...req.body,
      userId
    });

    // Verificar se a rede social pertence ao usuário
    const network = await db
      .select()
      .from(socialNetworks)
      .where(
        and(
          eq(socialNetworks.id, validatedData.networkId),
          eq(socialNetworks.userId, userId)
        )
      )
      .limit(1);

    if (network.length === 0) {
      return res.status(404).json({ message: 'Rede social não encontrada' });
    }

    // Verificar se já existe uma meta ativa do mesmo tipo para a mesma rede
    const existingGoal = await db
      .select()
      .from(socialGoals)
      .where(
        and(
          eq(socialGoals.userId, userId),
          eq(socialGoals.networkId, validatedData.networkId),
          eq(socialGoals.goalType, validatedData.goalType),
          eq(socialGoals.isActive, true)
        )
      )
      .limit(1);

    if (existingGoal.length > 0) {
      return res.status(400).json({ 
        message: 'Já existe uma meta ativa deste tipo para esta rede social' 
      });
    }

    const [newGoal] = await db
      .insert(socialGoals)
      .values(validatedData)
      .returning();

    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/social-growth/goals/:id - Atualizar meta
router.put('/goals/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);

    if (isNaN(goalId)) {
      return res.status(400).json({ message: 'ID da meta inválido' });
    }

    // Verificar se a meta pertence ao usuário
    const existingGoal = await db
      .select()
      .from(socialGoals)
      .where(
        and(
          eq(socialGoals.id, goalId),
          eq(socialGoals.userId, userId)
        )
      )
      .limit(1);

    if (existingGoal.length === 0) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }

    const updateData = insertSocialGoalSchema.partial().parse(req.body);

    const [updatedGoal] = await db
      .update(socialGoals)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(socialGoals.id, goalId))
      .returning();

    res.json(updatedGoal);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/social-growth/goals/:id - Desativar meta
router.delete('/goals/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);

    if (isNaN(goalId)) {
      return res.status(400).json({ message: 'ID da meta inválido' });
    }

    // Verificar se a meta pertence ao usuário
    const existingGoal = await db
      .select()
      .from(socialGoals)
      .where(
        and(
          eq(socialGoals.id, goalId),
          eq(socialGoals.userId, userId)
        )
      )
      .limit(1);

    if (existingGoal.length === 0) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }

    // Desativar a meta ao invés de deletar
    await db
      .update(socialGoals)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(socialGoals.id, goalId));

    res.json({ message: 'Meta desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar meta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;