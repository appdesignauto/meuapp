import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown,
  CalendarClock,
  BadgeDollarSign,
  Wallet,
  CircleDollarSign,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExtendedBadge } from '@/components/ui/badge-extensions';
import { Separator } from '@/components/ui/separator';

export default function SubscriptionTrends() {
  const [dateFilter, setDateFilter] = useState<string>('30');

  // Busca dados para o dashboard
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/subscriptions/stats', dateFilter],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/subscriptions/stats?days=${dateFilter}`);
        if (!response.ok) throw new Error('Falha ao carregar estatísticas');
        return await response.json();
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Retornamos uma estrutura vazia mas com os campos necessários
        return {
          totalSubscribers: 0,
          activeSubscriptions: 0,
          expiringSubscriptions: 0,
          revenueMetrics: { 
            currentMonth: 0, 
            previousMonth: 0,
            trend: 0
          },
          conversionRate: 0,
          churnRate: 0,
          averageLTV: 0,
          subscriptionsBySource: []
        };
      }
    }
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard de Assinaturas</h2>
            <p className="text-gray-500 mt-1">Visão consolidada de métricas e desempenho de assinaturas</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                dashboardStats?.activeSubscriptions || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <ExtendedBadge variant={dashboardStats?.revenueMetrics?.trend > 0 ? "success" : "destructive"} className="mr-1">
                {dashboardStats?.revenueMetrics?.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(dashboardStats?.revenueMetrics?.trend || 0)}%
              </ExtendedBadge>
              em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                `R$ ${(dashboardStats?.revenueMetrics?.currentMonth || 0).toLocaleString('pt-BR')}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <ExtendedBadge variant={dashboardStats?.revenueMetrics?.trend > 0 ? "success" : "destructive"} className="mr-1">
                {dashboardStats?.revenueMetrics?.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(dashboardStats?.revenueMetrics?.trend || 0)}%
              </ExtendedBadge>
              em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Expirações</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                dashboardStats?.expiringSubscriptions || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Assinaturas a expirar nos próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas financeiras */}
      <h3 className="text-lg font-semibold mb-3">Métricas Financeiras</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Médio</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                `R$ ${(dashboardStats?.averageLTV || 0).toLocaleString('pt-BR')}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor do tempo de vida do cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                `${(dashboardStats?.conversionRate || 0).toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Visitantes convertidos em assinantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                `${(dashboardStats?.churnRate || 0).toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de cancelamento mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Origem das assinaturas */}
      <h3 className="text-lg font-semibold mb-3">Origem das Assinaturas</h3>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {isLoadingStats ? (
              <>
                <div className="h-6 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-6 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-6 bg-muted animate-pulse rounded"></div>
              </>
            ) : (
              dashboardStats?.subscriptionsBySource?.map((source: any) => (
                <div key={source.name} className="flex items-center">
                  <div className="w-1/4 font-medium">{source.name}</div>
                  <div className="w-3/4">
                    <div className="flex items-center">
                      <div 
                        className="h-2 bg-primary rounded" 
                        style={{ width: `${source.percentage}%` }}
                      ></div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {source.count} ({source.percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              )) || []
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}