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
import { SiHotjar } from "react-icons/si"; // Ícone similar ao da Hotmart
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
  AlertTriangleIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  KeyRoundIcon,
  UserCogIcon,
  InfoIcon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  CircleIcon,
  BadgeCheckIcon,
  TrashIcon,
  UserIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LogInIcon,
  LogOutIcon,
  ThumbsUpIcon,
  ShoppingCartIcon,
  BookmarkIcon,
  HeartIcon,
  InfinityIcon,
  CrownIcon,
  PaletteIcon,
  HeadphonesIcon,
  ShieldIcon,
  MessageCircleIcon,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsertUser, NivelAcesso, OrigemAssinatura, TipoPlano } from "@shared/schema";
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
import UserDashboardMetrics from "./UserDashboardMetrics";

// Definições de tipos
interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  role?: string;
  nivelacesso: NivelAcesso;
  origemassinatura?: OrigemAssinatura | null;
  tipoplano?: TipoPlano | null;
  dataassinatura?: string | null;
  dataexpiracao?: string | null;
  acessovitalicio: boolean;
  observacaoadmin?: string | null;
  isactive: boolean;
  criadoem: string;
  ultimologin?: string | null;
  profileimageurl: string | null;
  bio: string | null;
}

interface UserWithStats extends User {
  followers?: number;
  following?: number;
  totalDownloads?: number;
  totalViews?: number;
  online?: boolean;  // Campo para indicar status online
  lastActivity?: string;  // Último registro de atividade
  
  // Índice para permitir acesso dinâmico às propriedades
  [key: string]: any;
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
  observacaoadmin?: string;
  isactive: boolean;
  
  // Campos para compatibilidade com código existente
  role?: string;
  plan?: string;
  periodType?: string;
}

// Definição dos papéis de usuário com cores e descrições específicas
const userRoles: { value: NivelAcesso; label: string; color: string; description: string; group: string }[] = [
  { 
    value: "usuario", 
    label: "Usuário Básico", 
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
    value: "suporte", 
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
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<NivelAcesso | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customDateRange, setCustomDateRange] = useState<{from?: Date, to?: Date}>({});

  // Buscar o usuário atual (autenticado)
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user");
      return await res.json();
    },
  });
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Estados para controlar a visibilidade dos campos do formulário
  const [showPlanFields, setShowPlanFields] = useState(false);
  const [showExpirationDate, setShowExpirationDate] = useState(false);
  const [showCreatePlanFields, setShowCreatePlanFields] = useState(false);
  const [showCreateExpirationDate, setShowCreateExpirationDate] = useState(false);

  // Funções handlers para os menus de ações
  const handleResetPassword = (email: string) => {
    toast({
      title: "Reset de senha",
      description: `Uma nova senha foi enviada para ${email}`,
    });
  };

  const handleShowHistory = () => {
    if (!selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione um usuário para ver o histórico de atividades",
        variant: "destructive",
      });
      return;
    }
    
    setIsHistoryDialogOpen(true);
  };

  // Mutação para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao excluir usuário");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso",
      });
      
      // Invalidar a consulta de usuários para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Fechar o diálogo se estiver aberto
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Estado para controlar o diálogo de confirmação de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Função para lidar com a solicitação de exclusão
  const handleDeleteConfirmation = (userId: number) => {
    // Exibir um diálogo de confirmação para evitar exclusões acidentais
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar a exclusão após confirmação
  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
      setUserToDelete(null);
    }
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

  // Função para processar as regras de negócio com base no nível de acesso
  const handleNivelAcessoChange = (nivel: NivelAcesso, formType: 'create' | 'edit') => {
    const form = formType === 'create' ? createForm : editForm;
    
    // Regras para cada nível de acesso de acordo com a documentação
    if (nivel === 'premium') {
      // Premium: mostrar campos de plano, configurar valores padrão
      if (formType === 'edit') {
        setShowPlanFields(true);
      } else {
        setShowCreatePlanFields(true);
      }
      
      // Definir valores padrão se estiverem vazios
      if (!form.getValues().tipoplano) {
        form.setValue('tipoplano', 'mensal' as TipoPlano);
      }
      
      if (!form.getValues().origemassinatura) {
        form.setValue('origemassinatura', 'manual' as OrigemAssinatura);
      }
      
      if (!form.getValues().dataassinatura) {
        form.setValue('dataassinatura', new Date().toISOString().split('T')[0]);
      }
      
      // Verificar tipo de plano atual e aplicar regras de visibilidade
      const tipoPlano = form.getValues().tipoplano;
      
      if (tipoPlano === 'vitalicio') {
        // Se for vitalício, forçar acesso vitalício = true e esconder data de expiração
        form.setValue('acessovitalicio', true);
        form.setValue('dataexpiracao', null as any);
        if (formType === 'edit') {
          setShowExpirationDate(false);
        } else {
          setShowCreateExpirationDate(false);
        }
      } 
      else if (tipoPlano === 'personalizado') {
        // Se for personalizado, mostrar data de expiração (a menos que tenha acesso vitalício)
        const acessoVitalicio = form.getValues().acessovitalicio;
        if (formType === 'edit') {
          setShowExpirationDate(!acessoVitalicio);
        } else {
          setShowCreateExpirationDate(!acessoVitalicio);
        }
      }
      else {
        // Para mensal e anual, calcular data de expiração automaticamente
        if (formType === 'edit') {
          setShowExpirationDate(false);
        } else {
          setShowCreateExpirationDate(false);
        }
        
        const dataAssinatura = form.getValues().dataassinatura;
        if (dataAssinatura) {
          const dataAssinaturaObj = new Date(dataAssinatura);
          const dataExpiracao = new Date(dataAssinaturaObj);
          
          if (tipoPlano === 'mensal') {
            dataExpiracao.setDate(dataExpiracao.getDate() + 30);
          } else if (tipoPlano === 'anual') {
            dataExpiracao.setDate(dataExpiracao.getDate() + 365);
          }
          
          form.setValue('dataexpiracao', dataExpiracao.toISOString().split('T')[0]);
          form.setValue('acessovitalicio', false);
        }
      }
    } 
    else if (nivel === 'usuario') {
      // Usuário comum: ocultar todos os campos de plano conforme documentação
      if (formType === 'edit') {
        setShowPlanFields(false);
        setShowExpirationDate(false);
      } else {
        setShowCreatePlanFields(false);
        setShowCreateExpirationDate(false);
      }
      
      // Resetar valores conforme documentação
      form.setValue('tipoplano', null as any);
      form.setValue('origemassinatura', null as any);
      form.setValue('dataassinatura', null as any);
      form.setValue('dataexpiracao', null as any);
      form.setValue('acessovitalicio', false);
    } 
    else {
      // Admin/Designer/Suporte/Designer ADM: ocultar campos e forçar acesso vitalício
      if (formType === 'edit') {
        setShowPlanFields(false);
        setShowExpirationDate(false);
      } else {
        setShowCreatePlanFields(false);
        setShowCreateExpirationDate(false);
      }
      
      // Limpar plano e forçar acesso vitalício conforme documentação
      form.setValue('tipoplano', null as any);
      form.setValue('origemassinatura', null as any);
      form.setValue('dataassinatura', null as any);
      form.setValue('dataexpiracao', null as any);
      form.setValue('acessovitalicio', true);
    }
  };
  
  // Handler para mudança no tipo de plano conforme documentação
  const handleTipoPlanoChange = (tipo: TipoPlano, formType: 'create' | 'edit') => {
    const form = formType === 'create' ? createForm : editForm;
    
    // Seguir regras da documentação por tipo de plano
    
    // Se tipo for vitalício, forçar acesso vitalício = true e esconder expiração
    if (tipo === 'vitalicio') {
      form.setValue('acessovitalicio', true);
      if (formType === 'edit') {
        setShowExpirationDate(false);
      } else {
        setShowCreateExpirationDate(false);
      }
      form.setValue('dataexpiracao', null as any);
    } 
    // Se tipo for personalizado, mostrar campo de expiração (nunca terá acesso vitalício)
    else if (tipo === 'personalizado') {
      // No plano personalizado, desativar acesso vitalício
      form.setValue('acessovitalicio', false);
      
      // Mostrar campo de expiração para entrada manual
      if (formType === 'edit') {
        setShowExpirationDate(true);
      } else {
        setShowCreateExpirationDate(true);
      }
      
      // Limpar o campo para entrada manual
      form.setValue('dataexpiracao', null as any);
    } 
    // Para mensal (30 dias) e anual (365 dias), calcular a data de expiração automaticamente
    else {
      // Ocultar campo de expiração pois será calculado automaticamente
      if (formType === 'edit') {
        setShowExpirationDate(false);
      } else {
        setShowCreateExpirationDate(false);
      }
      
      // Desativar acesso vitalício para planos temporários
      form.setValue('acessovitalicio', false);
      
      // Calcular a data de expiração baseada na data de assinatura
      const dataAssinatura = form.getValues().dataassinatura;
      if (dataAssinatura) {
        const dataAssinaturaObj = new Date(dataAssinatura);
        const dataExpiracao = new Date(dataAssinaturaObj);
        
        if (tipo === 'mensal') {
          // Adicionar 30 dias conforme documentação
          dataExpiracao.setDate(dataExpiracao.getDate() + 30);
        } else if (tipo === 'anual') {
          // Adicionar 365 dias conforme documentação
          dataExpiracao.setDate(dataExpiracao.getDate() + 365);
        }
        
        // Formatar a data para YYYY-MM-DD
        const dataExpiracaoFormatada = dataExpiracao.toISOString().split('T')[0];
        form.setValue('dataexpiracao', dataExpiracaoFormatada);
      }
    }
  };
  
  // Handler para mudança no checkbox de acesso vitalício conforme documentação
  const handleAcessoVitalicioChange = (checked: boolean, formType: 'create' | 'edit') => {
    const form = formType === 'create' ? createForm : editForm;
    const nivelAcesso = form.getValues().nivelacesso;
    
    // Conforme a documentação, acesso vitalício só é manipulável para premium com plano vitalício
    if (nivelAcesso === 'premium') {
      // Se marcar acesso vitalício, deve alterar para plano vitalício e esconder expiração
      if (checked) {
        form.setValue('tipoplano', 'vitalicio' as TipoPlano);
        form.setValue('dataexpiracao', null as any);
        
        if (formType === 'edit') {
          setShowExpirationDate(false);
        } else {
          setShowCreateExpirationDate(false);
        }
      } 
      // Se desmarcar, alterar para plano mensal (padrão) se estava em vitalício
      else {
        const tipoPlano = form.getValues().tipoplano;
        
        // Se estava em plano vitalício, alterar para mensal
        if (tipoPlano === 'vitalicio') {
          form.setValue('tipoplano', 'mensal' as TipoPlano);
          
          // Calcular data de expiração para plano mensal
          const dataAssinatura = form.getValues().dataassinatura;
          if (dataAssinatura) {
            const dataAssinaturaObj = new Date(dataAssinatura);
            const dataExpiracao = new Date(dataAssinaturaObj);
            dataExpiracao.setDate(dataExpiracao.getDate() + 30);
            form.setValue('dataexpiracao', dataExpiracao.toISOString().split('T')[0]);
          }
        }
      }
    } 
    // Para usuários de outros níveis de acesso, o acesso vitalício é decidido automaticamente
    else {
      // Se for papel administrativo, força acesso vitalício = true
      if (['admin', 'suporte', 'designer', 'designer_adm'].includes(nivelAcesso)) {
        form.setValue('acessovitalicio', true);
      } 
      // Se for usuário padrão, força acesso vitalício = false
      else if (nivelAcesso === 'usuario') {
        form.setValue('acessovitalicio', false);
      }
    }
  };

  // Carregar dados do usuário no formulário de edição
  useEffect(() => {
    if (selectedUser && isEditDialogOpen) {
      console.log("Carregando usuário para edição:", selectedUser);
      
      // Converter valores do banco para o formato esperado pelo formulário
      const formData = {
        username: selectedUser.username,
        email: selectedUser.email,
        name: selectedUser.name || "",
        nivelacesso: selectedUser.nivelacesso,
        tipoplano: selectedUser.tipoplano as TipoPlano | undefined,
        origemassinatura: selectedUser.origemassinatura as OrigemAssinatura | undefined,
        // Garantir que datas sejam formatadas corretamente se existirem ou vazias se não existirem
        dataassinatura: selectedUser.dataassinatura ? 
          new Date(selectedUser.dataassinatura).toISOString().split('T')[0] : "",
        dataexpiracao: selectedUser.dataexpiracao ? 
          new Date(selectedUser.dataexpiracao).toISOString().split('T')[0] : "",
        acessovitalicio: selectedUser.acessovitalicio || false,
        isactive: selectedUser.isactive,
        role: selectedUser.role || "", // Campo mantido para compatibilidade
      };
      
      console.log("Dados formatados para o formulário:", formData);
      
      // Para usuários premium, garantir que os campos específicos de assinatura estejam preenchidos
      if (selectedUser.nivelacesso === 'premium') {
        // Se for premium sem tipo de plano definido, definir como padrão
        if (!formData.tipoplano) {
          formData.tipoplano = 'mensal' as TipoPlano;
        }
        
        // Se for premium sem origem de assinatura definida, definir como padrão
        if (!formData.origemassinatura) {
          formData.origemassinatura = 'manual' as OrigemAssinatura;
        }
        
        // Se for premium sem data de assinatura, definir como hoje
        if (!formData.dataassinatura) {
          formData.dataassinatura = new Date().toISOString().split('T')[0];
        }
        
        // Para planos não vitalícios sem data de expiração, calcular com base no tipo
        if (!formData.dataexpiracao && formData.tipoplano !== 'vitalicio') {
          const dataAssinatura = new Date(formData.dataassinatura);
          const dataExpiracao = new Date(dataAssinatura);
          
          if (formData.tipoplano === 'anual') {
            dataExpiracao.setDate(dataExpiracao.getDate() + 365);
          } else {
            dataExpiracao.setDate(dataExpiracao.getDate() + 30); // padrão para mensal e personalizado
          }
          
          formData.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
        }
      }
      
      editForm.reset(formData);

      // Aplicar regras de visibilidade com base no nível de acesso carregado
      handleNivelAcessoChange(selectedUser.nivelacesso, 'edit');
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
        const matchesRole = roleFilter === "all" || user.nivelacesso === roleFilter;
        
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
          (activeTab === "designers" && (user.nivelacesso === "designer" || user.nivelacesso === "designer_adm"));
        
        // Filtro por data
        let matchesDate = true;
        if (dateFilter !== "all") {
          const today = new Date();
          const userCreated = new Date(user.criadoem);
          
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
      new Date(user.criadoem).toLocaleDateString('pt-BR'),
      user.ultimologin ? new Date(user.ultimologin).toLocaleDateString('pt-BR') : 'Nunca'
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
    
    // Aplicar regras de negócio com base no nível de acesso antes de enviar
    // 1. Para usuários normais (nivel_acesso = usuario)
    if (data.nivelacesso === 'usuario') {
      data.tipoplano = null as any;
      data.origemassinatura = null as any;
      data.dataassinatura = null as any;
      data.dataexpiracao = null as any;
      data.acessovitalicio = false;
    }
    // 2. Para papéis administrativos (admin, suporte, designer, designer_adm)
    else if (['admin', 'suporte', 'designer', 'designer_adm'].includes(data.nivelacesso)) {
      data.tipoplano = null as any;
      data.origemassinatura = null as any;
      data.dataassinatura = null as any;
      data.dataexpiracao = null as any;
      data.acessovitalicio = true; // Todos os papéis administrativos têm acesso vitalício
    }
    // 3. Para usuários premium (nivel_acesso = premium)
    else if (data.nivelacesso === 'premium') {
      // Sempre definir valores padrão para os campos obrigatórios
      
      // Verificar campo obrigatório data de assinatura para usuários premium
      if (!data.dataassinatura) {
        data.dataassinatura = new Date().toISOString().split('T')[0];
      }
      
      // Verifica e garante que origem da assinatura seja definida
      if (!data.origemassinatura) {
        data.origemassinatura = 'manual' as OrigemAssinatura;
      }
      
      // Verifica e garante que tipo de plano seja definido (padrão: mensal)
      if (!data.tipoplano) {
        data.tipoplano = 'mensal' as TipoPlano;
        // Como definimos tipo mensal, vamos calcular a data de expiração padrão
        const dataAssinatura = new Date(data.dataassinatura);
        const dataExpiracao = new Date(dataAssinatura);
        dataExpiracao.setDate(dataExpiracao.getDate() + 30);
        data.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
        data.acessovitalicio = false;
      }
      
      // Agora que garantimos que tipo de plano está definido, aplicamos a lógica específica
      
      // Se for plano vitalício, garantir acesso vitalício = true e sem data de expiração
      if (data.tipoplano === 'vitalicio') {
        data.acessovitalicio = true;
        data.dataexpiracao = null as any;
      }
      // Se for plano mensal, calcular data_expiracao (30 dias)
      else if (data.tipoplano === 'mensal') {
        const dataAssinatura = new Date(data.dataassinatura);
        const dataExpiracao = new Date(dataAssinatura);
        dataExpiracao.setDate(dataExpiracao.getDate() + 30);
        data.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
        data.acessovitalicio = false;
      }
      // Se for plano anual, calcular data_expiracao (365 dias)
      else if (data.tipoplano === 'anual') {
        const dataAssinatura = new Date(data.dataassinatura);
        const dataExpiracao = new Date(dataAssinatura);
        dataExpiracao.setDate(dataExpiracao.getDate() + 365);
        data.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
        data.acessovitalicio = false;
      }
      // Se for plano personalizado, verificamos se a data de expiração foi fornecida
      else if (data.tipoplano === 'personalizado') {
        if (!data.dataexpiracao) {
          // Se não foi, definimos uma data padrão de 30 dias (como no plano mensal)
          const dataAssinatura = new Date(data.dataassinatura);
          const dataExpiracao = new Date(dataAssinatura);
          dataExpiracao.setDate(dataExpiracao.getDate() + 30);
          data.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
        }
        data.acessovitalicio = false;
      }
      
      // Log para debug dos dados antes de enviar
      console.log("Dados de usuário premium a serem enviados:", {
        nivelacesso: data.nivelacesso,
        tipoplano: data.tipoplano,
        origemassinatura: data.origemassinatura,
        dataassinatura: data.dataassinatura,
        dataexpiracao: data.dataexpiracao,
        acessovitalicio: data.acessovitalicio
      });
    }
    
    createUserMutation.mutate(data);
  });

  // Submeter formulário de edição
  const handleEditSubmit = editForm.handleSubmit((data) => {
    if (selectedUser) {
      // Log importante para debug
      console.log("Dados do usuário antes de processar regras:", {
        original: selectedUser,
        form: data
      });
      
      // Aplicar regras de negócio com base no nível de acesso antes de enviar
      // 1. Para usuários normais (nivel_acesso = usuario)
      if (data.nivelacesso === 'usuario') {
        data.tipoplano = null as any;
        data.origemassinatura = null as any;
        data.dataassinatura = null as any;
        data.dataexpiracao = null as any;
        data.acessovitalicio = false;
      }
      // 2. Para papéis administrativos (admin, suporte, designer, designer_adm)
      else if (['admin', 'suporte', 'designer', 'designer_adm'].includes(data.nivelacesso)) {
        data.tipoplano = null as any;
        data.origemassinatura = null as any;
        data.dataassinatura = null as any;
        data.dataexpiracao = null as any;
        data.acessovitalicio = true; // Todos os papéis administrativos têm acesso vitalício
      }
      // 3. Para usuários premium (nivel_acesso = premium)
      else if (data.nivelacesso === 'premium') {
        // Preservar dados originais do usuário quando não forem modificados explicitamente
        // Se o usuário já for premium, manter os valores originais a menos que sejam alterados
        if (selectedUser.nivelacesso === 'premium') {
          // Manter origemassinatura original se não foi alterada no formulário ou está vazia
          if (!data.origemassinatura && selectedUser.origemassinatura) {
            data.origemassinatura = selectedUser.origemassinatura as OrigemAssinatura;
          }
          
          // Manter tipoplano original se não foi alterado no formulário ou está vazio
          if (!data.tipoplano && selectedUser.tipoplano) {
            data.tipoplano = selectedUser.tipoplano as TipoPlano;
          }
          
          // Manter dataassinatura original se não foi alterada no formulário ou está vazia
          if (!data.dataassinatura && selectedUser.dataassinatura) {
            data.dataassinatura = new Date(selectedUser.dataassinatura).toISOString().split('T')[0];
          }
          
          // Manter dataexpiracao original se não foi alterada no formulário ou está vazia
          if (!data.dataexpiracao && selectedUser.dataexpiracao && selectedUser.tipoplano !== 'vitalicio') {
            data.dataexpiracao = new Date(selectedUser.dataexpiracao).toISOString().split('T')[0];
          }
          
          // Manter acessovitalicio original 
          if (selectedUser.acessovitalicio !== undefined) {
            data.acessovitalicio = data.acessovitalicio !== undefined ? data.acessovitalicio : selectedUser.acessovitalicio;
          }
        }
        
        // Depois de preservar dados, aplicar regras para preencher campos faltantes
        
        // Verificar campo obrigatório data de assinatura para usuários premium
        if (!data.dataassinatura) {
          data.dataassinatura = new Date().toISOString().split('T')[0];
        }
        
        // Verifica e garante que origem da assinatura seja definida
        if (!data.origemassinatura) {
          data.origemassinatura = 'manual' as OrigemAssinatura;
        }
        
        // Verifica e garante que tipo de plano seja definido (padrão: mensal)
        if (!data.tipoplano) {
          data.tipoplano = 'mensal' as TipoPlano;
          // Como definimos tipo mensal, vamos calcular a data de expiração padrão
          const dataAssinatura = new Date(data.dataassinatura);
          const dataExpiracao = new Date(dataAssinatura);
          dataExpiracao.setDate(dataExpiracao.getDate() + 30);
          data.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
          data.acessovitalicio = false;
        }
        
        // Agora que garantimos que tipo de plano está definido, aplicamos a lógica específica
        
        // Se for plano vitalício, garantir acesso vitalício = true e sem data de expiração
        if (data.tipoplano === 'vitalicio') {
          data.acessovitalicio = true;
          data.dataexpiracao = null as any;
        }
        // Se for plano mensal, calcular data_expiracao (30 dias)
        else if (data.tipoplano === 'mensal') {
          const dataAssinatura = new Date(data.dataassinatura);
          const dataExpiracao = new Date(dataAssinatura);
          dataExpiracao.setDate(dataExpiracao.getDate() + 30);
          data.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
          data.acessovitalicio = false;
        }
        // Se for plano anual, calcular data_expiracao (365 dias)
        else if (data.tipoplano === 'anual') {
          const dataAssinatura = new Date(data.dataassinatura);
          const dataExpiracao = new Date(dataAssinatura);
          dataExpiracao.setDate(dataExpiracao.getDate() + 365);
          data.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
          data.acessovitalicio = false;
        }
        // Se for plano personalizado, verificamos se a data de expiração foi fornecida
        else if (data.tipoplano === 'personalizado') {
          if (!data.dataexpiracao) {
            // Se não foi, definimos uma data padrão de 30 dias (como no plano mensal)
            const dataAssinatura = new Date(data.dataassinatura);
            const dataExpiracao = new Date(dataAssinatura);
            dataExpiracao.setDate(dataExpiracao.getDate() + 30);
            data.dataexpiracao = dataExpiracao.toISOString().split('T')[0];
          }
          data.acessovitalicio = false;
        }
        
        // Log para debug dos dados antes de enviar
        console.log("Dados de edição de usuário premium:", {
          nivelacesso: data.nivelacesso,
          tipoplano: data.tipoplano,
          origemassinatura: data.origemassinatura,
          dataassinatura: data.dataassinatura,
          dataexpiracao: data.dataexpiracao,
          acessovitalicio: data.acessovitalicio
        });
      }
      
      updateUserMutation.mutate({
        id: selectedUser.id,
        userData: data,
      });
    }
  });

  // Renderização do badge de status do usuário
  const renderStatusBadge = (isactive: boolean) => {
    return isactive ? (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50 border-green-200">
          Ativo
        </Badge>
      </div>
    ) : (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-400"></div>
        <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50 border-red-200">
          Inativo
        </Badge>
      </div>
    );
  };
  
  // Função para formatar informações de expiração
  const formatExpirationInfo = (user: UserWithStats) => {
    if (user.nivelacesso !== 'premium') {
      return <span className="text-muted-foreground text-xs italic">-</span>;
    }
    
    if (user.acessovitalicio) {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="inline-block">
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300 flex items-center px-2 py-1 cursor-pointer whitespace-nowrap">
                <InfinityIcon className="w-3 h-3 mr-1.5" />
                <span>Vitalício</span>
              </Badge>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 p-3 shadow-lg rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-purple-900 flex items-center">
                <InfinityIcon className="w-4 h-4 mr-1.5 text-purple-600" />
                Acesso Vitalício
              </h4>
              <p className="text-xs text-purple-800">
                Este usuário possui acesso permanente à plataforma. Não há data de expiração e o acesso não será revogado automaticamente.
              </p>
              <div className="text-xs text-purple-700 mt-1 flex items-center">
                <BadgeCheckIcon className="w-3 h-3 mr-1" />
                <span>Benefício premium permanente</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }
    
    if (!user.dataexpiracao) {
      return <span className="text-muted-foreground text-xs italic">Não definida</span>;
    }
    
    try {
      const expDate = new Date(user.dataexpiracao);
      
      // Verificar se a data é válida
      if (isNaN(expDate.getTime())) {
        return <span className="text-yellow-500 text-xs italic">Data inválida</span>;
      }
      
      const now = new Date();
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      // Formatar data no padrão brasileiro (dd/mm/yyyy)
      const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(expDate);
      
      if (diffDays < 0) {
        // Expirado
        const daysAgo = Math.abs(diffDays);
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="inline-block">
                <Badge variant="outline" className="whitespace-nowrap bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300 flex items-center px-2 py-1 cursor-pointer">
                  <AlertCircleIcon className="w-3 h-3 mr-1.5" />
                  <span>Expirado</span>
                </Badge>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 p-3 shadow-lg rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 backdrop-blur-sm">
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold text-red-900 flex items-center">
                  <AlertCircleIcon className="w-4 h-4 mr-1.5 text-red-600" />
                  Assinatura Expirada
                </h4>
                <p className="text-xs text-red-800">
                  A assinatura deste usuário expirou há {daysAgo} {daysAgo === 1 ? 'dia' : 'dias'}. O acesso a conteúdos premium foi revogado.
                </p>
                <div className="text-xs text-red-700 mt-1">
                  <div className="flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    <span>Expirou em: </span>
                    <span className="ml-1 font-medium">{formattedDate}</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      } else if (diffDays <= 7) {
        // Próximo de expirar (até 7 dias)
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="inline-block">
                <Badge className="whitespace-nowrap bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300 flex items-center px-2 py-1 cursor-pointer">
                  <ClockIcon className="w-3 h-3 mr-1.5" />
                  <span>{diffDays === 0 ? "Expira hoje" : `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`}</span>
                </Badge>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 p-3 shadow-lg rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 backdrop-blur-sm">
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold text-amber-900 flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1.5 text-amber-600" />
                  Assinatura Prestes a Expirar
                </h4>
                <p className="text-xs text-amber-800">
                  {diffDays === 0 
                    ? "A assinatura deste usuário expira hoje. Recomenda-se verificar a renovação."
                    : `A assinatura deste usuário expira em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}. Recomenda-se notificar sobre a renovação.`
                  }
                </p>
                <div className="text-xs text-amber-700 mt-1">
                  <div className="flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    <span>Expira em: </span>
                    <span className="ml-1 font-medium">{formattedDate}</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      } else {
        // Ativo com mais de 7 dias
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="inline-block">
                <Badge className="whitespace-nowrap bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300 flex items-center px-2 py-1 cursor-pointer">
                  <CheckCircleIcon className="w-3 h-3 mr-1.5" />
                  <span>Ativo</span>
                </Badge>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 p-3 shadow-lg rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-sm">
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold text-emerald-900 flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Assinatura Ativa
                </h4>
                <p className="text-xs text-emerald-800">
                  A assinatura deste usuário está ativa e expira em {diffDays} dias. O usuário tem acesso a todos os conteúdos premium.
                </p>
                <div className="text-xs text-emerald-700 mt-1">
                  <div className="flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    <span>Expira em: </span>
                    <span className="ml-1 font-medium">{formattedDate}</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
    } catch (error) {
      console.error("Erro ao formatar data de expiração:", error);
      return <span className="text-yellow-500 text-xs italic">Erro ao processar data</span>;
    }
  };
  
  // Função para renderizar a origem da assinatura
  const renderSubscriptionSource = (user: UserWithStats) => {
    if (user.nivelacesso !== 'premium') {
      return <span className="text-muted-foreground text-xs italic">N/A</span>;
    }
    
    if (!user.origemassinatura) {
      return <span className="text-muted-foreground text-xs italic">Não definida</span>;
    }
    
    if (user.origemassinatura === 'hotmart') {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Badge variant="outline" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center px-2 py-1 cursor-pointer">
              <SiHotjar className="w-3 h-3 mr-1.5" />
              <span>Hotmart</span>
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 p-3 shadow-lg rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-orange-900 flex items-center">
                <SiHotjar className="w-4 h-4 mr-1.5 text-red-500" />
                Assinatura via Hotmart
              </h4>
              <p className="text-xs text-orange-800">
                Assinatura processada automaticamente através da plataforma Hotmart. O sistema verifica o status periodicamente.
              </p>
              <div className="text-xs text-orange-700 mt-1 flex items-center">
                <CalendarIcon className="w-3 h-3 mr-1" />
                <span>Assinado em: </span>
                <span className="ml-1 font-medium">
                  {user.dataassinatura ? new Date(user.dataassinatura).toLocaleDateString('pt-BR') : 'Data não informada'}
                </span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    } else if (user.origemassinatura === 'manual') {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center px-2 py-1 cursor-pointer">
              <UserCogIcon className="w-3 h-3 mr-1.5" />
              <span>Manual</span>
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 p-3 shadow-lg rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-blue-900 flex items-center">
                <UserCogIcon className="w-4 h-4 mr-1.5" />
                Assinatura Manual
              </h4>
              <p className="text-xs text-blue-800">
                Assinatura registrada manualmente pela administração. Não há verificação automática com plataformas externas.
              </p>
              <div className="text-xs text-blue-700 mt-1 flex items-center">
                <CalendarIcon className="w-3 h-3 mr-1" />
                <span>Registrada em: </span>
                <span className="ml-1 font-medium">
                  {user.dataassinatura ? new Date(user.dataassinatura).toLocaleDateString('pt-BR') : 'Data não informada'}
                </span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    } else if (user.origemassinatura === 'auto') {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-teal-100 text-green-800 border-green-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center px-2 py-1 cursor-pointer">
              <UserPlusIcon className="w-3 h-3 mr-1.5" />
              <span>Auto Cadastro</span>
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 p-3 shadow-lg rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-teal-50 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-green-900 flex items-center">
                <UserPlusIcon className="w-4 h-4 mr-1.5" />
                Auto Cadastro
              </h4>
              <p className="text-xs text-green-800">
                Usuário registrado diretamente pelo site. Criou sua própria conta através do formulário de cadastro.
              </p>
              <div className="text-xs text-green-700 mt-1 flex items-center">
                <CalendarIcon className="w-3 h-3 mr-1" />
                <span>Registrado em: </span>
                <span className="ml-1 font-medium">
                  {user.criadoem ? new Date(user.criadoem).toLocaleDateString('pt-BR') : 'Data não informada'}
                </span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    } else {
      return (
        <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-gray-100 inline-block capitalize">
          {user.origemassinatura}
        </span>
      );
    }
  };

  // Renderização do badge de papel do usuário com tooltip para descrição
  const renderRoleBadge = (role: NivelAcesso) => {
    const roleInfo = userRoles.find(r => r.value === role) || {
      value: role as NivelAcesso,
      label: role,
      color: "bg-gray-500 hover:bg-gray-600",
      description: "Papel indefinido",
      group: "outros"
    };

    const getIcon = () => {
      switch (roleInfo.value) {
        case "usuario":
          return <UserIcon className="w-3 h-3 mr-1" />;
        case "premium":
          return <CrownIcon className="w-3 h-3 mr-1" />;
        case "designer":
          return <PencilIcon className="w-3 h-3 mr-1" />;
        case "designer_adm":
          return <PencilIcon className="w-3 h-3 mr-1" />;
        case "suporte":
          return <HeadphonesIcon className="w-3 h-3 mr-1" />;
        case "admin":
          return <ShieldCheckIcon className="w-3 h-3 mr-1" />;
        default:
          return <UserIcon className="w-3 h-3 mr-1" />;
      }
    };

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="inline-flex">
            <Badge className={`${roleInfo.color} transition-all shadow-sm hover:shadow-md flex items-center px-2 py-1`}>
              {getIcon()}
              <span>{roleInfo.label}</span>
            </Badge>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4 shadow-lg rounded-lg border border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="flex justify-between space-x-4">
            <div className="space-y-2">
              <h4 className="text-base font-semibold">{roleInfo.label}</h4>
              <p className="text-sm text-muted-foreground">
                {roleInfo.description}
              </p>
              <div className="flex items-center pt-2">
                <Badge variant="outline" className={`
                  text-xs px-2 py-0.5 
                  ${roleInfo.group === "equipe" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-green-50 border-green-200 text-green-700"}
                `}>
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
                  {users?.filter(u => u.nivelacesso === "designer" || u.nivelacesso === "designer_adm").length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usuários premium</span>
                <span className="font-semibold">
                  {users?.filter(u => u.nivelacesso === "premium").length || 0}
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
                  onValueChange={(value) => setRoleFilter(value as NivelAcesso | "all")}
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
          <TabsTrigger value="dashboard">
            <BarChart2Icon className="h-4 w-4 mr-2" />
            Dashboard SaaS
          </TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="inactive">Inativos</TabsTrigger>
          <TabsTrigger value="designers">Designers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <UserDashboardMetrics />
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          <UserTable 
            users={sortedUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            formatExpirationInfo={formatExpirationInfo}
            renderSubscriptionSource={renderSubscriptionSource}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
            sortConfig={sortConfig}
            onSort={handleSort}
            handleResetPassword={handleResetPassword}
            handleShowHistory={handleShowHistory}
            handleDeleteConfirmation={handleDeleteConfirmation}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <UserTable 
            users={sortedUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            formatExpirationInfo={formatExpirationInfo}
            renderSubscriptionSource={renderSubscriptionSource}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
            sortConfig={sortConfig}
            onSort={handleSort}
            handleResetPassword={handleResetPassword}
            handleShowHistory={handleShowHistory}
            handleDeleteConfirmation={handleDeleteConfirmation}
          />
        </TabsContent>
        <TabsContent value="inactive" className="mt-6">
          <UserTable 
            users={sortedUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            formatExpirationInfo={formatExpirationInfo}
            renderSubscriptionSource={renderSubscriptionSource}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
            sortConfig={sortConfig}
            onSort={handleSort}
            handleResetPassword={handleResetPassword}
            handleShowHistory={handleShowHistory}
            handleDeleteConfirmation={handleDeleteConfirmation}
          />
        </TabsContent>
        <TabsContent value="designers" className="mt-6">
          <UserTable 
            users={sortedUsers} 
            isLoading={isLoadingUsers}
            renderRoleBadge={renderRoleBadge}
            renderStatusBadge={renderStatusBadge}
            formatExpirationInfo={formatExpirationInfo}
            renderSubscriptionSource={renderSubscriptionSource}
            setSelectedUser={setSelectedUser}
            setIsEditDialogOpen={setIsEditDialogOpen}
            toggleUserStatusMutation={toggleUserStatusMutation}
            sortConfig={sortConfig}
            onSort={handleSort}
            handleResetPassword={handleResetPassword}
            handleShowHistory={handleShowHistory}
            handleDeleteConfirmation={handleDeleteConfirmation}
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
              {/* Campo de nome */}
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
              
              {/* Campo de e-mail */}
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
              
              {/* Campo de senha */}
              <div>
                <Label htmlFor="password" className="text-right">
                  Senha
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...createForm.register("password", { required: true })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="ml-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </Button>
                </div>
                {createForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">Senha é obrigatória</p>
                )}
                
                {/* Informação sobre senha personalizada */}
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-2">
                  <div className="flex items-start">
                    <InfoIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      A senha que você definir aqui será usada pelo usuário para fazer login.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Campos de nível e status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nivelacesso" className="text-right">
                    Nível de Acesso
                  </Label>
                  <Select 
                    onValueChange={(value) => {
                      const nivelAcesso = value as NivelAcesso;
                      createForm.setValue("nivelacesso", nivelAcesso);
                      handleNivelAcessoChange(nivelAcesso, 'create');
                    }} 
                    defaultValue={createForm.getValues("nivelacesso") || "usuario"}
                    value={createForm.watch("nivelacesso")}
                  >
                    <SelectTrigger id="nivelacesso" className="mt-1">
                      <SelectValue placeholder="Selecione o nível de acesso" />
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
                <div className="flex items-center space-x-2 mt-7">
                  <Checkbox 
                    id="isactive" 
                    checked={createForm.watch("isactive")}
                    onCheckedChange={(checked) => createForm.setValue("isactive", !!checked)}
                  />
                  <Label htmlFor="isactive">Usuário ativo</Label>
                </div>
              </div>
              
              {/* Campos condicionais para planos - Somente para Premium */}
              {showCreatePlanFields && createForm.watch("nivelacesso") === 'premium' && (
                <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t">
                  {/* Campo Tipo de Plano - sempre aparece para nivel_acesso = premium */}
                  <div>
                    <Label htmlFor="tipoplano" className="text-right font-medium">
                      Tipo de Plano <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={(value) => {
                        const tipoPlano = value as TipoPlano;
                        createForm.setValue("tipoplano", tipoPlano);
                        handleTipoPlanoChange(tipoPlano, 'create');
                      }} 
                      defaultValue={createForm.getValues("tipoplano") || "mensal"}
                      value={createForm.watch("tipoplano")}
                    >
                      <SelectTrigger id="tipoplano" className="mt-1">
                        <SelectValue placeholder="Selecione o tipo de plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                        <SelectItem value="vitalicio">Vitalício</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Campo Origem da Assinatura - sempre aparece para nivel_acesso = premium */}
                  <div>
                    <Label htmlFor="origemassinatura" className="text-right font-medium">
                      Origem da Assinatura <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={(value) => createForm.setValue("origemassinatura", value as OrigemAssinatura)} 
                      defaultValue={createForm.getValues("origemassinatura") || "manual"}
                      value={createForm.watch("origemassinatura")}
                    >
                      <SelectTrigger id="origemassinatura" className="mt-1">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="hotmart">Hotmart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Campo Data de Assinatura - sempre aparece para nivel_acesso = premium */}
                  <div>
                    <Label htmlFor="dataassinatura" className="text-right font-medium">
                      Data de Assinatura <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dataassinatura"
                      type="date"
                      {...createForm.register("dataassinatura", { required: true })}
                      className="mt-1"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                    {createForm.formState.errors.dataassinatura && (
                      <p className="text-sm text-red-500 mt-1">Data de assinatura é obrigatória</p>
                    )}
                  </div>
                  
                  {/* Campo Data de Expiração - aparece apenas se tipo_plano = personalizado */}
                  {showCreateExpirationDate && (
                    <div>
                      <Label htmlFor="dataexpiracao" className="text-right font-medium">
                        Data de Expiração <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dataexpiracao"
                        type="date"
                        {...createForm.register("dataexpiracao", { 
                          required: createForm.watch("tipoplano") === 'personalizado' 
                        })}
                        className="mt-1"
                      />
                      {createForm.formState.errors.dataexpiracao && (
                        <p className="text-sm text-red-500 mt-1">Data de expiração é obrigatória</p>
                      )}
                    </div>
                  )}
                  
                  {/* Checkbox Acesso Vitalício - aparece apenas se tipo_plano = vitalicio */}
                  {createForm.watch("tipoplano") === 'vitalicio' && (
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox 
                          id="acessovitalicio" 
                          checked={createForm.watch("acessovitalicio")}
                          onCheckedChange={(checked) => {
                            handleAcessoVitalicioChange(!!checked, 'create');
                          }}
                          defaultChecked={true}
                        />
                        <Label htmlFor="acessovitalicio">Acesso vitalício</Label>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                <div className="flex mt-1">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    {...editForm.register("password")}
                    className="flex-1"
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="ml-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Informação sobre redefinição de senha */}
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-2">
                  <div className="flex items-start">
                    <InfoIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      Se você alterar a senha, o usuário precisará usar a nova senha para fazer login.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nivelacesso" className="text-right">
                    Nível de Acesso
                  </Label>
                  <Select 
                    onValueChange={(value) => {
                      const nivelAcesso = value as NivelAcesso;
                      editForm.setValue("nivelacesso", nivelAcesso);
                      
                      // Aplicar regras baseadas no nível de acesso
                      handleNivelAcessoChange(nivelAcesso, 'edit');
                    }} 
                    defaultValue={editForm.getValues("nivelacesso") || "usuario"}
                    value={editForm.watch("nivelacesso")}
                  >
                    <SelectTrigger id="edit-nivelacesso" className="mt-1">
                      <SelectValue placeholder="Selecione o nível de acesso" />
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
                  <div className="flex items-center space-x-2 mb-1">
                    <Checkbox 
                      id="edit-isactive" 
                      checked={editForm.watch("isactive")}
                      onCheckedChange={(checked) => editForm.setValue("isactive", !!checked)}
                    />
                    <Label htmlFor="edit-isactive">Usuário ativo</Label>
                  </div>
                </div>
              </div>
              
              {/* Campos de plano - visíveis apenas para nível premium */}
              {showPlanFields && editForm.watch("nivelacesso") === 'premium' && (
                <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t">
                  {/* Campo Tipo de Plano - sempre aparece para nivel_acesso = premium */}
                  <div>
                    <Label htmlFor="edit-tipoplano" className="text-right font-medium">
                      Tipo de Plano <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={(value) => {
                        const tipoPlano = value as TipoPlano;
                        editForm.setValue("tipoplano", tipoPlano);
                        
                        // Aplicar regras baseadas no tipo de plano
                        handleTipoPlanoChange(tipoPlano, 'edit');
                      }} 
                      defaultValue={editForm.getValues("tipoplano") || "mensal"}
                      value={editForm.watch("tipoplano")}
                    >
                      <SelectTrigger id="edit-tipoplano" className="mt-1">
                        <SelectValue placeholder="Selecione o tipo de plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                        <SelectItem value="vitalicio">Vitalício</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Campo Origem da Assinatura - sempre aparece para nivel_acesso = premium */}
                  <div>
                    <Label htmlFor="edit-origemassinatura" className="text-right font-medium">
                      Origem da Assinatura <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={(value) => editForm.setValue("origemassinatura", value as OrigemAssinatura)} 
                      defaultValue={editForm.getValues("origemassinatura") || "manual"}
                      value={editForm.watch("origemassinatura")}
                    >
                      <SelectTrigger id="edit-origemassinatura" className="mt-1">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="hotmart">Hotmart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Campo Data de Assinatura - sempre aparece para nivel_acesso = premium */}
                  <div>
                    <Label htmlFor="edit-dataassinatura" className="text-right font-medium">
                      Data de Assinatura <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-dataassinatura"
                      type="date"
                      {...editForm.register("dataassinatura", { required: true })}
                      className="mt-1"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                    {editForm.formState.errors.dataassinatura && (
                      <p className="text-sm text-red-500 mt-1">Data de assinatura é obrigatória</p>
                    )}
                  </div>
                  
                  {/* Campo Data de Expiração - aparece apenas se tipo_plano = personalizado */}
                  {showExpirationDate && (
                    <div>
                      <Label htmlFor="edit-dataexpiracao" className="text-right font-medium">
                        Data de Expiração <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-dataexpiracao"
                        type="date"
                        {...editForm.register("dataexpiracao", { 
                          required: editForm.watch("tipoplano") === 'personalizado' 
                        })}
                        className="mt-1"
                      />
                      {editForm.formState.errors.dataexpiracao && (
                        <p className="text-sm text-red-500 mt-1">Data de expiração é obrigatória</p>
                      )}
                    </div>
                  )}
                  
                  {/* Checkbox Acesso Vitalício - aparece apenas se tipo_plano = vitalicio */}
                  {editForm.watch("tipoplano") === 'vitalicio' && (
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox 
                          id="edit-acessovitalicio" 
                          checked={editForm.watch("acessovitalicio")}
                          onCheckedChange={(checked) => {
                            handleAcessoVitalicioChange(!!checked, 'edit');
                          }}
                          defaultChecked={true}
                        />
                        <Label htmlFor="edit-acessovitalicio">Acesso vitalício</Label>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

      {/* Dialog de histórico de atividades */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Atividades</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  Histórico de atividades recentes de <strong>{selectedUser.name || selectedUser.username}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {selectedUser && (
              <div className="space-y-6 pt-2 pb-4">
                {/* Lista de atividades exemplo - Em uma implementação real, isso seria carregado da API */}
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <LogInIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">Login no sistema</h4>
                        <p className="text-sm text-muted-foreground">
                          Acesso realizado via navegador Chrome no Windows
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">Hoje às 10:25</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <DownloadIcon className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">Download de arte</h4>
                        <p className="text-sm text-muted-foreground">
                          Arte "Poster de Lavagem" foi baixada
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">Ontem às 15:40</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <EyeIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">Visualização de arte</h4>
                        <p className="text-sm text-muted-foreground">
                          Visualizou 12 artes na categoria "Vendas"
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">15/04/2025</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <HeartIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">Favoritou artes</h4>
                        <p className="text-sm text-muted-foreground">
                          Adicionou 3 artes aos favoritos
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">14/04/2025</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-pink-100 p-2 rounded-full">
                    <ShoppingCartIcon className="h-5 w-5 text-pink-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">Assinatura realizada</h4>
                        <p className="text-sm text-muted-foreground">
                          Assinou o plano Premium - Anual
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">10/04/2025</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <LogInIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">Registro no sistema</h4>
                        <p className="text-sm text-muted-foreground">
                          Criação de conta no sistema
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">01/04/2025</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!selectedUser && (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Nenhum usuário selecionado</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente de tabela de usuários - Updated with WhatsApp integration
interface UserTableProps {
  users: UserWithStats[];
  isLoading: boolean;
  renderRoleBadge: (role: NivelAcesso) => JSX.Element;
  renderStatusBadge: (isactive: boolean) => JSX.Element;
  formatExpirationInfo: (user: UserWithStats) => React.ReactNode;
  renderSubscriptionSource: (user: UserWithStats) => React.ReactNode;
  setSelectedUser: (user: UserWithStats) => void;
  setIsEditDialogOpen: (open: boolean) => void;
  toggleUserStatusMutation: any;
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: string) => void;
  handleResetPassword: (email: string) => void;
  handleShowHistory: () => void;
  handleDeleteConfirmation: (userId: number) => void;
}

const UserTable = ({
  users,
  isLoading,
  renderRoleBadge,
  renderStatusBadge,
  formatExpirationInfo,
  renderSubscriptionSource,
  setSelectedUser,
  setIsEditDialogOpen,
  toggleUserStatusMutation,
  sortConfig,
  onSort,
  handleResetPassword,
  handleShowHistory,
  handleDeleteConfirmation
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
  const formatFullDate = (dateValue: string | Date) => {
    if (!dateValue) return "Data não disponível";
    
    try {
      // Criar data a partir do valor (que pode ser string ou Date)
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error("Data inválida:", dateValue);
        return "Data inválida";
      }
      
      // Tolerância de 3 horas (10800000 ms) para diferenças de fuso horário
      // Isso é necessário porque os timestamps vêm do banco com UTC e
      // podem parecer estar no futuro quando comparados ao horário local
      const now = new Date();
      const threeHours = 3 * 60 * 60 * 1000; // 3 horas em milissegundos
      
      // Se a data estiver mais de 3 horas no futuro (tolerância acima do normal),
      // então algo está realmente errado - nesse caso usamos a data atual
      if (date.getTime() > now.getTime() + threeHours) {
        // Registrar problema para debug
        console.log("Ajustando data com problema de fuso:", dateValue);
        
        // Formatar no padrão brasileiro usando o formatter com timezone correto
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo' // Usando timezone de Brasília
        }).format(now) + " (BRT)*"; // Adicionar asterisco para indicar ajuste
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
      console.error("Erro ao formatar data completa:", error, "Data:", dateValue);
      return "Data inválida";
    }
  };
  
  // Função para renderizar avatar do usuário
  const renderUserAvatar = (user: UserWithStats) => {
    // Gerar iniciais a partir do nome ou username
    const initials = user.name 
      ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : user.username.substring(0, 2).toUpperCase();
      
    // Verificar se o usuário tem uma URL de imagem de perfil
    const profileUrl = user.profileimageurl;
    
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="flex items-center">
            <div className="relative h-9 w-9 mr-3">
              {profileUrl ? (
                <img 
                  src={profileUrl} 
                  alt={user.username}
                  className="rounded-full object-cover h-9 w-9 shadow-sm border border-gray-100" 
                  onError={(e) => {
                    // Se a imagem falhar ao carregar, mostrar as iniciais
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    
                    // Criar um elemento de fallback com as iniciais
                    if (parent) {
                      // Esconder a imagem que falhou
                      target.style.display = 'none';
                      
                      // Criar elemento de fallback apenas se ainda não existe
                      if (!parent.querySelector('.avatar-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = `avatar-fallback rounded-full h-9 w-9 flex items-center justify-center text-xs text-white font-medium shadow-sm ${
                          userRoles.find(r => r.value === user.nivelacesso)?.color || "bg-gray-500"
                        }`;
                        fallback.textContent = initials;
                        parent.appendChild(fallback);
                      }
                    }
                  }}
                />
              ) : (
                <div className={`rounded-full h-9 w-9 flex items-center justify-center text-xs text-white font-medium shadow-sm ${
                  userRoles.find(r => r.value === user.nivelacesso)?.color || "bg-gray-500"
                }`}>
                  {initials}
                </div>
              )}
              {user.isactive && (
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border border-white shadow-sm" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{user.username}</span>
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
                  className="rounded-full object-cover h-16 w-16 shadow-sm border border-gray-100" 
                  onError={(e) => {
                    // Se a imagem falhar ao carregar, mostrar as iniciais
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    
                    // Criar um elemento de fallback com as iniciais
                    if (parent) {
                      // Esconder a imagem que falhou
                      target.style.display = 'none';
                      
                      // Criar elemento de fallback apenas se ainda não existe
                      if (!parent.querySelector('.avatar-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = `avatar-fallback rounded-full h-16 w-16 flex items-center justify-center text-xl text-white font-medium shadow-sm ${
                          userRoles.find(r => r.value === user.nivelacesso)?.color || "bg-gray-500"
                        }`;
                        fallback.textContent = initials;
                        parent.appendChild(fallback);
                      }
                    }
                  }}
                />
              ) : (
                <div className={`rounded-full h-16 w-16 flex items-center justify-center text-xl text-white font-medium shadow-sm ${
                  userRoles.find(r => r.value === user.nivelacesso)?.color || "bg-gray-500"
                }`}>
                  {initials}
                </div>
              )}
              {user.isactive && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border border-white shadow-sm" />
              )}
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold">{user.name || user.username}</h4>
              <div className="space-y-1">
                <p className="text-xs">{user.email}</p>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Cadastrado em {formatFullDate(user.criadoem)}
                  </p>
                </div>
                {user.ultimologin && (
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Último login: {formatFullDate(user.ultimologin)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {user.nivelacesso === 'premium' && (
            <div className="mt-3 border rounded-lg p-3 bg-gray-50">
              <div className="text-xs font-medium mb-2 flex items-center">
                <CrownIcon className="h-3.5 w-3.5 mr-1 text-amber-500" />
                <span>Detalhes da assinatura</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Plano:</span>{' '}
                  <span className="font-medium capitalize">{user.tipoplano || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Origem:</span>{' '}
                  <span className="font-medium capitalize">{user.origemassinatura || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Expiração:</span>{' '}
                  <span className="font-medium">{formatExpirationInfo(user)}</span>
                </div>
              </div>
            </div>
          )}
          
          {(user.nivelacesso === "designer" || user.nivelacesso === "designer_adm") && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-blue-50 rounded-md shadow-sm border border-blue-100">
                <p className="text-xs text-muted-foreground">Artes vistas</p>
                <p className="text-sm font-medium">{user.totalViews || 0}</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-md shadow-sm border border-blue-100">
                <p className="text-xs text-muted-foreground">Downloads</p>
                <p className="text-sm font-medium">{user.totalDownloads || 0}</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-md shadow-sm border border-blue-100">
                <p className="text-xs text-muted-foreground">Seguidores</p>
                <p className="text-sm font-medium">{user.followersCount || 0}</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-md shadow-sm border border-blue-100">
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
              onClick={() => onSort && onSort('nivelacesso')}
            >
              <div className="flex items-center">
                Papel
                {sortConfig?.key === 'nivelacesso' && (
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
              onClick={() => onSort && onSort('origemassinatura')}
            >
              <div className="flex items-center">
                Origem
                {sortConfig?.key === 'origemassinatura' && (
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
              onClick={() => onSort && onSort('dataexpiracao')}
            >
              <div className="flex items-center">
                Expiração
                {sortConfig?.key === 'dataexpiracao' && (
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
              onClick={() => onSort && onSort('criadoem')}
            >
              <div className="flex items-center">
                Cadastro
                {sortConfig?.key === 'criadoem' && (
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
              onClick={() => onSort && onSort('ultimologin')}
            >
              <div className="flex items-center">
                Último login
                {sortConfig?.key === 'ultimologin' && (
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
              <TableCell colSpan={10} className="text-center py-8">
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
              <TableCell colSpan={10} className="text-center py-8">
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
                <TableCell>{renderRoleBadge(user.nivelacesso)}</TableCell>
                <TableCell>{renderSubscriptionSource(user)}</TableCell>
                <TableCell>{formatExpirationInfo(user)}</TableCell>
                <TableCell>{renderStatusBadge(user.isactive)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {user.criadoem ? formatFullDate(user.criadoem) : (
                      <span className="text-muted-foreground text-xs">Não disponível</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.ultimologin ? (
                    <div className="text-sm">
                      {formatFullDate(user.ultimologin)}
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
                      <DropdownMenuItem
                        onClick={() => {
                          const message = `Olá ${user.name || user.username}, tudo bem? Sou da equipe DesignAuto e gostaria de conversar com você.`;
                          const phoneNumber = user.phone || '';
                          const whatsappUrl = phoneNumber 
                            ? `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
                            : `https://wa.me/?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="text-green-600"
                      >
                        <FaWhatsapp className="h-4 w-4 mr-2" />
                        Contatar no WhatsApp
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
                        onClick={() => handleDeleteConfirmation(user.id)}
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