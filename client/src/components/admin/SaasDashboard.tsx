import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Crown, TrendingUp, DollarSign, Calendar, AlertTriangle } from "lucide-react";

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  premiumUsers: number;
  freeUsers: number;
  conversionRate: number;
  subscriptionRevenue: number;
}

export function SaasDashboard() {
  const { data: metrics, isLoading, error } = useQuery<UserMetrics>({
    queryKey: ['/api/admin/users/stats'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar métricas</h3>
            <p className="text-gray-600 text-sm">
              Não foi possível carregar os dados do dashboard. Verifique sua conexão.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardCards = [
    {
      title: "Usuários Totais",
      value: metrics?.totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Usuários Ativos",
      value: metrics?.activeUsers || 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Usuários Premium",
      value: metrics?.premiumUsers || 0,
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Receita Mensal",
      value: `R$ ${(metrics?.subscriptionRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard SaaS</h2>
          <p className="text-gray-600">Visão geral das métricas de assinatura</p>
        </div>
        <Badge variant="outline" className="text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Ao vivo
        </Badge>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {metrics?.conversionRate || 0}%
            </div>
            <p className="text-gray-600 text-sm">
              Taxa de conversão de usuários gratuitos para premium
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              Distribuição de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usuários Free</span>
                <Badge variant="secondary">{metrics?.freeUsers || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usuários Premium</span>
                <Badge variant="default">{metrics?.premiumUsers || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usuários Inativos</span>
                <Badge variant="outline">{metrics?.inactiveUsers || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Resumo da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {((metrics?.activeUsers || 0) / (metrics?.totalUsers || 1) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Taxa de Atividade</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {metrics?.premiumUsers || 0}
              </div>
              <p className="text-sm text-gray-600">Assinantes Ativos</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                R$ {((metrics?.subscriptionRevenue || 0) * 12).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Receita Anual Projetada</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}