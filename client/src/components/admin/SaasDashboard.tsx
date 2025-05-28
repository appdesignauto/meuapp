import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, TrendingUp, DollarSign, Activity, UserCheck } from 'lucide-react';

interface SimplifiedMetrics {
  totalUsers: number;
  premiumUsers: number;
  conversionRate: number;
  subscriptionRevenue: number;
}

export function SaasDashboard() {
  // Usar endpoint de usuários existente para dados básicos
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/users'],
    refetchInterval: 30000,
  });

  // Calcular métricas simples baseadas nos dados dos usuários
  const metrics: SimplifiedMetrics = {
    totalUsers: usersData?.length || 0,
    premiumUsers: usersData?.filter((user: any) => 
      user.acessovitalicio || 
      user.nivelacesso === 'premium' || 
      (user.dataexpiracao && new Date(user.dataexpiracao) > new Date())
    ).length || 0,
    conversionRate: 0,
    subscriptionRevenue: 0
  };

  // Calcular taxa de conversão e receita
  if (metrics.totalUsers > 0) {
    metrics.conversionRate = parseFloat(((metrics.premiumUsers / metrics.totalUsers) * 100).toFixed(1));
    metrics.subscriptionRevenue = parseFloat((metrics.premiumUsers * 29.90).toFixed(2));
  }

  const freeUsers = metrics.totalUsers - metrics.premiumUsers;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard SaaS</h2>
          <p className="text-gray-600">Visão geral das métricas de assinaturas e usuários</p>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-blue-200">
              Usuários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Usuários Premium</CardTitle>
            <Crown className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.premiumUsers}</div>
            <p className="text-xs text-green-200">
              {metrics.conversionRate}% conversão
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.subscriptionRevenue.toFixed(2)}</div>
            <p className="text-xs text-purple-200">
              Estimativa baseada em assinaturas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-orange-200">
              Free para premium
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Detalhado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total de Usuários</span>
              <span className="text-sm text-gray-600">{metrics.totalUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usuários Premium</span>
              <span className="text-sm text-green-600 font-semibold">{metrics.premiumUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usuários Gratuitos</span>
              <span className="text-sm text-gray-600">{freeUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Taxa de Conversão</span>
              <span className="text-sm text-blue-600 font-semibold">{metrics.conversionRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas Financeiras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Receita Atual</span>
              <span className="text-sm text-green-600 font-semibold">R$ {metrics.subscriptionRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Valor por Assinatura</span>
              <span className="text-sm text-gray-600">R$ 29,90</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Potencial de Receita</span>
              <span className="text-sm text-purple-600 font-semibold">R$ {(freeUsers * 29.90).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Receita Máxima</span>
              <span className="text-sm text-blue-600 font-semibold">R$ {(metrics.totalUsers * 29.90).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Status do Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Dashboard funcionando corretamente • Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}