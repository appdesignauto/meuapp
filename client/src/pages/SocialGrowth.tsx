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

  const calculateProgress = (initial: number, current: number, target: number) => {
    console.log('Calculando progresso:', { initial, current, target });
    if (target === 0 || target <= initial) return 0;
    const progress = ((current - initial) / (target - initial)) * 100;
    console.log('Progresso calculado:', progress);
    return Math.min(Math.max(progress, 0), 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
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
          <TabsContent value="overview" className="space-y-6">
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Seguidores</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overviewLoading ? '...' : formatNumber(overviewData?.totalFollowers || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+{overviewData?.monthlyGrowth || 0}%</span> este mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overviewLoading ? '...' : formatNumber(overviewData?.totalSales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+{overviewData?.salesGrowth || 0}%</span> este mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {goalsLoading ? '...' : goals.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goals.filter((g: any) => g.isActive).length} em andamento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Redes Conectadas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {profilesLoading ? '...' : profiles.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Plataformas ativas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Crescimento */}
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Seguidores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="followers" 
                        stroke="#e91e63" 
                        strokeWidth={2}
                        name="Seguidores"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        name="Vendas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
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
                              <Input type="number" placeholder="0" {...field} />
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
                  <Card key={profile.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(profile.platform)}
                        <CardTitle className="text-base">{profile.profileName}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditProfileModal(profile)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProfileMutation.mutate(profile.id)}
                          disabled={deleteProfileMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">
                          {formatNumber(profile.currentFollowers)}
                        </div>
                        <p className="text-sm text-muted-foreground">seguidores</p>
                        <a 
                          href={profile.profileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Ver perfil
                        </a>
                      </div>
                    </CardContent>
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
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
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
                  <Card key={goal.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(goal.platform)}
                        <CardTitle className="text-base">{translateGoalType(goal.goalType)}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditGoalModal(goal)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                          disabled={deleteGoalMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{Math.round(calculateProgress(goal.initialValue || 0, goal.currentValue || 0, goal.targetValue))}%</span>
                        </div>
                        <Progress value={calculateProgress(goal.initialValue || 0, goal.currentValue || 0, goal.targetValue)} />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{formatNumber(goal.currentValue || 0)}</span>
                          <span>{formatNumber(goal.targetValue)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(goal.deadline)}</span>
                        </div>
                      </div>
                    </CardContent>
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
                              <Input type="number" placeholder="0" {...field} />
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
                              <Input type="number" placeholder="0" {...field} />
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