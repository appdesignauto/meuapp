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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsertUser, UserRole } from "@shared/schema";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isactive: boolean;
}

const userRoles: { value: UserRole; label: string }[] = [
  { value: "visitor", label: "Visitante" },
  { value: "free", label: "Usuário Free" },
  { value: "premium", label: "Usuário Premium" },
  { value: "designer", label: "Designer" },
  { value: "designer_adm", label: "Designer Administrador" },
  { value: "support", label: "Suporte" },
  { value: "admin", label: "Administrador" },
];

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [activeTab, setActiveTab] = useState("all");

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
      username: "",
      email: "",
      password: "",
      name: "",
      role: "free",
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
      const res = await apiRequest("POST", "/api/users", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao criar usuário");
      }
      return await res.json();
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
  const filteredUsers = users
    ? users.filter((user) => {
        const matchesSearch =
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        
        const matchesTab = 
          activeTab === "all" || 
          (activeTab === "active" && user.isactive) || 
          (activeTab === "inactive" && !user.isactive) ||
          (activeTab === "designers" && (user.role === "designer" || user.role === "designer_adm"));
        
        return matchesSearch && matchesRole && matchesTab;
      })
    : [];

  // Submeter formulário de criação
  const handleCreateSubmit = createForm.handleSubmit((data) => {
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

  // Renderização do badge de papel do usuário
  const renderRoleBadge = (role: UserRole) => {
    const roleColors: Record<UserRole, string> = {
      visitor: "bg-slate-500 hover:bg-slate-600",
      free: "bg-sky-500 hover:bg-sky-600",
      premium: "bg-violet-500 hover:bg-violet-600",
      designer: "bg-amber-500 hover:bg-amber-600",
      designer_adm: "bg-orange-500 hover:bg-orange-600",
      support: "bg-emerald-500 hover:bg-emerald-600",
      admin: "bg-rose-500 hover:bg-rose-600",
    };

    const roleLabels: Record<UserRole, string> = {
      visitor: "Visitante",
      free: "Free",
      premium: "Premium",
      designer: "Designer",
      designer_adm: "Designer ADM",
      support: "Suporte",
      admin: "Admin",
    };

    return (
      <Badge className={roleColors[role]}>{roleLabels[role]}</Badge>
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Buscar por nome, email ou username"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="w-full sm:w-1/3">
                <Label htmlFor="role-filter">Papel</Label>
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
            users={filteredUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <UserTable 
            users={filteredUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
          />
        </TabsContent>
        <TabsContent value="inactive" className="mt-6">
          <UserTable 
            users={filteredUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
          />
        </TabsContent>
        <TabsContent value="designers" className="mt-6">
          <UserTable 
            users={filteredUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    {...createForm.register("username", { required: true })}
                    className="mt-1"
                  />
                  {createForm.formState.errors.username && (
                    <p className="text-sm text-red-500 mt-1">Username é obrigatório</p>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    {...createForm.register("name")}
                    className="mt-1"
                  />
                </div>
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
}

const UserTable = ({
  users,
  isLoading,
  renderRoleBadge,
  renderStatusBadge,
  setSelectedUser,
  setIsEditDialogOpen,
  toggleUserStatusMutation,
}: UserTableProps) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableCaption>Lista de usuários do sistema</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data de criação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                Carregando usuários...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{renderRoleBadge(user.role)}</TableCell>
                <TableCell>{renderStatusBadge(user.isactive)}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
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
                            <UserXIcon className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          window.open(`/designers/${user.id}`, "_blank");
                        }}
                      >
                        Ver perfil
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