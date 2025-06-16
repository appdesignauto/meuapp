import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { socialProfiles, socialGoals, socialProgress, insertSocialProfileSchema, insertSocialGoalSchema, insertSocialProgressSchema } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = Router();

// Middleware para verificar autenticação
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// GET /api/social-growth/profiles - Buscar perfis sociais do usuário
router.get('/profiles', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const profiles = await db
      .select()
      .from(socialProfiles)
      .where(eq(socialProfiles.userId, userId))
      .orderBy(desc(socialProfiles.createdAt));

    res.json(profiles);
  } catch (error) {
    console.error('Error fetching social profiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/social-growth/profiles - Criar novo perfil social
router.post('/profiles', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const validatedData = insertSocialProfileSchema.parse({
      ...req.body,
      userId
    });

    const [newProfile] = await db
      .insert(socialProfiles)
      .values(validatedData)
      .returning();

    res.status(201).json(newProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating social profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/social-growth/profiles/:id - Atualizar perfil social
router.put('/profiles/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const profileId = parseInt(req.params.id);
    
    const updateData = insertSocialProfileSchema.partial().parse(req.body);

    const [updatedProfile] = await db
      .update(socialProfiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(socialProfiles.id, profileId), eq(socialProfiles.userId, userId)))
      .returning();

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating social profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/social-growth/profiles/:id - Deletar perfil social
router.delete('/profiles/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const profileId = parseInt(req.params.id);

    const [deletedProfile] = await db
      .delete(socialProfiles)
      .where(and(eq(socialProfiles.id, profileId), eq(socialProfiles.userId, userId)))
      .returning();

    if (!deletedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting social profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/social-growth/goals - Buscar metas do usuário
router.get('/goals', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const goals = await db
      .select()
      .from(socialGoals)
      .where(eq(socialGoals.userId, userId))
      .orderBy(desc(socialGoals.createdAt));

    res.json(goals);
  } catch (error) {
    console.error('Error fetching social goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/social-growth/goals - Criar nova meta
router.post('/goals', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const validatedData = insertSocialGoalSchema.parse({
      ...req.body,
      userId,
      deadline: new Date(req.body.deadline)
    });

    const [newGoal] = await db
      .insert(socialGoals)
      .values(validatedData)
      .returning();

    res.status(201).json(newGoal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating social goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/social-growth/goals/:id - Atualizar meta
router.put('/goals/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);
    
    const updateData = insertSocialGoalSchema.partial().parse({
      ...req.body,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined
    });

    const [updatedGoal] = await db
      .update(socialGoals)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(socialGoals.id, goalId), eq(socialGoals.userId, userId)))
      .returning();

    if (!updatedGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(updatedGoal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating social goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/social-growth/goals/:id - Deletar meta
router.delete('/goals/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);

    const [deletedGoal] = await db
      .delete(socialGoals)
      .where(and(eq(socialGoals.id, goalId), eq(socialGoals.userId, userId)))
      .returning();

    if (!deletedGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting social goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/social-growth/progress - Buscar histórico de progresso
router.get('/progress', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const progress = await db
      .select()
      .from(socialProgress)
      .where(eq(socialProgress.userId, userId))
      .orderBy(desc(socialProgress.year), desc(socialProgress.month));

    res.json(progress);
  } catch (error) {
    console.error('Error fetching social progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/social-growth/progress - Criar/atualizar progresso mensal
router.post('/progress', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const validatedData = insertSocialProgressSchema.parse({
      ...req.body,
      userId
    });

    // Tentar atualizar se já existe, senão criar novo
    const existing = await db
      .select()
      .from(socialProgress)
      .where(
        and(
          eq(socialProgress.userId, userId),
          eq(socialProgress.platform, validatedData.platform),
          eq(socialProgress.month, validatedData.month),
          eq(socialProgress.year, validatedData.year)
        )
      );

    let result;
    if (existing.length > 0) {
      [result] = await db
        .update(socialProgress)
        .set({ 
          followers: validatedData.followers,
          sales: validatedData.sales,
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(socialProgress.userId, userId),
            eq(socialProgress.platform, validatedData.platform),
            eq(socialProgress.month, validatedData.month),
            eq(socialProgress.year, validatedData.year)
          )
        )
        .returning();
    } else {
      [result] = await db
        .insert(socialProgress)
        .values(validatedData)
        .returning();
    }

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating/updating social progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/social-growth/overview - Dados resumidos para dashboard
router.get('/overview', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar perfis ativos
    const profiles = await db
      .select()
      .from(socialProfiles)
      .where(and(eq(socialProfiles.userId, userId), eq(socialProfiles.isActive, true)));

    // Buscar metas ativas
    const goals = await db
      .select()
      .from(socialGoals)
      .where(and(eq(socialGoals.userId, userId), eq(socialGoals.isActive, true)));

    // Buscar progresso recente (últimos 6 meses)
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

    const recentProgress = await db
      .select()
      .from(socialProgress)
      .where(
        and(
          eq(socialProgress.userId, userId),
          sql`(${socialProgress.year} * 12 + ${socialProgress.month}) >= ${sixMonthsAgo.getFullYear() * 12 + sixMonthsAgo.getMonth()}`
        )
      )
      .orderBy(socialProgress.year, socialProgress.month);

    // Calcular totais e crescimento
    const totalFollowers = profiles.reduce((sum, profile) => sum + profile.currentFollowers, 0);
    const totalSales = recentProgress.reduce((sum, p) => sum + p.sales, 0);
    const connectedNetworks = profiles.length;
    const activeGoals = goals.filter(goal => new Date(goal.deadline) > currentDate).length;

    // Calcular crescimento mensal baseado nos dados mais recentes disponíveis
    // Ordenar por ano e mês em ordem decrescente para pegar os dois períodos mais recentes
    const sortedProgress = recentProgress.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Agrupar por período (ano/mês) para pegar os dois períodos mais recentes
    const periodsMap = new Map();
    sortedProgress.forEach(p => {
      const key = `${p.year}-${p.month}`;
      if (!periodsMap.has(key)) {
        periodsMap.set(key, []);
      }
      periodsMap.get(key).push(p);
    });

    const periods = Array.from(periodsMap.entries()).sort((a, b) => {
      const [yearA, monthA] = a[0].split('-').map(Number);
      const [yearB, monthB] = b[0].split('-').map(Number);
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });

    let currentFollowers = 0;
    let previousFollowers = 0;
    let currentSales = 0;
    let previousSales = 0;

    if (periods.length >= 1) {
      // Período mais recente
      const currentPeriodData = periods[0][1];
      currentFollowers = currentPeriodData.reduce((sum, p) => sum + p.followers, 0);
      currentSales = currentPeriodData.reduce((sum, p) => sum + p.sales, 0);
    }

    if (periods.length >= 2) {
      // Período anterior
      const previousPeriodData = periods[1][1];
      previousFollowers = previousPeriodData.reduce((sum, p) => sum + p.followers, 0);
      previousSales = previousPeriodData.reduce((sum, p) => sum + p.sales, 0);
    }

    const monthlyGrowth = previousFollowers > 0 ? ((currentFollowers - previousFollowers) / previousFollowers) * 100 : 0;
    const salesGrowth = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0;

    res.json({
      totalFollowers,
      totalSales,
      connectedNetworks,
      activeGoals,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      salesGrowth: Math.round(salesGrowth * 10) / 10,
      profiles,
      goals,
      progressData: recentProgress
    });
  } catch (error) {
    console.error('Error fetching social growth overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;