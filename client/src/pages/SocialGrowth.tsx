import { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Target, 
  Plus, 
  Instagram,
  Facebook,
  Edit,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Schemas de validação
const profileSchema = z.object({
  platform: z.string().min(1, 'Selecione uma plataforma'),
  profileName: z.string().min(1, 'Nome do perfil é obrigatório'),
  profileUrl: z.string().url('URL deve ser válida'),
  currentFollowers: z.coerce.number().min(0, 'Número de seguidores deve ser positivo'),
});

const goalSchema = z.object({
  platform: z.string().min(1, 'Selecione uma plataforma'),
  goalType: z.string().min(1, 'Selecione o tipo de meta'),
  targetValue: z.coerce.number().min(1, 'Valor da meta deve ser maior que 0'),
  deadline: z.string().min(1, 'Data limite é obrigatória'),
});

const progressSchema = z.object({
  platform: z.string().min(1, 'Selecione uma plataforma'),
  month: z.coerce.number().min(1).max(12, 'Mês deve estar entre 1 e 12'),
  year: z.coerce.number().min(2020, 'Ano deve ser válido'),
  followers: z.coerce.number().min(0, 'Número de seguidores deve ser positivo'),
  sales: z.coerce.number().min(0, 'Número de vendas deve ser positivo'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type GoalFormData = z.infer<typeof goalSchema>;
type ProgressFormData = z.infer<typeof progressSchema>;

export default function SocialGrowth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados dos modais
  const [activeTab, setActiveTab] = useState('overview');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [editingProgress, setEditingProgress] = useState<any>(null);

  // Formulários
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      platform: '',
      profileName: '',
      profileUrl: '',
      currentFollowers: 0,
    }
  });

  const goalForm = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      platform: '',
      goalType: '',
      targetValue: 0,
      deadline: '',
    }
  });

  const progressForm = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      platform: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      followers: 0,
      sales: 0,
    }
  });

  // Queries para buscar dados do backend
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/social-growth/overview'],
    enabled: !!user
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['/api/social-growth/profiles'],
    enabled: !!user
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/social-growth/goals'],
    enabled: !!user
  });

  const { data: progressData = [], isLoading: progressLoading } = useQuery({
    queryKey: ['/api/social-growth/progress'],
    enabled: !!user
  });

  // Mutations para criar dados
  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch('/api/social-growth/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao criar perfil');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsProfileModalOpen(false);
      setEditingProfile(null);
      profileForm.reset();
      toast({ title: 'Perfil criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar perfil', variant: 'destructive' });
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const response = await fetch('/api/social-growth/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao criar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      goalForm.reset();
      toast({ title: 'Meta criada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar meta', variant: 'destructive' });
    }
  });

  const createProgressMutation = useMutation({
    mutationFn: async (data: ProgressFormData) => {
      const response = await fetch('/api/social-growth/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao adicionar progresso');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsProgressModalOpen(false);
      progressForm.reset();
      toast({ title: 'Progresso adicionado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao adicionar progresso', variant: 'destructive' });
    }
  });

  // Mutations para atualizar dados
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProfileFormData }) => {
      const response = await fetch(`/api/social-growth/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar perfil');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsProfileModalOpen(false);
      setEditingProfile(null);
      profileForm.reset();
      toast({ title: 'Perfil atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GoalFormData }) => {
      const response = await fetch(`/api/social-growth/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      goalForm.reset();
      toast({ title: 'Meta atualizada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar meta', variant: 'destructive' });
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProgressFormData }) => {
      const response = await fetch(`/api/social-growth/progress/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar progresso');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsProgressModalOpen(false);
      setEditingProgress(null);
      progressForm.reset();
      toast({ title: 'Progresso atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar progresso', variant: 'destructive' });
    }
  });

  // Mutations para deletar dados
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/social-growth/profiles/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar perfil');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      toast({ title: 'Perfil deletado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao deletar perfil', variant: 'destructive' });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/social-growth/goals/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      toast({ title: 'Meta deletada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao deletar meta', variant: 'destructive' });
    }
  });

  const deleteProgressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/social-growth/progress/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar progresso');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      toast({ title: 'Progresso deletado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao deletar progresso', variant: 'destructive' });
    }
  });

  // Handlers dos formulários
  const handleProfileSubmit = (data: ProfileFormData) => {
    if (editingProfile) {
      updateProfileMutation.mutate({ id: editingProfile.id, data });
    } else {
      createProfileMutation.mutate(data);
    }
  };

  const handleGoalSubmit = (data: GoalFormData) => {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data });
    } else {
      // Encontrar o perfil da plataforma selecionada para obter os seguidores atuais
      const selectedProfile = profiles.find((p: any) => p.platform === data.platform);
      const currentFollowers = selectedProfile?.currentFollowers || 0;
      
      // Criar meta com valor inicial baseado nos seguidores atuais da rede social
      const goalData = {
        ...data,
        initialValue: data.goalType === 'followers' ? currentFollowers : 0,
        currentValue: data.goalType === 'followers' ? currentFollowers : 0,
      };
      
      createGoalMutation.mutate(goalData);
    }
  };

  const handleProgressSubmit = (data: ProgressFormData) => {
    if (editingProgress) {
      updateProgressMutation.mutate({ id: editingProgress.id, data });
    } else {
      createProgressMutation.mutate(data);
    }
  };

  // Funções auxiliares
  const openEditProfileModal = (profile: any) => {
    setEditingProfile(profile);
    profileForm.reset({
      platform: profile.platform,
      profileName: profile.profileName,
      profileUrl: profile.profileUrl,
      currentFollowers: profile.currentFollowers,
    });
    setIsProfileModalOpen(true);
  };

  const openEditGoalModal = (goal: any) => {
    setEditingGoal(goal);
    // Converter a data para o formato YYYY-MM-DD para o input date
    const deadline = new Date(goal.deadline).toISOString().split('T')[0];
    goalForm.reset({
      platform: goal.platform,
      goalType: goal.goalType,
      targetValue: goal.targetValue,
      deadline: deadline,
    });
    setIsGoalModalOpen(true);
  };

  const openEditProgressModal = (progress: any) => {
    setEditingProgress(progress);
    progressForm.reset({
      platform: progress.platform,
      month: progress.month,
      year: progress.year,
      followers: progress.followers,
      sales: progress.sales,
    });
    setIsProgressModalOpen(true);
  };

  const resetProfileModal = () => {
    setEditingProfile(null);
    profileForm.reset();
    setIsProfileModalOpen(false);
  };

  const resetGoalModal = () => {
    setEditingGoal(null);
    goalForm.reset();
    setIsGoalModalOpen(false);
  };

  const resetProgressModal = () => {
    setEditingProgress(null);
    progressForm.reset();
    setIsProgressModalOpen(false);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-500" />;
      case 'facebook':
        return <Facebook className="h-5 w-5 text-blue-500" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  // Função para obter valor atual baseado no histórico mais recente
  const getCurrentValueFromHistory = (goalPlatform: string, goalType: string) => {
    if (!progressData || progressData.length === 0) return 0;
    
    // Filtrar dados por plataforma
    const platformProgress = progressData.filter((p: any) => p.platform === goalPlatform);
    if (platformProgress.length === 0) return 0;
    
    // Encontrar o registro mais recente
    const latest = platformProgress.reduce((latest: any, current: any) => {
      if (!latest) return current;
      if (current.year > latest.year) return current;
      if (current.year === latest.year && current.month > latest.month) return current;
      return latest;
    });
    
    // Retornar o valor baseado no tipo de meta
    return goalType === 'followers' ? (latest.followers || 0) : (latest.sales || 0);
  };

  const calculateProgress = (initial: number, current: number, target: number) => {
    if (target === 0) return 0;
    // Cálculo simples: valor atual / valor da meta * 100
    const progress = (current / target) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  // Funções para formatação de input com pontos
  const formatNumberInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumberInput = (value: string) => {
    return parseInt(value.replace(/\./g, '')) || 0;
  };

  const translateGoalType = (goalType: string) => {
    const translations = {
      'followers': 'Seguidores',
      'sales': 'Vendas'
    };
    return translations[goalType as keyof typeof translations] || goalType;
  };

  const translatePlatform = (platform: string) => {
    const translations = {
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'tiktok': 'TikTok',
      'youtube': 'YouTube',
      'all': 'Todas as Plataformas'
    };
    return translations[platform as keyof typeof translations] || platform;
  };

  // Funções para obter dados reais dos perfis usando histórico mais recente
  const getInstagramFollowers = () => {
    // Usar dados do histórico mais recente primeiro
    if (progressData && progressData.length > 0) {
      const instagramProgress = progressData.filter((p: any) => p.platform === 'instagram');
      if (instagramProgress.length > 0) {
        // Encontrar o registro mais recente
        const latest = instagramProgress.reduce((latest: any, current: any) => {
          if (!latest) return current;
          if (current.year > latest.year) return current;
          if (current.year === latest.year && current.month > latest.month) return current;
          return latest;
        });
        return latest.followers || 0;
      }
    }
    
    // Fallback para dados do perfil se não há histórico
    if (!profiles || profiles.length === 0) return 0;
    const instagramProfile = profiles.find((p: any) => p.platform === 'instagram');
    return instagramProfile?.currentFollowers || 0;
  };

  const getFacebookFollowers = () => {
    // Usar dados do histórico mais recente primeiro
    if (progressData && progressData.length > 0) {
      const facebookProgress = progressData.filter((p: any) => p.platform === 'facebook');
      if (facebookProgress.length > 0) {
        // Encontrar o registro mais recente
        const latest = facebookProgress.reduce((latest: any, current: any) => {
          if (!latest) return current;
          if (current.year > latest.year) return current;
          if (current.year === latest.year && current.month > latest.month) return current;
          return latest;
        });
        return latest.followers || 0;
      }
    }
    
    // Fallback para dados do perfil se não há histórico
    if (!profiles || profiles.length === 0) return 0;
    const facebookProfile = profiles.find((p: any) => p.platform === 'facebook');
    return facebookProfile?.currentFollowers || 0;
  };

  const getInstagramGrowth = () => {
    if (!progressData || progressData.length === 0) return 0;
    
    const instagramProgress = progressData.filter((p: any) => p.platform === 'instagram');
    if (instagramProgress.length < 2) return 0;
    
    // Ordenar por ano e mês
    const sorted = instagramProgress.sort((a: any, b: any) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    const current = sorted[0];
    const previous = sorted[1];
    
    if (!current || !previous || previous.followers === 0) return 0;
    
    return Math.round(((current.followers - previous.followers) / previous.followers) * 100);
  };

  const getFacebookGrowth = () => {
    if (!progressData || progressData.length === 0) return 0;
    
    const facebookProgress = progressData.filter((p: any) => p.platform === 'facebook');
    if (facebookProgress.length < 2) return 0;
    
    // Ordenar por ano e mês
    const sorted = facebookProgress.sort((a: any, b: any) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    const current = sorted[0];
    const previous = sorted[1];
    
    if (!current || !previous || previous.followers === 0) return 0;
    
    return Math.round(((current.followers - previous.followers) / previous.followers) * 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para acessar o Dashboard de Crescimento Social.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Crescimento Social</h1>
              <p className="text-gray-600">Gerencie suas metas e acompanhe seu crescimento nas redes sociais</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="networks">Redes Sociais</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-8">
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total de Seguidores */}
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (overviewData?.monthlyGrowth || 0) >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(overviewData?.monthlyGrowth || 0) >= 0 ? '+' : ''}{overviewData?.monthlyGrowth || 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total de Seguidores</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {overviewLoading ? '...' : formatNumber(overviewData?.totalFollowers || 0)}
                  </p>
                </div>
              </Card>

              {/* Total de Vendas */}
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (overviewData?.salesGrowth || 0) >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(overviewData?.salesGrowth || 0) >= 0 ? '+' : ''}{overviewData?.salesGrowth || 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total de Vendas</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {overviewLoading ? '...' : formatNumber(overviewData?.totalSales || 0)}
                  </p>
                </div>
              </Card>

              {/* Metas Ativas */}
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-orange-600 font-medium">
                      {goalsLoading ? '...' : `${goals.filter((g: any) => g.isActive).length} próximas`}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Metas Ativas</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {goalsLoading ? '...' : goals.length}
                  </p>
                </div>
              </Card>

              {/* Redes Conectadas */}
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-purple-600 font-medium">
                      Instagram, Facebook
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Redes Conectadas</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {profilesLoading ? '...' : profiles.length}
                  </p>
                </div>
              </Card>
            </div>

            {/* Evolução do Crescimento por Plataforma */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Evolução do Crescimento de Seguidores</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Instagram */}
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Instagram</h3>
                        <p className="text-sm text-gray-500">seguidores</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInstagramGrowth() >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {getInstagramGrowth() >= 0 ? '+' : ''}{getInstagramGrowth()}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatNumber(getInstagramFollowers())}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Crescimento Mensal</span>
                        <span className={`font-medium ${getInstagramGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {getInstagramGrowth() >= 0 ? '+' : ''}{getInstagramGrowth()}%
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Crescimento Semanal</span>
                        <span className={`font-medium ${getInstagramGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {getInstagramGrowth() >= 0 ? '+' : ''}{(getInstagramGrowth() / 4).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Média Diária</span>
                        <span className={`font-medium ${getInstagramGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {getInstagramGrowth() >= 0 ? '+' : ''}{Math.round(10000 / 30)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Facebook */}
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Facebook</h3>
                        <p className="text-sm text-gray-500">seguidores</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFacebookGrowth() >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {getFacebookGrowth() >= 0 ? '+' : ''}{getFacebookGrowth()}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatNumber(getFacebookFollowers())}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Crescimento Mensal</span>
                        <span className={`font-medium ${getFacebookGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {getFacebookGrowth() >= 0 ? '+' : ''}{getFacebookGrowth()}%
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Crescimento Semanal</span>
                        <span className={`font-medium ${getFacebookGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {getFacebookGrowth() >= 0 ? '+' : ''}{(getFacebookGrowth() / 4).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Média Diária</span>
                        <span className={`font-medium ${getFacebookGrowth() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {getFacebookGrowth() >= 0 ? '+' : ''}{Math.round(10000 / 30)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Total Geral */}
                <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Total Geral</h3>
                        <p className="text-sm text-gray-500">seguidores</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (overviewData?.monthlyGrowth || 0) >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(overviewData?.monthlyGrowth || 0) >= 0 ? '+' : ''}{overviewData?.monthlyGrowth || 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatNumber(overviewData?.totalFollowers || 0)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Crescimento Mensal</span>
                        <span className={`font-medium ${
                          (overviewData?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(overviewData?.monthlyGrowth || 0) >= 0 ? '+' : ''}{overviewData?.monthlyGrowth || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Crescimento Semanal</span>
                        <span className={`font-medium ${
                          (overviewData?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(overviewData?.monthlyGrowth || 0) >= 0 ? '+' : ''}{((overviewData?.monthlyGrowth || 0) / 4).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Média Diária</span>
                        <span className={`font-medium ${
                          (overviewData?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(overviewData?.monthlyGrowth || 0) >= 0 ? '+' : ''}{Math.round((overviewData?.totalFollowers || 0) * (overviewData?.monthlyGrowth || 0) / 100 / 30)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Metas Ativas no Dashboard Principal */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Metas Ativas</h2>
                <span className="text-sm text-gray-500">{goalsLoading ? '...' : `${goals.filter((g: any) => g.isActive).length} em andamento`}</span>
              </div>
              
              {goalsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              ) : goals.length === 0 ? (
                <Card className="p-8 border-0 shadow-sm text-center">
                  <div className="text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma meta definida ainda</p>
                    <p className="text-xs text-gray-400 mt-1">Vá para a aba "Metas" para criar sua primeira meta</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.slice(0, 4).map((goal: any) => (
                    <Card key={goal.id} className="p-4 border-0 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            goal.platform === 'instagram' 
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                              : 'bg-blue-600'
                          }`}>
                            {goal.platform === 'instagram' ? (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{translateGoalType(goal.goalType)}</h4>
                            <p className="text-xs text-gray-500 capitalize">{translatePlatform(goal.platform)}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                          calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) >= 100
                            ? 'bg-green-100 text-green-700'
                            : calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) >= 75
                            ? 'bg-blue-100 text-blue-700'
                            : calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) >= 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {Math.round(calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue))}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress 
                          value={calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue)} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatNumber(getCurrentValueFromHistory(goal.platform, goal.goalType))}</span>
                          <span>{formatNumber(goal.targetValue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(goal.deadline)}</span>
                          </div>
                          <span className={`font-medium ${
                            calculateProgress(goal.initialValue || 0, goal.currentValue || 0, goal.targetValue) >= 100
                              ? 'text-green-600'
                              : calculateProgress(goal.initialValue || 0, goal.currentValue || 0, goal.targetValue) >= 75
                              ? 'text-blue-600'
                              : calculateProgress(goal.initialValue || 0, goal.currentValue || 0, goal.targetValue) >= 50
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                          }`}>
                            {calculateProgress(goal.initialValue || 0, goal.currentValue || 0, goal.targetValue) >= 100 
                              ? 'Concluída!' 
                              : `${formatNumber(goal.targetValue - (goal.currentValue || 0))} restantes`}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Dados Mensais de Performance */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Dados Mensais de Performance</h2>
              </div>

              {/* Tabela de Performance */}
              <Card className="p-3 md:p-6 border-0 shadow-sm">
                <div className="overflow-x-auto -mx-3 md:mx-0">
                  <div className="min-w-[800px] px-3 md:px-0">
                    <table className="w-full text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 text-gray-600 font-medium min-w-[80px]">Mês</th>
                          <th className="text-center py-3 px-1 text-purple-600 font-medium min-w-[60px]">IG</th>
                          <th className="text-center py-3 px-1 text-purple-600 font-medium min-w-[50px]">IG V</th>
                          <th className="text-center py-3 px-1 text-purple-600 font-medium min-w-[70px]">IG Cresc</th>
                          <th className="text-center py-3 px-1 text-blue-600 font-medium min-w-[60px]">FB</th>
                          <th className="text-center py-3 px-1 text-blue-600 font-medium min-w-[50px]">FB V</th>
                          <th className="text-center py-3 px-1 text-blue-600 font-medium min-w-[70px]">FB Cresc</th>
                          <th className="text-center py-3 px-1 text-gray-900 font-medium min-w-[60px]">Total</th>
                          <th className="text-center py-3 px-1 text-green-600 font-medium min-w-[60px]">T. Vendas</th>
                        </tr>
                      </thead>
                      <tbody>
                      {progressData && progressData.length > 0 ? (
                        (() => {
                          // Agrupar dados por mês/ano
                          const monthlyData = new Map();
                          
                          progressData.forEach(record => {
                            const key = `${record.year}-${record.month.toString().padStart(2, '0')}`;
                            if (!monthlyData.has(key)) {
                              monthlyData.set(key, {
                                month: record.month,
                                year: record.year,
                                instagram: { followers: 0, sales: 0, growth: 0 },
                                facebook: { followers: 0, sales: 0, growth: 0 }
                              });
                            }
                            
                            const data = monthlyData.get(key);
                            if (record.platform === 'instagram') {
                              data.instagram.followers = record.followers;
                              data.instagram.sales = record.sales;
                            } else if (record.platform === 'facebook') {
                              data.facebook.followers = record.followers;
                              data.facebook.sales = record.sales;
                            }
                          });

                          // Converter para array e ordenar por data (mais recente primeiro)
                          const sortedData = Array.from(monthlyData.values())
                            .sort((a, b) => {
                              if (b.year !== a.year) return b.year - a.year;
                              return b.month - a.month;
                            });

                          // Calcular crescimento
                          sortedData.forEach((current, index) => {
                            if (index < sortedData.length - 1) {
                              const previous = sortedData[index + 1];
                              
                              // Crescimento Instagram
                              if (previous.instagram.followers > 0) {
                                current.instagram.growth = ((current.instagram.followers - previous.instagram.followers) / previous.instagram.followers) * 100;
                              }
                              
                              // Crescimento Facebook
                              if (previous.facebook.followers > 0) {
                                current.facebook.growth = ((current.facebook.followers - previous.facebook.followers) / previous.facebook.followers) * 100;
                              }
                            }
                          });

                          const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                                            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

                          return sortedData.map((data, index) => (
                            <tr key={`${data.year}-${data.month}`} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2 text-gray-900 font-medium text-xs md:text-sm">
                                <div className="min-w-[70px]">
                                  {monthNames[data.month - 1]} {data.year}
                                </div>
                              </td>
                              
                              {/* Instagram */}
                              <td className="text-center py-3 px-1 text-gray-900 text-xs md:text-sm">
                                {formatNumber(data.instagram.followers)}
                              </td>
                              <td className="text-center py-3 px-1 text-gray-900 text-xs md:text-sm">
                                {data.instagram.sales}
                              </td>
                              <td className="text-center py-3 px-1">
                                {data.instagram.growth !== 0 ? (
                                  <span className={`inline-flex items-center space-x-1 text-xs ${
                                    data.instagram.growth >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    <TrendingUp className="h-2 w-2 md:h-3 md:w-3" />
                                    <span>{data.instagram.growth >= 0 ? '+' : ''}{data.instagram.growth.toFixed(1)}%</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">0%</span>
                                )}
                              </td>
                              
                              {/* Facebook */}
                              <td className="text-center py-3 px-1 text-gray-900 text-xs md:text-sm">
                                {formatNumber(data.facebook.followers)}
                              </td>
                              <td className="text-center py-3 px-1 text-gray-900 text-xs md:text-sm">
                                {data.facebook.sales}
                              </td>
                              <td className="text-center py-3 px-1">
                                {data.facebook.growth !== 0 ? (
                                  <span className={`inline-flex items-center space-x-1 text-xs ${
                                    data.facebook.growth >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    <TrendingUp className="h-2 w-2 md:h-3 md:w-3" />
                                    <span>{data.facebook.growth >= 0 ? '+' : ''}{data.facebook.growth.toFixed(1)}%</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">0%</span>
                                )}
                              </td>
                              
                              {/* Total */}
                              <td className="text-center py-3 px-1 text-gray-900 font-semibold text-xs md:text-sm">
                                {formatNumber(data.instagram.followers + data.facebook.followers)}
                              </td>
                              <td className="text-center py-3 px-1 text-green-600 font-semibold text-xs md:text-sm">
                                {data.instagram.sales + data.facebook.sales}
                              </td>
                            </tr>
                          ));
                        })()
                      ) : (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-gray-500 text-xs md:text-sm">
                            Nenhum dado de performance disponível
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </Card>

              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Melhor Mês */}
                <Card className="p-4 md:p-6 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
                  <div className="flex items-center justify-center mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Melhor Mês</h3>
                    <p className="text-xl md:text-2xl font-bold text-purple-600 mb-1">
                      {progressData && progressData.length > 0 ? 'Agosto 2025' : 'N/A'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">Maior crescimento</p>
                  </div>
                </Card>

                {/* Crescimento Total */}
                <Card className="p-4 md:p-6 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <div className="flex items-center justify-center mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Crescimento Total</h3>
                    <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
                      +{formatNumber(overviewData?.totalFollowers ? overviewData.totalFollowers - 20000 : 0)}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">Desde o início</p>
                  </div>
                </Card>

                {/* Vendas Acumuladas */}
                <Card className="p-4 md:p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-center mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Vendas Acumuladas</h3>
                    <p className="text-xl md:text-2xl font-bold text-green-600 mb-1">
                      {progressData ? progressData.reduce((total, record) => total + record.sales, 0) : 0}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">Total de vendas</p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Redes Sociais */}
          <TabsContent value="networks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Perfis de Redes Sociais</h2>
              <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetProfileModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingProfile ? 'Editar Perfil' : 'Adicionar Novo Perfil'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plataforma</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a plataforma" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="profileName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Perfil</FormLabel>
                            <FormControl>
                              <Input placeholder="@seu_perfil" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="profileUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Perfil</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="currentFollowers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seguidores Atuais</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="0" 
                                value={field.value ? formatNumberInput(field.value.toString()) : ''}
                                onChange={(e) => {
                                  const formatted = formatNumberInput(e.target.value);
                                  const parsed = parseNumberInput(formatted);
                                  field.onChange(parsed);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={resetProfileModal}>
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                        >
                          {editingProfile ? 'Atualizar' : 'Criar'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profilesLoading ? (
                <div>Carregando perfis...</div>
              ) : profiles.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Nenhum perfil cadastrado ainda
                </div>
              ) : (
                profiles.map((profile: any) => (
                  <Card key={profile.id} className="p-6 border-0 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          profile.platform === 'instagram' 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                            : 'bg-blue-600'
                        }`}>
                          {profile.platform === 'instagram' ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{profile.profileName}</h3>
                          <p className="text-sm text-gray-500 capitalize">{translatePlatform(profile.platform)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditProfileModal(profile)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteProfileMutation.mutate(profile.id)}
                          disabled={deleteProfileMutation.isPending}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold text-gray-900">
                          {formatNumber(profile.currentFollowers)}
                        </div>
                        <p className="text-sm text-gray-500">seguidores</p>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <a 
                          href={profile.profileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Ver perfil
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Metas */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Metas de Crescimento</h2>
              <Dialog open={isGoalModalOpen} onOpenChange={(open) => {
                if (!open) resetGoalModal();
                setIsGoalModalOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button onClick={resetGoalModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Meta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingGoal ? 'Editar Meta' : 'Adicionar Nova Meta'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...goalForm}>
                    <form onSubmit={goalForm.handleSubmit(handleGoalSubmit)} className="space-y-4">
                      <FormField
                        control={goalForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plataforma</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a plataforma" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={goalForm.control}
                        name="goalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Meta</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="followers">Seguidores</SelectItem>
                                <SelectItem value="sales">Vendas</SelectItem>
                                <SelectItem value="engagement">Engajamento</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={goalForm.control}
                        name="targetValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor da Meta</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="0" 
                                value={field.value ? formatNumberInput(field.value.toString()) : ''}
                                onChange={(e) => {
                                  const formatted = formatNumberInput(e.target.value);
                                  const parsed = parseNumberInput(formatted);
                                  field.onChange(parsed);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={goalForm.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Limite</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                value={typeof field.value === 'string' ? field.value : field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={resetGoalModal}>
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                        >
                          {editingGoal ? 'Atualizar' : 'Criar'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goalsLoading ? (
                <div>Carregando metas...</div>
              ) : goals.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Nenhuma meta cadastrada ainda
                </div>
              ) : (
                goals.map((goal: any) => (
                  <Card key={goal.id} className="p-6 border-0 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          goal.platform === 'instagram' 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                            : 'bg-blue-600'
                        }`}>
                          {goal.platform === 'instagram' ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{translateGoalType(goal.goalType)}</h3>
                          <p className="text-sm text-gray-500 capitalize">{translatePlatform(goal.platform)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Badge de Status */}
                        {calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) >= 100 ? (
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            Concluída
                          </span>
                        ) : new Date(goal.deadline) < new Date() ? (
                          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Vencida
                          </span>
                        ) : calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) >= 90 ? (
                          <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                            Próximo ao objetivo
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            Em andamento
                          </span>
                        )}
                        
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditGoalModal(goal)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteGoalMutation.mutate(goal.id)}
                            disabled={deleteGoalMutation.isPending}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Progresso da Meta</span>
                          <span className={`text-sm font-semibold px-2 py-1 rounded-md ${
                            calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) >= 100
                              ? 'bg-green-100 text-green-700'
                              : calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) >= 75
                              ? 'bg-blue-100 text-blue-700'
                              : calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {Math.round(calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue))}%
                          </span>
                        </div>
                        <Progress 
                          value={calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue)} 
                          className="h-3"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{formatNumber(getCurrentValueFromHistory(goal.platform, goal.goalType))} atual</span>
                          <span>{formatNumber(goal.targetValue)} meta</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>Prazo:</span>
                          </div>
                          <span className="font-medium text-gray-900">{formatDate(goal.deadline)}</span>
                        </div>
                        
                        {/* Informativo "Faltam XXX" */}
                        {calculateProgress(goal.initialValue || 0, getCurrentValueFromHistory(goal.platform, goal.goalType), goal.targetValue) < 100 && (
                          <div className="flex items-center justify-center pt-3 mt-3 border-t border-gray-100">
                            <span className="flex items-center text-sm text-green-600 font-medium">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {goal.goalType === 'followers' ? (
                                `Faltam ${(goal.targetValue - getCurrentValueFromHistory(goal.platform, goal.goalType)).toLocaleString()}`
                              ) : (
                                `Faltam ${(goal.targetValue - getCurrentValueFromHistory(goal.platform, goal.goalType)).toLocaleString()}`
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Histórico de Progresso</h2>
              <Dialog open={isProgressModalOpen} onOpenChange={(open) => {
                if (!open) resetProgressModal();
                setIsProgressModalOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Progresso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingProgress ? 'Editar Progresso Mensal' : 'Adicionar Progresso Mensal'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...progressForm}>
                    <form onSubmit={progressForm.handleSubmit(handleProgressSubmit)} className="space-y-4">
                      <FormField
                        control={progressForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plataforma</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a plataforma" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={progressForm.control}
                          name="month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mês</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="12" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={progressForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ano</FormLabel>
                              <FormControl>
                                <Input type="number" min="2020" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={progressForm.control}
                        name="followers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seguidores</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="0" 
                                value={field.value ? formatNumberInput(field.value.toString()) : ''}
                                onChange={(e) => {
                                  const formatted = formatNumberInput(e.target.value);
                                  const parsed = parseNumberInput(formatted);
                                  field.onChange(parsed);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={progressForm.control}
                        name="sales"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendas</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="0" 
                                value={field.value ? formatNumberInput(field.value.toString()) : ''}
                                onChange={(e) => {
                                  const formatted = formatNumberInput(e.target.value);
                                  const parsed = parseNumberInput(formatted);
                                  field.onChange(parsed);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsProgressModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createProgressMutation.isPending}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Progresso Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div>Carregando histórico...</div>
                ) : progressData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum progresso registrado ainda
                  </div>
                ) : (
                  <div className="space-y-4">
                    {progressData.map((progress: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getPlatformIcon(progress.platform)}
                          <div>
                            <p className="font-medium">{progress.month}/{progress.year}</p>
                            <p className="text-sm text-muted-foreground capitalize">{progress.platform}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium">{formatNumber(progress.followers)} seguidores</p>
                            <p className="text-sm text-muted-foreground">{formatNumber(progress.sales)} vendas</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditProgressModal(progress)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteProgressMutation.mutate(progress.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}