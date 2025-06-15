import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, Target, Bell, Instagram, Facebook, Twitter, Linkedin, Youtube, Plus, Edit, Trash2, Calendar, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SocialProfile {
  id: number;
  platform: string;
  username: string;
  followersCount: number;
  isActive: boolean;
  lastSync: Date;
}

interface SocialGoal {
  id: number;
  platform: string;
  goalType: 'followers' | 'engagement' | 'sales';
  targetValue: number;
  deadline: Date;
  startDate: Date;
  isActive: boolean;
}

interface SocialAlert {
  id: number;
  type: 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface DashboardData {
  metrics: {
    total_followers: number;
    total_sales: number;
    active_goals: number;
    connected_platforms: number;
    monthly_growth: {
      followers: number;
      sales: number;
    };
  };
  alerts: SocialAlert[];
  goals_progress: Array<{
    id: number;
    platform: string;
    type: string;
    current: number;
    target: number;
    percentage: number;
    deadline: string;
    status: 'completed' | 'on_track' | 'at_risk' | 'behind';
  }>;
  charts_data: {
    followers_trend: Array<{ month: string; value: number }>;
    sales_trend: Array<{ month: string; value: number }>;
  };
}

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

const statusColors = {
  completed: 'bg-green-500',
  on_track: 'bg-blue-500',
  at_risk: 'bg-yellow-500',
  behind: 'bg-red-500',
};

export default function SocialGrowthPage() {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Crescimento Social</h1>
            <p className="text-gray-600 mt-2">
              Faça login para acessar suas métricas de crescimento social
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/auth'} 
            className="w-full"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard data query with error handling
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ['/api/social/dashboard'],
    refetchInterval: 30000,
    enabled: !!user,
    retry: 2,
  });

  // Profiles query
  const { data: profiles = [], error: profilesError } = useQuery<SocialProfile[]>({
    queryKey: ['/api/social/profiles'],
    enabled: !!user,
    retry: 2,
  });

  // Goals query
  const { data: goals = [], error: goalsError } = useQuery<SocialGoal[]>({
    queryKey: ['/api/social/goals'],
    enabled: !!user,
    retry: 2,
  });

  // Alerts query
  const { data: alerts = [], error: alertsError } = useQuery<SocialAlert[]>({
    queryKey: ['/api/social/alerts'],
    enabled: !!user,
    retry: 2,
  });

  // Add profile mutation
  const addProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<SocialProfile>) => {
      const response = await fetch('/api/social/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error('Erro ao adicionar perfil');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/dashboard'] });
      setIsAddingProfile(false);
    },
  });

  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (goalData: Partial<SocialGoal>) => {
      const response = await fetch('/api/social/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      if (!response.ok) throw new Error('Erro ao adicionar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/dashboard'] });
      setIsAddingGoal(false);
    },
  });

  // Mark alert as read mutation
  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/social/alerts/${alertId}/read`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Erro ao marcar alerta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/dashboard'] });
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth}%`;
  };

  if (isDashboardLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crescimento Social</h1>
          <p className="text-gray-600 mt-2">Gerencie e monitore o crescimento das suas redes sociais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Sincronizar
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Seguidores</p>
                    <p className="text-2xl font-bold">{formatNumber(dashboardData?.metrics.total_followers || 0)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {formatGrowth(dashboardData?.metrics.monthly_growth.followers || 0)} este mês
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vendas Geradas</p>
                    <p className="text-2xl font-bold">{dashboardData?.metrics.total_sales || 0}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {formatGrowth(dashboardData?.metrics.monthly_growth.sales || 0)} este mês
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Metas Ativas</p>
                    <p className="text-2xl font-bold">{dashboardData?.metrics.active_goals || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Em andamento</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Plataformas</p>
                    <p className="text-2xl font-bold">{dashboardData?.metrics.connected_platforms || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Conectadas</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Followers Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Seguidores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData?.charts_data.followers_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Goals Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso das Metas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.goals_progress.slice(0, 4).map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {goal.platform}
                        </Badge>
                        <span className="text-sm font-medium">{goal.type}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${statusColors[goal.status]}`}></div>
                    </div>
                    <Progress value={goal.percentage} className="h-2" />
                    <p className="text-xs text-gray-600">
                      {formatNumber(goal.current)} / {formatNumber(goal.target)} ({goal.percentage}%)
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Alertas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.alerts.map((alert) => (
                  <Alert key={alert.id} className="cursor-pointer" onClick={() => markAlertReadMutation.mutate(alert.id)}>
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                        {!alert.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Perfis das Redes Sociais</h2>
            <Dialog open={isAddingProfile} onOpenChange={setIsAddingProfile}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Perfil
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Perfil</DialogTitle>
                </DialogHeader>
                <AddProfileForm onSubmit={addProfileMutation.mutate} isLoading={addProfileMutation.isPending} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => {
              const IconComponent = platformIcons[profile.platform as keyof typeof platformIcons] || Activity;
              return (
                <Card key={profile.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <IconComponent className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold capitalize">{profile.platform}</h3>
                        <p className="text-sm text-gray-600">@{profile.username}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Seguidores</span>
                        <span className="font-semibold">{formatNumber(profile.followersCount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <Badge variant={profile.isActive ? "default" : "secondary"}>
                          {profile.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Metas de Crescimento</h2>
            <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Meta</DialogTitle>
                </DialogHeader>
                <AddGoalForm onSubmit={addGoalMutation.mutate} isLoading={addGoalMutation.isPending} profiles={profiles} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold capitalize">{goal.platform}</h3>
                      <p className="text-sm text-gray-600">{goal.goalType}</p>
                    </div>
                    <Badge variant={goal.isActive ? "default" : "secondary"}>
                      {goal.isActive ? "Ativa" : "Pausada"}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Meta</span>
                        <span className="font-semibold">{formatNumber(goal.targetValue)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Prazo</span>
                        <span className="text-sm">{new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <h2 className="text-xl font-semibold">Central de Alertas</h2>
          
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={`cursor-pointer ${!alert.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        {!alert.isRead && <Badge variant="secondary" className="text-xs">Novo</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAlertReadMutation.mutate(alert.id)}
                      >
                        Marcar como lido
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum alerta no momento</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add Profile Form Component
function AddProfileForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    platform: '',
    username: '',
    followersCount: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, isActive: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform">Plataforma</Label>
        <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="username">Nome de usuário</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="@seuperfil"
          required
        />
      </div>

      <div>
        <Label htmlFor="followers">Número de seguidores</Label>
        <Input
          id="followers"
          type="number"
          value={formData.followersCount}
          onChange={(e) => setFormData({ ...formData, followersCount: parseInt(e.target.value) || 0 })}
          placeholder="1000"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Adicionando...' : 'Adicionar Perfil'}
      </Button>
    </form>
  );
}

// Add Goal Form Component
function AddGoalForm({ onSubmit, isLoading, profiles }: { onSubmit: (data: any) => void; isLoading: boolean; profiles: SocialProfile[] }) {
  const [formData, setFormData] = useState({
    platform: '',
    goalType: '',
    targetValue: 0,
    deadline: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, isActive: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform">Plataforma</Label>
        <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a plataforma" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.platform}>
                {profile.platform} (@{profile.username})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="goalType">Tipo de Meta</Label>
        <Select value={formData.goalType} onValueChange={(value) => setFormData({ ...formData, goalType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="followers">Seguidores</SelectItem>
            <SelectItem value="engagement">Engajamento</SelectItem>
            <SelectItem value="sales">Vendas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="target">Valor da Meta</Label>
        <Input
          id="target"
          type="number"
          value={formData.targetValue}
          onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })}
          placeholder="5000"
          required
        />
      </div>

      <div>
        <Label htmlFor="deadline">Data limite</Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Criando...' : 'Criar Meta'}
      </Button>
    </form>
  );
}