import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Target, Calendar, TrendingUp, AlertTriangle, Instagram, Facebook, MessageCircle, Youtube, Users, Edit3, Trash2, History } from 'lucide-react';
import SocialHistoryView from './SocialHistoryView';

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
  const { toast } = useToast();
  const [editingGoal, setEditingGoal] = useState<SocialGoal | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editFormData, setEditFormData] = useState({
    goalType: '',
    targetValue: '',
    deadline: '',
    description: ''
  });

  // Fetch goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery<SocialGoal[]>({
    queryKey: ['/api/social-growth/goals'],
  });

  // Fetch networks para mapear os nomes
  const { data: networks = [] } = useQuery({
    queryKey: ['/api/social-growth/networks'],
  });

  // Mutation para editar meta
  const editGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/social-growth/goals/${id}`, {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      setEditingGoal(null);
      toast({
        title: 'Sucesso',
        description: 'Meta atualizada com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar meta',
        variant: 'destructive'
      });
    }
  });

  // Mutation para excluir meta
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/social-growth/goals/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      toast({
        title: 'Sucesso',
        description: 'Meta excluída com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir meta',
        variant: 'destructive'
      });
    }
  });

  // Função para abrir o modal de edição
  const handleEditGoal = (goal: SocialGoal) => {
    setEditingGoal(goal);
    setEditFormData({
      goalType: goal.goalType,
      targetValue: goal.targetValue.toString(),
      deadline: goal.deadline.split('T')[0], // Formato YYYY-MM-DD
      description: goal.description || ''
    });
  };

  // Função para salvar edição
  const handleSaveEdit = () => {
    if (!editingGoal) return;
    
    editGoalMutation.mutate({
      id: editingGoal.id,
      data: {
        goalType: editFormData.goalType,
        targetValue: parseInt(editFormData.targetValue),
        deadline: editFormData.deadline,
        description: editFormData.description
      }
    });
  };

  // Função para excluir meta
  const handleDeleteGoal = (goalId: number) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      deleteGoalMutation.mutate(goalId);
    }
  };

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
            <div key={goal.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
              {/* Header compacto */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">
                    {getGoalTypeLabel(goal.goalType)} - {config.name}
                  </span>
                  {getStatusBadge(goal)}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEditGoal(goal)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title="Editar"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 text-slate-400 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* Valores e progresso em linha compacta */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {goal.currentValue.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">
                    / {goal.targetValue.toLocaleString()}
                  </span>
                </div>
                <span className="text-sm text-slate-600">
                  {progress.toFixed(0)}%
                </span>
              </div>
              
              {/* Barra de progresso simples */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all ${progressColor}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              
              {/* Info de deadline compacta */}
              <div className="text-xs text-slate-500">
                {daysLeft > 0 ? (
                  `${daysLeft} dias até ${formattedDate}`
                ) : daysLeft === 0 ? (
                  'Vence hoje'
                ) : (
                  <span className="text-red-600">Vencida em {formattedDate}</span>
                )}
              </div>
              
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

      {/* Modal de Edição */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goalType" className="text-right">
                Tipo
              </Label>
              <Select 
                value={editFormData.goalType} 
                onValueChange={(value) => setEditFormData({...editFormData, goalType: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followers">Seguidores</SelectItem>
                  <SelectItem value="engagement">Engajamento</SelectItem>
                  <SelectItem value="sales">Vendas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetValue" className="text-right">
                Meta
              </Label>
              <Input
                id="targetValue"
                type="number"
                value={editFormData.targetValue}
                onChange={(e) => setEditFormData({...editFormData, targetValue: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deadline" className="text-right">
                Prazo
              </Label>
              <Input
                id="deadline"
                type="date"
                value={editFormData.deadline}
                onChange={(e) => setEditFormData({...editFormData, deadline: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingGoal(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={editGoalMutation.isPending}
            >
              {editGoalMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}