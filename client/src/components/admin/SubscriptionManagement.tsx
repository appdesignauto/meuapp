import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, Users, UserCheck, UserMinus, Eye, EyeOff, Copy, X, RefreshCw, Clock, AlertCircle, CheckCircle, Crown, Shield, TrendingUp, BarChart3 } from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string;
  accountType: 'premium' | 'free';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  subscriptionId?: number;
  subscriptionEndDate?: string;
  subscriptionStartDate?: string;
  lastLoginAt?: string;
}

interface Subscription {
  id: number;
  userId: number;
  planType: 'premium' | 'free';
  startDate: string;
  endDate: string;
  isActive: boolean;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'expired';
  user?: User;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;

}

// Interface para mapeamento de produtos
interface ProductMapping {
  id: number;
  productName: string;
  planType: 'premium' | 'free';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationSetting {
  id: number;
  name: string;
  value: string;
  description?: string;
  type: 'text' | 'boolean' | 'number';
  isActive: boolean;
  updatedAt: string;
}

interface IntegrationSettings {
  // Reserved for future integrations
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SubscriptionsResponse {
  subscriptions: Subscription[];
  pagination: PaginationInfo;
}

interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanType, setSelectedPlanType] = useState<'all' | 'premium' | 'free'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'expired'>('all');

