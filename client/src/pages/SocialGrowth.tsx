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
  currentFollowers: z.number().min(0, 'Número de seguidores deve ser positivo'),
});

const goalSchema = z.object({
  platform: z.string().min(1, 'Selecione uma plataforma'),
  goalType: z.string().min(1, 'Selecione o tipo de meta'),
  targetValue: z.number().min(1, 'Valor da meta deve ser maior que 0'),
  deadline: z.string().min(1, 'Data limite é obrigatória'),
});

const progressSchema = z.object({
  platform: z.string().min(1, 'Selecione uma plataforma'),
  month: z.number().min(1).max(12, 'Mês deve estar entre 1 e 12'),
  year: z.number().min(2020, 'Ano deve ser válido'),
  followers: z.number().min(0, 'Número de seguidores deve ser positivo'),
  sales: z.number().min(0, 'Número de vendas deve ser positivo'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type GoalFormData = z.infer<typeof goalSchema>;
type ProgressFormData = z.infer<typeof progressSchema>;

// Dados simulados para demonstração (serão substituídos por dados reais da API)
const mockData = {
  totalFollowers: 12700,
  totalSales: 125,
  activeGoals: 3,
  connectedNetworks: 2,
  monthlyGrowth: 8.3,
  salesGrowth: 15.2,
  
  profiles: [
    {
      id: 1,
      platform: 'instagram',
      profileName: '@designauto_oficial',
      profileUrl: 'https://instagram.com/designauto_oficial',
      currentFollowers: 8500,
      isActive: true,
    },
    {
      id: 2,
      platform: 'facebook',
      profileName: 'Design Auto',
      profileUrl: 'https://facebook.com/designauto',
      currentFollowers: 4200,
      isActive: true,
    }
  ],
  
  goals: [
    {
      id: 1,
      platform: 'instagram',
      goalType: 'followers',
      currentValue: 8500,
      targetValue: 10000,
      deadline: '2025-07-31',
      isActive: true,
    },
    {
      id: 2,
      platform: 'facebook',
      goalType: 'followers',
      currentValue: 4200,
      targetValue: 5000,
      deadline: '2025-08-15',
      isActive: true,
    },
    {
      id: 3,
      platform: 'all',
      goalType: 'sales',
      currentValue: 125,
      targetValue: 200,
      deadline: '2025-12-31',
      isActive: true,
    }
  ],
  
  progressData: [
    { month: 'Jan', year: 2025, instagram: 7800, facebook: 3900, total: 11700, sales: 95 },
    { month: 'Fev', year: 2025, instagram: 8100, facebook: 4000, total: 12100, sales: 108 },
    { month: 'Mar', year: 2025, instagram: 8300, facebook: 4100, total: 12400, sales: 115 },
    { month: 'Abr', year: 2025, instagram: 8500, facebook: 4200, total: 12700, sales: 125 },
  ]
};

export function SocialGrowth() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      platform: '',
      profileName: '',
      profileUrl: '',
      currentFollowers: 0,
    },
  });

  const goalForm = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      platform: '',
      goalType: '',
      targetValue: 0,
      deadline: '',
    },
  });

  const progressForm = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      platform: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      followers: 0,
      sales: 0,
    },
  });

  // React Query hooks para buscar dados da API
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

  // Mutations para criar/editar dados
  const createProfileMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/social-growth/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsProfileModalOpen(false);
      profileForm.reset();
      toast({ title: 'Perfil criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar perfil', variant: 'destructive' });
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/social-growth/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsGoalModalOpen(false);
      goalForm.reset();
      toast({ title: 'Meta criada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar meta', variant: 'destructive' });
    }
  });

  const createProgressMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/social-growth/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/overview'] });
      setIsProgressModalOpen(false);
      progressForm.reset();
      toast({ title: 'Progresso atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar progresso', variant: 'destructive' });
    }
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    createProfileMutation.mutate(data);
  };

  const onGoalSubmit = (data: GoalFormData) => {
    createGoalMutation.mutate(data);
  };

  const onProgressSubmit = (data: ProgressFormData) => {
    createProgressMutation.mutate(data);
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

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
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
                  <div className="text-2xl font-bold">{formatNumber(mockData.totalFollowers)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+{mockData.monthlyGrowth}%</span> este mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(mockData.totalSales)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+{mockData.salesGrowth}%</span> este mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockData.activeGoals}</div>
                  <p className="text-xs text-muted-foreground">
                    2 próximas do objetivo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Redes Conectadas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockData.connectedNetworks}</div>
                  <p className="text-xs text-muted-foreground">
                    Instagram e Facebook
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Evolução do Crescimento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5" />
                    Instagram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{formatNumber(8500)}</div>
                  <div className="space-y-1 text-sm">
                    <p>+700 este mês</p>
                    <p>+23 por dia</p>
                    <p>Crescimento: +9.0%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-5 w-5" />
                    Facebook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{formatNumber(4200)}</div>
                  <div className="space-y-1 text-sm">
                    <div>+300 este mês</div>
                    <p>+10 por dia</p>
                    <p>Crescimento: +7.7%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Total Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{formatNumber(12700)}</div>
                  <div className="space-y-1 text-sm">
                    <p>+1000 este mês</p>
                    <p>+33 por dia</p>
                    <p>Crescimento: +8.5%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progresso das Metas */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso das Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockData.goals.map((goal) => {
                    const progress = calculateProgress(goal.currentValue, goal.targetValue);
                    const remaining = goal.targetValue - goal.currentValue;
                    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(goal.platform)}
                            <span className="font-medium capitalize">
                              {goal.platform === 'all' ? 'Todas as Plataformas' : goal.platform} - {goal.goalType === 'followers' ? 'Seguidores' : 'Vendas'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatNumber(goal.currentValue)} / {formatNumber(goal.targetValue)}</div>
                            <div className="text-xs text-muted-foreground">{daysLeft} dias restantes</div>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.toFixed(1)}% concluído</span>
                          <span>Restam {formatNumber(remaining)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crescimento de Seguidores</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockData.progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="instagram" stroke="#e1306c" strokeWidth={2} name="Instagram" />
                      <Line type="monotone" dataKey="facebook" stroke="#1877f2" strokeWidth={2} name="Facebook" />
                      <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} name="Total" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockData.progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2} name="Vendas" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Redes Sociais */}
          <TabsContent value="networks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Redes Sociais Conectadas</h2>
              <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Rede Social
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Rede Social</DialogTitle>
                  </DialogHeader>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
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
                                <SelectItem value="tiktok">TikTok</SelectItem>
                                <SelectItem value="youtube">YouTube</SelectItem>
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
                              <Input placeholder="@seuperfil" {...field} />
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
                              <Input placeholder="https://instagram.com/seuperfil" {...field} />
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
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsProfileModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Adicionar</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.profiles.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(profile.platform)}
                        <span className="capitalize">{profile.platform}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{profile.profileName}</p>
                      <p className="text-sm text-muted-foreground break-all">{profile.profileUrl}</p>
                      <div className="text-2xl font-bold">{formatNumber(profile.currentFollowers)}</div>
                      <p className="text-sm text-muted-foreground">seguidores</p>
                      <Badge variant={profile.isActive ? "default" : "secondary"}>
                        {profile.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Metas */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Metas de Crescimento</h2>
              <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Meta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Meta</DialogTitle>
                  </DialogHeader>
                  <Form {...goalForm}>
                    <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-4">
                      <FormField
                        control={goalForm.control}
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
                                <SelectItem value="all">Todas as Plataformas</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                                <SelectItem value="tiktok">TikTok</SelectItem>
                                <SelectItem value="youtube">YouTube</SelectItem>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="followers">Seguidores</SelectItem>
                                <SelectItem value="sales">Vendas</SelectItem>
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
                            <FormLabel>Valor Objetivo</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="10000" 
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
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsGoalModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Criar Meta</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.goals.map((goal) => {
                const progress = calculateProgress(goal.currentValue, goal.targetValue);
                const remaining = goal.targetValue - goal.currentValue;
                const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={goal.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(goal.platform)}
                          <span className="capitalize">
                            {goal.platform === 'all' ? 'Todas' : goal.platform}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {goal.goalType === 'followers' ? 'Seguidores' : 'Vendas'}
                          </p>
                          <div className="text-2xl font-bold">
                            {formatNumber(goal.currentValue)} / {formatNumber(goal.targetValue)}
                          </div>
                        </div>
                        
                        <Progress value={progress} className="h-2" />
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Progresso:</span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Restam:</span>
                            <span className="font-medium">{formatNumber(remaining)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Prazo:</span>
                            <span className={`font-medium flex items-center gap-1 ${daysLeft < 30 ? 'text-amber-600' : 'text-green-600'}`}>
                              <Calendar className="h-3 w-3" />
                              {daysLeft} dias
                            </span>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={progress >= 80 ? "default" : progress >= 50 ? "secondary" : "outline"}
                          className="w-full justify-center"
                        >
                          {progress >= 100 ? 'Concluída' : progress >= 80 ? 'Quase lá!' : progress >= 50 ? 'No caminho' : 'Iniciando'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Histórico de Performance</h2>
              <Dialog open={isProgressModalOpen} onOpenChange={setIsProgressModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Atualizar Dados
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atualizar Dados Mensais</DialogTitle>
                  </DialogHeader>
                  <Form {...progressForm}>
                    <form onSubmit={progressForm.handleSubmit(onProgressSubmit)} className="space-y-4">
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
                                <SelectItem value="tiktok">TikTok</SelectItem>
                                <SelectItem value="youtube">YouTube</SelectItem>
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
                              <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      {new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                                <Input 
                                  type="number" 
                                  placeholder="2025" 
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
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
                            <FormLabel>Número de Seguidores</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="8500" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
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
                            <FormLabel>Número de Vendas</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="125" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsProgressModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Atualizar</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Dados Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Período</th>
                        <th className="text-left p-2">Instagram</th>
                        <th className="text-left p-2">Facebook</th>
                        <th className="text-left p-2">Total Seguidores</th>
                        <th className="text-left p-2">Vendas</th>
                        <th className="text-left p-2">Crescimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockData.progressData.map((data, index) => {
                        const previousData = mockData.progressData[index - 1];
                        const growth = previousData 
                          ? ((data.total - previousData.total) / previousData.total * 100).toFixed(1)
                          : '0.0';
                        
                        return (
                          <tr key={`${data.month}-${data.year}`} className="border-b">
                            <td className="p-2 font-medium">{data.month} {data.year}</td>
                            <td className="p-2">{formatNumber(data.instagram)}</td>
                            <td className="p-2">{formatNumber(data.facebook)}</td>
                            <td className="p-2 font-medium">{formatNumber(data.total)}</td>
                            <td className="p-2">{formatNumber(data.sales)}</td>
                            <td className="p-2">
                              <span className={`font-medium ${Number(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Number(growth) >= 0 ? '+' : ''}{growth}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SocialGrowth;