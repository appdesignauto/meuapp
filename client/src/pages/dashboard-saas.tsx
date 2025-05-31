import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";

interface DashboardMetrics {
  financial: {
    mrr: number;
    arr: number;
    revenue30Days: number;
    revenue7Days: number;
    churnRate: number;
    ltv: number;
  };
  users: {
    totalUsers: number;
    activeSubscriptions: number;
    freeUsers: number;
    premiumUsers: number;
    newUsers30Days: number;
    newUsers7Days: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
    churnRate: number;
  };
  growth: {
    userGrowthRate: number;
    revenueGrowthRate: number;
    conversionRate: number;
  };
}

interface RevenueData {
  month: string;
  revenue: number;
  subscribers: number;
}

interface UserSegment {
  segment: string;
  count: number;
  percentage: number;
  revenue: number;
}

export default function DashboardSaas() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ["/api/dashboard/revenue-chart"],
  });

  const { data: userSegments, isLoading: segmentsLoading } = useQuery<UserSegment[]>({
    queryKey: ["/api/dashboard/user-segments"],
  });

  if (metricsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
        <p className="text-muted-foreground">
          Visão geral das métricas de crescimento e receita do DesignAuto
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatCurrency(metrics.financial.mrr) : '-'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{metrics ? formatPercentage(metrics.growth.revenueGrowthRate) : '0%'} este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.users.totalUsers.toLocaleString('pt-BR') || '-'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{metrics?.users.newUsers30Days || 0} novos este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatPercentage(metrics.growth.conversionRate) : '-'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3 text-blue-500" />
              <span>Free para Premium</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatPercentage(metrics.financial.churnRate) : '-'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span>Cancelamentos mensais</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visões */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="retention">Retenção</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Receita vs Assinantes</CardTitle>
                <CardDescription>
                  Evolução mensal da receita e base de assinantes
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {revenueLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse bg-gray-200 rounded h-48 w-full"></div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                    <p className="text-muted-foreground">Gráfico de receita em desenvolvimento</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Distribuição de Usuários</CardTitle>
                <CardDescription>
                  Segmentação da base de usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Usuários Premium</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {metrics?.users.premiumUsers.toLocaleString('pt-BR') || '0'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metrics ? formatPercentage((metrics.users.premiumUsers / metrics.users.totalUsers) * 100) : '0%'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium">Usuários Free</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {metrics?.users.freeUsers.toLocaleString('pt-BR') || '0'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metrics ? formatPercentage((metrics.users.freeUsers / metrics.users.totalUsers) * 100) : '0%'}
                      </div>
                    </div>
                  </div>

                  <Progress 
                    value={metrics ? (metrics.users.premiumUsers / metrics.users.totalUsers) * 100 : 0} 
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>ARR (Receita Anual Recorrente)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics ? formatCurrency(metrics.financial.arr) : '-'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Baseado no MRR atual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LTV (Valor Vitalício)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics ? formatCurrency(metrics.financial.ltv) : '-'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Por cliente premium
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics ? formatCurrency(metrics.financial.revenue30Days) : '-'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Últimos 30 dias
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Últimos 7 dias</span>
                  <Badge variant="secondary">
                    +{metrics?.users.newUsers7Days || 0} novos
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Últimos 30 dias</span>
                  <Badge variant="secondary">
                    +{metrics?.users.newUsers30Days || 0} novos
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa de crescimento</span>
                  <Badge variant="outline">
                    {metrics ? formatPercentage(metrics.growth.userGrowthRate) : '0%'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assinaturas Ativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">
                  {metrics?.users.activeSubscriptions.toLocaleString('pt-BR') || '0'}
                </div>
                <Progress 
                  value={metrics ? (metrics.users.activeSubscriptions / metrics.users.totalUsers) * 100 : 0}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {metrics ? formatPercentage((metrics.users.activeSubscriptions / metrics.users.totalUsers) * 100) : '0%'} dos usuários são premium
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Retenção</CardTitle>
              <CardDescription>
                Percentual de usuários que continuam ativos após o registro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Dia 1</span>
                  <span className="text-sm font-bold">
                    {metrics ? formatPercentage(metrics.retention.day1) : '0%'}
                  </span>
                </div>
                <Progress value={metrics?.retention.day1 || 0} className="w-full" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Dia 7</span>
                  <span className="text-sm font-bold">
                    {metrics ? formatPercentage(metrics.retention.day7) : '0%'}
                  </span>
                </div>
                <Progress value={metrics?.retention.day7 || 0} className="w-full" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Dia 30</span>
                  <span className="text-sm font-bold">
                    {metrics ? formatPercentage(metrics.retention.day30) : '0%'}
                  </span>
                </div>
                <Progress value={metrics?.retention.day30 || 0} className="w-full" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}