  // Estados para modalidades de edição
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddSubscriptionDialogOpen, setIsAddSubscriptionDialogOpen] = useState(false);
  const [isEditSubscriptionDialogOpen, setIsEditSubscriptionDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // Estados para formulários
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserAccountType, setNewUserAccountType] = useState<'premium' | 'free'>('free');
  const [subscriptionDuration, setSubscriptionDuration] = useState('30');

  // Estados para controle de diálogos
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteSubscriptionDialogOpen, setIsDeleteSubscriptionDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);

  // Estados de controle para as configurações de integração
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings | null>(null);

  // Estados para busca por origem
  const [originFilter, setOriginFilter] = useState<'all'>('all');

  // Função para buscar estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/users/stats'],
    queryFn: () => apiRequest('GET', '/api/admin/users/stats'),
  });

  // Query para buscar usuários
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery<UsersResponse>({
    queryKey: ['/api/admin/users', usersCurrentPage, pageSize, searchTerm, selectedPlanType, selectedStatus, originFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: usersCurrentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedPlanType !== 'all' && { planType: selectedPlanType }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(originFilter !== 'all' && { origin: originFilter }),
      });
      return apiRequest('GET', `/api/admin/users?${params.toString()}`);
    },
  });

  // Query para buscar assinaturas
  const { data: subscriptionsData, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery<SubscriptionsResponse>({
    queryKey: ['/api/admin/subscriptions', currentPage, pageSize, selectedPlanType, selectedStatus],
    queryFn: () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(selectedPlanType !== 'all' && { planType: selectedPlanType }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });
      return apiRequest('GET', `/api/admin/subscriptions?${params.toString()}`);
    },
  });

  // Query para buscar configurações de integração
  const { data: integrationData, isLoading: integrationLoading } = useQuery({
    queryKey: ['/api/integrations/settings'],
    queryFn: () => apiRequest('GET', '/api/integrations/settings'),
  });

  useEffect(() => {
    if (integrationData) {
      setIntegrationSettings(integrationData);
    }
  }, [integrationData]);

  // Mutação para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; name: string; accountType: 'premium' | 'free' }) => {
      return apiRequest('POST', '/api/admin/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      setIsAddUserDialogOpen(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserAccountType('free');
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário.",
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: number; email: string; name: string; accountType: 'premium' | 'free'; isActive: boolean }) => {
      const { id, ...data } = userData;
      return apiRequest('PUT', `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

  // Mutação para deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover usuário",
        description: error.message || "Ocorreu um erro ao remover o usuário.",
        variant: "destructive",
      });
    },
  });

  // Mutação para criar assinatura
  const createSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionData: { 
      userId: number; 
      planType: 'premium' | 'free'; 
      duration: number;
      paymentStatus?: 'pending' | 'completed' | 'failed' | 'expired';
    }) => {
      return apiRequest('POST', '/api/admin/subscriptions', subscriptionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      setIsAddSubscriptionDialogOpen(false);
      toast({
        title: "Assinatura criada",
        description: "A assinatura foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message || "Ocorreu um erro ao criar a assinatura.",
        variant: "destructive",
      });
    },
  });

  // Função auxiliar para obter a badge de status da assinatura
  const getStatusBadge = (subscription: Subscription) => {
    const isExpired = new Date(subscription.endDate) < new Date();
    const paymentStatus = subscription.paymentStatus;
    
    if (paymentStatus === 'failed') {
      return <Badge variant="destructive">Pagamento Falhou</Badge>;
    }
    
    if (paymentStatus === 'pending') {
      return <Badge variant="secondary">Pagamento Pendente</Badge>;
    }
    
    if (isExpired || paymentStatus === 'expired') {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    
    if (subscription.isActive && paymentStatus === 'completed') {
      return <Badge variant="default">Ativa</Badge>;
    }
    
    return <Badge variant="secondary">Inativa</Badge>;
  };

  // Função auxiliar para filtrar usuários por origem
  const filterUsersByOrigin = (user: User) => {
    if (originFilter === 'all') return true;
    
    // Lógica para determinar a origem do usuário
    // Filtro removido - todas as origens são aceitas
    
    return true;
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsEditSubscriptionDialogOpen(true);
  };

  const handleDeleteSubscription = (subscription: Subscription) => {
    setSubscriptionToDelete(subscription);
    setIsDeleteSubscriptionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Assinaturas</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Premium</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.premiumUsers || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Free</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.freeUsers || 0}</div>
              </CardContent>
            </Card>
            

          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tendências de Assinaturas</CardTitle>
              <CardDescription>Análise detalhada do crescimento de assinaturas</CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionTrends />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={selectedPlanType} onValueChange={(value: 'all' | 'premium' | 'free') => setSelectedPlanType(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo de plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value: 'all' | 'active' | 'expired') => setSelectedStatus(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={originFilter} onValueChange={(value: 'all' | 'doppus') => setOriginFilter(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>

                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Usuário
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : usersData?.users?.length ? (
                    usersData.users.filter(filterUsersByOrigin).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          <Badge variant={user.accountType === 'premium' ? 'default' : 'secondary'}>
                            {user.accountType === 'premium' ? 'Premium' : 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Paginação para usuários */}
          {usersData?.pagination && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {usersData.pagination.page} de {usersData.pagination.totalPages} 
                ({usersData.pagination.total} usuários no total)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersCurrentPage <= 1}
                  onClick={() => setUsersCurrentPage(usersCurrentPage - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersCurrentPage >= usersData.pagination.totalPages}
                  onClick={() => setUsersCurrentPage(usersCurrentPage + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedPlanType} onValueChange={(value: 'all' | 'premium' | 'free') => setSelectedPlanType(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo de plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value: 'all' | 'active' | 'expired') => setSelectedStatus(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsAddSubscriptionDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Assinatura
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Fim</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : subscriptionsData?.subscriptions?.length ? (
                    subscriptionsData.subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">#{subscription.id}</TableCell>
                        <TableCell>
                          {subscription.user ? (
                            <div>
                              <div className="font-medium">{subscription.user.name}</div>
                              <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Usuário não encontrado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={subscription.planType === 'premium' ? 'default' : 'secondary'}>
                            {subscription.planType === 'premium' ? 'Premium' : 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription)}</TableCell>
                        <TableCell>{formatDate(subscription.startDate)}</TableCell>
                        <TableCell>{formatDate(subscription.endDate)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSubscription(subscription)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSubscription(subscription)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Nenhuma assinatura encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Paginação para assinaturas */}
          {subscriptionsData?.pagination && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {subscriptionsData.pagination.page} de {subscriptionsData.pagination.totalPages} 
                ({subscriptionsData.pagination.total} assinaturas no total)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= subscriptionsData.pagination.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
            



      </Tabs>

      {/* Dialog para adicionar usuário */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userEmail">Email</Label>
              <Input
                id="userEmail"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="userName">Nome</Label>
              <Input
                id="userName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div>
              <Label htmlFor="accountType">Tipo de Conta</Label>
              <Select value={newUserAccountType} onValueChange={(value: 'premium' | 'free') => setNewUserAccountType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createUserMutation.mutate({
                email: newUserEmail,
                name: newUserName,
                accountType: newUserAccountType
              })}
              disabled={!newUserEmail || !newUserName || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}