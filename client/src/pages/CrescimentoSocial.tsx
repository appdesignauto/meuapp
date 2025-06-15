import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Instagram,
  Facebook,
  Calendar,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Crown,
  Zap
} from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface SocialProfile {
  id: number;
  platform: 'instagram' | 'facebook';
  username: string;
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocialGoal {
  id: number;
  platform: 'instagram' | 'facebook';
  metric: 'followers' | 'engagement' | 'posts' | 'sales';
  targetValue: number;
  currentValue: number | null;
  deadline: string;
  description: string;
  isActive: boolean;
  progress: number;
  remaining: number;
  createdAt: string;
}

interface DashboardData {
  metrics: {
    totalFollowers: number;
    totalFollowersGrowth: number;
    avgEngagement: number;
    avgEngagementGrowth: number;
    totalPosts: number;
    totalPostsGrowth: number;
    estimatedReach: number;
    estimatedReachGrowth: number;
  };
  platforms: {
    instagram: {
      followers: number;
      monthlyGrowth: number;
      weeklyGrowth: number;
      dailyAverage: number;
    };
    facebook: {
      followers: number;
      monthlyGrowth: number;
      weeklyGrowth: number;
      dailyAverage: number;
    };
  };
  goals: SocialGoal[];
  chartData: {
    followers: Array<{ date: string; instagram: number; facebook: number }>;
    sales: Array<{ date: string; instagram: number; facebook: number }>;
  };
}

export default function CrescimentoSocial() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGoal, setSelectedGoal] = useState<SocialGoal | null>(null);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/social-growth/overview'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user goals
  const { data: goals = [] } = useQuery<SocialGoal[]>({
    queryKey: ['/api/social-growth/goals'],
    refetchInterval: 30000,
  });

  // Fetch user profiles
  const { data: profiles = [] } = useQuery<SocialProfile[]>({
    queryKey: ['/api/social-growth/profiles'],
    refetchInterval: 30000,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (goalData: any) => apiRequest('/api/social-growth/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth'] });
      setIsCreatingGoal(false);
      toast({
        title: "Meta criada!",
        description: "Sua nova meta foi criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, ...goalData }: any) => apiRequest(`/api/social-growth/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth'] });
      setSelectedGoal(null);
      toast({
        title: "Meta atualizada!",
        description: "Sua meta foi atualizada com sucesso.",
      });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/social-growth/goals/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth'] });
      toast({
        title: "Meta excluída!",
        description: "Sua meta foi excluída com sucesso.",
      });
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'facebook':
        return <Facebook className="h-5 w-5 text-blue-600" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'followers':
        return <Users className="h-4 w-4" />;
      case 'engagement':
        return <Heart className="h-4 w-4" />;
      case 'posts':
        return <MessageCircle className="h-4 w-4" />;
      case 'sales':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Crown className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">
              Faça login para acessar o dashboard de crescimento social.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                Crescimento Social
              </h1>
              <p className="text-gray-600 mt-2">
                Acompanhe e gerencie o crescimento das suas redes sociais
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Zap className="h-4 w-4 mr-1" />
              Dashboard Profissional
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profiles">Perfis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Seguidores</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(dashboardData?.metrics.totalFollowers || 0)}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className={`flex items-center mt-2 ${getGrowthColor(dashboardData?.metrics.totalFollowersGrowth || 0)}`}>
                    {getGrowthIcon(dashboardData?.metrics.totalFollowersGrowth || 0)}
                    <span className="text-sm font-medium ml-1">
                      {dashboardData?.metrics.totalFollowersGrowth || 0}% este mês
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Engajamento Médio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(dashboardData?.metrics.avgEngagement || 0).toFixed(1)}%
                      </p>
                    </div>
                    <Heart className="h-8 w-8 text-pink-600" />
                  </div>
                  <div className={`flex items-center mt-2 ${getGrowthColor(dashboardData?.metrics.avgEngagementGrowth || 0)}`}>
                    {getGrowthIcon(dashboardData?.metrics.avgEngagementGrowth || 0)}
                    <span className="text-sm font-medium ml-1">
                      {dashboardData?.metrics.avgEngagementGrowth || 0}% este mês
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Posts Publicados</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData?.metrics.totalPosts || 0}
                      </p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className={`flex items-center mt-2 ${getGrowthColor(dashboardData?.metrics.totalPostsGrowth || 0)}`}>
                    {getGrowthIcon(dashboardData?.metrics.totalPostsGrowth || 0)}
                    <span className="text-sm font-medium ml-1">
                      {dashboardData?.metrics.totalPostsGrowth || 0}% este mês
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Alcance Estimado</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(dashboardData?.metrics.estimatedReach || 0)}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className={`flex items-center mt-2 ${getGrowthColor(dashboardData?.metrics.estimatedReachGrowth || 0)}`}>
                    {getGrowthIcon(dashboardData?.metrics.estimatedReachGrowth || 0)}
                    <span className="text-sm font-medium ml-1">
                      {dashboardData?.metrics.estimatedReachGrowth || 0}% este mês
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    Instagram
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Seguidores</span>
                    <span className="font-semibold">
                      {formatNumber(dashboardData?.platforms.instagram.followers || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Crescimento Mensal</span>
                    <span className={`font-semibold ${getGrowthColor(dashboardData?.platforms.instagram.monthlyGrowth || 0)}`}>
                      {dashboardData?.platforms.instagram.monthlyGrowth || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Média Diária</span>
                    <span className="font-semibold">
                      +{dashboardData?.platforms.instagram.dailyAverage || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    Facebook
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Seguidores</span>
                    <span className="font-semibold">
                      {formatNumber(dashboardData?.platforms.facebook.followers || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Crescimento Mensal</span>
                    <span className={`font-semibold ${getGrowthColor(dashboardData?.platforms.facebook.monthlyGrowth || 0)}`}>
                      {dashboardData?.platforms.facebook.monthlyGrowth || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Média Diária</span>
                    <span className="font-semibold">
                      +{dashboardData?.platforms.facebook.dailyAverage || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Crescimento de Seguidores - Últimos 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData?.chartData.followers || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="instagram"
                        stackId="1"
                        stroke="#e1306c"
                        fill="#e1306c"
                        fillOpacity={0.6}
                        name="Instagram"
                      />
                      <Area
                        type="monotone"
                        dataKey="facebook"
                        stackId="1"
                        stroke="#1877f2"
                        fill="#1877f2"
                        fillOpacity={0.6}
                        name="Facebook"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Metas de Crescimento</h2>
              <Button onClick={() => setIsCreatingGoal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <Card key={goal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(goal.platform)}
                        {getMetricIcon(goal.metric)}
                        <span className="font-medium capitalize">
                          {goal.metric} - {goal.platform}
                        </span>
                      </div>
                      <Badge variant={goal.isActive ? "default" : "secondary"}>
                        {goal.isActive ? "Ativa" : "Pausada"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progresso</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Atual: {goal.currentValue || 0}</span>
                        <span>Meta: {goal.targetValue}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">{goal.description}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      Prazo: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedGoal(goal)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Analytics Avançado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Análises detalhadas e relatórios personalizados em breve.
                  </p>
                  <Badge variant="secondary">Em Desenvolvimento</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfis Conectados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Conecte suas Redes Sociais
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Integração com APIs do Instagram e Facebook em breve.
                  </p>
                  <Badge variant="secondary">Em Desenvolvimento</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}