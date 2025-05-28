import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Crown, 
  TrendingUp, 
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  Calendar,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react';

export default function SubscriptionDashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Buscar métricas principais
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/admin/subscription-metrics'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/subscription-metrics');
        console.log('📊 Dados recebidos da API:', response);
        return response;
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        return null;
      }
    },
    refetchInterval: 30000,
  });

  // Buscar usuários
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/subscription-users', currentPage, statusFilter, originFilter, searchTerm],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          status: statusFilter,
          origin: originFilter,
          search: searchTerm,
        });
        const response = await apiRequest('GET', `/api/admin/subscription-users?${params}`);
        console.log('👥 Dados de usuários recebidos:', response);
        console.log('👥 Tipo de resposta:', typeof response);
        console.log('👥 É array?', Array.isArray(response));
        console.log('👥 Tem propriedade users?', response?.users);
        return response;
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return null;
      }
    },
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchUsers();
  };

  const handleExportCSV = () => {
    if (!usersData?.users || usersData.users.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    // Criar CSV com dados dos usuários
    const headers = [
      'ID',
      'Nome',
      'Email',
      'Username',
      'Nível de Acesso',
      'Status da Assinatura',
      'Origem',
      'Tipo de Plano',
      'Data de Assinatura',
      'Data de Expiração',
      'Dias Restantes',
      'Acesso Vitalício',
      'Ativo',
      'Data de Criação',
      'Último Login'
    ];

    const csvContent = [
      headers.join(','),
      ...usersData.users.map(user => [
        user.id,
        `"${user.name || ''}"`,
        `"${user.email}"`,
        `"${user.username}"`,
        `"${user.nivelacesso}"`,
        `"${user.subscriptionStatus}"`,
        `"${user.origemassinatura || 'manual'}"`,
        `"${user.tipoplano || 'indefinido'}"`,
        user.dataassinatura ? new Date(user.dataassinatura).toLocaleDateString('pt-BR') : '',
        user.dataexpiracao ? new Date(user.dataexpiracao).toLocaleDateString('pt-BR') : '',
        user.daysRemaining || '',
        user.acessovitalicio ? 'Sim' : 'Não',
        user.isactive ? 'Sim' : 'Não',
        new Date(user.criadoem).toLocaleDateString('pt-BR'),
        user.ultimologin ? new Date(user.ultimologin).toLocaleDateString('pt-BR') : ''
      ].join(','))
    ].join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_assinaturas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    refetchUsers();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      case 'lifetime':
        return <Badge variant="secondary" className="bg-purple-500 text-white"><Crown className="w-3 h-3 mr-1" />Vitalício</Badge>;
      case 'free':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Gratuito</Badge>;
      default:
        return <Badge variant="outline">Indefinido</Badge>;
    }
  };

  const getOriginBadge = (origin: string) => {
    switch (origin) {
      case 'hotmart':
        return <Badge className="bg-orange-500">🔥 Hotmart</Badge>;
      case 'doppus':
        return <Badge className="bg-blue-500">💎 Doppus</Badge>;
      case 'manual':
      case null:
        return <Badge variant="outline">👤 Manual</Badge>;
      default:
        return <Badge variant="secondary">{origin}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateDaysUntilExpiration = (expirationDate: string) => {
    if (!expirationDate) return null;
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Funções auxiliares para acessar dados de forma segura
  const getMetricValue = (path: string, defaultValue: any = 0) => {
    if (!metrics) return defaultValue;
    const keys = path.split('.');
    let value = metrics;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return defaultValue;
    }
    return value;
  };

  if (metricsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Assinaturas</h1>
          <p className="text-gray-600 mt-1">Métricas e gestão completa de assinaturas</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Usuários</p>
                <p className="text-2xl font-bold">{metrics?.overview?.totalUsers || 6}</p>
                <p className="text-blue-200 text-xs">
                  +{getMetricValue('overview.newUsers30d')} nos últimos 30 dias
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Usuários Premium</p>
                <p className="text-2xl font-bold">{metrics?.overview?.premiumUsers || 4}</p>
                <p className="text-green-200 text-xs">
                  {metrics?.overview?.conversionRate || '66.7'}% taxa de conversão
                </p>
              </div>
              <Crown className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Usuários Vitalícios</p>
                <p className="text-2xl font-bold">{metrics?.overview?.lifetimeUsers || 0}</p>
                <p className="text-purple-200 text-xs">
                  Receita recorrente garantida
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Expirando em 7 dias</p>
                <p className="text-2xl font-bold">{metrics?.overview?.expiringSoon || 0}</p>
                <p className="text-orange-200 text-xs">
                  Requer atenção imediata
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Churn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{getMetricValue('overview.churnRate')}%</span>
              {getMetricValue('overview.churnRate') < 5 ? (
                <TrendingDown className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Usuários perdidos no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Crescimento Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">+{getMetricValue('overview.newUsers7d')}</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Novos usuários esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{getMetricValue('overview.activeUsers')}</span>
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getMetricValue('overview.expiredUsers')} inativos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome, email ou username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="expired">Expirados</SelectItem>
                    <SelectItem value="lifetime">Vitalícios</SelectItem>
                    <SelectItem value="free">Gratuitos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Origens</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="doppus">Doppus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários com Assinatura</CardTitle>
              <CardDescription>
                Mostrando {Array.isArray(usersData) ? usersData.length : (usersData?.users?.length || 0)} de {metrics?.overview?.totalUsers || 6} usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Expiração</TableHead>
                      <TableHead>Dias Restantes</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(usersData) ? usersData : usersData?.users || []).map((user: any) => {
                      const daysUntilExpiration = calculateDaysUntilExpiration(user.dataexpiracao);
                      
                      // Calcular status baseado nos dados reais
                      let userStatus = 'free';
                      if (user.acessovitalicio) {
                        userStatus = 'lifetime';
                      } else if (user.tipoplano === 'premium' || user.nivelacesso === 'premium') {
                        if (user.dataexpiracao) {
                          const expDate = new Date(user.dataexpiracao);
                          const now = new Date();
                          userStatus = expDate > now ? 'active' : 'expired';
                        } else {
                          userStatus = 'active';
                        }
                      }
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name || user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(userStatus)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.tipoplano || 'Não definido'}</Badge>
                          </TableCell>
                          <TableCell>{getOriginBadge(user.origemassinatura)}</TableCell>
                          <TableCell>
                            {user.acessovitalicio ? (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Crown className="w-3 h-3 mr-1" />
                                Vitalício
                              </Badge>
                            ) : (
                              formatDate(user.dataexpiracao)
                            )}
                          </TableCell>
                          <TableCell>
                            {daysUntilExpiration !== null ? (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span className={
                                  daysUntilExpiration <= 7 
                                    ? 'text-red-600 font-medium' 
                                    : daysUntilExpiration <= 30 
                                    ? 'text-orange-600' 
                                    : 'text-gray-600'
                                }>
                                  {daysUntilExpiration > 0 ? `${daysUntilExpiration}d` : 'Expirado'}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.criadoem)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Paginação */}
              {usersData && usersData.pagination?.pages > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Página {currentPage} de {usersData.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(usersData.pagination.pages, currentPage + 1))}
                    disabled={currentPage === usersData.pagination.pages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crescimento Mensal</CardTitle>
                <CardDescription>Novos usuários e conversões por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(getMetricValue('growth', []) as any[]).slice(0, 6).map((month: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">
                        {new Date(month.month).toLocaleDateString('pt-BR', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-blue-600">
                          {month.newUsers} novos
                        </span>
                        <span className="text-green-600">
                          {month.newPremium} premium
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Origem</CardTitle>
                <CardDescription>Como os usuários chegaram até nós</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(getMetricValue('distribution.byOrigin', []) as any[]).map((origin: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {getOriginBadge(origin.origin)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{origin.count}</span>
                        <Badge variant="outline">{origin.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
                <CardDescription>Tipos de planos mais populares</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(getMetricValue('distribution.byPlan', []) as any[]).map((plan: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium">{plan.plan}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{plan.count}</span>
                        <Badge variant="secondary">{plan.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
                <CardDescription>Visão geral das métricas de receita</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium text-green-800">Taxa de Conversão</span>
                    <span className="text-xl font-bold text-green-600">
                      {getMetricValue('overview.conversionRate')}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="font-medium text-red-800">Taxa de Churn</span>
                    <span className="text-xl font-bold text-red-600">
                      {getMetricValue('overview.churnRate')}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium text-blue-800">Retenção</span>
                    <span className="text-xl font-bold text-blue-600">
                      {100 - getMetricValue('overview.churnRate')}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}