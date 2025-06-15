import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, TrendingUp, AlertTriangle, Instagram, Facebook, MessageCircle, Youtube, Users, Edit3, Trash2 } from 'lucide-react';

// Types
interface SocialGoal {
  id: number;
  networkId: number;
  goalType: 'followers' | 'engagement' | 'sales';
  targetValue: number;
  currentValue: number;
  deadline: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  networkName?: string;
  networkPlatform?: string;
}

// Platform configurations
const platformConfig = {
  instagram: { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  whatsapp: { name: 'WhatsApp Business', icon: MessageCircle, color: 'bg-green-600' },
  youtube: { name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  tiktok: { name: 'TikTok', icon: Users, color: 'bg-black' },
};

// Component para visualização apenas das metas
export default function SocialGoalsView() {
  // Fetch goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery<SocialGoal[]>({
    queryKey: ['/api/social-growth/goals'],
  });

  // Fetch networks para mapear os nomes
  const { data: networks = [] } = useQuery({
    queryKey: ['/api/social-growth/networks'],
  });

  const getGoalTypeLabel = (type: string) => {
    const labels = {
      followers: 'Seguidores',
      engagement: 'Engajamento',
      sales: 'Vendas'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'followers': return TrendingUp;
      case 'engagement': return Target;
      case 'sales': return Calendar;
      default: return Target;
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (goal: SocialGoal) => {
    if (goal.isCompleted) {
      return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
    }
    
    const daysLeft = getDaysUntilDeadline(goal.deadline);
    const progress = calculateProgress(goal.currentValue, goal.targetValue);
    
    if (daysLeft < 0) {
      return <Badge variant="destructive">Vencida</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge className="bg-orange-100 text-orange-800">Urgente</Badge>;
    } else if (progress < 25 && daysLeft <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
    }
  };

  if (goalsLoading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Minhas Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Minhas Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">
              Nenhuma meta criada ainda. Use o botão "Adicionar Meta" para começar!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Minhas Metas ({goals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentValue, goal.targetValue);
          const daysLeft = getDaysUntilDeadline(goal.deadline);
          
          // Encontrar a rede associada
          const network = networks.find((n: any) => n.id === goal.networkId);
          const platform = network?.platform || 'instagram';
          const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.instagram;
          const Icon = config.icon;
          
          // Formatação da data
          const deadlineDate = new Date(goal.deadline);
          const formattedDate = deadlineDate.toLocaleDateString('pt-BR');
          
          // Cor da barra de progresso baseada no desempenho
          let progressColor = 'bg-blue-600';
          if (goal.isCompleted) {
            progressColor = 'bg-green-600';
          } else if (progress >= 75) {
            progressColor = 'bg-blue-600';
          } else if (progress >= 50) {
            progressColor = 'bg-yellow-500';
          } else if (progress >= 25) {
            progressColor = 'bg-orange-500';
          } else {
            progressColor = 'bg-red-500';
          }
          
          // Determinar se precisa de alerta
          const needsAlert = !goal.isCompleted && daysLeft > 0 && progress < 50 && daysLeft <= 30;
          const requiredGrowth = Math.ceil((goal.targetValue - goal.currentValue) / Math.max(daysLeft, 1));
          
          return (
            <div key={goal.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              {/* Header com ícone e título */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${config.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-lg">
                    {getGoalTypeLabel(goal.goalType)} - {config.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Meta até {formattedDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Valores grandes */}
              <div className="flex items-end gap-3 mb-3">
                <div className="text-4xl font-bold text-slate-900">
                  {goal.currentValue.toLocaleString()}
                </div>
                <div className="text-lg text-slate-500 mb-1">
                  / {goal.targetValue.toLocaleString()}
                </div>
              </div>
              
              {/* Barra de progresso personalizada */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>{progress.toFixed(1)}% concluído</span>
                  <span>
                    {daysLeft > 0 ? (
                      `${daysLeft} dias restantes`
                    ) : daysLeft === 0 ? (
                      'Vence hoje'
                    ) : (
                      <span className="text-red-600">Vencida há {Math.abs(daysLeft)} dias</span>
                    )}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Alerta de performance */}
              {needsAlert && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-yellow-800 font-medium">
                      Você precisa ganhar {requiredGrowth.toLocaleString()} {getGoalTypeLabel(goal.goalType).toLowerCase()} por {daysLeft === 1 ? 'dia' : 'mês'} para manter o ritmo.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Descrição se houver */}
              {goal.description && (
                <div className="mt-3 text-sm text-slate-600 bg-white rounded-lg p-3 border border-slate-100">
                  {goal.description}
                </div>
              )}
              
              {/* Badge de status */}
              <div className="mt-4 flex justify-end">
                {getStatusBadge(goal)}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}