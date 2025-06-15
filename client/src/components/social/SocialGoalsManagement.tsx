import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Target, Edit3, Trash2, Instagram, Facebook, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SocialNetwork {
  id: number;
  platform: string;
  username: string;
  profileUrl: string;
  initialFollowers: number;
  isActive: boolean;
}

interface SocialGoal {
  id: number;
  goalType: 'followers' | 'sales' | 'engagement';
  targetValue: number;
  currentValue: number;
  deadline: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  socialNetworkId: number;
  networkPlatform: string;
  networkUsername: string;
}

interface SocialGoalsManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialGoalsManagement({ isOpen, onClose }: SocialGoalsManagementProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SocialGoal | null>(null);
  const [formData, setFormData] = useState({
    socialNetworkId: '',
    goalType: '',
    targetValue: '',
    deadline: '',
    description: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch networks and goals
  const { data: networks = [] } = useQuery<SocialNetwork[]>({
    queryKey: ['/api/social-growth/networks'],
    enabled: isOpen
  });

  const { data: goals = [], isLoading } = useQuery<SocialGoal[]>({
    queryKey: ['/api/social-growth/goals'],
    enabled: isOpen
  });

  // Mutations
  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('[FRONTEND] Enviando dados para API:', data);
      const result = await apiRequest('/api/social-growth/goals', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('[FRONTEND] Resposta da API:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      setIsAddingGoal(false);
      resetForm();
      toast({
        title: "Meta criada",
        description: "Meta adicionada com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('[FRONTEND] Erro ao criar meta:', error);
      let errorMessage = "Erro ao criar meta. Tente novamente.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/social-growth/goals/${id}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      setEditingGoal(null);
      resetForm();
      toast({
        title: "Meta atualizada",
        description: "Meta editada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar meta. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/social-growth/goals/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      toast({
        title: "Meta excluída",
        description: "Meta removida com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir meta. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      socialNetworkId: '',
      goalType: '',
      targetValue: '',
      deadline: '',
      description: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData = {
      networkId: parseInt(formData.socialNetworkId),
      goalType: formData.goalType as 'followers' | 'sales' | 'engagement',
      targetValue: parseInt(formData.targetValue),
      deadline: formData.deadline,
      description: formData.description || undefined
    };

    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: goalData });
    } else {
      createGoalMutation.mutate(goalData);
    }
  };

  const handleEdit = (goal: SocialGoal) => {
    setEditingGoal(goal);
    setFormData({
      socialNetworkId: goal.network.id.toString(),
      goalType: goal.goalType,
      targetValue: goal.targetValue.toString(),
      deadline: goal.deadline.split('T')[0],
      description: goal.description || ''
    });
    setIsAddingGoal(true);
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'instagram' ? Instagram : Facebook;
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'instagram' ? 'from-pink-500 to-pink-600' : 'from-blue-500 to-blue-600';
  };

  const getGoalTypeText = (type: string) => {
    const types = {
      followers: 'Seguidores',
      sales: 'Vendas',
      engagement: 'Engajamento'
    };
    return types[type as keyof typeof types] || type;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPerformanceAlert = (current: number, target: number, deadline: string) => {
    const progress = calculateProgress(current, target);
    const daysLeft = getDaysUntilDeadline(deadline);
    
    if (progress >= 100) return null;
    
    const needed = target - current;
    const dailyNeeded = Math.ceil(needed / Math.max(daysLeft, 1));
    
    if (daysLeft <= 0) return `Meta expirada! Faltaram ${needed} para atingir o objetivo.`;
    if (daysLeft <= 7) return `⚠️ Você precisa ganhar ${dailyNeeded} por dia para manter o ritmo.`;
    if (progress < 50 && daysLeft <= 30) return `⚠️ Você precisa ganhar ${dailyNeeded} por dia para manter o ritmo.`;
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target size={20} className="text-green-600" />
            Minhas Metas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com botão adicionar */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Gerencie suas metas de crescimento social</p>
            <Button 
              onClick={() => setIsAddingGoal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus size={16} className="mr-2" />
              Nova Meta
            </Button>
          </div>

          {/* Lista de metas */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando metas...</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <Target size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Nenhuma meta cadastrada</p>
              <p className="text-sm text-gray-400">Adicione sua primeira meta para começar a acompanhar seu progresso</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {goals.map((goal) => {
                const PlatformIcon = getPlatformIcon(goal.networkPlatform);
                const progress = calculateProgress(goal.currentValue, goal.targetValue);
                const platformGradient = getPlatformColor(goal.networkPlatform);
                const performanceAlert = getPerformanceAlert(goal.currentValue, goal.targetValue, goal.deadline);
                const daysLeft = getDaysUntilDeadline(goal.deadline);
                
                return (
                  <Card key={goal.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${platformGradient}`}>
                            <PlatformIcon size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {getGoalTypeText(goal.goalType)} - {goal.networkPlatform === 'instagram' ? 'Instagram' : 'Facebook'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Meta até {format(new Date(goal.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(goal)}
                            className="text-gray-600 hover:text-blue-600"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGoalMutation.mutate(goal.id)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Progresso */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{goal.currentValue.toLocaleString()}</span>
                          <span className="text-gray-500">/ {goal.targetValue.toLocaleString()}</span>
                        </div>
                        
                        <Progress value={progress} className="h-2" />
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{progress.toFixed(1)}% concluído</span>
                          <div className="flex items-center gap-4">
                            {daysLeft > 0 ? (
                              <span className="text-gray-500 flex items-center gap-1">
                                <Calendar size={12} />
                                {daysLeft} dias restantes
                              </span>
                            ) : (
                              <Badge variant="destructive">Expirada</Badge>
                            )}
                          </div>
                        </div>

                        {/* Alerta de performance */}
                        {performanceAlert && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={16} className="text-yellow-600" />
                              <p className="text-sm text-yellow-800">{performanceAlert}</p>
                            </div>
                          </div>
                        )}

                        {/* Descrição */}
                        {goal.description && (
                          <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal para adicionar/editar meta */}
        <Dialog open={isAddingGoal} onOpenChange={(open) => {
          setIsAddingGoal(open);
          if (!open) {
            setEditingGoal(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="network">Rede Social</Label>
                <Select 
                  value={formData.socialNetworkId} 
                  onValueChange={(value) => setFormData({...formData, socialNetworkId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a rede" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => (
                      <SelectItem key={network.id} value={network.id.toString()}>
                        {network.platform === 'instagram' ? 'Instagram' : 'Facebook'} - {network.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goalType">Tipo de Meta</Label>
                <Select 
                  value={formData.goalType} 
                  onValueChange={(value) => setFormData({...formData, goalType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">Seguidores</SelectItem>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="engagement">Engajamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetValue">Valor Alvo</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                  placeholder="Ex: 10000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="deadline">Data Limite</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva sua meta..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingGoal(false);
                    setEditingGoal(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {editingGoal ? 'Atualizar' : 'Criar Meta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}