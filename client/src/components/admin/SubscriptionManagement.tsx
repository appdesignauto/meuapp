import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
  Clock,
  User,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  BarChart4,
  TrendingUp,
  TrendingDown,
  Plus,
  Save,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, addMonths, addYears, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from '@/components/ui/switch';

interface User {
  id: number;
  username: string;
  email: string;
  nivelacesso: number;
  planstatus: string;
  origemassinatura: string;
  tipoplano: string;
  planoexpiracao: string | null;
  criadoem: string;
  atualizadoem: string;
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

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [editForm, setEditForm] = useState({
    id: 0,
    planstatus: '',
    tipoplano: '',
    origemassinatura: '',
    planoexpiracao: '',
    notifyUser: true,
    adminNotes: ''
  });
  
  // Consultar estatísticas de assinaturas
  const {
    data: subscriptionStats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: statsError
  } = useQuery({
    queryKey: ['/api/subscriptions/stats'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/stats');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas de assinaturas');
      }
      
      return response.json();
    },
    refetchInterval: 60000 // Atualizar a cada minuto
  });
  
  // Consultar usuários com assinaturas
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: usersError
  } = useQuery({
    queryKey: ['/api/admin/users', page, limit, statusFilter, originFilter, searchTerm],
    queryFn: async () => {
      // Montar parâmetros de consulta
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      
      if (originFilter !== 'all') {
        queryParams.append('origin', originFilter);
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/admin/users?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados de usuários');
      }
      
      return response.json();
    }
  });
  
  // Consultar detalhes de um usuário específico
  const {
    data: userDetail,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: detailError
  } = useQuery({
    queryKey: ['/api/admin/users/detail', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null;
      
      const response = await fetch(`/api/admin/users/${selectedUser}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar detalhes do usuário');
      }
      
      return response.json();
    },
    enabled: selectedUser !== null,
    refetchOnWindowFocus: false
  });
  
  // Mutation para atualizar assinatura de usuário
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/admin/users/${data.id}/subscription`, data);
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar assinatura');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Atualizar dados na tela após a atualização
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/users']
      });
      
      if (selectedUser) {
        queryClient.invalidateQueries({
          queryKey: ['/api/admin/users/detail', selectedUser]
        });
      }
      
      // Também atualiza as estatísticas
      queryClient.invalidateQueries({
        queryKey: ['/api/subscriptions/stats']
      });
      
      setIsEditDialogOpen(false);
      toast({
        title: 'Assinatura atualizada com sucesso',
        description: 'Os dados da assinatura foram atualizados',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar assinatura',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Mutation para remover assinatura de usuário
  const removeSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${id}/subscription`);
      
      if (!response.ok) {
        throw new Error('Falha ao remover assinatura');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Atualizar dados na tela após a remoção
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/users']
      });
      
      // Também atualiza as estatísticas
      queryClient.invalidateQueries({
        queryKey: ['/api/subscriptions/stats']
      });
      
      setIsConfirmDialogOpen(false);
      setIsViewDialogOpen(false);
      toast({
        title: 'Assinatura removida com sucesso',
        description: 'A assinatura foi removida e o usuário foi rebaixado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover assinatura',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Formatar data e hora para exibição
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: pt });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Calcular dias restantes até a expiração
  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    
    try {
      const expirationDate = new Date(dateString);
      const today = new Date();
      
      // Retorna null se a data já passou
      if (expirationDate < today) return null;
      
      const diffTime = expirationDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return null;
    }
  };
  
  // Formatar o status com cores
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'ativo':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
      case 'inactive':
      case 'inativo':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inativo</Badge>;
      case 'expired':
      case 'expirado':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expirado</Badge>;
      case 'trial':
      case 'teste':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Teste</Badge>;
      case 'pending':
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Visualizar detalhes do usuário
  const handleViewUser = (id: number) => {
    setSelectedUser(id);
    setIsViewDialogOpen(true);
  };
  
  // Editar assinatura de usuário
  const handleEditSubscription = () => {
    if (!userDetail) return;
    
    // Preencher o formulário com os dados atuais
    setEditForm({
      id: userDetail.id,
      planstatus: userDetail.planstatus || '',
      tipoplano: userDetail.tipoplano || '',
      origemassinatura: userDetail.origemassinatura || '',
      planoexpiracao: userDetail.planoexpiracao ? format(new Date(userDetail.planoexpiracao), 'yyyy-MM-dd') : '',
      notifyUser: true,
      adminNotes: ''
    });
    
    setIsEditDialogOpen(true);
  };
  
  // Remover assinatura de usuário
  const handleRemoveSubscription = () => {
    setIsConfirmDialogOpen(true);
  };
  
  // Função para adicionar período à data
  const handleDatePreset = (preset: string) => {
    const today = new Date();
    let newDate;
    
    switch (preset) {
      case '7d':
        newDate = addDays(today, 7);
        break;
      case '15d':
        newDate = addDays(today, 15);
        break;
      case '1m':
        newDate = addMonths(today, 1);
        break;
      case '3m':
        newDate = addMonths(today, 3);
        break;
      case '6m':
        newDate = addMonths(today, 6);
        break;
      case '1y':
        newDate = addYears(today, 1);
        break;
      default:
        return;
    }
    
    setEditForm({
      ...editForm,
      planoexpiracao: format(newDate, 'yyyy-MM-dd')
    });
  };
  
  // Componente de cartão de estatísticas
  const StatCard = ({ title, value, icon: Icon, trend, description, className = '' }: {
    title: string;
    value: number | string;
    icon: any;
    trend?: 'up' | 'down' | 'none';
    description?: string;
    className?: string;
  }) => {
    return (
      <Card className={`${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && description && (
            <p className="text-xs text-muted-foreground flex items-center pt-1">
              {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-500" />}
              {description}
            </p>
          )}
          {!trend && description && (
            <p className="text-xs text-muted-foreground pt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    );
  };
  
  if (isErrorUsers) {
    return (
      <div className="p-4 bg-red-50 rounded-md">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Erro ao carregar dados de usuários</p>
        </div>
        <p className="mt-2 text-sm text-red-600">
          {usersError instanceof Error ? usersError.message : 'Ocorreu um erro desconhecido'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-6">Gerenciamento de Assinaturas</h2>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        {/* Aba de Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {isLoadingStats ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : isErrorStats ? (
            <div className="p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-600">
                {statsError instanceof Error ? statsError.message : 'Erro ao carregar estatísticas'}
              </p>
            </div>
          ) : subscriptionStats ? (
            <>
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
              
              {/* Estatísticas adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Origens de Assinatura</CardTitle>
                    <CardDescription>Distribuição de assinantes por origem</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Hotmart</span>
                        <span className="font-medium">{subscriptionStats.hotmartCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.round((subscriptionStats.hotmartCount / (subscriptionStats.total || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-3">
                        <span>Doppus</span>
                        <span className="font-medium">{subscriptionStats.doppusCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-emerald-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.round((subscriptionStats.doppusCount / (subscriptionStats.total || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-3">
                        <span>Manual</span>
                        <span className="font-medium">{subscriptionStats.manualCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-amber-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.round((subscriptionStats.manualCount / (subscriptionStats.total || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status das Assinaturas</CardTitle>
                    <CardDescription>Distribuição por status atual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Ativas</span>
                        <span className="font-medium">{subscriptionStats.active}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.round((subscriptionStats.active / (subscriptionStats.total || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-3">
                        <span>Expiradas</span>
                        <span className="font-medium">{subscriptionStats.expired}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-red-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.round((subscriptionStats.expired / (subscriptionStats.total || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-3">
                        <span>Em Teste</span>
                        <span className="font-medium">{subscriptionStats.trialCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-400 h-2.5 rounded-full" 
                          style={{ width: `${Math.round((subscriptionStats.trialCount / (subscriptionStats.total || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>
        
        {/* Aba de Assinaturas */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-4">
            <h3 className="text-lg font-semibold">Lista de Assinantes</h3>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                  <SelectItem value="trial">Em teste</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={originFilter}
                onValueChange={setOriginFilter}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="doppus">Doppus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                className="pl-10 w-full"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button
              onClick={() => setIsNewDialogOpen(true)}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Assinatura
            </Button>
          </div>
        </div>
        
        {isLoadingUsers ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <Table>
              <TableCaption>Lista de usuários com assinaturas</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Expira em <Calendar className="w-4 h-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData?.users && usersData.users.length > 0 ? (
                  usersData.users.map((user: User) => {
                    const daysRemaining = getDaysRemaining(user.planoexpiracao);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.tipoplano || 'N/A'}</TableCell>
                        <TableCell>{user.origemassinatura || 'N/A'}</TableCell>
                        <TableCell>
                          {user.planoexpiracao ? (
                            <div>
                              {formatDateTime(user.planoexpiracao)}
                              {daysRemaining !== null && (
                                <span className={`text-xs ml-2 ${
                                  daysRemaining < 7 ? 'text-red-500' : 'text-gray-500'
                                }`}>
                                  ({daysRemaining} dias)
                                </span>
                              )}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.planstatus || '')}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewUser(user.id)}
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-32 text-gray-500">
                      {usersData?.users && usersData.users.length === 0 
                        ? 'Nenhum usuário com assinatura encontrado' 
                        : 'Carregando...'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Paginação */}
            {usersData?.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Página {page} de {usersData.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(usersData.totalPages, prev + 1))}
                    disabled={page >= usersData.totalPages}
                  >
                    Próxima <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Dialog para visualizar detalhes do usuário */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
            <DialogDescription>
              Informações detalhadas da assinatura do usuário.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : isErrorDetail ? (
            <div className="p-4 bg-red-50 rounded-md">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">Erro ao carregar detalhes</p>
              </div>
              <p className="mt-2 text-sm text-red-600">
                {detailError instanceof Error ? detailError.message : 'Ocorreu um erro desconhecido'}
              </p>
            </div>
          ) : userDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">ID</p>
                  <p className="text-sm">{userDetail.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Nome de Usuário</p>
                  <p className="text-sm">{userDetail.username}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{userDetail.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Nível de Acesso</p>
                  <p className="text-sm">{userDetail.nivelacesso}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Criado em</p>
                  <p className="text-sm">{formatDateTime(userDetail.criadoem)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Atualizado em</p>
                  <p className="text-sm">{formatDateTime(userDetail.atualizadoem)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold mb-3">Detalhes da Assinatura</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="text-sm">{getStatusBadge(userDetail.planstatus || '')}</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Tipo de Plano</p>
                    <p className="text-sm">{userDetail.tipoplano || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Origem</p>
                    <p className="text-sm">{userDetail.origemassinatura || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Expira em</p>
                    <p className="text-sm">
                      {userDetail.planoexpiracao 
                        ? `${formatDateTime(userDetail.planoexpiracao)}` 
                        : 'N/A'
                      }
                      {getDaysRemaining(userDetail.planoexpiracao) !== null && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({getDaysRemaining(userDetail.planoexpiracao)} dias restantes)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleEditSubscription}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Assinatura
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleRemoveSubscription}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Assinatura
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      
      {/* Dialog para editar assinatura */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Assinatura</DialogTitle>
            <DialogDescription>
              Atualizar dados da assinatura do usuário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planstatus">Status da Assinatura</Label>
                <Select
                  value={editForm.planstatus}
                  onValueChange={(value) => setEditForm({...editForm, planstatus: value})}
                >
                  <SelectTrigger id="planstatus">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="trial">Teste</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipoplano">Tipo de Plano</Label>
                <Select
                  value={editForm.tipoplano}
                  onValueChange={(value) => setEditForm({...editForm, tipoplano: value})}
                >
                  <SelectTrigger id="tipoplano">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="vitalicio">Vitalício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="origemassinatura">Origem da Assinatura</Label>
                <Select
                  value={editForm.origemassinatura}
                  onValueChange={(value) => setEditForm({...editForm, origemassinatura: value})}
                >
                  <SelectTrigger id="origemassinatura">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="doppus">Doppus</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planoexpiracao">Data de Expiração</Label>
                <div className="space-y-2">
                  <Input 
                    id="planoexpiracao"
                    type="date"
                    value={editForm.planoexpiracao}
                    onChange={(e) => setEditForm({...editForm, planoexpiracao: e.target.value})}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDatePreset('7d')}
                    >
                      +7 dias
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDatePreset('15d')}
                    >
                      +15 dias
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDatePreset('1m')}
                    >
                      +1 mês
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDatePreset('3m')}
                    >
                      +3 meses
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDatePreset('1y')}
                    >
                      +1 ano
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Notas do Administrador</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Coloque alguma observação (opcional)"
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm({...editForm, adminNotes: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="notifyUser"
                  checked={editForm.notifyUser}
                  onCheckedChange={(checked) => setEditForm({...editForm, notifyUser: checked})}
                />
                <Label htmlFor="notifyUser">Notificar usuário sobre a alteração</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => updateSubscriptionMutation.mutate(editForm)}
              disabled={updateSubscriptionMutation.isPending}
            >
              {updateSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogo de confirmação para remover assinatura */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Você está prestes a remover a assinatura deste usuário. Esta ação irá:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <ul className="list-disc list-inside text-sm space-y-2">
              <li>Remover o acesso Premium do usuário</li>
              <li>Alterar o nível de acesso para 1 (básico)</li>
              <li>Remover a data de expiração do plano</li>
              <li>Registrar esta alteração manual no histórico</li>
            </ul>
            
            <div className="bg-amber-50 p-3 mt-4 rounded-md border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Atenção:</p>
                  <p>Esta ação não pode ser desfeita. Se o usuário pagou via Hotmart, considere verificar primeiro se o cancelamento deve ser feito na plataforma deles.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) {
                  removeSubscriptionMutation.mutate(selectedUser);
                }
              }}
              disabled={removeSubscriptionMutation.isPending}
            >
              {removeSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover Assinatura
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para criar nova assinatura */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Assinatura</DialogTitle>
            <DialogDescription>
              Atribuir uma assinatura manualmente a um usuário.
            </DialogDescription>
          </DialogHeader>
          
          {/* Formulário para adicionar nova assinatura */}
          <div className="space-y-4 py-2">
            {/* Implementar formulário para buscar usuário e adicionar assinatura */}
            <div className="pt-4 text-center">
              <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Implementação em andamento...</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;