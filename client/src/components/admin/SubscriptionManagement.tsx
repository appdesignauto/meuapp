import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import WebhookList from './WebhookList';
import SubscriptionTrends from './SubscriptionTrends';
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
  Eye,
  Settings,
  Webhook,
  FileText
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

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'none';
}

function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h4 className="text-2xl font-bold">{value.toLocaleString()}</h4>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="rounded-full p-2 bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && trend !== 'none' && (
          <div className="mt-3 flex items-center text-xs">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {trend === 'up' ? 'Positivo' : 'Atenção'}
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Estados para diálogos
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Estados para configurações de assinatura
  const [autoDowngrade, setAutoDowngrade] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationDays, setNotificationDays] = useState<string[]>(['7', '3', '1']);
  const [gracePeriod, setGracePeriod] = useState('3');
  
  // Mutation para salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: {
      autoDowngrade: boolean;
      emailNotifications: boolean;
      notificationDays: string[];
      gracePeriod: string;
    }) => {
      const response = await apiRequest('POST', '/api/subscriptions/settings', settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações de assinatura foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Função para salvar configurações
  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      autoDowngrade,
      emailNotifications,
      notificationDays,
      gracePeriod
    });
  };
  
  // Form estados para edição
  const [formData, setFormData] = useState({
    tipoplano: '',
    origemassinatura: '',
    planstatus: '',
    planoexpiracao: '',
    observacaoadmin: ''
  });
  
  // Consulta para estatísticas
  const {
    data: subscriptionStats,
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
  
  // Consulta para usuários com filtragem
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['/api/admin/users', page, pageSize, searchTerm, statusFilter, originFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (originFilter !== 'all') params.append('origin', originFilter);
      
      const response = await apiRequest('GET', `/api/admin/users?${params.toString()}`);
      return response.json();
    },
    refetchOnWindowFocus: false
  });
  
  // Consulta para detalhes do usuário
  const {
    data: userDetail,
    isLoading: isLoadingDetail, 
    isError: isErrorDetail,
    error: detailError
  } = useQuery({
    queryKey: ['/api/admin/users', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) throw new Error('ID de usuário não selecionado');
      const response = await apiRequest('GET', `/api/admin/users/${selectedUserId}`);
      return response.json();
    },
    enabled: selectedUserId !== null,
    refetchOnWindowFocus: false
  });
  
  // Mutação para atualizar assinaturas
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${selectedUserId}/subscription`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assinatura atualizada com sucesso',
        description: 'Os dados da assinatura foram atualizados',
        variant: 'default',
      });
      
      // Invalida consultas para atualizar dados
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/users']
      });
      
      // Também atualiza as estatísticas
      queryClient.invalidateQueries({
        queryKey: ['/api/subscriptions/stats']
      });
      
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para remover assinaturas
  const removeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/admin/users/${selectedUserId}/subscription`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assinatura removida com sucesso',
        description: 'A assinatura foi removida e o usuário foi rebaixado',
        variant: 'default',
      });
      
      // Invalida consultas para atualizar dados
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/users']
      });
      
      // Também atualiza as estatísticas
      queryClient.invalidateQueries({
        queryKey: ['/api/subscriptions/stats']
      });
      
      setIsConfirmDialogOpen(false);
      setIsViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover assinatura',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Efeito para preencher o formulário quando o usuário é selecionado
  useEffect(() => {
    if (userDetail) {
      setFormData({
        tipoplano: userDetail.tipoplano || '',
        origemassinatura: userDetail.origemassinatura || '',
        planstatus: userDetail.planstatus || '',
        planoexpiracao: userDetail.planoexpiracao || '',
        observacaoadmin: userDetail.observacaoadmin || ''
      });
    }
  }, [userDetail]);
  
  // Funções de manipulação
  const handleViewUser = (id: number) => {
    setSelectedUserId(id);
    setIsViewDialogOpen(true);
  };
  
  const handleEditUser = (id: number) => {
    setSelectedUserId(id);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteUser = (id: number) => {
    setSelectedUserId(id);
    setIsConfirmDialogOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSubscriptionMutation.mutate(formData);
  };
  
  const handleExtendSubscription = (months: number) => {
    if (!userDetail?.planoexpiracao) {
      toast({
        title: 'Erro ao estender assinatura',
        description: 'Data de expiração não encontrada',
        variant: 'destructive',
      });
      return;
    }
    
    const currentExpDate = userDetail.planoexpiracao ? new Date(userDetail.planoexpiracao) : new Date();
    const newExpDate = addMonths(currentExpDate, months);
    
    setFormData({
      ...formData,
      planoexpiracao: format(newExpDate, 'yyyy-MM-dd')
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active':
      case 'ativo':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'expired':
      case 'expirado':
        return <Badge variant="destructive">{status}</Badge>;
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
              
              {/* Componente de Tendências de Assinaturas */}
              <div className="mt-8">
                <SubscriptionTrends />
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
                  <SelectTrigger className="w-[150px]">
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
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="doppus">Doppus</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <SearchIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar assinantes..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : isErrorUsers ? (
            <div className="p-4 bg-red-50 rounded-md">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">Erro ao carregar assinantes</p>
              </div>
              <p className="text-sm text-red-600">
                {usersError instanceof Error ? usersError.message : 'Ocorreu um erro desconhecido'}
              </p>
            </div>
          ) : usersData?.users.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Nenhum assinante encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableCaption>Lista de usuários assinantes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.tipoplano || '-'}</TableCell>
                        <TableCell>{user.origemassinatura || '-'}</TableCell>
                        <TableCell>{getStatusBadge(user.planstatus)}</TableCell>
                        <TableCell>
                          {user.planoexpiracao 
                            ? format(new Date(user.planoexpiracao), 'dd/MM/yyyy', { locale: pt })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewUser(user.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditUser(user.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginação */}
              {usersData.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {usersData.users.length} de {usersData.total} assinantes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page <= 1}
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
        </TabsContent>
        
        {/* Aba de Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <WebhookList />
        </TabsContent>
        
        {/* Aba de Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações de Assinatura</CardTitle>
              <CardDescription>Gerencie as configurações gerais de assinaturas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-downgrade" className="font-medium">Rebaixamento automático</Label>
                      <p className="text-sm text-muted-foreground">Rebaixar automaticamente usuários com assinaturas expiradas</p>
                    </div>
                    <Switch 
                      id="auto-downgrade" 
                      checked={autoDowngrade}
                      onCheckedChange={setAutoDowngrade}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">Notificações por email</Label>
                      <p className="text-sm text-muted-foreground">Enviar email quando uma assinatura estiver próxima da expiração</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Dias para notificação de expiração</Label>
                  <p className="text-sm text-muted-foreground">Enviar lembretes automáticos antes da expiração</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="expiry-7" 
                        className="rounded"
                        checked={notificationDays.includes('7')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNotificationDays([...notificationDays, '7']);
                          } else {
                            setNotificationDays(notificationDays.filter(day => day !== '7'));
                          }
                        }}
                      />
                      <label htmlFor="expiry-7">7 dias antes</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="expiry-3" 
                        className="rounded"
                        checked={notificationDays.includes('3')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNotificationDays([...notificationDays, '3']);
                          } else {
                            setNotificationDays(notificationDays.filter(day => day !== '3'));
                          }
                        }}
                      />
                      <label htmlFor="expiry-3">3 dias antes</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="expiry-1" 
                        className="rounded"
                        checked={notificationDays.includes('1')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNotificationDays([...notificationDays, '1']);
                          } else {
                            setNotificationDays(notificationDays.filter(day => day !== '1'));
                          }
                        }}
                      />
                      <label htmlFor="expiry-1">1 dia antes</label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Período de tolerância após expiração</Label>
                  <p className="text-sm text-muted-foreground">Manter o acesso premium por um período após a expiração</p>
                  <Select 
                    value={gracePeriod}
                    onValueChange={setGracePeriod}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem período de tolerância</SelectItem>
                      <SelectItem value="1">1 dia</SelectItem>
                      <SelectItem value="3">3 dias</SelectItem>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="14">14 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings()}>
                    <Save className="w-4 h-4 mr-2" /> Salvar configurações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opções de Assinatura</CardTitle>
              <CardDescription>Personalize as opções disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Tipos de plano disponíveis</Label>
                  <p className="text-sm text-muted-foreground">Gerencie os tipos de plano que podem ser atribuídos aos usuários</p>
                  
                  <div className="border rounded-md p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Premium Mensal</span>
                        <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Premium Anual</span>
                        <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Vitalício</span>
                        <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t mt-4 pt-4">
                      <Button variant="outline" size="sm">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar plano
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Origens de assinatura disponíveis</Label>
                  <p className="text-sm text-muted-foreground">Gerencie as origens de assinatura que podem ser atribuídas</p>
                  
                  <div className="border rounded-md p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Hotmart</span>
                        <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Doppus</span>
                        <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Manual</span>
                        <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t mt-4 pt-4">
                      <Button variant="outline" size="sm">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar origem
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
                  <p className="text-sm font-medium text-muted-foreground">Nome de usuário</p>
                  <p>{userDetail.username}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{userDetail.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tipo de plano</p>
                  <p>{userDetail.tipoplano || 'Não definido'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Origem da assinatura</p>
                  <p>{userDetail.origemassinatura || 'Não definida'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Status do plano</p>
                  <p>{getStatusBadge(userDetail.planstatus)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Data de expiração</p>
                  <p>{userDetail.planoexpiracao 
                    ? format(new Date(userDetail.planoexpiracao), 'dd/MM/yyyy', { locale: pt })
                    : 'Não definida'
                  }</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Data de criação</p>
                  <p>{format(new Date(userDetail.criadoem), 'dd/MM/yyyy HH:mm', { locale: pt })}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Última atualização</p>
                  <p>{format(new Date(userDetail.atualizadoem), 'dd/MM/yyyy HH:mm', { locale: pt })}</p>
                </div>
              </div>
              
              {userDetail.observacaoadmin && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Observações do administrador</p>
                  <p className="text-sm whitespace-pre-line">{userDetail.observacaoadmin}</p>
                </div>
              )}
              
              <div className="border-t pt-4 flex justify-between">
                <Button variant="outline" onClick={() => handleEditUser(userDetail.id)}>
                  <Edit className="w-4 h-4 mr-2" /> Editar assinatura
                </Button>
                <Button variant="destructive" onClick={() => setIsConfirmDialogOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Remover assinatura
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      
      {/* Dialog para editar assinatura */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Assinatura</DialogTitle>
            <DialogDescription>
              Edite os detalhes da assinatura do usuário.
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
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipoplano" className="text-right">
                    Tipo de plano
                  </Label>
                  <div className="col-span-3">
                    <Select
                      name="tipoplano"
                      value={formData.tipoplano}
                      onValueChange={(value) => setFormData({...formData, tipoplano: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Premium Mensal">Premium Mensal</SelectItem>
                        <SelectItem value="Premium Anual">Premium Anual</SelectItem>
                        <SelectItem value="Vitalício">Vitalício</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="origemassinatura" className="text-right">
                    Origem
                  </Label>
                  <div className="col-span-3">
                    <Select
                      name="origemassinatura"
                      value={formData.origemassinatura}
                      onValueChange={(value) => setFormData({...formData, origemassinatura: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hotmart">Hotmart</SelectItem>
                        <SelectItem value="Doppus">Doppus</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="planstatus" className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3">
                    <Select
                      name="planstatus"
                      value={formData.planstatus}
                      onValueChange={(value) => setFormData({...formData, planstatus: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                        <SelectItem value="trial">Em teste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="planoexpiracao" className="text-right">
                    Data de expiração
                  </Label>
                  <div className="col-span-3">
                    <div className="relative">
                      <Input
                        id="planoexpiracao"
                        type="date"
                        name="planoexpiracao"
                        value={formData.planoexpiracao}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExtendSubscription(1)}
                      >
                        +1 mês
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExtendSubscription(3)}
                      >
                        +3 meses
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExtendSubscription(6)}
                      >
                        +6 meses
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExtendSubscription(12)}
                      >
                        +1 ano
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="observacaoadmin" className="text-right align-top pt-2">
                    Observações
                  </Label>
                  <Textarea
                    id="observacaoadmin"
                    name="observacaoadmin"
                    className="col-span-3"
                    value={formData.observacaoadmin}
                    onChange={handleFormChange}
                    placeholder="Notas internas sobre esta assinatura"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateSubscriptionMutation.isPending}
                >
                  {updateSubscriptionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar remoção */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remover assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a assinatura deste usuário? Esta ação irá rebaixar o usuário para o nível gratuito.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => removeSubscriptionMutation.mutate()}
              disabled={removeSubscriptionMutation.isPending}
            >
              {removeSubscriptionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar remoção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}