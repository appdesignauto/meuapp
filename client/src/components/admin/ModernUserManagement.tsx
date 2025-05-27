import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Users, 
  UserPlus, 
  Crown, 
  Palette, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  User
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  profileimageurl: string | null;
  bio: string | null;
  nivelacesso: string;
  tipoplano: string | null;
  origemassinatura: string | null;
  dataassinatura: string | null;
  dataexpiracao: string | null;
  acessovitalicio: boolean;
  isactive: boolean;
  ultimologin: string | null;
  criadoem: string;
  atualizadoem: string;
}

interface UserResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    designers: number;
  };
}

interface EditUserData {
  nivelacesso?: string;
  isactive?: boolean;
  tipoplano?: string;
  acessovitalicio?: boolean;
  dataexpiracao?: string;
  observacaoadmin?: string;
}

export default function ModernUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<EditUserData>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar usuários com a nova API
  const { data: userResponse, isLoading, error } = useQuery<UserResponse>({
    queryKey: ['admin-users', searchTerm, statusFilter, roleFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }
      return response.json();
    }
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: EditUserData }) => {
      return apiRequest(`/api/admin/users/${userId}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      setEditData({});
      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o usuário.",
        variant: "destructive",
      });
    }
  });

  // Mutation para deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/users/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    }
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditData({
      nivelacesso: user.nivelacesso,
      isactive: user.isactive,
      tipoplano: user.tipoplano || '',
      acessovitalicio: user.acessovitalicio,
      dataexpiracao: user.dataexpiracao || '',
      observacaoadmin: ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ userId: selectedUser.id, data: editData });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      designer_adm: "secondary",
      designer: "outline",
      premium: "default",
      suporte: "secondary",
      usuario: "outline",
      visitante: "outline"
    };

    const labels = {
      admin: "Admin",
      designer_adm: "Designer Admin",
      designer: "Designer",
      premium: "Premium",
      suporte: "Suporte",
      usuario: "Usuário",
      visitante: "Visitante"
    };

    return (
      <Badge variant={variants[role as keyof typeof variants] || "outline"}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao carregar usuários</CardTitle>
            <CardDescription>
              Ocorreu um erro ao buscar os dados dos usuários. Tente novamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com título e botão */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie os usuários, designers e administradores do sistema</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Estatísticas */}
      {userResponse?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total de usuários</p>
                  <p className="text-2xl font-bold">{userResponse.stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Usuários ativos</p>
                  <p className="text-2xl font-bold">{userResponse.stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Crown className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Usuários premium</p>
                  <p className="text-2xl font-bold">{userResponse.stats.premiumUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Palette className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Designers</p>
                  <p className="text-2xl font-bold">{userResponse.stats.designers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="designer_adm">Designer Admin</SelectItem>
                <SelectItem value="designer">Designer</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="usuario">Usuário</SelectItem>
                <SelectItem value="visitante">Visitante</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuários */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userResponse?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.profileimageurl ? (
                            <img 
                              src={user.profileimageurl} 
                              alt={user.name || user.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.name || user.username}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.nivelacesso)}</TableCell>
                    <TableCell>{getStatusBadge(user.isactive)}</TableCell>
                    <TableCell>{formatDate(user.criadoem)}</TableCell>
                    <TableCell>{formatDate(user.ultimologin)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {userResponse?.pagination && userResponse.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {((currentPage - 1) * 20) + 1} a {Math.min(currentPage * 20, userResponse.pagination.total)} de {userResponse.pagination.total} usuários
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(userResponse.pagination.totalPages, prev + 1))}
              disabled={currentPage === userResponse.pagination.totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário {selectedUser?.name || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nivelacesso">Nível de Acesso</Label>
              <Select 
                value={editData.nivelacesso} 
                onValueChange={(value) => setEditData(prev => ({ ...prev, nivelacesso: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="designer_adm">Designer Admin</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isactive"
                checked={editData.isactive}
                onCheckedChange={(checked) => setEditData(prev => ({ ...prev, isactive: checked }))}
              />
              <Label htmlFor="isactive">Usuário ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="acessovitalicio"
                checked={editData.acessovitalicio}
                onCheckedChange={(checked) => setEditData(prev => ({ ...prev, acessovitalicio: checked }))}
              />
              <Label htmlFor="acessovitalicio">Acesso vitalício</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacaoadmin">Observação do Admin</Label>
              <Textarea
                id="observacaoadmin"
                placeholder="Adicione uma observação sobre este usuário..."
                value={editData.observacaoadmin}
                onChange={(e) => setEditData(prev => ({ ...prev, observacaoadmin: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}