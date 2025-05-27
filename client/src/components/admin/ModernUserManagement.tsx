import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Crown,
  User,
  Mail,
  Calendar,
  Activity,
  Eye,
  EyeOff,
  Download,
  Upload,
  Settings,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Star,
  Heart,
  TrendingUp,
  UserCheck,
  UserX,
  RefreshCw,
  FileText,
  BarChart3,
  Globe,
  Smartphone,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { NivelAcesso, OrigemAssinatura, TipoPlano } from "@shared/schema";

// Types
interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  nivelacesso: NivelAcesso;
  origemassinatura?: OrigemAssinatura | null;
  tipoplano?: TipoPlano | null;
  dataassinatura?: string | null;
  dataexpiracao?: string | null;
  acessovitalicio: boolean;
  isactive: boolean;
  criadoem: string;
  ultimologin?: string | null;
  profileimageurl: string | null;
  bio: string | null;
  followersCount?: number;
  followingCount?: number;
  totalDownloads?: number;
  totalViews?: number;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  name: string;
  nivelacesso: NivelAcesso;
  origemassinatura?: OrigemAssinatura;
  tipoplano?: TipoPlano;
  dataassinatura?: string;
  dataexpiracao?: string;
  acessovitalicio?: boolean;
  isactive: boolean;
}

// Role configurations with modern styling
const roleConfig = {
  admin: {
    label: "Administrador",
    color: "bg-gradient-to-r from-red-500 to-pink-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    icon: Crown,
    description: "Acesso total ao sistema"
  },
  designer_adm: {
    label: "Designer Admin",
    color: "bg-gradient-to-r from-orange-500 to-red-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    icon: Settings,
    description: "Designer com privilégios administrativos"
  },
  designer: {
    label: "Designer",
    color: "bg-gradient-to-r from-yellow-500 to-orange-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: Star,
    description: "Criador de conteúdo"
  },
  suporte: {
    label: "Suporte",
    color: "bg-gradient-to-r from-green-500 to-emerald-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    icon: Heart,
    description: "Equipe de atendimento"
  },
  premium: {
    label: "Premium",
    color: "bg-gradient-to-r from-purple-500 to-violet-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    icon: Zap,
    description: "Assinante premium"
  },
  usuario: {
    label: "Usuário",
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: User,
    description: "Usuário básico"
  }
};

