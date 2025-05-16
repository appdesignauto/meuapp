import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import WebhookList from './WebhookList';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  SearchIcon,
  Calendar,
  Edit,
  Trash2,
  BadgeDollarSign,
  Wallet,
  CircleDollarSign,
  BarChart3,
  CalendarClock,
  Clock,
  UserCheck,
  User,
  UserMinus,
  Users,
  CreditCard,
  DollarSign,
  BarChart4,
  LineChart,
  TrendingUp,
  ArrowRight,
  Download,
  FileText,
  Filter
} from 'lucide-react';
import SubscriptionTrends from './SubscriptionTrends';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: number;
  username: string;
  email: string;
  name?: string | null;
  nivelacesso: number;
  planstatus: string;
  origemassinatura: string;
  tipoplano: string;
  planoexpiracao: string | null;
  dataassinatura: string | null;
  dataexpiracao: string | null;
  criadoem: string;
  atualizadoem: string;
}

interface SubscriptionDetail {
  id: number;
  userId: number;
  planId: string;
  planName: string;
  planType: string;
  status: string;
  origin: string;
  startDate: string;
  endDate: string | null;
  price: number;
  currency: string;
  transactionId: string | null;
  paymentMethod: string | null;
  user: {
    username: string;
    email: string;
    name: string | null;
  }
}

interface SubscriptionDetailResponse {
  detail: SubscriptionDetail | null;
  error: string | null;
}

interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  trialCount: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
  hotmartCount: number;
  doppusCount: number;
  manualCount: number;
  // Métricas financeiras
  mrr: number;  // Receita Mensal Recorrente
  averageValue: number;  // Valor médio por assinatura
  annualRevenue: number;  // Projeção de receita anual
  churnRate: number;  // Taxa de cancelamento
  averageRetention: number;  // Tempo médio de permanência (dias)
  averageLTV: number;  // Lifetime Value (valor médio ao longo da vida)
  subscriptionsByPlan: {
    [key: string]: number;
  };
  subscriptionsByOrigin: {
    [key: string]: number;
  };
  recentSubscriptions: {
    date: string;
    count: number;
  }[];
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'none';
}

