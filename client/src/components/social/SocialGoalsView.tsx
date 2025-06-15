import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

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

// Component para visualização apenas das metas
export default function SocialGoalsView() {
  // Fetch goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery<SocialGoal[]>({
    queryKey: ['/api/social-growth/goals'],
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
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentValue, goal.targetValue);
          const daysLeft = getDaysUntilDeadline(goal.deadline);
          const GoalIcon = getGoalTypeIcon(goal.goalType);
          
          return (
            <div key={goal.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <GoalIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {getGoalTypeLabel(goal.goalType)} - {goal.networkName || `Rede ${goal.networkId}`}
                    </h4>
                    {goal.description && (
                      <p className="text-sm text-slate-600 mt-1">{goal.description}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(goal)}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Progresso</span>
                  <span className="font-medium">
                    {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{progress.toFixed(1)}% concluído</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {daysLeft > 0 ? (
                      <span>{daysLeft} dias restantes</span>
                    ) : (
                      <span className="text-red-600">Vencida há {Math.abs(daysLeft)} dias</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Alerta de performance */}
              {!goal.isCompleted && daysLeft > 0 && progress < 50 && daysLeft <= 14 && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded flex items-center gap-2 text-sm text-orange-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Acelere o ritmo para atingir sua meta no prazo!</span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}