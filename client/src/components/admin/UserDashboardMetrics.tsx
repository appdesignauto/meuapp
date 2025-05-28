import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Crown, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Activity,
  DollarSign,
  UserPlus,
  Shield,
  Palette,
  HeadphonesIcon,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  premiumUsers: number;
  freeUsers: number;
  designerUsers: number;
  adminUsers: number;
  supportUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  onlineUsers: number;
  recentActivity: number;
  subscriptionRevenue: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
  lifetimeUsers: number;
  trialUsers: number;
  conversionRate: number;
  churnRate: number;
  avgSessionDuration: number;
  usersByOrigin: Record<string, number>;
  usersByPlan: Record<string, number>;
  growthTrend: Array<{ date: string; count: number }>;
}

export default function UserDashboardMetrics() {
  const { data: metrics, isLoading, error } = useQuery<UserMetrics>({
    queryKey: ['/api/admin/user-metrics'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/user-metrics');
      if (!res.ok) {
        throw new Error('Erro ao carregar métricas');
      }
      return await res.json();
    },
    refetchInterval: 30000,
    retry: 2,
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const conversionPercentage = ((metrics.premiumUsers / metrics.totalUsers) * 100).toFixed(1);
  const activePercentage = ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Usuários */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{metrics.newUsersMonth} este mês
            </div>
          </CardContent>
        </Card>

        {/* Usuários Ativos */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Ativos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers.toLocaleString()}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">
                {activePercentage}% do total
              </div>
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                {metrics.onlineUsers} online
              </Badge>
            </div>
            <Progress value={parseFloat(activePercentage)} className="mt-2 h-1" />
          </CardContent>
        </Card>

        {/* Usuários Premium */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Premium
            </CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.premiumUsers.toLocaleString()}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">
                {conversionPercentage}% conversão
              </div>
              <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50">
                {metrics.lifetimeUsers} vitalício
              </Badge>
            </div>
            <Progress value={parseFloat(conversionPercentage)} className="mt-2 h-1" />
          </CardContent>
        </Card>

        {/* Receita de Assinaturas */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Estimada
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.subscriptionRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              MRR mensal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Novos Usuários */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Usuários
            </CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hoje</span>
                <span className="font-semibold">{metrics.newUsersToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">7 dias</span>
                <span className="font-semibold">{metrics.newUsersWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">30 dias</span>
                <span className="font-semibold">{metrics.newUsersMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usuários por Tipo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Por Categoria
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Palette className="h-3 w-3 text-amber-500" />
                  <span className="text-sm">Designers</span>
                </div>
                <span className="font-semibold">{metrics.designerUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span className="text-sm">Admins</span>
                </div>
                <span className="font-semibold">{metrics.adminUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HeadphonesIcon className="h-3 w-3 text-emerald-500" />
                  <span className="text-sm">Suporte</span>
                </div>
                <span className="font-semibold">{metrics.supportUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atividade e Engajamento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engajamento
            </CardTitle>
            <Activity className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Atividade recente</span>
                <span className="font-semibold">{metrics.recentActivity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sessão média</span>
                <span className="font-semibold">{Math.round(metrics.avgSessionDuration)}min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa conversão</span>
                <span className="font-semibold">{metrics.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Avisos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-orange-500" />
                  <span className="text-sm">Expira em 7d</span>
                </div>
                <Badge variant={metrics.expiringIn7Days > 0 ? "destructive" : "outline"}>
                  {metrics.expiringIn7Days}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-yellow-500" />
                  <span className="text-sm">Expira em 30d</span>
                </div>
                <Badge variant={metrics.expiringIn30Days > 5 ? "secondary" : "outline"}>
                  {metrics.expiringIn30Days}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserX className="h-3 w-3 text-red-500" />
                  <span className="text-sm">Inativos</span>
                </div>
                <Badge variant={metrics.inactiveUsers > 10 ? "destructive" : "outline"}>
                  {metrics.inactiveUsers}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Origem e Plano */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuários por Origem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usuários por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.usersByOrigin).map(([origin, count]) => {
                const percentage = ((count / metrics.totalUsers) * 100).toFixed(1);
                return (
                  <div key={origin} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{origin}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress value={parseFloat(percentage)} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Usuários por Tipo de Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usuários por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.usersByPlan).map(([plan, count]) => {
                const percentage = ((count / metrics.totalUsers) * 100).toFixed(1);
                return (
                  <div key={plan} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{plan}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress value={parseFloat(percentage)} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}