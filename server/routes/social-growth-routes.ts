import { Router } from "express";
import { db } from "../db.js";
import { socialProfiles, socialGoals, socialProgress, users } from "../../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

// Middleware para verificar autenticação
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
};

// GET /api/social-growth/overview - Visão geral do crescimento social
router.get("/overview", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Buscar perfis do usuário
    const profiles = await db
      .select()
      .from(socialProfiles)
      .where(eq(socialProfiles.userId, userId));

    // Buscar metas ativas
    const goals = await db
      .select()
      .from(socialGoals)
      .where(and(
        eq(socialGoals.userId, userId),
        eq(socialGoals.status, "active")
      ));

    // Buscar dados de progresso dos últimos 6 meses
    const progressData = await db
      .select()
      .from(socialProgress)
      .where(eq(socialProgress.userId, userId))
      .orderBy(desc(socialProgress.monthYear));

    // Calcular métricas principais
    const totalFollowers = profiles.reduce((sum, profile) => sum + (profile.followersCount || 0), 0);
    const totalSales = progressData.reduce((sum, data) => sum + (data.salesCount || 0), 0);
    const metasAtivas = goals.length;
    const redesConectadas = profiles.filter(p => p.isActive).length;

    // Calcular crescimento mensal
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const currentData = progressData.filter(d => d.monthYear === currentMonth);
    const lastData = progressData.filter(d => d.monthYear === lastMonth);

    const currentFollowers = currentData.reduce((sum, d) => sum + (d.followersCount || 0), 0);
    const lastFollowers = lastData.reduce((sum, d) => sum + (d.followersCount || 0), 0);
    const followersGrowth = lastFollowers > 0 ? ((currentFollowers - lastFollowers) / lastFollowers * 100) : 0;

    const currentSales = currentData.reduce((sum, d) => sum + (d.salesCount || 0), 0);
    const lastSales = lastData.reduce((sum, d) => sum + (d.salesCount || 0), 0);
    const salesGrowth = lastSales > 0 ? ((currentSales - lastSales) / lastSales * 100) : 0;

    // Dados por plataforma
    const instagramProfile = profiles.find(p => p.platform === 'instagram');
    const facebookProfile = profiles.find(p => p.platform === 'facebook');

    const instagramData = progressData.filter(d => d.platform === 'instagram').slice(0, 6);
    const facebookData = progressData.filter(d => d.platform === 'facebook').slice(0, 6);

    res.json({
      metrics: {
        totalFollowers,
        followersGrowth: Math.round(followersGrowth * 10) / 10,
        totalSales,
        salesGrowth: Math.round(salesGrowth * 10) / 10,
        metasAtivas,
        redesConectadas
      },
      platforms: {
        instagram: {
          followers: instagramProfile?.followersCount || 0,
          username: instagramProfile?.username || '',
          monthlyGrowth: calculateMonthlyGrowth(instagramData, 'followers'),
          weeklyGrowth: calculateWeeklyGrowth(instagramData, 'followers'),
          dailyAverage: calculateDailyAverage(instagramData, 'followers')
        },
        facebook: {
          followers: facebookProfile?.followersCount || 0,
          username: facebookProfile?.username || '',
          monthlyGrowth: calculateMonthlyGrowth(facebookData, 'followers'),
          weeklyGrowth: calculateWeeklyGrowth(facebookData, 'followers'),
          dailyAverage: calculateDailyAverage(facebookData, 'followers')
        }
      },
      goals: goals.map(goal => ({
        ...goal,
        progress: goal.targetValue > 0 ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0
      })),
      chartData: {
        followers: generateChartData(instagramData, facebookData, 'followers'),
        sales: generateChartData(instagramData, facebookData, 'sales')
      },
      monthlyComparison: generateMonthlyComparison(progressData)
    });

  } catch (error) {
    console.error("Erro ao buscar visão geral:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/social-growth/profiles - Listar perfis de redes sociais
router.get("/profiles", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const profiles = await db
      .select()
      .from(socialProfiles)
      .where(eq(socialProfiles.userId, userId))
      .orderBy(desc(socialProfiles.createdAt));

    res.json(profiles);
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/social-growth/profiles - Adicionar nova rede social
router.post("/profiles", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { platform, username, profileUrl, followersCount } = req.body;

    const newProfile = await db
      .insert(socialProfiles)
      .values({
        userId,
        platform,
        username,
        profileUrl,
        followersCount: followersCount || 0
      })
      .returning();

    res.json(newProfile[0]);
  } catch (error) {
    console.error("Erro ao criar perfil:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PUT /api/social-growth/profiles/:id - Atualizar perfil
router.put("/profiles/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const profileId = parseInt(req.params.id);
    const { username, profileUrl, followersCount } = req.body;

    const updatedProfile = await db
      .update(socialProfiles)
      .set({
        username,
        profileUrl,
        followersCount,
        updatedAt: new Date()
      })
      .where(and(
        eq(socialProfiles.id, profileId),
        eq(socialProfiles.userId, userId)
      ))
      .returning();

    if (!updatedProfile.length) {
      return res.status(404).json({ error: "Perfil não encontrado" });
    }

    res.json(updatedProfile[0]);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE /api/social-growth/profiles/:id - Remover perfil
router.delete("/profiles/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const profileId = parseInt(req.params.id);

    const deletedProfile = await db
      .delete(socialProfiles)
      .where(and(
        eq(socialProfiles.id, profileId),
        eq(socialProfiles.userId, userId)
      ))
      .returning();

    if (!deletedProfile.length) {
      return res.status(404).json({ error: "Perfil não encontrado" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar perfil:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/social-growth/goals - Listar metas
router.get("/goals", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const goals = await db
      .select()
      .from(socialGoals)
      .where(eq(socialGoals.userId, userId))
      .orderBy(desc(socialGoals.createdAt));

    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: goal.targetValue > 0 ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0,
      remaining: goal.targetValue - goal.currentValue
    }));

    res.json(goalsWithProgress);
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/social-growth/goals - Criar nova meta
router.post("/goals", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { platform, goalType, targetValue, deadline, currentValue } = req.body;

    const newGoal = await db
      .insert(socialGoals)
      .values({
        userId,
        platform,
        goalType,
        targetValue,
        deadline,
        currentValue: currentValue || 0
      })
      .returning();

    res.json(newGoal[0]);
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PUT /api/social-growth/goals/:id - Atualizar meta
router.put("/goals/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);
    const { targetValue, deadline, currentValue, status } = req.body;

    const updatedGoal = await db
      .update(socialGoals)
      .set({
        targetValue,
        deadline,
        currentValue,
        status,
        updatedAt: new Date()
      })
      .where(and(
        eq(socialGoals.id, goalId),
        eq(socialGoals.userId, userId)
      ))
      .returning();

    if (!updatedGoal.length) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    res.json(updatedGoal[0]);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE /api/social-growth/goals/:id - Remover meta
router.delete("/goals/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);

    const deletedGoal = await db
      .delete(socialGoals)
      .where(and(
        eq(socialGoals.id, goalId),
        eq(socialGoals.userId, userId)
      ))
      .returning();

    if (!deletedGoal.length) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/social-growth/progress - Listar dados históricos
router.get("/progress", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const progress = await db
      .select()
      .from(socialProgress)
      .where(eq(socialProgress.userId, userId))
      .orderBy(desc(socialProgress.monthYear));

    res.json(progress);
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/social-growth/progress - Atualizar dados mensais
router.post("/progress", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { monthYear, instagramFollowers, instagramSales, facebookFollowers, facebookSales } = req.body;

    // Inserir ou atualizar dados do Instagram
    if (instagramFollowers !== undefined || instagramSales !== undefined) {
      await db
        .insert(socialProgress)
        .values({
          userId,
          platform: 'instagram',
          monthYear,
          followersCount: instagramFollowers || 0,
          salesCount: instagramSales || 0
        })
        .onConflictDoUpdate({
          target: [socialProgress.userId, socialProgress.platform, socialProgress.monthYear],
          set: {
            followersCount: instagramFollowers || 0,
            salesCount: instagramSales || 0
          }
        });
    }

    // Inserir ou atualizar dados do Facebook
    if (facebookFollowers !== undefined || facebookSales !== undefined) {
      await db
        .insert(socialProgress)
        .values({
          userId,
          platform: 'facebook',
          monthYear,
          followersCount: facebookFollowers || 0,
          salesCount: facebookSales || 0
        })
        .onConflictDoUpdate({
          target: [socialProgress.userId, socialProgress.platform, socialProgress.monthYear],
          set: {
            followersCount: facebookFollowers || 0,
            salesCount: facebookSales || 0
          }
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar progresso:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Funções auxiliares
function calculateMonthlyGrowth(data: any[], type: string) {
  if (data.length < 2) return 0;
  const current = data[0]?.[type === 'followers' ? 'followersCount' : 'salesCount'] || 0;
  const previous = data[1]?.[type === 'followers' ? 'followersCount' : 'salesCount'] || 0;
  return previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;
}

function calculateWeeklyGrowth(data: any[], type: string) {
  // Simplificação: assumindo crescimento semanal como 1/4 do mensal
  return Math.round(calculateMonthlyGrowth(data, type) / 4 * 10) / 10;
}

function calculateDailyAverage(data: any[], type: string) {
  if (data.length < 2) return 0;
  const monthlyGrowth = calculateMonthlyGrowth(data, type);
  const current = data[0]?.[type === 'followers' ? 'followersCount' : 'salesCount'] || 0;
  return Math.round((current * (monthlyGrowth / 100)) / 30);
}

function generateChartData(instagramData: any[], facebookData: any[], type: string) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const field = type === 'followers' ? 'followersCount' : 'salesCount';
  
  return months.map((month, index) => ({
    month,
    Instagram: instagramData[5 - index]?.[field] || 0,
    Facebook: facebookData[5 - index]?.[field] || 0
  }));
}

function generateMonthlyComparison(progressData: any[]) {
  const months = ['2024-04', '2024-05', '2024-06'];
  const monthNames = ['Abril', 'Maio', 'Junho'];
  
  return months.map((monthYear, index) => {
    const monthData = progressData.filter(d => d.monthYear === monthYear);
    const instagram = monthData.find(d => d.platform === 'instagram');
    const facebook = monthData.find(d => d.platform === 'facebook');
    
    return {
      month: monthNames[index],
      instagram: {
        followers: instagram?.followersCount || 0,
        sales: instagram?.salesCount || 0
      },
      facebook: {
        followers: facebook?.followersCount || 0,
        sales: facebook?.salesCount || 0
      },
      total: {
        followers: (instagram?.followersCount || 0) + (facebook?.followersCount || 0),
        sales: (instagram?.salesCount || 0) + (facebook?.salesCount || 0)
      }
    };
  });
}

export default router;