function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  const formatValue = (val: number): string => {
    // Prevenir erros com valores undefined/null
    if (val === undefined || val === null) {
      return '0';
    }
    
    // Formata valores monetários com "R$" e 2 casas decimais
    if (title.includes('Receita') || title.includes('Valor') || title.includes('LTV')) {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Formata percentuais
    if (title.includes('Taxa') || title.includes('Conversão')) {
      return `${val.toFixed(1)}%`;
    }
    
    // Formata dias
    if (title.includes('Retenção')) {
      return `${Math.round(val)} dias`;
    }
    
    // Formata números inteiros
    return val.toLocaleString('pt-BR');
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="p-2 rounded-full bg-background/80">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-xs">
            {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-green-500" />}
            {trend === 'down' && <TrendingUp className="w-3 h-3 mr-1 text-red-500 rotate-180" />}
            <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}>
              {trend === 'up' ? 'Tendência positiva' : trend === 'down' ? 'Tendência negativa' : 'Estável'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Estados para exportação
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFields, setExportFields] = useState<string[]>([
    'username', 'email', 'name', 'origemassinatura', 'tipoplano', 'dataassinatura', 'dataexpiracao'
  ]);
  
  // Estados para diálogos
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Estados para configurações
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationDays, setNotificationDays] = useState<string[]>(['7', '3', '1']);
  const [autoDowngrade, setAutoDowngrade] = useState(true);
  const [graceHours, setGraceHours] = useState('24');
  
  // Consulta para estatísticas de assinatura
  const {
    data: subscriptionStats = {
      total: 0,
      active: 0,
      expired: 0,
      trialCount: 0,
      expiringIn7Days: 0,
      expiringIn30Days: 0,
      hotmartCount: 0,
      doppusCount: 0,
      manualCount: 0,
      mrr: 0,
      averageValue: 0,
      annualRevenue: 0,
      churnRate: 0,
      averageRetention: 0,
      averageLTV: 0,
      subscriptionsByPlan: {},
      subscriptionsByOrigin: {},
      recentSubscriptions: []
    },
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: statsError
  } = useQuery<SubscriptionStats>({
    queryKey: ['/api/subscriptions/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscriptions/stats');
      return response.json();
    }
  });
  
  // Consulta para usuários com filtragem avançada
  const {
    data: usersData = { users: [], totalCount: 0 },
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['/api/admin/users', page, pageSize, searchTerm, statusFilter, originFilter, planFilter, dateFilter, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (originFilter !== 'all') params.append('origin', originFilter);
      if (planFilter !== 'all') params.append('plan', planFilter);
      
      // Adicionar filtros de data
      if (dateFilter !== 'all') {
        params.append('dateFilter', dateFilter);
        
        if (dateFilter === 'custom' && fromDate) {
          params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
          
          if (toDate) {
            params.append('toDate', format(toDate, 'yyyy-MM-dd'));
          }
        }
      }
      
      const response = await apiRequest('GET', `/api/admin/users?${params.toString()}`);
      return response.json();
    }
  });
  
  // Consulta para detalhes de uma assinatura específica
  const {
    data: subscriptionDetail,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: detailError,
    refetch: refetchDetail
  } = useQuery<SubscriptionDetailResponse>({
    queryKey: ['/api/subscriptions/detail', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return { detail: null, error: null };
      const response = await apiRequest('GET', `/api/subscriptions/detail/${selectedUserId}`);
      return response.json();
    },
    enabled: !!selectedUserId && isViewDialogOpen,
  });
  
  // Mutação para atualizar status da assinatura
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number, status: string }) => {
      const response = await apiRequest('POST', `/api/subscriptions/update-status`, {
        userId,
        status
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status da assinatura foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/stats'] });
      setIsConfirmDialogOpen(false);
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Função para exibir badge colorido de acordo com o status
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'ativo':
      case 'ativa':
        return <Badge variant="outline" className="border-green-500 text-green-500">{status}</Badge>;
      case 'expired':
      case 'expirado':
      case 'expirada':
        return <Badge variant="outline" className="border-red-500 text-red-500">{status}</Badge>;
      case 'pending':
      case 'pendente':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">{status}</Badge>;
      case 'trial':
      case 'teste':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Indefinido'}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        
        {/* Aba de Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {isLoadingStats ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isErrorStats ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium">Erro ao carregar estatísticas</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {statsError instanceof Error ? statsError.message : 'Ocorreu um erro desconhecido'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/stats'] })}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              {/* Estatísticas gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard 
                  title="Total de Assinantes" 
                  value={subscriptionStats.total}
                  icon={Users}
                  description="Todos os usuários com assinatura"
                />
                
                <StatCard 
                  title="Assinaturas Ativas" 
                  value={subscriptionStats.active}
                  icon={UserCheck}
                  trend={subscriptionStats.active > subscriptionStats.total/2 ? 'up' : 'down'}
                  description={`${Math.round((subscriptionStats.active / (subscriptionStats.total || 1)) * 100)}% do total`}
                />
                
                <StatCard 
                  title="Expirando em 7 dias" 
                  value={subscriptionStats.expiringIn7Days}
                  icon={Clock}
                  trend={subscriptionStats.expiringIn7Days > 0 ? 'down' : 'none'}
                  description="Assinaturas próximas do fim"
                />
                
                <StatCard 
                  title="Hotmart" 
                  value={subscriptionStats.hotmartCount}
                  icon={BarChart4}
                  description={`${Math.round((subscriptionStats.hotmartCount / (subscriptionStats.total || 1)) * 100)}% das assinaturas`}
                />
              </div>
              
              {/* Indicadores financeiros */}
              <h3 className="text-xl font-semibold mb-4">Indicadores Financeiros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard 
                  title="Receita Mensal (MRR)" 
                  value={subscriptionStats.mrr}
                  icon={BadgeDollarSign}
                  description="Receita mensal recorrente"
                />
                
                <StatCard 
                  title="Valor Médio" 
                  value={subscriptionStats.averageValue}
                  icon={CreditCard}
                  description="Ticket médio por assinatura"
                />
                
                <StatCard 
                  title="Receita Anual (Proj.)" 
                  value={subscriptionStats.annualRevenue}
                  icon={CircleDollarSign}
                  description="Projeção de receita anual"
                />
                
                <StatCard 
                  title="Taxa de Cancelamento" 
                  value={subscriptionStats.churnRate}
                  icon={UserMinus}
                  trend={subscriptionStats.churnRate > 5 ? 'down' : 'up'}
                  description="Churn rate mensal"
                />
              </div>
              
              {/* Gráficos e tendências */}
              <SubscriptionTrends />
            </>
          )}
        </TabsContent>
        
        {/* Aba de Lista de Assinaturas */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou username..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
          
          {/* Filtros avançados */}
          {showAdvancedFilters && (
            <div className="bg-card border rounded-md p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="trial">Teste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Origem</Label>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Todas as origens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as origens</SelectItem>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="doppus">Doppus</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="other">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Plano</Label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Todos os planos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os planos</SelectItem>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="pro">Profissional</SelectItem>
                    <SelectItem value="enterprise">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Período</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Qualquer período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="last90days">Últimos 90 dias</SelectItem>
                    <SelectItem value="expiring7days">Expirando em 7 dias</SelectItem>
                    <SelectItem value="expiring30days">Expirando em 30 dias</SelectItem>
                    <SelectItem value="expired">Expiradas</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateFilter === 'custom' && (
                <div className="md:col-span-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">De</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-2 justify-start text-left font-normal"
                        >
                          {fromDate ? (
                            format(fromDate, 'dd/MM/yyyy', { locale: pt })
                          ) : (
                            <span className="text-muted-foreground">Selecione a data inicial</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={fromDate}
                          onSelect={setFromDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Até</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-2 justify-start text-left font-normal"
                        >
                          {toDate ? (
                            format(toDate, 'dd/MM/yyyy', { locale: pt })
                          ) : (
                            <span className="text-muted-foreground">Selecione a data final</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={toDate}
                          onSelect={setToDate}
                          initialFocus
                          disabled={(date) => 
                            fromDate ? date < fromDate : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {isLoadingUsers ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isErrorUsers ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium">Erro ao carregar assinaturas</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {usersError instanceof Error ? usersError.message : 'Ocorreu um erro desconhecido'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetchUsers()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : usersData.users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma assinatura encontrada</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Nenhum resultado para os filtros aplicados. Tente outros critérios de busca.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Data de Início</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{user.origemassinatura || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{user.tipoplano || 'Free'}</TableCell>
                        <TableCell>
                          {user.dataassinatura 
                            ? format(new Date(user.dataassinatura), 'dd/MM/yyyy', { locale: pt }) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {user.dataexpiracao 
                            ? format(new Date(user.dataexpiracao), 'dd/MM/yyyy', { locale: pt }) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.planstatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <SearchIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginação */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium">{usersData.users.length}</span> de{" "}
                  <span className="font-medium">{usersData.totalCount}</span> registros
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={usersData.users.length < pageSize}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Aba de Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <WebhookList />
        </TabsContent>
      </Tabs>
      
      {/* Diálogo de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre esta assinatura
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isErrorDetail ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium">Erro ao carregar detalhes</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {detailError instanceof Error ? detailError.message : 'Ocorreu um erro desconhecido'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetchDetail()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : !subscriptionDetail?.detail ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">Nenhuma informação detalhada disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Informações do Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nome:</span>
                      <span className="font-medium">{subscriptionDetail.detail.user.name || subscriptionDetail.detail.user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="font-medium">{subscriptionDetail.detail.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Username:</span>
                      <span className="font-medium">{subscriptionDetail.detail.user.username}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Detalhes da Assinatura</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Plano:</span>
                      <span className="font-medium">{subscriptionDetail.detail.planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{subscriptionDetail.detail.planType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Origem:</span>
                      <span className="font-medium capitalize">{subscriptionDetail.detail.origin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span>{getStatusBadge(subscriptionDetail.detail.status)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Datas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Data de início:</span>
                      <span className="font-medium">
                        {format(new Date(subscriptionDetail.detail.startDate), 'dd/MM/yyyy', { locale: pt })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Data de expiração:</span>
                      <span className="font-medium">
                        {subscriptionDetail.detail.endDate 
                          ? format(new Date(subscriptionDetail.detail.endDate), 'dd/MM/yyyy', { locale: pt })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Informações de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: subscriptionDetail.detail.currency || 'BRL'
                        }).format(subscriptionDetail.detail.price)}
                      </span>
                    </div>
                    {subscriptionDetail.detail.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Método de pagamento:</span>
                        <span className="font-medium">{subscriptionDetail.detail.paymentMethod}</span>
                      </div>
                    )}
                    {subscriptionDetail.detail.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ID da transação:</span>
                        <span className="font-medium">{subscriptionDetail.detail.transactionId}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Atualizar Assinatura</DialogTitle>
            <DialogDescription>
              Edite os detalhes da assinatura
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isErrorDetail ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium">Erro ao carregar detalhes</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {detailError instanceof Error ? detailError.message : 'Ocorreu um erro desconhecido'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetchDetail()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status da Assinatura</Label>
                  <Select defaultValue={subscriptionDetail?.detail?.status || "active"}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="trial">Teste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Expiração</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="endDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                          {subscriptionDetail?.detail?.endDate 
                            ? format(new Date(subscriptionDetail.detail.endDate), 'PPP', { locale: pt })
                            : 'Selecione uma data'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setIsConfirmDialogOpen(true);
                    }}
                  >
                    Cancelar Assinatura
                  </Button>
                  <Button>Salvar Alterações</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Confirmação */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              O usuário perderá acesso aos recursos premium imediatamente após o cancelamento.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Voltar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedUserId) {
                  updateStatusMutation.mutate({ userId: selectedUserId, status: 'expired' });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Exportação */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exportar Usuários</DialogTitle>
            <DialogDescription>
              Configure os campos e formato para exportação
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Resumo de filtros ativos */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Filtros aplicados:</h4>
              <div className="flex flex-wrap gap-2">
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {statusFilter}
                  </Badge>
                )}
                {originFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Origem: {originFilter}
                  </Badge>
                )}
                {planFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Plano: {planFilter}
                  </Badge>
                )}
                {dateFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Período: {dateFilter === 'custom' ? 'Personalizado' : dateFilter}
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Busca: {searchTerm}
                  </Badge>
                )}
                {statusFilter === 'all' && originFilter === 'all' && planFilter === 'all' && 
                 dateFilter === 'all' && !searchTerm && (
                  <span className="text-sm text-muted-foreground">Nenhum filtro aplicado</span>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Formato de Exportação</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="export-format" className="mt-2">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Campos para Exportação</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="username"
                      checked={exportFields.includes('username')} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportFields([...exportFields, 'username']);
                        } else {
                          setExportFields(exportFields.filter(f => f !== 'username'));
                        }
                      }}
                    />
                    <label htmlFor="username" className="text-sm">Username</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="email"
                      checked={exportFields.includes('email')} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportFields([...exportFields, 'email']);
                        } else {
                          setExportFields(exportFields.filter(f => f !== 'email'));
                        }
                      }}
                    />
                    <label htmlFor="email" className="text-sm">Email</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="name"
                      checked={exportFields.includes('name')} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportFields([...exportFields, 'name']);
                        } else {
                          setExportFields(exportFields.filter(f => f !== 'name'));
                        }
                      }}
                    />
                    <label htmlFor="name" className="text-sm">Nome</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="origin"
                      checked={exportFields.includes('origemassinatura')} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportFields([...exportFields, 'origemassinatura']);
                        } else {
                          setExportFields(exportFields.filter(f => f !== 'origemassinatura'));
                        }
                      }}
                    />
                    <label htmlFor="origin" className="text-sm">Origem</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="plan"
                      checked={exportFields.includes('tipoplano')} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportFields([...exportFields, 'tipoplano']);
                        } else {
                          setExportFields(exportFields.filter(f => f !== 'tipoplano'));
                        }
                      }}
                    />
                    <label htmlFor="plan" className="text-sm">Plano</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status"
                      checked={exportFields.includes('planstatus')} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportFields([...exportFields, 'planstatus']);
                        } else {
                          setExportFields(exportFields.filter(f => f !== 'planstatus'));
                        }
                      }}
                    />
                    <label htmlFor="status" className="text-sm">Status</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="startDate"
                      checked={exportFields.includes('dataassinatura')} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportFields([...exportFields, 'dataassinatura']);
                        } else {
                          setExportFields(exportFields.filter(f => f !== 'dataassinatura'));
                        }
                      }}
                    />
                    <label htmlFor="startDate" className="text-sm">Data de Início</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="endDate"
                      checked={exportFields.includes('dataexpiracao')} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportFields([...exportFields, 'dataexpiracao']);
                        } else {
                          setExportFields(exportFields.filter(f => f !== 'dataexpiracao'));
                        }
                      }}
                    />
                    <label htmlFor="endDate" className="text-sm">Data de Expiração</label>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-center">
                Total de registros a exportar: <span className="font-medium">{usersData.totalCount}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowExportDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                // Filtragem e exportação
                const filteredUsers = usersData.users.filter(user => 
                  applyDateFilter(user)
                );
                
                exportData(filteredUsers);
                setShowExportDialog(false);
                
                toast({
                  title: "Dados exportados com sucesso",
                  description: `${filteredUsers.length} registros foram exportados`,
                });
              }}
            >
              Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  function applyDateFilter(user: User) {
    if (dateFilter === 'all') return true;
    
    const today = new Date();
    const startDate = user.dataassinatura ? new Date(user.dataassinatura) : null;
    const endDate = user.dataexpiracao ? new Date(user.dataexpiracao) : null;
    
    switch (dateFilter) {
      case 'today':
        return startDate ? startDate.toDateString() === today.toDateString() : false;
      case 'last7days':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        return startDate ? startDate >= sevenDaysAgo : false;
      case 'expiring7days':
        const in7Days = new Date();
        in7Days.setDate(today.getDate() + 7);
        return endDate ? endDate <= in7Days && endDate >= today : false;
      default:
        return true;
    }
  }
  
  function exportData(users: User[]) {
    const filteredData = users.map(user => {
      const result: Record<string, any> = {};
      
      exportFields.forEach(field => {
        if (field === 'dataassinatura' || field === 'dataexpiracao' || field === 'criadoem' || field === 'atualizadoem') {
          result[field] = user[field as keyof User] 
            ? format(new Date(user[field as keyof User] as string), 'dd/MM/yyyy', { locale: pt })
            : '';
        } else {
          result[field] = user[field as keyof User] || '';
        }
      });
      
      return result;
    });
    
    if (exportFormat === 'json') {
      const jsonString = JSON.stringify(filteredData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios_${format(new Date(), 'yyyyMMdd')}.json`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // CSV Format
      const headers = exportFields.map(field => {
        const fieldMap: Record<string, string> = {
          'username': 'Username',
          'email': 'Email',
          'name': 'Nome',
          'origemassinatura': 'Origem',
          'tipoplano': 'Plano',
          'planstatus': 'Status',
          'dataassinatura': 'Data de Início',
          'dataexpiracao': 'Data de Expiração',
          'criadoem': 'Data de Criação',
          'atualizadoem': 'Última Atualização'
        };
        
        return fieldMap[field] || field;
      });
      
      let csvContent = headers.join(',') + '\n';
      
      filteredData.forEach(user => {
        const row = exportFields.map(field => {
          // Escapar aspas e conteúdo com vírgulas
          const value = user[field]?.toString() || '';
          return value.includes(',') || value.includes('"') ? 
            `"${value.replace(/"/g, '""')}"` : value;
        });
        
        csvContent += row.join(',') + '\n';
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios_${format(new Date(), 'yyyyMMdd')}.csv`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }
}