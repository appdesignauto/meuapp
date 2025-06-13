import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialDashboardProps {
  period: string;
}

interface FinancialData {
  period: string;
  summary: {
    totalRevenue: number;
    mrr: number;
    activeSubscribers: number;
    churnRate: number;
    averageTicket: number;
  };
  revenueBySource: Array<{
    source: string;
    planType: string;
    subscribers: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    subscriptions: number;
    revenue: number;
  }>;
  averageTicketByPlan: Array<{
    planType: string;
    subscribers: number;
    price: number;
  }>;
  revenueByPlanType: Array<{
    planType: string;
    subscribers: number;
    revenue: number;
  }>;
  recentSubscribers: Array<{
    id: number;
    name: string;
    email: string;
    planType: string;
    source: string;
    subscriptionDate: string;
    planValue: number;
  }>;
}

const FinancialDashboard = ({ period }: FinancialDashboardProps) => {
  const [financialActiveTab, setFinancialActiveTab] = useState('overview');

  const { data: financialData, isLoading, error, refetch } = useQuery<FinancialData>({
    queryKey: ['/api/financial/stats', period],
    queryFn: async () => {
      const response = await fetch(`/api/financial/stats?period=${period}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados financeiros');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando dados financeiros...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-600 mb-4">
          <TrendingDown className="w-12 h-12 mx-auto mb-2" />
          <p className="font-medium">Erro ao carregar dados financeiros</p>
          <p className="text-sm text-gray-500 mt-1">Verifique sua conexão e tente novamente</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'hotmart':
        return 'bg-orange-100 text-orange-800';
      case 'doppus':
        return 'bg-blue-100 text-blue-800';
      case 'manual':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType?.toLowerCase()) {
      case 'anual':
        return 'bg-purple-100 text-purple-800';
      case 'mensal':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Abas internas do Financeiro */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Financial tabs">
          <button
            onClick={() => setFinancialActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              financialActiveTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setFinancialActiveTab('performance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              financialActiveTab === 'performance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance de Planos
          </button>
          <button
            onClick={() => setFinancialActiveTab('recent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              financialActiveTab === 'recent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assinantes Recentes
          </button>
        </nav>
      </div>

      {/* Conteúdo das abas */}
      {financialActiveTab === 'overview' && (
        <div className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialData?.summary.totalRevenue || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Período: {period === 'all' ? 'Todo período' : period}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  MRR
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financialData?.summary.mrr || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Receita Recorrente Mensal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Assinantes Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {financialData?.summary.activeSubscribers || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Assinantes premium ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Taxa de Churn
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {financialData?.summary.churnRate || 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Taxa de cancelamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Ticket Médio
                </CardTitle>
                <CreditCard className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(financialData?.summary.averageTicket || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Valor médio por assinante
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Receita por Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Receita por Origem de Pagamento
              </CardTitle>
              <CardDescription>
                Distribuição da receita por plataforma de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData?.revenueBySource.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getSourceBadgeVariant(item.source)}>
                        {item.source || 'Desconhecido'}
                      </Badge>
                      <Badge variant="outline" className={getPlanBadgeVariant(item.planType)}>
                        {item.planType || 'Indefinido'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {item.subscribers} assinantes
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {financialActiveTab === 'performance' && (
        <div className="space-y-6">
          {/* Faturamento por Tipo de Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Faturamento por Tipo de Plano
              </CardTitle>
              <CardDescription>
                Receita gerada por cada tipo de plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData?.revenueByPlanType.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getPlanBadgeVariant(item.planType)}>
                        {item.planType || 'Indefinido'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {item.subscribers} assinantes
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ticket Médio por Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Ticket Médio por Plano
              </CardTitle>
              <CardDescription>
                Valor médio de cada tipo de plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData?.averageTicketByPlan.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getPlanBadgeVariant(item.planType)}>
                        {item.planType || 'Indefinido'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {item.subscribers} assinantes
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-indigo-600">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {financialActiveTab === 'recent' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assinantes Recentes
              </CardTitle>
              <CardDescription>
                Últimos assinantes que fizeram upgrade para premium (últimos 30 dias)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialData?.recentSubscribers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum assinante recente encontrado</p>
                  <p className="text-sm">Não há novos assinantes nos últimos 30 dias</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData?.recentSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">
                          {subscriber.name || 'Nome não informado'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {subscriber.email}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPlanBadgeVariant(subscriber.planType)}>
                            {subscriber.planType || 'Indefinido'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSourceBadgeVariant(subscriber.source)}>
                            {subscriber.source || 'Desconhecido'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(subscriber.subscriptionDate)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(subscriber.planValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;