const ModernUserManagement = () => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedNivelAcesso, setSelectedNivelAcesso] = useState<string>("usuario");
  const [selectedOrigemAssinatura, setSelectedOrigemAssinatura] = useState<string>("");
  const [createUserStep, setCreateUserStep] = useState<1 | 2>(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
  });

  // Function to calculate expiration date based on plan type
  const calculateExpirationDate = (subscriptionDate: string, planType: string): string => {
    const date = new Date(subscriptionDate);
    switch (planType) {
      case "mensal":
        date.setMonth(date.getMonth() + 1);
        break;
      case "trimestral":
        date.setMonth(date.getMonth() + 3);
        break;
      case "semestral":
        date.setMonth(date.getMonth() + 6);
        break;
      case "anual":
        date.setFullYear(date.getFullYear() + 1);
        break;
      case "vitalicio":
        // For lifetime, set a far future date
        date.setFullYear(date.getFullYear() + 100);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  // Create user form
  const createForm = useForm<UserFormData>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
      nivelacesso: "usuario",
      isactive: true,
    },
  });

  // Edit user form
  const editForm = useForm<Partial<UserFormData>>();

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const res = await apiRequest("POST", "/api/users", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao criar usuário");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Usuário criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserFormData> }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao atualizar usuário");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Usuário atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao excluir usuário");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Usuário excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.nivelacesso === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.isactive) ||
                         (statusFilter === "inactive" && !user.isactive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get user stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isactive).length;
  const premiumUsers = users.filter(u => u.nivelacesso === "premium").length;
  const designerUsers = users.filter(u => u.nivelacesso === "designer" || u.nivelacesso === "designer_adm").length;

  // Generate username from email
  const generateUsernameFromEmail = (email: string): string => {
    const emailPrefix = email.split('@')[0];
    // Remove special characters and make lowercase
    return emailPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  const handleCreateUser = (data: UserFormData) => {
    // Generate username from email if not provided
    const username = data.username || generateUsernameFromEmail(data.email);
    
    // Prepare the final data
    const finalData = {
      ...data,
      username,
      // Only include premium fields if the user is premium
      ...(data.nivelacesso === "premium" && {
        origemassinatura: data.origemassinatura,
        tipoplano: data.tipoplano,
        dataassinatura: data.dataassinatura,
        dataexpiracao: data.dataexpiracao,
        acessovitalicio: data.tipoplano === "vitalicio"
      })
    };
    
    createUserMutation.mutate(finalData);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      email: user.email,
      name: user.name || "",
      nivelacesso: user.nivelacesso,
      isactive: user.isactive,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (data: Partial<UserFormData>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ id: selectedUser.id, data });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (user: User) => {
    if (!user.isactive) {
      return <Badge variant="destructive" className="flex items-center gap-1"><UserX className="w-3 h-3" />Inativo</Badge>;
    }
    
    if (user.nivelacesso === "premium" && user.dataexpiracao) {
      const isExpired = new Date(user.dataexpiracao) < new Date();
      if (isExpired) {
        return <Badge variant="destructive" className="flex items-center gap-1"><Clock className="w-3 h-3" />Expirado</Badge>;
      }
    }
    
    return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" />Ativo</Badge>;
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Gerenciamento de Usuários
            </h1>
            <p className="text-gray-600 mt-1">Gerencie todos os usuários da plataforma com facilidade</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total de Usuários</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{activeUsers}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Usuários Premium</p>
                  <p className="text-2xl font-bold">{premiumUsers}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Designers</p>
                  <p className="text-2xl font-bold">{designerUsers}</p>
                </div>
                <Star className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, email ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="designer_adm">Designer Admin</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Usuários ({filteredUsers.length})</span>
            {selectedUsers.length > 0 && (
              <Badge variant="secondary">
                {selectedUsers.length} selecionado(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando usuários...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      <Checkbox />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Função</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Último Login</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Criado em</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const roleInfo = roleConfig[user.nivelacesso as keyof typeof roleConfig];
                    const RoleIcon = roleInfo?.icon || User;
                    
                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <Checkbox />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.profileimageurl || ""} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{user.name || user.username}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${roleInfo?.color} text-white border-0`}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleInfo?.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(user)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(user.ultimologin)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(user.criadoem)}
                        </td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Enviar Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog with Steps */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setCreateUserStep(1);
          setSelectedNivelAcesso("usuario");
          setSelectedOrigemAssinatura("");
          createForm.reset();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar Novo Usuário
              <span className="text-sm font-normal text-muted-foreground ml-auto">
                Etapa {createUserStep} de {selectedNivelAcesso === "premium" ? "2" : "1"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {createUserStep === 1 
                ? "Preencha os dados principais de acesso"
                : "Configure os detalhes da assinatura premium"
              }
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: selectedNivelAcesso === "premium" 
                  ? `${(createUserStep / 2) * 100}%` 
                  : "100%" 
              }}
            />
          </div>

          <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
            {/* Step 1: Basic Information */}
            {createUserStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...createForm.register("email", { required: "Email é obrigatório" })}
                    placeholder="Digite o email (identificação principal)"
                    className="text-base"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    O email será usado como identificação principal
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    {...createForm.register("name", { required: "Nome é obrigatório" })}
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...createForm.register("password", { required: "Senha é obrigatória" })}
                      placeholder="Digite a senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="nivelacesso">Nível de Acesso *</Label>
                  <Select onValueChange={(value) => {
                    createForm.setValue("nivelacesso", value as NivelAcesso);
                    setSelectedNivelAcesso(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível de acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isactive"
                    {...createForm.register("isactive")}
                    defaultChecked={true}
                  />
                  <Label htmlFor="isactive">Usuário ativo</Label>
                </div>
              </div>
            )}

            {/* Step 2: Premium Subscription Details */}
            {createUserStep === 2 && selectedNivelAcesso === "premium" && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-purple-50">
                  <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4" />
                    Configurações Premium
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="origemassinatura">Origem da Assinatura *</Label>
                      <Select onValueChange={(value) => {
                        createForm.setValue("origemassinatura", value as OrigemAssinatura);
                        setSelectedOrigemAssinatura(value);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a origem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Manual
                            </div>
                          </SelectItem>
                          <SelectItem value="hotmart">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Hotmart
                            </div>
                          </SelectItem>
                          <SelectItem value="doppus">
                            <div className="flex items-center gap-2">
                              <Monitor className="w-4 h-4" />
                              Doppus
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Manual, Hotmart, and Doppus Subscription Details */}
                    {(selectedOrigemAssinatura === "manual" || selectedOrigemAssinatura === "hotmart" || selectedOrigemAssinatura === "doppus") && (
                      <div className="space-y-4 p-3 border rounded bg-blue-50">
                        <h5 className="font-medium text-blue-800 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          {selectedOrigemAssinatura === "manual" ? "Detalhes da Assinatura Manual" : 
                           selectedOrigemAssinatura === "hotmart" ? "Assinatura Hotmart (Processo Manual)" :
                           "Assinatura Doppus (Processo Manual)"}
                        </h5>
                        {(selectedOrigemAssinatura === "hotmart" || selectedOrigemAssinatura === "doppus") && (
                          <p className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                            ℹ️ Use esta opção quando o webhook automático falhar ou para processar compras manualmente
                          </p>
                        )}
                        
                        {/* Transaction ID for Hotmart/Doppus manual entries */}
                        {(selectedOrigemAssinatura === "hotmart" || selectedOrigemAssinatura === "doppus") && (
                          <div>
                            <Label htmlFor="observacaoadmin">ID da Transação / Observações</Label>
                            <Input
                              placeholder={`ID da transação ${selectedOrigemAssinatura === "hotmart" ? "Hotmart" : "Doppus"} ou observações sobre a compra`}
                              value={createForm.watch("observacaoadmin") || ""}
                              onChange={(e) => createForm.setValue("observacaoadmin", e.target.value)}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              💡 Útil para rastrear a compra caso o webhook tenha falhado
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="tipoplano">Tipo de Plano *</Label>
                          <Select onValueChange={(value) => {
                            createForm.setValue("tipoplano", value as TipoPlano);
                            const dataAssinatura = createForm.getValues("dataassinatura");
                            if (dataAssinatura) {
                              const expirationDate = calculateExpirationDate(dataAssinatura, value);
                              createForm.setValue("dataexpiracao", expirationDate);
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de plano" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mensal">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Mensal
                                </div>
                              </SelectItem>
                              <SelectItem value="trimestral">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Trimestral (3 meses)
                                </div>
                              </SelectItem>
                              <SelectItem value="semestral">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Semestral (6 meses)
                                </div>
                              </SelectItem>
                              <SelectItem value="anual">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  Anual (12 meses)
                                </div>
                              </SelectItem>
                              <SelectItem value="vitalicio">
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4" />
                                  Vitalício
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="dataassinatura">Data da Assinatura *</Label>
                          <Input
                            id="dataassinatura"
                            type="date"
                            {...createForm.register("dataassinatura")}
                            onChange={(e) => {
                              createForm.setValue("dataassinatura", e.target.value);
                              const tipoplano = createForm.getValues("tipoplano");
                              if (tipoplano) {
                                const expirationDate = calculateExpirationDate(e.target.value, tipoplano);
                                createForm.setValue("dataexpiracao", expirationDate);
                              }
                            }}
                          />
                        </div>

                        <div>
                          <Label htmlFor="dataexpiracao">Data de Expiração</Label>
                          <Input
                            id="dataexpiracao"
                            type="date"
                            {...createForm.register("dataexpiracao")}
                            readOnly
                            className="bg-gray-100 cursor-not-allowed"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            📅 Calculada automaticamente baseada no plano
                          </p>
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  if (createUserStep === 2) {
                    setCreateUserStep(1);
                  } else {
                    setIsCreateDialogOpen(false);
                  }
                }}
              >
                {createUserStep === 2 ? "Voltar" : "Cancelar"}
              </Button>
              
              {createUserStep === 1 ? (
                <Button 
                  type="button" 
                  onClick={() => {
                    // Validate step 1 fields
                    const email = createForm.getValues("email");
                    const name = createForm.getValues("name");
                    const password = createForm.getValues("password");
                    const nivelacesso = createForm.getValues("nivelacesso");
                    
                    // Enhanced validation with specific error messages
                    if (!email || email.trim() === "") {
                      toast({
                        title: "Email obrigatório",
                        description: "Por favor, digite um email válido.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (!name || name.trim() === "") {
                      toast({
                        title: "Nome obrigatório",
                        description: "Por favor, digite o nome completo.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (!password || password.trim() === "") {
                      toast({
                        title: "Senha obrigatória",
                        description: "Por favor, digite uma senha.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (!nivelacesso) {
                      toast({
                        title: "Nível de acesso obrigatório",
                        description: "Por favor, selecione um nível de acesso.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Email format validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                      toast({
                        title: "Email inválido",
                        description: "Por favor, digite um email válido.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (selectedNivelAcesso === "premium") {
                      setCreateUserStep(2);
                    } else {
                      handleCreateUser(createForm.getValues());
                    }
                  }}
                  disabled={createUserMutation.isPending}
                >
                  {selectedNivelAcesso === "premium" ? (
                    <>
                      Próximo
                      <ChevronDown className="w-4 h-4 ml-2 rotate-[-90deg]" />
                    </>
                  ) : (
                    createUserMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Criar Usuário
                      </>
                    )
                  )}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => {
                    // Validate premium fields for step 2
                    const origemassinatura = createForm.getValues("origemassinatura");
                    
                    if (!origemassinatura) {
                      toast({
                        title: "Origem da assinatura obrigatória",
                        description: "Por favor, selecione a origem da assinatura.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Additional validation for manual subscriptions
                    if (origemassinatura === "manual") {
                      const tipoplano = createForm.getValues("tipoplano");
                      const dataassinatura = createForm.getValues("dataassinatura");
                      
                      if (!tipoplano) {
                        toast({
                          title: "Tipo de plano obrigatório",
                          description: "Por favor, selecione o tipo de plano.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      if (!dataassinatura) {
                        toast({
                          title: "Data da assinatura obrigatória",
                          description: "Por favor, selecione a data da assinatura.",
                          variant: "destructive",
                        });
                        return;
                      }
                    }
                    
                    // All validations passed, submit the form
                    handleCreateUser(createForm.getValues());
                  }}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Criar Usuário
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  {...editForm.register("name")}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div>
                <Label htmlFor="edit-username">Nome de Usuário</Label>
                <Input
                  id="edit-username"
                  {...editForm.register("username")}
                  placeholder="Digite o username"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...editForm.register("email")}
                placeholder="Digite o email"
              />
            </div>

            <div>
              <Label htmlFor="edit-nivelacesso">Função</Label>
              <Select onValueChange={(value) => editForm.setValue("nivelacesso", value as NivelAcesso)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isactive"
                {...editForm.register("isactive")}
              />
              <Label htmlFor="edit-isactive">Usuário ativo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModernUserManagement;