/**
 * Painel de Administração de Assinaturas
 * 
 * Este painel oferece uma visão unificada e controle sobre todas as assinaturas
 * da plataforma, independente da origem (Hotmart, Doppus, manual).
 * 
 * Organizado em 3 abas principais:
 * 1. Visão Geral - Dashboard com métricas consolidadas
 * 2. Assinaturas - Lista de usuários com assinaturas ativas/expiradas
 * 3. Configurações - Opções gerais para gerenciamento de assinaturas
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/layout/AdminLayout';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';
import SubscriptionSettings from '@/components/admin/SubscriptionSettings';

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
  Bell,
  Settings,
  RefreshCw,
  CalendarClock,
  BadgeDollarSign,
  Wallet,
  CircleDollarSign,
  UserCheck,
  LineChart
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExtendedBadge } from '@/components/ui/badge-extensions';
import { Separator } from '@/components/ui/separator';

export default function AssinaturasPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [dateFilter, setDateFilter] = useState<string>('30');

  // Simulação de dados para o dashboard. Idealmente, estes seriam carregados via API
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
          averageRetention: 0,
          mrr: 0,
          averageValue: 0,
          annualRevenue: 0,
          subscriptionsBySource: []
        };
      }
    }
  });

  return (
    <AdminLayout title="Painel de Assinaturas" backLink="/admin">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Assinaturas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Configurações
          </TabsTrigger>
        </TabsList>

        {/* Dashboard / Visão Geral */}
        <TabsContent value="overview">
          <div className="mb-6 mt-6">
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

          {/* Indicadores financeiros */}
          <h3 className="text-lg font-semibold mb-3 mt-6">Indicadores Financeiros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal (MRR)</CardTitle>
                <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `R$ ${(dashboardStats?.mrr || 0).toLocaleString('pt-BR')}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita mensal recorrente
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `R$ ${(dashboardStats?.averageValue || 0).toLocaleString('pt-BR')}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor médio por assinatura
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projeção Anual</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `R$ ${(dashboardStats?.annualRevenue || 0).toLocaleString('pt-BR')}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Projeção de receita anual
                </p>
              </CardContent>
            </Card>
            
            {/* Segunda linha de métricas financeiras */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
                  Taxa de cancelamento
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retenção Média</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `${dashboardStats?.averageRetention || 0} dias`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempo médio de permanência
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor do Cliente (LTV)</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `R$ ${(dashboardStats?.averageLTV || 0).toLocaleString('pt-BR')}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor médio ao longo da vida
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de retenção */}
          <h3 className="text-lg font-semibold mb-3">Métricas de Retenção</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
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
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo de Permanência</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `${dashboardStats?.averageRetention || 0} dias`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempo médio de permanência
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Renovação</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `${((100 - (dashboardStats?.churnRate || 0))).toFixed(1)}%`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentual de assinaturas renovadas
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
        </TabsContent>

        {/* Lista de Assinaturas */}
        <TabsContent value="subscriptions">
          <div className="mb-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Assinaturas</h2>
                <p className="text-gray-500 mt-1">Visualize e gerencie assinaturas de usuários da plataforma</p>
              </div>
            </div>
          </div>
          <SubscriptionManagement />
        </TabsContent>



        {/* Configurações */}
        <TabsContent value="settings">
          <div className="mb-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Configurações de Assinaturas</h2>
                <p className="text-gray-500 mt-1">Configure opções globais para o sistema de assinaturas</p>
              </div>
            </div>
          </div>
          
          <SubscriptionSettings />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}