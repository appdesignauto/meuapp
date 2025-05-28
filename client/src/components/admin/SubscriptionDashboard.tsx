import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
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

interface User {
  id: number;
  email: string;
  username?: string;
  name?: string;
  nivelacesso: string;
  tipoplano?: string;
  dataassinatura?: string;
  dataexpiracao?: string;
  acessovitalicio: boolean;
  isactive: boolean;
  criadoem: string;
  ultimologin?: string;
  origemassinatura?: string;
}

interface MetricsResponse {
  overview: {
    totalUsers: number;
    premiumUsers: number;
    freeUsers: number;
    conversionRate: string;
    recentSignups: number;
  };
}

export default function SubscriptionDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');

  // Query para métricas
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<MetricsResponse>({
    queryKey: ['/api/admin/subscription-metrics'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Query para usuários
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/subscription-users'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  console.log('🔍 Debug Dashboard:');
  console.log('Metrics Data:', metricsData);
  console.log('Users Data:', usersData);

  const handleRefresh = async () => {
    console.log('🔄 Atualizando dados do dashboard...');
    
    try {
      // Invalidar cache e forçar reload
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-users'] });
      
      // Refetch dados
      await Promise.all([refetchMetrics(), refetchUsers()]);
      
      console.log('✅ Dados atualizados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
    }
  };

  const handleExportCSV = () => {
    if (!usersData || usersData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    // Criar CSV com dados dos usuários
    const headers = [
      'ID',
      'Email',
      'Username',
      'Nome',
      'Nível de Acesso',
      'Tipo de Plano',
      'Data de Assinatura',
      'Data de Expiração',
      'Acesso Vitalício',
      'Ativo',
      'Data de Criação',
      'Último Login',
      'Origem'
    ];

    const csvContent = [
      headers.join(','),
      ...usersData.map(user => [
        user.id,
        `"${user.email}"`,
        `"${user.username || ''}"`,
        `"${user.name || ''}"`,
        `"${user.nivelacesso}"`,
        `"${user.tipoplano || 'indefinido'}"`,
        user.dataassinatura ? new Date(user.dataassinatura).toLocaleDateString('pt-BR') : '',
        user.dataexpiracao ? new Date(user.dataexpiracao).toLocaleDateString('pt-BR') : '',
        user.acessovitalicio ? 'Sim' : 'Não',
        user.isactive ? 'Sim' : 'Não',
        new Date(user.criadoem).toLocaleDateString('pt-BR'),
        user.ultimologin ? new Date(user.ultimologin).toLocaleDateString('pt-BR') : '',
        `"${user.origemassinatura || 'manual'}"`
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
  };

  const getStatusBadge = (user: User) => {
    if (user.acessovitalicio) {
      return <Badge variant="secondary" className="bg-purple-500 text-white"><Crown className="w-3 h-3 mr-1" />Vitalício</Badge>;
    }
    
    if (['premium', 'designer', 'designer_adm'].includes(user.nivelacesso)) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Premium</Badge>;
    }
    
    if (user.nivelacesso === 'admin') {
      return <Badge variant="default" className="bg-blue-500"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
    }
    
    return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Gratuito</Badge>;
  };

  const getOriginBadge = (origin: string) => {
    switch (origin) {
      case 'hotmart':
        return <Badge className="bg-orange-500">🔥 Hotmart</Badge>;
      case 'doppus':
        return <Badge className="bg-blue-500">💎 Doppus</Badge>;
      case 'manual':
      case null:
      case undefined:
      default:
        return <Badge variant="outline">📝 Manual</Badge>;
    }
  };

  // Filtrar usuários
  const filteredUsers = usersData?.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'premium' && ['premium', 'designer', 'designer_adm'].includes(user.nivelacesso)) ||
      (statusFilter === 'free' && user.nivelacesso === 'free') ||
      (statusFilter === 'admin' && user.nivelacesso === 'admin') ||
      (statusFilter === 'lifetime' && user.acessovitalicio);

    const matchesOrigin = originFilter === 'all' || 
      (originFilter === 'manual' && (!user.origemassinatura || user.origemassinatura === 'manual')) ||
      (originFilter === 'hotmart' && user.origemassinatura === 'hotmart') ||
      (originFilter === 'doppus' && user.origemassinatura === 'doppus');

    return matchesSearch && matchesStatus && matchesOrigin;
  }) || [];

  // Usar dados da API ou calcular como fallback
  const totalUsers = metricsData?.overview?.totalUsers || usersData?.length || 0;
  const premiumUsers = metricsData?.overview?.premiumUsers || usersData?.filter(user => 
    ['premium', 'designer', 'designer_adm'].includes(user.nivelacesso) || user.acessovitalicio
  ).length || 0;
  const freeUsers = metricsData?.overview?.freeUsers || (totalUsers - premiumUsers);
  const conversionRate = metricsData?.overview?.conversionRate || 
    (totalUsers > 0 ? `${Math.round((premiumUsers / totalUsers) * 100)}%` : '0%');
  const lifetimeUsers = usersData?.filter(user => user.acessovitalicio).length || 0;
  const recentSignups = metricsData?.overview?.recentSignups || 0;
  const expiringIn7Days = 0; // Calcular se necessário

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Assinaturas</h1>
          <p className="text-muted-foreground">Métricas e gestão completa de assinaturas</p>
        </div>
        <div className="flex gap-2">
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

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +0 nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Premium</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{premiumUsers}</div>
            <p className="text-xs text-muted-foreground">
              {conversionRate} taxa de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Vitalícios</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{lifetimeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Receita recorrente garantida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirando em 7 dias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringIn7Days}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0%</div>
            <p className="text-xs text-muted-foreground">Usuários perdidos no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Crescimento Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0</div>
            <p className="text-xs text-muted-foreground">Novos usuários esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersData?.filter(u => u.isactive).length || 0}</div>
            <p className="text-xs text-muted-foreground">0 inativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Usuários */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="lifetime">Vitalício</SelectItem>
              </SelectContent>
            </Select>
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todas as Origens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Origens</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="doppus">Doppus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários com Assinatura</CardTitle>
              <CardDescription>
                Mostrando {filteredUsers.length} de {totalUsers} usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
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
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {usersData?.length === 0 ? 'Nenhum usuário encontrado' : 'Nenhum usuário corresponde aos filtros'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name || user.username || 'Sem nome'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(user)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.tipoplano || 'Indefinido'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getOriginBadge(user.origemassinatura || 'manual')}</TableCell>
                          <TableCell>
                            {user.dataexpiracao ? 
                              new Date(user.dataexpiracao).toLocaleDateString('pt-BR') : 
                              (user.acessovitalicio ? 'Vitalício' : 'Indefinido')
                            }
                          </TableCell>
                          <TableCell>
                            {user.acessovitalicio ? (
                              <Badge variant="secondary" className="bg-purple-500 text-white">
                                <Crown className="w-3 h-3 mr-1" />
                                Infinito
                              </Badge>
                            ) : user.dataexpiracao ? (
                              (() => {
                                const now = new Date();
                                const expiry = new Date(user.dataexpiracao);
                                const diffTime = expiry.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) {
                                  return <Badge variant="destructive">Expirado</Badge>;
                                } else if (diffDays <= 7) {
                                  return <Badge variant="destructive">{diffDays} dias</Badge>;
                                } else if (diffDays <= 30) {
                                  return <Badge variant="secondary">{diffDays} dias</Badge>;
                                } else {
                                  return <Badge variant="outline">{diffDays} dias</Badge>;
                                }
                              })()
                            ) : (
                              <Badge variant="outline">Indefinido</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.criadoem).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Gráficos e análises detalhadas em desenvolvimento.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Premium</span>
                    <span>{premiumUsers} usuários</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Gratuito</span>
                    <span>{freeUsers} usuários</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-400 h-2 rounded-full" 
                      style={{ width: `${totalUsers > 0 ? (freeUsers / totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}