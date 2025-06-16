import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Instagram, Facebook, ChevronRight, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SocialProfile {
  id: number;
  platform: string;
  platformDisplayName: string;
  currentFollowers: number;
  isActive: boolean;
}

interface SocialGoal {
  id: number;
  type: string;
  targetValue: number;
  initialValue: number;
  currentValue: number;
  deadline: string;
  isCompleted: boolean;
  platform?: string;
}

interface OverviewData {
  totalFollowers: number;
  totalSales: number;
  monthlyGrowth: number;
  salesGrowth: number;
  networksConnected: number;
  activeGoals: number;
}

const SocialGrowthQuickAccess = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Buscar dados do overview
  const { data: overviewData } = useQuery<OverviewData>({
    queryKey: ['/api/social-growth/overview'],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Buscar perfis sociais
  const { data: profiles } = useQuery<SocialProfile[]>({
    queryKey: ['/api/social-growth/profiles'],
    enabled: !!user?.id,
  });

  // Buscar metas ativas
  const { data: goals } = useQuery<SocialGoal[]>({
    queryKey: ['/api/social-growth/goals'],
    enabled: !!user?.id,
  });

  // Função para formatar números
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Função para obter ícone da plataforma
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  // Função para obter cor da plataforma
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'text-pink-600 bg-pink-50 border-pink-200';
      case 'facebook':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Calcular progresso da meta
  const calculateProgress = (goal: SocialGoal) => {
    const progress = ((goal.currentValue - goal.initialValue) / (goal.targetValue - goal.initialValue)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Filtrar metas ativas (primeiras 2)
  const activeGoals = goals?.slice(0, 2) || [];

  if (!user) {
    return null;
  }

  return (
    <section className="py-6 bg-gradient-to-b from-white via-white to-green-50/30 relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Social Growth</h2>
          </div>
          <Button 
            onClick={() => setLocation('/social-growth')}
            variant="ghost" 
            className="text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1 h-auto flex items-center gap-1 text-sm font-medium rounded-full border border-transparent hover:border-green-100"
          >
            Ver dashboard
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resumo Geral */}
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-white/80 text-green-700">
                {(overviewData?.monthlyGrowth || 0) >= 0 ? '+' : ''}{(overviewData?.monthlyGrowth || 0).toFixed(0)}%
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Total de Seguidores</h3>
              <p className="text-2xl font-bold text-green-600 mb-1">
                {formatNumber(overviewData?.totalFollowers || 0)}
              </p>
              <p className="text-sm text-gray-600">
                {overviewData?.networksConnected || 0} redes conectadas
              </p>
            </div>
          </Card>

          {/* Plataformas Ativas */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Plataformas</h3>
              <Badge variant="outline" className="text-xs">
                {profiles?.length || 0} ativas
              </Badge>
            </div>
            <div className="space-y-3">
              {profiles?.slice(0, 2).map((profile) => (
                <div key={profile.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getPlatformColor(profile.platform)}`}>
                      {getPlatformIcon(profile.platform)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {profile.platformDisplayName}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(profile.currentFollowers)}
                  </span>
                </div>
              ))}
              {(!profiles || profiles.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-2">
                  Nenhuma plataforma conectada
                </p>
              )}
            </div>
          </Card>

          {/* Metas Ativas */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Metas Ativas</h3>
              <Badge variant="outline" className="text-xs">
                {overviewData?.activeGoals || 0} ativas
              </Badge>
            </div>
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const progress = calculateProgress(goal);
                const progressColor = progress >= 100 ? 'bg-green-500' : progress >= 75 ? 'bg-blue-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-gray-300';
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700 capitalize">
                          Meta de {goal.type === 'followers' ? 'seguidores' : 'vendas'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div 
                        className={`h-1.5 rounded-full ${progressColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
              {activeGoals.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  Nenhuma meta ativa
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SocialGrowthQuickAccess;