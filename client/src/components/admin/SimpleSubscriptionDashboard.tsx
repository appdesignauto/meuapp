import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
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
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  UserCheck,
  UserX,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';

// Interface para métricas simplificadas
interface SubscriptionMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  lifetimeUsers: number;
  expiredSubscriptions: number;
  freeUsers: number;
  conversionRate: number;
  monthlyRevenue: number;
}

function SimpleSubscriptionDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');

  // Buscar dados dos usuários
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['/api/users'],
    refetchInterval: 30000,
  });

  // Calcular métricas baseadas nos dados reais dos usuários
  const calculateMetrics = (): SubscriptionMetrics => {
    if (!usersData) return {
      totalUsers: 0,
      activeSubscriptions: 0,
      lifetimeUsers: 0,
      expiredSubscriptions: 0,
      freeUsers: 0,
      conversionRate: 0,
      monthlyRevenue: 0
    };

    const now = new Date();
    let activeSubscriptions = 0;
    let lifetimeUsers = 0;
    let expiredSubscriptions = 0;
    let monthlyRevenue = 0;

    usersData.forEach((user: any) => {
      // Verificar se tem acesso vitalício
      if (user.acessovitalicio) {
        lifetimeUsers++;
        activeSubscriptions++;
        monthlyRevenue += 497.00; // Valor do plano vitalício
        return;
      }

      // Verificar se é premium por nível de acesso
      if (user.nivelacesso === 'premium' || 
          user.nivelacesso === 'admin' || 
          user.nivelacesso === 'designer' || 
          user.nivelacesso === 'designer_adm') {
        activeSubscriptions++;
        
        // Calcular receita baseada no tipo de plano
        switch (user.tipoplano) {
          case 'mensal':
            monthlyRevenue += 29.90;
            break;
          case 'anual':
            monthlyRevenue += 16.42; // R$ 197/12 meses
            break;
          case 'vitalicio':
            monthlyRevenue += 497.00;
            lifetimeUsers++;
            break;
          default:
            monthlyRevenue += 29.90; // Valor padrão
        }
        return;
      }

      // Verificar assinaturas com data de expiração
      if (user.dataexpiracao) {
        const expirationDate = new Date(user.dataexpiracao);
        if (expirationDate > now) {
          activeSubscriptions++;
          // Calcular receita baseada no tipo de plano
          switch (user.tipoplano) {
            case 'mensal':
              monthlyRevenue += 29.90;
              break;
            case 'anual':
              monthlyRevenue += 16.42;
              break;
            default:
              monthlyRevenue += 29.90;
          }
        } else {
          expiredSubscriptions++;
        }
      }
    });

    const totalUsers = usersData.length;
    const freeUsers = totalUsers - activeSubscriptions - expiredSubscriptions;
    const conversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeSubscriptions,
      lifetimeUsers,
      expiredSubscriptions,
      freeUsers,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2))
    };
  };

  const metrics = calculateMetrics();

  // Processar dados dos usuários para exibição
  const processedUsers = usersData?.map((user: any) => {
    const now = new Date();
    let subscriptionStatus = 'free';
    let daysRemaining = null;

    if (user.acessovitalicio) {
      subscriptionStatus = 'lifetime';
    } else if (user.nivelacesso === 'premium' || 
               user.nivelacesso === 'admin' || 
               user.nivelacesso === 'designer' || 
               user.nivelacesso === 'designer_adm') {
      subscriptionStatus = 'active';
    } else if (user.dataexpiracao) {
      const expirationDate = new Date(user.dataexpiracao);
      if (expirationDate > now) {
        subscriptionStatus = 'active';
        daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        subscriptionStatus = 'expired';
      }
    }

    return {
      ...user,
      subscriptionStatus,
      daysRemaining
    };
  }) || [];

  // Filtrar usuários
  const filteredUsers = processedUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.subscriptionStatus === statusFilter;
    
    const matchesOrigin = originFilter === 'all' || 
                         (originFilter === 'manual' && (!user.origemassinatura || user.origemassinatura === 'manual')) ||
                         user.origemassinatura === originFilter;

    return matchesSearch && matchesStatus && matchesOrigin;
  });

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

  const getOriginBadge = (origin: string | null) => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleExportCSV = () => {
    if (!filteredUsers.length) {
      alert('Não há dados para exportar');
      return;
    }

    const headers = [
      'ID', 'Nome', 'Email', 'Username', 'Nível de Acesso', 
      'Status da Assinatura', 'Origem', 'Tipo de Plano', 
      'Data de Assinatura', 'Data de Expiração', 'Dias Restantes',
      'Acesso Vitalício', 'Ativo', 'Data de Criação', 'Último Login'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.id,
        `"${user.name || ''}"`,
        `"${user.email}"`,
        `"${user.username}"`,
        `"${user.nivelacesso}"`,
        `"${user.subscriptionStatus}"`,
        `"${user.origemassinatura || 'manual'}"`,
        `"${user.tipoplano || 'indefinido'}"`,
        user.dataassinatura ? formatDate(user.dataassinatura) : '',
        user.dataexpiracao ? formatDate(user.dataexpiracao) : '',
        user.daysRemaining || '',
        user.acessovitalicio ? 'Sim' : 'Não',
        user.isactive ? 'Sim' : 'Não',
        formatDate(user.criadoem),
        user.ultimologin ? formatDate(user.ultimologin) : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_assinaturas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Assinaturas</h2>
          <p className="text-muted-foreground">
            Gerencie e monitore todas as assinaturas da plataforma
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Base completa de usuários
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.conversionRate}% de conversão
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Vitalícios</CardTitle>
                <Crown className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{metrics.lifetimeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Acesso permanente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ {metrics.monthlyRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Receita recorrente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status das Assinaturas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Assinaturas Ativas</span>
                  <span className="text-sm text-green-600 font-semibold">{metrics.activeSubscriptions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Usuários Vitalícios</span>
                  <span className="text-sm text-purple-600 font-semibold">{metrics.lifetimeUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Assinaturas Expiradas</span>
                  <span className="text-sm text-red-600 font-semibold">{metrics.expiredSubscriptions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Usuários Gratuitos</span>
                  <span className="text-sm text-gray-600 font-semibold">{metrics.freeUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Conversão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa de Conversão</span>
                  <span className="text-sm text-blue-600 font-semibold">{metrics.conversionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Potencial de Receita</span>
                  <span className="text-sm text-purple-600 font-semibold">R$ {(metrics.freeUsers * 29.90).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Receita Anual Estimada</span>
                  <span className="text-sm text-green-600 font-semibold">R$ {(metrics.monthlyRevenue * 12).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Origem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const origins = processedUsers.reduce((acc: any, user) => {
                    const origin = user.origemassinatura || 'manual';
                    acc[origin] = (acc[origin] || 0) + 1;
                    return acc;
                  }, {});

                  return Object.entries(origins).map(([origin, count]: [string, any]) => (
                    <div key={origin} className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{origin}</span>
                      <span className="text-sm text-gray-600 font-semibold">{count}</span>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="lifetime">Vitalício</SelectItem>
                <SelectItem value="free">Gratuito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Origens</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="doppus">Doppus</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.subscriptionStatus)}</TableCell>
                      <TableCell>{getOriginBadge(user.origemassinatura)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.tipoplano ? user.tipoplano.charAt(0).toUpperCase() + user.tipoplano.slice(1) : 'Indefinido'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.dataexpiracao)}</TableCell>
                      <TableCell>
                        {user.daysRemaining !== null ? (
                          <span className={`font-medium ${user.daysRemaining <= 7 ? 'text-red-600' : user.daysRemaining <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {user.daysRemaining} dias
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SimpleSubscriptionDashboard;