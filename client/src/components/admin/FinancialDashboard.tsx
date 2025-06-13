import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  BarChart3,
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
  const { data: financialData, isLoading, error } = useQuery({
    queryKey: ['/api/financial/stats', period],
    queryFn: async () => {
      const response = await fetch(`/api/financial/stats?period=${period}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados financeiros');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando dados financeiros...
        </div>
      </div>
    );
  }

  if (error || !financialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-600">
          <p>Erro ao carregar dados financeiros</p>
          <p className="text-sm mt-1">Tente novamente em alguns momentos</p>
        </div>
      </div>
    );
  }

  const { summary, revenueBySource, recentSubscribers } = financialData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Período: {period === 'all' ? 'Todo período' : period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.mrr)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita Recorrente Mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.activeSubscribers}
            </div>
            <p className="text-xs text-muted-foreground">
              Assinantes premium ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.churnRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de cancelamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(summary.averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por assinante
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Receita por Origem de Pagamento */}
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
            {revenueBySource.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="secondary"
                    className={
                      source.source === 'hotmart' 
                        ? 'bg-orange-100 text-orange-800 border-orange-200' 
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }
                  >
                    {source.source}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={
                      source.planType === 'anual'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }
                  >
                    {source.planType}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {source.subscribers} assinantes
                  </span>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(source.revenue)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assinantes Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assinantes Recentes
          </CardTitle>
          <CardDescription>
            Últimos assinantes que adquiriram planos premium
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSubscribers.map((subscriber, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {subscriber.name || 'Não informado'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {subscriber.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscriber.planType === 'anual' ? 'default' : 'secondary'}>
                      {subscriber.planType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {subscriber.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(subscriber.subscriptionDate)}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(subscriber.planValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;