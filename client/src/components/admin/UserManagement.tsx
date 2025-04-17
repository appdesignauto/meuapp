import { useState, useEffect } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  PencilIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
  ShieldCheckIcon,
  UserXIcon,
  FilterIcon,
  DownloadIcon,
  BellIcon,
  HistoryIcon,
  BarChart2Icon,
  ActivityIcon,
  SearchIcon,
  SortAscIcon,
  SortDescIcon,
  CalendarIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  KeyRoundIcon,
  UserCogIcon,
  InfoIcon,
  MailIcon,
  CircleIcon,
  BadgeCheckIcon,
  TrashIcon,
  UserIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsertUser, UserRole } from "@shared/schema";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Definições de tipos
interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  role: UserRole;
  isactive: boolean;
  createdAt: string;
  profileimageurl: string | null;
}

interface UserWithStats extends User {
  followersCount?: number;
  followingCount?: number;
  totalDownloads?: number;
  totalViews?: number;
  lastLogin?: string;
  online?: boolean;  // Novo campo para indicar status online
  lastActivity?: string;  // Último registro de atividade
  
  // Índice para permitir acesso dinâmico às propriedades
  [key: string]: any;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  plan: string;
  periodType: string;
  isactive: boolean;
}

// Definição dos papéis de usuário com cores e descrições específicas
const userRoles: { value: UserRole; label: string; color: string; description: string; group: string }[] = [
  { 
    value: "visitor", 
    label: "Visitante", 
    color: "bg-slate-500 hover:bg-slate-600",
    description: "Usuário que não possui conta no sistema, apenas visualiza conteúdo público",
    group: "clientes"
  },
  { 
    value: "free", 
    label: "Usuário Free", 
    color: "bg-sky-500 hover:bg-sky-600",
    description: "Usuário registrado com acesso a recursos gratuitos",
    group: "clientes"
  },
  { 
    value: "premium", 
    label: "Usuário Premium", 
    color: "bg-violet-500 hover:bg-violet-600",
    description: "Assinante com acesso completo às artes e downloads",
    group: "clientes"
  },
  { 
    value: "designer", 
    label: "Designer", 
    color: "bg-amber-500 hover:bg-amber-600",
    description: "Criador de conteúdo que pode enviar e gerenciar artes",
    group: "equipe" 
  },
  { 
    value: "designer_adm", 
    label: "Designer Administrador", 
    color: "bg-orange-500 hover:bg-orange-600",
    description: "Designer com permissões adicionais para gerenciar outros designers",
    group: "equipe"
  },
  { 
    value: "support", 
    label: "Suporte", 
    color: "bg-emerald-500 hover:bg-emerald-600",
    description: "Equipe de suporte com acesso para gerenciar usuários e conteúdo",
    group: "equipe"
  },
  { 
    value: "admin", 
    label: "Administrador", 
    color: "bg-rose-500 hover:bg-rose-600",
    description: "Acesso total ao sistema e todas as funcionalidades",
    group: "equipe"
  },
];

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customDateRange, setCustomDateRange] = useState<{from?: Date, to?: Date}>({});
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Funções handlers para os menus de ações
  const handleResetPassword = (email: string) => {
    toast({
      title: "Reset de senha",
      description: `Uma nova senha foi enviada para ${email}`,
    });
  };

  const handleShowHistory = () => {
    toast({
      title: "Histórico de atividades",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  const handleDeleteConfirmation = () => {
    toast({
      title: "Atenção",
      description: "Funcionalidade de exclusão requer confirmação adicional",
      variant: "destructive",
    });
  };

  // Buscar usuários
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserWithStats[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
  });

  // Formulário para criar usuário
  const createForm = useForm<UserFormData>({
    defaultValues: {
      username: "", // Será gerado automaticamente a partir do email
      email: "",
      password: "",
      name: "",
      role: "free",
      plan: "free",
      periodType: "mensal",
      isactive: true,
    },
  });

  // Formulário para editar usuário
  const editForm = useForm<Partial<UserFormData>>({
    defaultValues: {
      username: "",
      email: "",
      name: "",
      role: "free",
      isactive: true,
    },
  });

  // Carregar dados do usuário no formulário de edição
  useEffect(() => {
    if (selectedUser && isEditDialogOpen) {
      editForm.reset({
        username: selectedUser.username,
        email: selectedUser.email,
        name: selectedUser.name || "",
        role: selectedUser.role,
        isactive: selectedUser.isactive,
      });
    }
  }, [selectedUser, isEditDialogOpen, editForm]);

  // Criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Primeiro, criar o usuário
      const res = await apiRequest("POST", "/api/users", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao criar usuário");
      }
      const user = await res.json();
      
      // Se o plano não é free, criar uma assinatura para o usuário
      if (data.plan !== 'free' && user.id) {
        // Calcular a data de expiração da assinatura com base no período selecionado
        let endDate = null;
        
        if (data.plan !== 'free') {
          const today = new Date();
          endDate = new Date(today);
          
          switch (data.periodType) {
            case 'mensal':
              endDate.setMonth(today.getMonth() + 1);
              break;
            case 'anual':
              endDate.setFullYear(today.getFullYear() + 1);
              break;
            case 'vitalicio':
              // Para assinaturas vitalícias, definimos uma data muito distante
              endDate.setFullYear(today.getFullYear() + 100);
              break;
            default:
              endDate.setMonth(today.getMonth() + 1); // Padrão: mensal
          }
        }
        
        // Criar assinatura para o usuário
        const subscriptionData = {
          userId: user.id,
          planType: data.plan,
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: endDate ? endDate.toISOString() : null
        };
        
        const subscriptionRes = await apiRequest("POST", "/api/subscriptions", subscriptionData);
        if (!subscriptionRes.ok) {
          console.error("Erro ao criar assinatura. Usuário criado sem assinatura.");
          // Não vamos falhar a criação do usuário se a assinatura falhar
        }
        
        // Se o papel do usuário não é 'premium' mas o plano é premium, atualizar o papel
        if (data.role !== 'premium' && data.plan === 'premium') {
          const updateRes = await apiRequest("PUT", `/api/users/${user.id}`, { 
            role: 'premium'
          });
          if (!updateRes.ok) {
            console.error("Erro ao atualizar o papel do usuário para premium.");
          }
        }
      }
      
      return user;
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso",
        description: "O novo usuário foi adicionado ao sistema",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<UserFormData> }) => {
      const res = await apiRequest("PUT", `/api/users/${data.id}`, data.userData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao atualizar usuário");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado com sucesso",
        description: "As informações do usuário foram atualizadas",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Ativar/desativar usuário
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isactive }: { id: number; isactive: boolean }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, { isactive });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao atualizar status do usuário");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do usuário foi atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar usuários
  // Filtrar usuários
  const filteredUsers = users
    ? users.filter((user) => {
        // Filtro de busca por texto
        const matchesSearch =
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Filtro por papel
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        
        // Filtro por status
        const matchesStatus = 
          statusFilter === "all" || 
          (statusFilter === "active" && user.isactive) ||
          (statusFilter === "inactive" && !user.isactive);
        
        // Filtro por tab
        const matchesTab = 
          activeTab === "all" || 
          (activeTab === "active" && user.isactive) || 
          (activeTab === "inactive" && !user.isactive) ||
          (activeTab === "designers" && (user.role === "designer" || user.role === "designer_adm"));
        
        // Filtro por data
        let matchesDate = true;
        if (dateFilter !== "all") {
          const today = new Date();
          const userCreated = new Date(user.createdAt);
          
          switch (dateFilter) {
            case "today":
              matchesDate = 
                userCreated.getDate() === today.getDate() &&
                userCreated.getMonth() === today.getMonth() &&
                userCreated.getFullYear() === today.getFullYear();
              break;
            case "week":
              const lastWeek = new Date(today);
              lastWeek.setDate(lastWeek.getDate() - 7);
              matchesDate = userCreated >= lastWeek;
              break;
            case "month":
              const lastMonth = new Date(today);
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              matchesDate = userCreated >= lastMonth;
              break;
            case "custom":
              if (customDateRange.from) {
                matchesDate = userCreated >= customDateRange.from;
              }
              if (customDateRange.to) {
                matchesDate = matchesDate && userCreated <= customDateRange.to;
              }
              break;
          }
        }
        
        return matchesSearch && matchesRole && matchesStatus && matchesTab && matchesDate;
      })
    : [];
    
  // Função para ordenar a lista de usuários
  const handleSort = (key: string) => {
    // Se já estiver ordenando por essa coluna, inverter a direção
    if (sortConfig?.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      // Caso contrário, ordenar por essa coluna em ordem ascendente
      setSortConfig({ key, direction: 'asc' });
    }
  };

  // Ordenar usuários se sortConfig estiver definido
  const sortedUsers = sortConfig 
    ? [...filteredUsers].sort((a, b) => {
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;
        
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        let result = 0;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          result = aValue.localeCompare(bValue);
        } else {
          result = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
        
        return sortConfig.direction === 'asc' ? result : -result;
      })
    : filteredUsers;
    
  // Função para exportar dados de usuários para CSV
  const exportUsersToCsv = () => {
    if (!users || users.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há usuários disponíveis para exportação",
        variant: "destructive",
      });
      return;
    }
    
    // Cabeçalhos do CSV
    const headers = [
      'ID', 
      'Username', 
      'Nome', 
      'Email', 
      'Papel', 
      'Status', 
      'Data de Cadastro', 
      'Último Login'
    ];
    
    // Linhas de dados
    const rows = users.map(user => [
      user.id,
      user.username,
      user.name || '',
      user.email,
      userRoles.find(r => r.value === user.role)?.label || user.role,
      user.isactive ? 'Ativo' : 'Inativo',
      new Date(user.createdAt).toLocaleDateString('pt-BR'),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'
    ]);
    
    // Criar o conteúdo CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Criar um Blob com o conteúdo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Criar um link para download e clicar nele
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportação concluída",
      description: "Os dados dos usuários foram exportados com sucesso",
    });
  };

  // Submeter formulário de criação
  const handleCreateSubmit = createForm.handleSubmit((data) => {
    // Gerar username a partir do email se não estiver definido
    if (!data.username || data.username.trim() === '') {
      // Remove caracteres especiais e espaços e pega a parte antes do @
      const emailUsername = data.email.split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
        
      // Adiciona um timestamp para garantir unicidade
      const timestamp = Date.now().toString().slice(-4);
      
      // Define o username final
      data.username = `${emailUsername}${timestamp}`;
    }
    
    createUserMutation.mutate(data);
  });

  // Submeter formulário de edição
  const handleEditSubmit = editForm.handleSubmit((data) => {
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        userData: data,
      });
    }
  });

  // Renderização do badge de status do usuário
  const renderStatusBadge = (isactive: boolean) => {
    return isactive ? (
      <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-500 hover:bg-gray-600">Inativo</Badge>
    );
  };

  // Renderização do badge de papel do usuário com tooltip para descrição
  const renderRoleBadge = (role: UserRole) => {
    const roleInfo = userRoles.find(r => r.value === role) || {
      value: role,
      label: role,
      color: "bg-gray-500 hover:bg-gray-600",
      description: "Papel indefinido",
      group: "outros"
    };

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div>
            <Badge className={roleInfo.color}>
              {roleInfo.label}
            </Badge>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="flex justify-between space-x-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{roleInfo.label}</h4>
              <p className="text-sm text-muted-foreground">
                {roleInfo.description}
              </p>
              <div className="flex items-center pt-2">
                <Badge variant="outline" className="text-xs">
                  {roleInfo.group === "equipe" ? "Equipe interna" : "Cliente"}
                </Badge>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários, designers e administradores do sistema
          </p>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <UserPlusIcon className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estatísticas Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de usuários</span>
                <span className="font-semibold">{users?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usuários ativos</span>
                <span className="font-semibold">
                  {users?.filter(u => u.isactive).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Designers</span>
                <span className="font-semibold">
                  {users?.filter(u => u.role === "designer" || u.role === "designer_adm").length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usuários premium</span>
                <span className="font-semibold">
                  {users?.filter(u => u.role === "premium").length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="search" className="flex items-center gap-2">
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                  Buscar
                </Label>
                <Input
                  id="search"
                  placeholder="Buscar por nome, email ou username"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role-filter" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Papel
                </Label>
                <Select 
                  value={roleFilter} 
                  onValueChange={(value) => setRoleFilter(value as UserRole | "all")}
                >
                  <SelectTrigger id="role-filter" className="mt-1">
                    <SelectValue placeholder="Selecione um papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {userRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter" className="flex items-center gap-2">
                  <CircleIcon className="h-4 w-4 text-muted-foreground" />
                  Status
                </Label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
                >
                  <SelectTrigger id="status-filter" className="mt-1">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={exportUsersToCsv}
              >
                <DownloadIcon className="h-4 w-4" />
                Exportar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setIsNotificationDialogOpen(true)}
              >
                <BellIcon className="h-4 w-4" />
                Enviar notificação
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setIsStatsDialogOpen(true)}
              >
                <BarChart2Icon className="h-4 w-4" />
                Estatísticas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <FilterIcon className="h-4 w-4" />
                Mais filtros
              </Button>
              <Select 
                value={dateFilter} 
                onValueChange={(value) => setDateFilter(value as "all" | "today" | "week" | "month" | "custom")}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {dateFilter === "all" && "Todas as datas"}
                      {dateFilter === "today" && "Hoje"}
                      {dateFilter === "week" && "Última semana"}
                      {dateFilter === "month" && "Último mês"}
                      {dateFilter === "custom" && "Intervalo personalizado"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="custom">Intervalo personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="inactive">Inativos</TabsTrigger>
          <TabsTrigger value="designers">Designers</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <UserTable 
            users={sortedUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <UserTable 
            users={sortedUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </TabsContent>
        <TabsContent value="inactive" className="mt-6">
          <UserTable 
            users={sortedUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </TabsContent>
        <TabsContent value="designers" className="mt-6">
          <UserTable 
            users={sortedUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de criação de usuário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar novo usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name" className="text-right">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  {...createForm.register("name", { required: true })}
                  className="mt-1"
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">Nome é obrigatório</p>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...createForm.register("email", { required: true })}
                  className="mt-1"
                />
                {createForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">Email é obrigatório</p>
                )}
              </div>
              <div>
                <Label htmlFor="password" className="text-right">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...createForm.register("password", { required: true })}
                  className="mt-1"
                />
                {createForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">Senha é obrigatória</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role" className="text-right">
                    Papel
                  </Label>
                  <Select 
                    onValueChange={(value) => createForm.setValue("role", value as UserRole)} 
                    defaultValue={createForm.getValues("role")}
                  >
                    <SelectTrigger id="role" className="mt-1">
                      <SelectValue placeholder="Selecione um papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="plan" className="text-right">
                    Plano
                  </Label>
                  <Select 
                    onValueChange={(value) => createForm.setValue("plan", value)} 
                    defaultValue={createForm.getValues("plan")}
                  >
                    <SelectTrigger id="plan" className="mt-1">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodType" className="text-right">
                    Período
                  </Label>
                  <Select 
                    onValueChange={(value) => createForm.setValue("periodType", value)} 
                    defaultValue={createForm.getValues("periodType")}
                  >
                    <SelectTrigger id="periodType" className="mt-1">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="vitalicio">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end mb-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isactive" 
                      checked={createForm.watch("isactive")}
                      onCheckedChange={(checked) => createForm.setValue("isactive", !!checked)}
                    />
                    <Label htmlFor="isactive">Usuário ativo</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Criando..." : "Criar usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição de usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="edit-username"
                    {...editForm.register("username", { required: true })}
                    className="mt-1"
                  />
                  {editForm.formState.errors.username && (
                    <p className="text-sm text-red-500 mt-1">Username é obrigatório</p>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="edit-name"
                    {...editForm.register("name")}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...editForm.register("email", { required: true })}
                  className="mt-1"
                />
                {editForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">Email é obrigatório</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-password" className="text-right">
                  Nova senha (opcional)
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  {...editForm.register("password")}
                  className="mt-1"
                  placeholder="Deixe em branco para manter a senha atual"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-role" className="text-right">
                    Papel
                  </Label>
                  <Select 
                    onValueChange={(value) => editForm.setValue("role", value as UserRole)} 
                    defaultValue={editForm.getValues("role")}
                    value={editForm.watch("role")}
                  >
                    <SelectTrigger id="edit-role" className="mt-1">
                      <SelectValue placeholder="Selecione um papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end mb-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-isactive" 
                      checked={editForm.watch("isactive")}
                      onCheckedChange={(checked) => editForm.setValue("isactive", !!checked)}
                    />
                    <Label htmlFor="edit-isactive">Usuário ativo</Label>
                  </div>
                </div>
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
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente de tabela de usuários
interface UserTableProps {
  users: UserWithStats[];
  isLoading: boolean;
  renderRoleBadge: (role: UserRole) => JSX.Element;
  renderStatusBadge: (isactive: boolean) => JSX.Element;
  setSelectedUser: (user: UserWithStats) => void;
  setIsEditDialogOpen: (open: boolean) => void;
  toggleUserStatusMutation: any;
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: string) => void;
}

const UserTable = ({
  users,
  isLoading,
  renderRoleBadge,
  renderStatusBadge,
  setSelectedUser,
  setIsEditDialogOpen,
  toggleUserStatusMutation,
  sortConfig,
  onSort,
}: UserTableProps) => {
  // Função para formatar data e mostrar tempo relativo
  const formatDateRelative = (dateString: string) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error("Data inválida:", dateString);
        return "Data inválida";
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Validar para evitar valores negativos
      if (diffDays < 0) {
        console.warn("Data no futuro detectada:", dateString, "Diferença:", diffDays);
        return "Recente";
      }
      
      if (diffDays === 0) {
        return "Hoje";
      } else if (diffDays === 1) {
        return "Ontem";
      } else if (diffDays < 7) {
        return `${diffDays} dias atrás`;
      } else {
        return date.toLocaleDateString("pt-BR");
      }
    } catch (error) {
      console.error("Erro ao formatar data relativa:", error, "Data:", dateString);
      return "Data inválida";
    }
  };
  
  // Função para formatar data completa considerando horário de Brasília (UTC-3)
  const formatFullDate = (dateString: string) => {
    if (!dateString) return "Data não disponível";
    
    try {
      // Criar data a partir da string
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error("Data inválida:", dateString);
        return "Data inválida";
      }
      
      // Verificar se a data é futura (tolerância de 5 minutos para evitar problemas de sincronização)
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutos em milissegundos
      if (date.getTime() > now.getTime() + fiveMinutes) {
        console.error("Data futura detectada:", dateString, "Data:", date, "Agora:", now);
        
        // Correção automática: se a data for futura, usar a data atual
        console.log("Corrigindo data para a data atual");
        return new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }) + " (BRT)";
      }
      
      // Formatar no padrão brasileiro
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo' // Usando timezone de Brasília
      }).format(date) + " (BRT)";
    } catch (error) {
      console.error("Erro ao formatar data completa:", error, "Data:", dateString);
      return "Data inválida";
    }
  };
  
  // Função para renderizar avatar do usuário
  const renderUserAvatar = (user: UserWithStats) => {
    const initials = user.name 
      ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : user.username.substring(0, 2).toUpperCase();
      
    const profileUrl = user.profileimageurl;
    
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="flex items-center">
            <div className="relative h-8 w-8 mr-2">
              {profileUrl ? (
                <img 
                  src={profileUrl} 
                  alt={user.username}
                  className="rounded-full object-cover h-8 w-8" 
                />
              ) : (
                <div className={`rounded-full h-8 w-8 flex items-center justify-center text-xs text-white font-medium ${
                  userRoles.find(r => r.value === user.role)?.color || "bg-gray-500"
                }`}>
                  {initials}
                </div>
              )}
              {user.isactive && (
                <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-white" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{user.username}</span>
              <span className="text-xs text-muted-foreground">{user.name || "-"}</span>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="flex space-x-4">
            <div className="relative h-16 w-16">
              {profileUrl ? (
                <img 
                  src={profileUrl} 
                  alt={user.username}
                  className="rounded-full object-cover h-16 w-16" 
                />
              ) : (
                <div className={`rounded-full h-16 w-16 flex items-center justify-center text-xl text-white font-medium ${
                  userRoles.find(r => r.value === user.role)?.color || "bg-gray-500"
                }`}>
                  {initials}
                </div>
              )}
              {user.isactive && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border border-white" />
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{user.name || user.username}</h4>
              <div className="space-y-1">
                <p className="text-xs">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Cadastrado em {formatFullDate(user.createdAt)}
                </p>
                {user.lastLogin && (
                  <p className="text-xs text-muted-foreground">
                    Último login: {formatFullDate(user.lastLogin)}
                  </p>
                )}
              </div>
            </div>
          </div>
          {(user.role === "designer" || user.role === "designer_adm") && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Artes vistas</p>
                <p className="text-sm font-medium">{user.totalViews || 0}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Downloads</p>
                <p className="text-sm font-medium">{user.totalDownloads || 0}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Seguidores</p>
                <p className="text-sm font-medium">{user.followersCount || 0}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Seguindo</p>
                <p className="text-sm font-medium">{user.followingCount || 0}</p>
              </div>
            </div>
          )}
        </HoverCardContent>
      </HoverCard>
    );
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableCaption>Lista de usuários do sistema</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort && onSort('username')}
            >
              <div className="flex items-center">
                Usuário
                {sortConfig?.key === 'username' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort && onSort('email')}
            >
              <div className="flex items-center">
                Email
                {sortConfig?.key === 'email' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort && onSort('role')}
            >
              <div className="flex items-center">
                Papel
                {sortConfig?.key === 'role' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort && onSort('isactive')}
            >
              <div className="flex items-center">
                Status
                {sortConfig?.key === 'isactive' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort && onSort('createdAt')}
            >
              <div className="flex items-center">
                Cadastro
                {sortConfig?.key === 'createdAt' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort && onSort('lastLogin')}
            >
              <div className="flex items-center">
                Último login
                {sortConfig?.key === 'lastLogin' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex justify-center">
                  <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Carregando usuários...</p>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <p className="text-muted-foreground">Nenhum usuário encontrado com os filtros atuais.</p>
                <Button variant="link" onClick={() => window.location.reload()}>
                  Redefinir filtros
                </Button>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className={!user.isactive ? "opacity-60" : ""}>
                <TableCell>{renderUserAvatar(user)}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{renderRoleBadge(user.role)}</TableCell>
                <TableCell>{renderStatusBadge(user.isactive)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatFullDate(user.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  {user.lastLogin ? (
                    <div className="text-sm">
                      {formatFullDate(user.lastLogin)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Nunca</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Editar usuário
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          // Aqui poderia abrir um diálogo dedicado para alterar função
                          setIsEditDialogOpen(true); // Por enquanto usamos o diálogo de edição
                        }}
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        Alterar função
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleResetPassword(user.email)}
                      >
                        <KeyRoundIcon className="h-4 w-4 mr-2" />
                        Resetar senha
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          window.open(`/designers/${user.username}`, "_blank");
                        }}
                      >
                        <FileTextIcon className="h-4 w-4 mr-2" />
                        Ver perfil detalhado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleShowHistory}
                      >
                        <HistoryIcon className="h-4 w-4 mr-2" />
                        Histórico de atividades
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          toggleUserStatusMutation.mutate({
                            id: user.id,
                            isactive: !user.isactive,
                          });
                        }}
                      >
                        {user.isactive ? (
                          <>
                            <UserXIcon className="h-4 w-4 mr-2 text-amber-500" />
                            <span className="text-amber-500">Bloquear usuário</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="h-4 w-4 mr-2 text-green-500" />
                            <span className="text-green-500">Ativar usuário</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteConfirmation}
                        className="text-red-500 focus:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Excluir usuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;