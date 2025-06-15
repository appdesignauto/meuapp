import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Target, Plus, Edit, Trash2, Instagram, Facebook, Youtube, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Schema para validação do formulário
const goalFormSchema = z.object({
  networkId: z.string().min(1, 'Selecione uma rede social'),
  goalType: z.enum(['followers', 'engagement', 'sales'], {
    required_error: 'Selecione o tipo de meta'
  }),
  targetValue: z.number().min(1, 'O valor da meta deve ser maior que zero'),
  deadline: z.string().min(1, 'Selecione uma data limite'),
  description: z.string().optional()
});

type GoalFormData = z.infer<typeof goalFormSchema>;

interface SocialGoal {
  id: number;
  goalType: 'followers' | 'engagement' | 'sales';
  targetValue: number;
  deadline: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  currentValue: number;
  progress: number;
  daysRemaining: number;
  needsAttention: boolean;
  network: {
    id: number;
    platform: string;
    username: string;
  };
}

interface SocialNetwork {
  id: number;
  platform: string;
  username: string;
  profileUrl?: string;
  isActive: boolean;
}

// Função para obter ícone da plataforma
const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram className="w-4 h-4" />;
    case 'facebook':
      return <Facebook className="w-4 h-4" />;
    case 'youtube':
      return <Youtube className="w-4 h-4" />;
    case 'whatsapp_business':
      return <MessageCircle className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
};

// Função para obter cor da plataforma
const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return 'bg-gradient-to-r from-purple-500 to-pink-500';
    case 'facebook':
      return 'bg-blue-600';
    case 'youtube':
      return 'bg-red-600';
    case 'whatsapp_business':
      return 'bg-green-600';
    default:
      return 'bg-gray-600';
  }
};

// Função para traduzir tipo de meta
const translateGoalType = (goalType: string) => {
  switch (goalType) {
    case 'followers':
      return 'Seguidores';
    case 'engagement':
      return 'Engajamento';
    case 'sales':
      return 'Vendas';
    default:
      return goalType;
  }
};

// Função para formatar números
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export default function SocialGoalsSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SocialGoal | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar metas existentes
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/social-growth/goals'],
    retry: false,
  });

  // Buscar redes sociais disponíveis
  const { data: networks = [], isLoading: networksLoading } = useQuery({
    queryKey: ['/api/social-growth/networks'],
    retry: false,
  });

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      networkId: '',
      goalType: 'followers' as const,
      targetValue: 0,
      deadline: '',
      description: ''
    }
  });

  // Mutation para criar meta
  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      return apiRequest('/api/social-growth/goals', {
        method: 'POST',
        body: {
          ...data,
          networkId: parseInt(data.networkId),
          targetValue: Number(data.targetValue)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      toast({
        title: 'Meta criada com sucesso',
        description: 'Sua nova meta foi adicionada e está sendo monitorada.',
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar meta',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });

  // Mutation para deletar meta
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      return apiRequest(`/api/social-growth/goals/${goalId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      toast({
        title: 'Meta removida',
        description: 'A meta foi desativada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover meta',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: GoalFormData) => {
    createGoalMutation.mutate(data);
  };

  const handleDeleteGoal = (goalId: number) => {
    if (confirm('Tem certeza que deseja remover esta meta?')) {
      deleteGoalMutation.mutate(goalId);
    }
  };

  const openDialog = (goal?: SocialGoal) => {
    if (goal) {
      setEditingGoal(goal);
      form.setValue('networkId', goal.network.id.toString());
      form.setValue('goalType', goal.goalType);
      form.setValue('targetValue', goal.targetValue);
      form.setValue('deadline', goal.deadline);
      form.setValue('description', goal.description || '');
    } else {
      setEditingGoal(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  if (goalsLoading || networksLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Minhas Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Carregando metas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Minhas Metas
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => openDialog()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="networkId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rede Social</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma rede social" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {networks.map((network: SocialNetwork) => (
                              <SelectItem key={network.id} value={network.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1 rounded ${getPlatformColor(network.platform)} text-white`}>
                                    {getPlatformIcon(network.platform)}
                                  </div>
                                  {network.platform} - @{network.username}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Meta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de meta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="followers">Seguidores</SelectItem>
                            <SelectItem value="engagement">Engajamento</SelectItem>
                            <SelectItem value="sales">Vendas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Meta</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 10000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Limite</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva sua meta..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createGoalMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {createGoalMutation.isPending ? 'Salvando...' : 'Salvar Meta'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma meta criada</p>
            <p className="text-sm">Comece definindo suas metas de crescimento social</p>
          </div>
        ) : (
          goals.map((goal: SocialGoal) => (
            <div key={goal.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${getPlatformColor(goal.network.platform)} text-white`}>
                    {getPlatformIcon(goal.network.platform)}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {translateGoalType(goal.goalType)} - {goal.network.platform}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Meta até {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {goal.needsAttention && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Atenção
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGoal(goal.id)}
                    disabled={deleteGoalMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{formatNumber(goal.currentValue)}</span>
                  <span>/ {formatNumber(goal.targetValue)}</span>
                </div>
                <Progress 
                  value={goal.progress} 
                  className="w-full h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{goal.progress.toFixed(1)}% concluído</span>
                  <span>
                    {goal.daysRemaining > 0 
                      ? `${goal.daysRemaining} dias restantes`
                      : goal.daysRemaining === 0
                      ? 'Prazo é hoje'
                      : `${Math.abs(goal.daysRemaining)} dias em atraso`
                    }
                  </span>
                </div>
              </div>

              {goal.needsAttention && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  {goal.goalType === 'followers' 
                    ? `Você precisa ganhar ${Math.ceil((goal.targetValue - goal.currentValue) / Math.max(goal.daysRemaining, 1))} seguidores por ${goal.daysRemaining > 1 ? 'dia' : 'mês'} para manter o ritmo.`
                    : goal.goalType === 'sales'
                    ? `Você precisa ganhar ${Math.ceil((goal.targetValue - goal.currentValue) / Math.max(goal.daysRemaining, 1))} vendas por ${goal.daysRemaining > 1 ? 'dia' : 'mês'} para manter o ritmo.`
                    : `Você precisa aumentar o engajamento em ${Math.ceil((goal.targetValue - goal.currentValue) / Math.max(goal.daysRemaining, 1))} por ${goal.daysRemaining > 1 ? 'dia' : 'mês'} para manter o ritmo.`
                  }
                </div>
              )}

              {goal.description && (
                <p className="mt-3 text-sm text-gray-600">{goal.description}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}