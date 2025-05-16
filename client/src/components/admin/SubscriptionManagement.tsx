import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import WebhookList from './WebhookList';
import SubscriptionSettings from './SubscriptionSettings';
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
  CheckCircle,
  XCircle,
  SearchIcon,
  Calendar,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  BadgeDollarSign,
  Wallet,
  CircleDollarSign,
  BarChart3,
  CalendarClock,
  Clock,
  User as UserIcon,
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
  Settings,
  X,
  FileText,
  Copy,
  Download,
  Filter,
  SlidersHorizontal,
  MoreHorizontal
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { format, addDays, addMonths, addYears, parseISO, subDays, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';

// Interface para mapeamento de produtos Hotmart
interface ProductMapping {
  id: number;
  productName: string;
  planType: string;
  durationDays: number;
  isLifetime: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para as configurações de integração
interface IntegrationSettings {
  hotmart?: {
    secret?: {
      isDefined: boolean;
      realValue?: string;
    };
    clientId?: {
      isDefined: boolean;
      realValue?: string;
    };
    clientSecret?: {
      isDefined: boolean;
      realValue?: string;
    };
  };
  doppus?: {
    secret?: {
      isDefined: boolean;
      realValue?: string;
    };
  };
}

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Definindo interface para chaves com informações de segurança
interface SecretKeyInfo {
  isDefined: boolean;
  realValue?: string;
}

// Interface para mapeamento de produtos da Hotmart
interface ProductMapping {
  id: number;
  productName: string;
  planType: string;
  durationDays: number | null;
  isLifetime: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface principal para configurações de integração
interface IntegrationSettings {
  hotmart?: {
    secret?: SecretKeyInfo;
    clientId?: SecretKeyInfo;
    clientSecret?: SecretKeyInfo;
    useSandbox?: {
      isDefined: boolean;
      value: string;
      realValue?: string;
    };
  };
  doppus?: {
    secret?: SecretKeyInfo;
    apiKey?: SecretKeyInfo;
  };
}

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
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState("visaoGeral");

  // Estado para armazenar o status da última conexão com a Hotmart
  const [lastConnectionStatus, setLastConnectionStatus] = useState<{
    success: boolean;
    message?: string;
    timestamp: Date;
  } | null>(null);
  
  // Os estados para gerenciamento de mapeamentos foram movidos para baixo
  // para evitar duplicação
  
  // Função para buscar os mapeamentos de produtos Hotmart
  const fetchProductMappings = useCallback(async () => {
    try {
      if (setIsLoadingMappings) {
        setIsLoadingMappings(true);
      }
      const response = await fetch('/api/integrations/hotmart/product-mappings');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar mapeamentos de produtos');
      }
      
      const data = await response.json();
      if (setProductMappings) {
        setProductMappings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar mapeamentos:', error);
      toast({
        title: "Erro ao carregar mapeamentos",
        description: "Não foi possível carregar os mapeamentos de produtos Hotmart.",
        variant: "destructive",
      });
    } finally {
      if (setIsLoadingMappings) {
        setIsLoadingMappings(false);
      }
    }
  }, [toast, setIsLoadingMappings, setProductMappings]);

  // Função para abrir o diálogo de adição de mapeamento
  const openAddMappingDialog = () => {
    setMappingFormData({
      productName: '',
      planType: 'premium',
      durationDays: 30,
      isLifetime: false
    });
    setEditingMapping(null);
    setShowProductMappingDialog(true);
  };

  // Função para abrir o diálogo de edição de mapeamento
  const openEditMappingDialog = (mapping: ProductMapping) => {
    setMappingFormData({
      productName: mapping.productName,
      planType: mapping.planType,
      durationDays: mapping.durationDays || 30,
      isLifetime: mapping.isLifetime
    });
    setEditingMapping(mapping);
    setShowProductMappingDialog(true);
  };

  // Função para processar alterações no formulário de mapeamento
  const handleMappingFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setMappingFormData({
        ...mappingFormData,
        [name]: parseInt(value, 10)
      });
    } else {
      setMappingFormData({
        ...mappingFormData,
        [name]: value
      });
    }
  };

  // Função para enviar o formulário de mapeamento
  const handleSubmitMapping = async () => {
    try {
      const endpoint = editingMapping 
        ? `/api/integrations/hotmart/product-mappings/${editingMapping.id}` 
        : '/api/integrations/hotmart/product-mappings';
      
      const method = editingMapping ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mappingFormData)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao salvar mapeamento');
      }
      
      // Atualizar a lista de mapeamentos
      await fetchProductMappings();
      
      // Fechar o diálogo
      setShowProductMappingDialog(false);
      
      toast({
        title: editingMapping ? "Mapeamento atualizado" : "Mapeamento adicionado",
        description: editingMapping 
          ? "O mapeamento de produto foi atualizado com sucesso." 
          : "Um novo mapeamento de produto foi adicionado.",
      });
    } catch (error) {
      console.error('Erro ao salvar mapeamento:', error);
      toast({
        title: "Erro ao salvar mapeamento",
        description: "Não foi possível salvar o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  // Função para alternar o status de um mapeamento (ativo/inativo)
  const handleToggleMappingStatus = async (mapping: ProductMapping) => {
    try {
      const response = await fetch(`/api/integrations/hotmart/product-mappings/${mapping.id}/toggle-status`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao alterar status');
      }
      
      // Atualizar a lista de mapeamentos
      await fetchProductMappings();
      
      toast({
        title: "Status alterado",
        description: `O mapeamento para "${mapping.productName}" foi ${mapping.isActive ? 'desativado' : 'ativado'}.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do mapeamento.",
        variant: "destructive",
      });
    }
  };

  // Função para excluir um mapeamento
  const handleDeleteMapping = async (mapping: ProductMapping) => {
    if (!window.confirm(`Tem certeza que deseja excluir o mapeamento para "${mapping.productName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/integrations/hotmart/product-mappings/${mapping.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao excluir mapeamento');
      }
      
      // Atualizar a lista de mapeamentos
      await fetchProductMappings();
      
      toast({
        title: "Mapeamento excluído",
        description: `O mapeamento para "${mapping.productName}" foi excluído com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao excluir mapeamento:', error);
      toast({
        title: "Erro ao excluir mapeamento",
        description: "Não foi possível excluir o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };
  
  // Carrega o status de conexão do localStorage ao inicializar
  useEffect(() => {
    const savedStatus = localStorage.getItem('hotmartLastConnectionStatus');
    if (savedStatus) {
      try {
        const parsed = JSON.parse(savedStatus);
        setLastConnectionStatus({
          ...parsed,
          timestamp: new Date(parsed.timestamp)
        });
      } catch (error) {
        console.error('Erro ao carregar status de conexão do localStorage:', error);
      }
    }
  }, []);
  
  // Carrega os mapeamentos de produtos quando a aba de integrações é selecionada
  useEffect(() => {
    if (activeTab === "configIntegracoes") {
      fetchProductMappings();
    }
  }, [activeTab, fetchProductMappings]);
  
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
  
  // Estados para configurações das integrações
  const [isHotmartSecretDialogOpen, setIsHotmartSecretDialogOpen] = useState(false);
  const [isHotmartClientIdDialogOpen, setIsHotmartClientIdDialogOpen] = useState(false);
  
  // Estados para mapeamento de produtos Hotmart
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [showProductMappingDialog, setShowProductMappingDialog] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProductMapping | null>(null);
  const [mappingFormData, setMappingFormData] = useState({
    productName: '',
    planType: 'premium',
    durationDays: 30,
    isLifetime: false
  });
  const [isHotmartClientSecretDialogOpen, setIsHotmartClientSecretDialogOpen] = useState(false);
  const [isDoppusSecretDialogOpen, setIsDoppusSecretDialogOpen] = useState(false);
  const [isDoppusApiKeyDialogOpen, setIsDoppusApiKeyDialogOpen] = useState(false);
  
  // Estados para mostrar/ocultar as chaves salvas
  const [showHotmartSecret, setShowHotmartSecret] = useState(false);
  const [showHotmartClientId, setShowHotmartClientId] = useState(false);
  const [showHotmartClientSecret, setShowHotmartClientSecret] = useState(false);
  const [showDoppusSecret, setShowDoppusSecret] = useState(false);
  const [showDoppusApiKey, setShowDoppusApiKey] = useState(false);
  
  // Estado para controlar o ambiente da Hotmart (sandbox/produção)
  const [isHotmartSandbox, setIsHotmartSandbox] = useState(true);
  
  const [hotmartSecretInput, setHotmartSecretInput] = useState('');
  const [hotmartClientIdInput, setHotmartClientIdInput] = useState('');
  const [hotmartClientSecretInput, setHotmartClientSecretInput] = useState('');
  const [doppusSecretInput, setDoppusSecretInput] = useState('');
  const [doppusApiKeyInput, setDoppusApiKeyInput] = useState('');
  
  // Estados para configuração de assinatura
  const [autoDowngrade, setAutoDowngrade] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationDays, setNotificationDays] = useState<string[]>(['7', '3', '1']);
  const [gracePeriod, setGracePeriod] = useState('3');
  
  // Estado para configurações de integração
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings | null>(null);
  
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
  
  // Mutações para atualizar chaves de integração
  const updateHotmartSecretMutation = useMutation({
    mutationFn: async (newSecret: string) => {
      const response = await apiRequest('POST', '/api/integrations/hotmart/secret', { secret: newSecret });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Chave atualizada",
        description: "A chave secreta da Hotmart foi atualizada com sucesso.",
      });
      
      // Atualizar o estado local se a resposta contiver o valor atualizado
      if (data.updatedValue && integrationSettings?.hotmart) {
        // Atualiza diretamente o valor no estado
        setIntegrationSettings((prev) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            hotmart: {
              ...prev.hotmart,
              secret: data.updatedValue
            }
          };
        });
      }
      
      setIsHotmartSecretDialogOpen(false);
      setHotmartSecretInput('');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar chave",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateHotmartClientIdMutation = useMutation({
    mutationFn: async (newClientId: string) => {
      const response = await apiRequest('POST', '/api/integrations/hotmart/client-id', { clientId: newClientId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Client ID atualizado",
        description: "O Client ID da Hotmart foi atualizado com sucesso.",
      });
      
      // Atualizar o estado local com o valor retornado da API
      if (data.updatedValue && integrationSettings?.hotmart) {
        setIntegrationSettings((prev) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            hotmart: {
              ...prev.hotmart,
              clientId: data.updatedValue
            }
          };
        });
      }
      
      setIsHotmartClientIdDialogOpen(false);
      setHotmartClientIdInput('');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar Client ID",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateHotmartClientSecretMutation = useMutation({
    mutationFn: async (newClientSecret: string) => {
      const response = await apiRequest('POST', '/api/integrations/hotmart/client-secret', { clientSecret: newClientSecret });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Client Secret atualizado",
        description: "O Client Secret da Hotmart foi atualizado com sucesso.",
      });
      
      // Atualizar o estado local com o valor retornado da API
      if (data.updatedValue && integrationSettings?.hotmart) {
        setIntegrationSettings((prev) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            hotmart: {
              ...prev.hotmart,
              clientSecret: data.updatedValue
            }
          };
        });
      }
      
      setIsHotmartClientSecretDialogOpen(false);
      setHotmartClientSecretInput('');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar Client Secret",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateDoppusSecretMutation = useMutation({
    mutationFn: async (newSecret: string) => {
      const response = await apiRequest('POST', '/api/integrations/doppus/secret', { secret: newSecret });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Chave atualizada",
        description: "A chave secreta da Doppus foi atualizada com sucesso.",
      });
      
      // Atualizar o estado local com o valor retornado da API
      if (data.updatedValue && integrationSettings?.doppus) {
        setIntegrationSettings((prev) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            doppus: {
              ...prev.doppus,
              secret: data.updatedValue
            }
          };
        });
      }
      
      setIsDoppusSecretDialogOpen(false);
      setDoppusSecretInput('');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar chave",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateDoppusApiKeyMutation = useMutation({
    mutationFn: async (newApiKey: string) => {
      const response = await apiRequest('POST', '/api/integrations/doppus/apikey', { apiKey: newApiKey });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "API Key atualizada",
        description: "A API Key da Doppus foi atualizada com sucesso.",
      });
      
      // Atualizar o estado local com o valor retornado da API
      if (data.updatedValue && integrationSettings?.doppus) {
        setIntegrationSettings((prev) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            doppus: {
              ...prev.doppus,
              apiKey: data.updatedValue
            }
          };
        });
      }
      
      setIsDoppusApiKeyDialogOpen(false);
      setDoppusApiKeyInput('');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar API Key",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para alternar o ambiente da Hotmart (sandbox/produção)
  const toggleHotmartEnvironmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/integrations/hotmart/toggle-environment', {});
      return response.json();
    },
    onSuccess: (data) => {
      // Atualizar o estado local com o novo valor
      const newEnvironment = data.updatedValue.value === 'true' ? 'Sandbox' : 'Produção';
      
      toast({
        title: "Ambiente atualizado",
        description: `O ambiente da Hotmart foi alterado para ${newEnvironment}.`,
      });
      
      // Atualizar o estado local
      setIsHotmartSandbox(data.updatedValue.value === 'true');
      
      // Atualizar estado das configurações
      if (data.updatedValue && integrationSettings?.hotmart) {
        setIntegrationSettings((prev) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            hotmart: {
              ...prev.hotmart,
              useSandbox: data.updatedValue
            }
          };
        });
      }
      
      // Invalida a consulta para atualizar dados de integração
      queryClient.invalidateQueries({
        queryKey: ['/api/integrations/settings']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alternar ambiente",
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
  
  // Consulta para obter configurações de integração
  const {
    data: integrationData,
    isLoading: isIntegrationsLoading,
    isError: isIntegrationsError,
    error: integrationsError
  } = useQuery<IntegrationSettings>({
    queryKey: ['/api/integrations/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations/settings');
      return response.json();
    }
  });
  
  // Efeito para atualizar o estado quando os dados de integração mudarem
  useEffect(() => {
    if (integrationData) {
      setIntegrationSettings(integrationData);
      
      // Atualizar o estado do ambiente Sandbox baseado nos dados retornados
      if (integrationData.hotmart?.useSandbox) {
        setIsHotmartSandbox(integrationData.hotmart.useSandbox.value === 'true');
      }
    }
  }, [integrationData]);
  
  // Efeito para mostrar erro de integração
  useEffect(() => {
    if (isIntegrationsError && integrationsError instanceof Error) {
      toast({
        title: "Erro ao carregar configurações de integração",
        description: integrationsError.message,
        variant: "destructive",
      });
    }
  }, [isIntegrationsError, integrationsError, toast]);
  
  // Consulta para usuários com filtragem avançada
  const {
    data: usersData,
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
      <Tabs 
        defaultValue="visaoGeral" 
        className="w-full"
        onValueChange={(value) => {
          if (value === "configIntegracoes") {
            setActiveTab("integrations");
            fetchProductMappings();
          } else if (value === "webhooks") {
            setActiveTab("webhooks");
          } else if (value === "assinaturas") {
            setActiveTab("subscriptions");
          } else {
            setActiveTab("overview");
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="visaoGeral">Visão Geral</TabsTrigger>
          <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="configIntegracoes">Integrações</TabsTrigger>
        </TabsList>
        
        {/* Aba de Visão Geral */}
        <TabsContent value="visaoGeral" className="space-y-6">
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
              
              {/* Indicadores financeiros */}
              <h3 className="text-lg font-semibold mb-3 mt-6">Indicadores Financeiros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Mensal (MRR)</CardTitle>
                    <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                      ) : (
                        `R$ ${(subscriptionStats?.mrr || 0).toLocaleString('pt-BR')}`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Receita mensal recorrente
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        `R$ ${(subscriptionStats?.averageValue || 0).toLocaleString('pt-BR')}`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor médio por assinatura
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projeção Anual</CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                      ) : (
                        `R$ ${(subscriptionStats?.annualRevenue || 0).toLocaleString('pt-BR')}`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Projeção de receita anual
                    </p>
                  </CardContent>
                </Card>
                
                {/* Segunda linha de métricas financeiras */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        `${(subscriptionStats?.churnRate || 0).toFixed(1)}%`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Taxa de cancelamento
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Retenção Média</CardTitle>
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        `${subscriptionStats?.averageRetention || 0} dias`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tempo médio de permanência
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor do Cliente (LTV)</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                      ) : (
                        `R$ ${(subscriptionStats?.averageLTV || 0).toLocaleString('pt-BR')}`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor médio ao longo da vida
                    </p>
                  </CardContent>
                </Card>
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
        <TabsContent value="assinaturas" className="space-y-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-lg font-semibold">Lista de Assinantes</h3>
              
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <Button 
                  variant={showAdvancedFilters || planFilter !== 'all' || dateFilter !== 'all' ? "default" : "outline"}
                  size="sm" 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-1"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros Avançados
                  {(planFilter !== 'all' || dateFilter !== 'all') && (
                    <Badge variant="secondary" className="ml-1 font-normal text-xs">
                      {(planFilter !== 'all' && dateFilter !== 'all') ? '2' :
                       (planFilter !== 'all' || dateFilter !== 'all') ? '1' : ''}
                    </Badge>
                  )}
                  {showAdvancedFilters ? (
                    <ChevronLeft className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setExportFormat('csv');
                      setShowExportDialog(true);
                    }}>
                      Exportar como CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setExportFormat('excel');
                      setShowExportDialog(true);
                    }}>
                      Exportar como Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status: Todos</SelectItem>
                    <SelectItem value="active">Status: Ativos</SelectItem>
                    <SelectItem value="expired">Status: Expirados</SelectItem>
                    <SelectItem value="trial">Status: Em teste</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={originFilter}
                  onValueChange={setOriginFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Origem: Todas</SelectItem>
                    <SelectItem value="hotmart">Origem: Hotmart</SelectItem>
                    <SelectItem value="doppus">Origem: Doppus</SelectItem>
                    <SelectItem value="manual">Origem: Manual</SelectItem>
                  </SelectContent>
                </Select>
                
                {showAdvancedFilters && (
                  <>
                    <Select
                      value={planFilter}
                      onValueChange={setPlanFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Plano: Todos</SelectItem>
                        <SelectItem value="mensal">Plano: Mensal</SelectItem>
                        <SelectItem value="trimestral">Plano: Trimestral</SelectItem>
                        <SelectItem value="anual">Plano: Anual</SelectItem>
                        <SelectItem value="vitalicio">Plano: Vitalício</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={dateFilter}
                      onValueChange={setDateFilter}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Período de assinatura" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Período: Qualquer data</SelectItem>
                        <SelectItem value="today">Período: Hoje</SelectItem>
                        <SelectItem value="last7days">Período: Últimos 7 dias</SelectItem>
                        <SelectItem value="last30days">Período: Últimos 30 dias</SelectItem>
                        <SelectItem value="thisMonth">Período: Este mês</SelectItem>
                        <SelectItem value="lastMonth">Período: Mês passado</SelectItem>
                        <SelectItem value="custom">Período: Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {dateFilter === 'custom' && (
                      <div className="flex items-center gap-2">
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {fromDate && toDate ? 
                                `${format(fromDate, 'dd/MM/yyyy')} até ${format(toDate, 'dd/MM/yyyy')}` : 
                                fromDate ? 
                                  `A partir de ${format(fromDate, 'dd/MM/yyyy')}` : 
                                  toDate ? 
                                    `Até ${format(toDate, 'dd/MM/yyyy')}` : 
                                    'Selecionar período'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-4 w-auto" align="start">
                            <div className="space-y-4">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="from">De</Label>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 px-2"
                                    onClick={() => setFromDate(undefined)}
                                    disabled={!fromDate}
                                  >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>
                                <CalendarComponent
                                  mode="single"
                                  selected={fromDate}
                                  onSelect={setFromDate}
                                  disabled={(date) => toDate ? date > toDate : false}
                                  initialFocus
                                />
                              </div>
                              
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="to">Até</Label>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 px-2"
                                    onClick={() => setToDate(undefined)}
                                    disabled={!toDate}
                                  >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>
                                <CalendarComponent
                                  mode="single"
                                  selected={toDate}
                                  onSelect={setToDate}
                                  disabled={(date) => fromDate ? date < fromDate : false}
                                  initialFocus
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setFromDate(undefined);
                                    setToDate(undefined);
                                    setIsCalendarOpen(false);
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => setIsCalendarOpen(false)}
                                  disabled={!fromDate && !toDate}
                                >
                                  Aplicar
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="relative flex-1">
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
            
            {showAdvancedFilters && (
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">
                  Filtros ativos: {
                    [
                      statusFilter !== 'all' && `Status: ${statusFilter}`,
                      originFilter !== 'all' && `Origem: ${originFilter}`,
                      planFilter !== 'all' && `Plano: ${planFilter}`,
                      dateFilter !== 'all' && `Período: ${dateFilter}`,
                      searchTerm && `Busca: "${searchTerm}"`
                    ].filter(Boolean).join(', ') || 'Nenhum'
                  }
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setOriginFilter('all');
                    setPlanFilter('all');
                    setDateFilter('all');
                    setFromDate(undefined);
                    setToDate(undefined);
                    setSearchTerm('');
                  }}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
              </div>
            )}
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
        
        {/* Aba de Webhooks e Configurações */}
        <TabsContent value="webhooks" className="space-y-6">
          <WebhookList key="subscription-webhooks" />
        </TabsContent>
        
        {/* Nova aba de Configurações de Integrações (Hotmart e Doppus) */}
        <TabsContent value="configIntegracoes" className="space-y-6">
          <Tabs defaultValue="hotmart" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="hotmart">Hotmart</TabsTrigger>
              <TabsTrigger value="doppus">Doppus</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hotmart" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações da Hotmart</CardTitle>
                  <CardDescription>Configure as integrações com a plataforma Hotmart</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Toggle de ambiente Sandbox/Produção para Hotmart */}
                  <div className="space-y-2 border p-4 rounded-md bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">Ambiente da API</h3>
                        <p className="text-sm text-muted-foreground">Determina qual ambiente da API da Hotmart será utilizado</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={isHotmartSandbox}
                          onCheckedChange={() => {
                            toggleHotmartEnvironmentMutation.mutate();
                          }}
                          disabled={toggleHotmartEnvironmentMutation.isPending}
                        />
                        <span className="text-sm font-medium">
                          {isHotmartSandbox ? 'Sandbox' : 'Produção'}
                        </span>
                        {toggleHotmartEnvironmentMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isHotmartSandbox 
                        ? 'Sandbox: Ambiente de testes da Hotmart. As transações não são reais.' 
                        : 'Produção: Ambiente real da Hotmart. As transações são reais e processadas.'}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="hotmartWebhookUrl">URL do Webhook</Label>
                      <div className="flex mt-1.5">
                        <Input 
                          id="hotmartWebhookUrl" 
                          placeholder="https://seusite.com.br/api/webhooks/hotmart" 
                          value="https://designauto.com.br/webhook/hotmart"
                          readOnly
                          className="flex-1 rounded-r-none bg-muted"
                        />
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="rounded-l-none"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://designauto.com.br/webhook/hotmart`);
                            toast({
                              title: "URL copiada!",
                              description: "URL do webhook copiada para a área de transferência.",
                              duration: 3000,
                            });
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Cole esta URL nas configurações de webhook da sua conta Hotmart.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="hotmartSecretKey">Chave Secreta (Hotmart Secret)</Label>
                      <div className="flex mt-1.5">
                        <Input 
                          id="hotmartSecretKey" 
                          type={showHotmartSecret ? "text" : "password"}
                          placeholder="Insira a chave secreta da Hotmart" 
                          value={integrationSettings?.hotmart?.secret?.isDefined ? 
                                 (showHotmartSecret ? integrationSettings?.hotmart?.secret?.realValue || "" : "●●●●●●●●●●●●●●●●") : 
                                 ""}
                          readOnly
                          className="flex-1 rounded-r-none bg-muted"
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          className="px-3 border-r-0 rounded-none"
                          onClick={() => setShowHotmartSecret(!showHotmartSecret)}
                        >
                          {showHotmartSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="rounded-l-none"
                          onClick={() => setIsHotmartSecretDialogOpen(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Esta chave é usada para verificar a autenticidade das notificações recebidas da Hotmart.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="hotmartClientId">Client ID</Label>
                      <div className="flex mt-1.5">
                        <Input 
                          id="hotmartClientId" 
                          type={showHotmartClientId ? "text" : "password"} 
                          placeholder="Insira o Client ID da API Hotmart" 
                          value={integrationSettings?.hotmart?.clientId?.isDefined ? 
                                 (showHotmartClientId ? integrationSettings?.hotmart?.clientId?.realValue || "" : "●●●●●●●●●●●●●●●●") : 
                                 ""}
                          readOnly
                          className="flex-1 rounded-r-none bg-muted"
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          className="px-3 border-r-0 rounded-none"
                          onClick={() => setShowHotmartClientId(!showHotmartClientId)}
                        >
                          {showHotmartClientId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="rounded-l-none"
                          onClick={() => setIsHotmartClientIdDialogOpen(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Necessário para a API da Hotmart. Obtenha estas credenciais no painel Hotmart Developers.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="hotmartClientSecret">Client Secret</Label>
                      <div className="flex mt-1.5">
                        <Input 
                          id="hotmartClientSecret" 
                          type={showHotmartClientSecret ? "text" : "password"}
                          placeholder="Insira o Client Secret da API Hotmart" 
                          value={integrationSettings?.hotmart?.clientSecret?.isDefined ? 
                                 (showHotmartClientSecret ? integrationSettings?.hotmart?.clientSecret?.realValue || "" : "●●●●●●●●●●●●●●●●") : 
                                 ""}
                          readOnly
                          className="flex-1 rounded-r-none bg-muted"
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          className="px-3 border-r-0 rounded-none"
                          onClick={() => setShowHotmartClientSecret(!showHotmartClientSecret)}
                        >
                          {showHotmartClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="rounded-l-none"
                          onClick={() => setIsHotmartClientSecretDialogOpen(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Necessário para a API da Hotmart. Mantenha esta informação confidencial.
                      </p>
                    </div>

                    <div className="pt-4 space-y-3">
                      {/* Status da Conexão */}
                      {lastConnectionStatus && (
                        <div className={`text-sm p-2 rounded-md flex items-start ${lastConnectionStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {lastConnectionStatus.success ? (
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium">
                              {lastConnectionStatus.success ? 'Conexão bem-sucedida' : 'Falha na conexão'}
                            </div>
                            <div className="text-xs mt-1 opacity-80">
                              Última verificação: {lastConnectionStatus.timestamp.toLocaleString('pt-BR')}
                            </div>
                            {!lastConnectionStatus.success && lastConnectionStatus.message && (
                              <div className="text-xs mt-1">
                                Motivo: {lastConnectionStatus.message}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto"
                        onClick={() => {
                          toast({
                            title: "Testando conexão...",
                            description: "Verificando conexão com a API da Hotmart"
                          });
                          
                          // Testar conexão com a API Hotmart
                          fetch('/api/integrations/hotmart/test-connection')
                            .then(response => response.json())
                            .then(data => {
                              // Salvar resultado da conexão
                              setLastConnectionStatus({
                                success: data.success,
                                message: data.message || (data.success ? undefined : "Erro não especificado"),
                                timestamp: new Date()
                              });
                              
                              if (data.success) {
                                toast({
                                  title: "Conexão bem-sucedida!",
                                  description: "A conexão com a API da Hotmart está funcionando corretamente.",
                                  variant: "default",
                                });
                                
                                // Salvar no localStorage para persistir entre sessões
                                localStorage.setItem('hotmartLastConnectionStatus', JSON.stringify({
                                  success: true,
                                  message: data.message,
                                  timestamp: new Date().toISOString()
                                }));
                              } else {
                                toast({
                                  title: "Erro na conexão",
                                  description: data.message || "Não foi possível conectar à API da Hotmart. Verifique as credenciais.",
                                  variant: "destructive",
                                });
                                
                                // Salvar no localStorage para persistir entre sessões
                                localStorage.setItem('hotmartLastConnectionStatus', JSON.stringify({
                                  success: false,
                                  message: data.message || "Não foi possível conectar à API da Hotmart",
                                  timestamp: new Date().toISOString()
                                }));
                              }
                            })
                            .catch(error => {
                              // Atualizar status da conexão em caso de erro
                              setLastConnectionStatus({
                                success: false,
                                message: "Erro de rede ao conectar com a API",
                                timestamp: new Date()
                              });
                              
                              toast({
                                title: "Erro na conexão",
                                description: "Ocorreu um erro ao tentar conectar com a API da Hotmart. Verifique o console para mais detalhes.",
                                variant: "destructive",
                              });
                              console.error("Erro ao testar conexão com Hotmart:", error);
                              
                              // Salvar no localStorage para persistir entre sessões
                              localStorage.setItem('hotmartLastConnectionStatus', JSON.stringify({
                                success: false,
                                message: "Erro de rede ao conectar com a API",
                                timestamp: new Date().toISOString()
                              }));
                            });
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar Conexão com Hotmart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mapeamento de Produtos Hotmart</CardTitle>
                  <CardDescription>Configure como os produtos da Hotmart são mapeados no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground max-w-prose">
                          Configure como os produtos da Hotmart serão convertidos em assinaturas no DesignAuto.
                          O sistema utilizará estes mapeamentos ao processar notificações de compra.
                        </p>
                      </div>
                      <Button onClick={openAddMappingDialog} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar mapeamento
                      </Button>
                    </div>
                    
                    {isLoadingMappings ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : productMappings.length === 0 ? (
                      <div className="bg-muted/50 border rounded-md p-6 text-center">
                        <div className="text-muted-foreground mb-2">
                          Nenhum mapeamento configurado
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Adicione mapeamentos para que o sistema saiba como converter as compras da Hotmart em assinaturas.
                        </p>
                        <Button onClick={openAddMappingDialog} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Configurar Mapeamento
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Produto Hotmart</TableHead>
                              <TableHead>Plano no DesignAuto</TableHead>
                              <TableHead>Duração</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productMappings.map((mapping) => (
                              <TableRow key={mapping.id}>
                                <TableCell className="font-medium">
                                  {mapping.productName}
                                </TableCell>
                                <TableCell>
                                  {mapping.planType.charAt(0).toUpperCase() + mapping.planType.slice(1)}
                                </TableCell>
                                <TableCell>
                                  {mapping.isLifetime ? (
                                    <Badge variant="secondary">Vitalício</Badge>
                                  ) : (
                                    `${mapping.durationDays} dias`
                                  )}
                                </TableCell>
                                <TableCell>
                                  {mapping.isActive ? (
                                    <Badge className="bg-green-500">Ativo</Badge>
                                  ) : (
                                    <Badge variant="outline">Inativo</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditMappingDialog(mapping)}
                                      title="Editar"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleMappingStatus(mapping)}
                                      title={mapping.isActive ? "Desativar" : "Ativar"}
                                    >
                                      {mapping.isActive ? (
                                        <XCircle className="h-4 w-4 text-destructive" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteMapping(mapping)}
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="doppus" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações da Doppus</CardTitle>
                  <CardDescription>Configure as integrações com a plataforma Doppus</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="doppusWebhookUrl">URL do Webhook</Label>
                      <div className="flex mt-1.5">
                        <Input 
                          id="doppusWebhookUrl" 
                          placeholder="https://seusite.com.br/api/webhooks/doppus" 
                          value="https://designauto.com.br/webhook/doppus"
                          readOnly
                          className="flex-1 rounded-r-none bg-muted"
                        />
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="rounded-l-none"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://designauto.com.br/webhook/doppus`);
                            toast({
                              title: "URL copiada!",
                              description: "URL do webhook copiada para a área de transferência.",
                              duration: 3000,
                            });
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Cole esta URL nas configurações de webhook da sua conta Doppus.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="doppusSecretKey">Chave Secreta (Doppus Secret)</Label>
                      <div className="flex mt-1.5">
                        <Input 
                          id="doppusSecretKey" 
                          type={showDoppusSecret ? "text" : "password"}
                          placeholder="Insira a chave secreta da Doppus" 
                          value={integrationSettings?.doppus?.secret?.isDefined ? 
                                 (showDoppusSecret ? integrationSettings?.doppus?.secret?.realValue || "" : "●●●●●●●●●●●●●●●●") : 
                                 ""}
                          readOnly
                          className="flex-1 rounded-r-none bg-muted"
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          className="px-3 border-r-0 rounded-none"
                          onClick={() => setShowDoppusSecret(!showDoppusSecret)}
                        >
                          {showDoppusSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="rounded-l-none"
                          onClick={() => setIsDoppusSecretDialogOpen(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Esta chave é usada para verificar a autenticidade das notificações recebidas da Doppus.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="doppusApiKey">API Key</Label>
                      <div className="flex mt-1.5">
                        <Input 
                          id="doppusApiKey" 
                          type={showDoppusApiKey ? "text" : "password"}
                          placeholder="Insira a API Key da Doppus" 
                          value={integrationSettings?.doppus?.apiKey?.isDefined ? 
                                 (showDoppusApiKey ? integrationSettings?.doppus?.apiKey?.realValue || "" : "●●●●●●●●●●●●●●●●") : 
                                 ""}
                          readOnly
                          className="flex-1 rounded-r-none bg-muted"
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          className="px-3 border-r-0 rounded-none"
                          onClick={() => setShowDoppusApiKey(!showDoppusApiKey)}
                        >
                          {showDoppusApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="rounded-l-none"
                          onClick={() => setIsDoppusApiKeyDialogOpen(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Necessário para acessar a API da Doppus.
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar Conexão com Doppus
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mapeamento de Produtos Doppus</CardTitle>
                  <CardDescription>Configure como os produtos da Doppus são mapeados no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Produto Doppus</TableHead>
                            <TableHead>Plano no DesignAuto</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-muted-foreground italic">Nenhum produto configurado</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Mapeamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
      
      {/* Diálogo de Exportação */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Exportar Assinantes</DialogTitle>
            <DialogDescription>
              Selecione os campos que deseja incluir na exportação. Os filtros atualmente aplicados serão considerados.
            </DialogDescription>
          </DialogHeader>
          
          {/* Resumo dos filtros */}
          <div className="bg-muted p-3 rounded-md text-sm mt-2">
            <p className="font-medium mb-2">Filtros aplicados:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold">Status</Badge>
                <span className={statusFilter !== 'all' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {statusFilter === 'all' ? 'Todos' : 
                  statusFilter === 'active' ? 'Ativos' : 
                  statusFilter === 'expired' ? 'Expirados' : 'Em teste'}
                </span>
              </li>
              
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold">Origem</Badge>
                <span className={originFilter !== 'all' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {originFilter === 'all' ? 'Todas' : 
                  originFilter === 'hotmart' ? 'Hotmart' : 
                  originFilter === 'doppus' ? 'Doppus' : 'Manual'}
                </span>
              </li>
              
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold">Plano</Badge>
                <span className={planFilter !== 'all' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {planFilter === 'all' ? 'Todos' : 
                  planFilter === 'mensal' ? 'Mensal' : 
                  planFilter === 'trimestral' ? 'Trimestral' : 
                  planFilter === 'anual' ? 'Anual' : 'Vitalício'}
                </span>
              </li>
              
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold">Período</Badge>
                <span className={dateFilter !== 'all' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {dateFilter === 'all' ? 'Qualquer data' :
                  dateFilter === 'today' ? 'Hoje' :
                  dateFilter === 'last7days' ? 'Últimos 7 dias' :
                  dateFilter === 'last30days' ? 'Últimos 30 dias' :
                  dateFilter === 'thisMonth' ? 'Este mês' :
                  dateFilter === 'lastMonth' ? 'Mês passado' :
                  dateFilter === 'custom' ? (fromDate && toDate ? 
                    `${format(fromDate, 'dd/MM/yyyy')} até ${format(toDate, 'dd/MM/yyyy')}` : 
                    fromDate ? `A partir de ${format(fromDate, 'dd/MM/yyyy')}` : 
                    toDate ? `Até ${format(toDate, 'dd/MM/yyyy')}` : 'Personalizado') :
                  'Qualquer data'}
                </span>
              </li>
              
              {searchTerm && (
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="font-semibold">Busca</Badge> 
                  <span className="text-primary font-medium">"{searchTerm}"</span>
                </li>
              )}
            </ul>
            
            {/* Contador de registros a serem exportados */}
            <div className="mt-4 pt-3 border-t border-border text-center">
              <p className="text-sm flex items-center justify-center gap-2">
                <Badge variant="secondary" className="px-2 py-1">
                  {(() => {
                    // Calcular a quantidade de registros após aplicar os filtros
                    const count = usersData?.users?.filter((user) => {
                      // Status
                      if (statusFilter !== 'all') {
                        if (statusFilter === 'active' && user.planstatus !== 'active') return false;
                        if (statusFilter === 'expired' && user.planstatus !== 'expired') return false;
                        if (statusFilter === 'trial' && user.planstatus !== 'trial') return false;
                      }
                      
                      // Origem
                      if (originFilter !== 'all') {
                        const userOrigin = user.origemassinatura?.toLowerCase() || '';
                        if (originFilter === 'hotmart' && userOrigin !== 'hotmart') return false;
                        if (originFilter === 'doppus' && userOrigin !== 'doppus') return false;
                        if (originFilter === 'manual' && userOrigin !== 'manual') return false;
                      }
                      
                      // Plano
                      if (planFilter !== 'all') {
                        const userPlan = user.tipoplano?.toLowerCase() || '';
                        if (planFilter === 'mensal' && userPlan !== 'mensal') return false;
                        if (planFilter === 'trimestral' && userPlan !== 'trimestral') return false;
                        if (planFilter === 'anual' && userPlan !== 'anual') return false;
                        if (planFilter === 'vitalicio' && userPlan !== 'vitalicio') return false;
                      }
                      
                      // Data
                      if (dateFilter !== 'all' && !applyDateFilter(user)) return false;
                      
                      // Busca
                      if (searchTerm) {
                        const termLower = searchTerm.toLowerCase();
                        const nameMatch = user.name?.toLowerCase().includes(termLower) || false;
                        const usernameMatch = user.username.toLowerCase().includes(termLower);
                        const emailMatch = user.email.toLowerCase().includes(termLower);
                        
                        if (!nameMatch && !usernameMatch && !emailMatch) return false;
                      }
                      
                      return true;
                    }).length || 0;
                    return count;
                  })()}
                </Badge>
                <span>registros serão exportados com os filtros selecionados</span>
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportFields.includes('username')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportFields([...exportFields, 'username']);
                    } else {
                      setExportFields(exportFields.filter(f => f !== 'username'));
                    }
                  }}
                />
                Nome de Usuário
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportFields.includes('email')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportFields([...exportFields, 'email']);
                    } else {
                      setExportFields(exportFields.filter(f => f !== 'email'));
                    }
                  }}
                />
                E-mail
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportFields.includes('name')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportFields([...exportFields, 'name']);
                    } else {
                      setExportFields(exportFields.filter(f => f !== 'name'));
                    }
                  }}
                />
                Nome Completo
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportFields.includes('origemassinatura')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportFields([...exportFields, 'origemassinatura']);
                    } else {
                      setExportFields(exportFields.filter(f => f !== 'origemassinatura'));
                    }
                  }}
                />
                Origem
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportFields.includes('tipoplano')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportFields([...exportFields, 'tipoplano']);
                    } else {
                      setExportFields(exportFields.filter(f => f !== 'tipoplano'));
                    }
                  }}
                />
                Plano
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportFields.includes('dataassinatura')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportFields([...exportFields, 'dataassinatura']);
                    } else {
                      setExportFields(exportFields.filter(f => f !== 'dataassinatura'));
                    }
                  }}
                />
                Data de Assinatura
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportFields.includes('dataexpiracao')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportFields([...exportFields, 'dataexpiracao']);
                    } else {
                      setExportFields(exportFields.filter(f => f !== 'dataexpiracao'));
                    }
                  }}
                />
                Data de Expiração
              </Label>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <div>
                <p className="text-sm font-medium mb-1">Formato de exportação</p>
                <Select
                  value={exportFormat}
                  onValueChange={setExportFormat}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="excel">Excel (.xls)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => setExportFields([
                  'username', 'email', 'name', 'origemassinatura', 'tipoplano', 'dataassinatura', 'dataexpiracao'
                ])}
              >
                Selecionar todos
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => exportData(usersData?.users || [])} disabled={exportFields.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para atualizar a chave secreta da Hotmart */}
      {/* Diálogo para adicionar/editar mapeamento de produto Hotmart */}
      <Dialog open={showProductMappingDialog} onOpenChange={setShowProductMappingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? 'Editar Mapeamento de Produto' : 'Adicionar Mapeamento de Produto'}
            </DialogTitle>
            <DialogDescription>
              {editingMapping 
                ? 'Atualize as configurações do mapeamento entre produto Hotmart e plano DesignAuto'
                : 'Configure como um produto da Hotmart será convertido em assinatura no DesignAuto'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="productName">Nome do Produto na Hotmart:</Label>
              <Input
                id="productName"
                name="productName"
                placeholder="Ex: DesignAuto Premium"
                value={mappingFormData.productName}
                onChange={handleMappingFormChange}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use exatamente o mesmo nome do produto que aparece na Hotmart
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="planType">Tipo de Plano no DesignAuto:</Label>
              <Select
                value={mappingFormData.planType}
                onValueChange={(value) => 
                  setMappingFormData({...mappingFormData, planType: value})
                }
              >
                <SelectTrigger id="planType">
                  <SelectValue placeholder="Selecione o tipo de plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Nível de acesso que será concedido ao assinante
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isLifetime" 
                  checked={mappingFormData.isLifetime}
                  onCheckedChange={(checked) => 
                    setMappingFormData({...mappingFormData, isLifetime: checked as boolean})
                  }
                />
                <Label htmlFor="isLifetime">
                  Plano Vitalício
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Se marcado, a assinatura nunca expirará
              </p>
            </div>
            
            {!mappingFormData.isLifetime && (
              <div className="space-y-2">
                <Label htmlFor="durationDays">Duração (em dias):</Label>
                <Input
                  id="durationDays"
                  name="durationDays"
                  type="number"
                  min={1}
                  placeholder="Ex: 30, 90, 365"
                  value={mappingFormData.durationDays}
                  onChange={handleMappingFormChange}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMappingFormData({...mappingFormData, durationDays: 30})}
                  >
                    1 mês
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMappingFormData({...mappingFormData, durationDays: 90})}
                  >
                    3 meses
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMappingFormData({...mappingFormData, durationDays: 180})}
                  >
                    6 meses
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMappingFormData({...mappingFormData, durationDays: 365})}
                  >
                    1 ano
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductMappingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitMapping}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isHotmartSecretDialogOpen} onOpenChange={setIsHotmartSecretDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Chave Secreta da Hotmart</DialogTitle>
            <DialogDescription>
              Insira a nova chave secreta para verificação dos webhooks da Hotmart.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="hotmartSecret">Chave Secreta (Hotmart Secret)</Label>
              <Input
                id="hotmartSecret"
                value={hotmartSecretInput}
                onChange={(e) => setHotmartSecretInput(e.target.value)}
                placeholder="Insira a chave secreta da Hotmart"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Esta chave é usada para verificar a autenticidade das notificações recebidas da Hotmart.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHotmartSecretDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => updateHotmartSecretMutation.mutate(hotmartSecretInput)}
              disabled={!hotmartSecretInput.trim() || updateHotmartSecretMutation.isPending}
              type="button"
            >
              {updateHotmartSecretMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para atualizar o Client ID da Hotmart */}
      <Dialog open={isHotmartClientIdDialogOpen} onOpenChange={setIsHotmartClientIdDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Client ID da Hotmart</DialogTitle>
            <DialogDescription>
              Insira o novo Client ID para usar a API da Hotmart.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="hotmartClientId">Client ID</Label>
              <Input
                id="hotmartClientId"
                value={hotmartClientIdInput}
                onChange={(e) => setHotmartClientIdInput(e.target.value)}
                placeholder="Insira o Client ID da API Hotmart"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                O Client ID é necessário para a API da Hotmart. Obtenha estas credenciais no painel Hotmart Developers.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHotmartClientIdDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => updateHotmartClientIdMutation.mutate(hotmartClientIdInput)}
              disabled={!hotmartClientIdInput.trim() || updateHotmartClientIdMutation.isPending}
              type="button"
            >
              {updateHotmartClientIdMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para atualizar o Client Secret da Hotmart */}
      <Dialog open={isHotmartClientSecretDialogOpen} onOpenChange={setIsHotmartClientSecretDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Client Secret da Hotmart</DialogTitle>
            <DialogDescription>
              Insira o novo Client Secret para usar a API da Hotmart.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="hotmartClientSecret">Client Secret</Label>
              <Input
                id="hotmartClientSecret"
                value={hotmartClientSecretInput}
                onChange={(e) => setHotmartClientSecretInput(e.target.value)}
                placeholder="Insira o Client Secret da API Hotmart"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                O Client Secret é necessário para a API da Hotmart. Mantenha esta informação confidencial.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHotmartClientSecretDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => updateHotmartClientSecretMutation.mutate(hotmartClientSecretInput)}
              disabled={!hotmartClientSecretInput.trim() || updateHotmartClientSecretMutation.isPending}
              type="button"
            >
              {updateHotmartClientSecretMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para atualizar a chave secreta da Doppus */}
      <Dialog open={isDoppusSecretDialogOpen} onOpenChange={setIsDoppusSecretDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Chave Secreta da Doppus</DialogTitle>
            <DialogDescription>
              Insira a nova chave secreta para verificação dos webhooks da Doppus.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="doppusSecret">Chave Secreta (Doppus Secret)</Label>
              <Input
                id="doppusSecret"
                value={doppusSecretInput}
                onChange={(e) => setDoppusSecretInput(e.target.value)}
                placeholder="Insira a chave secreta da Doppus"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Esta chave é usada para verificar a autenticidade das notificações recebidas da Doppus.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDoppusSecretDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => updateDoppusSecretMutation.mutate(doppusSecretInput)}
              disabled={!doppusSecretInput.trim() || updateDoppusSecretMutation.isPending}
              type="button"
            >
              {updateDoppusSecretMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para atualizar a API Key da Doppus */}
      <Dialog open={isDoppusApiKeyDialogOpen} onOpenChange={setIsDoppusApiKeyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar API Key da Doppus</DialogTitle>
            <DialogDescription>
              Insira a nova API Key para integração com a Doppus.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="doppusApiKey">API Key</Label>
              <Input
                id="doppusApiKey"
                value={doppusApiKeyInput}
                onChange={(e) => setDoppusApiKeyInput(e.target.value)}
                placeholder="Insira a API Key da Doppus"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Esta chave é utilizada para acessar a API da Doppus e obter informações de assinaturas.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDoppusApiKeyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => updateDoppusApiKeyMutation.mutate(doppusApiKeyInput)}
              disabled={!doppusApiKeyInput.trim() || updateDoppusApiKeyMutation.isPending}
              type="button"
            >
              {updateDoppusApiKeyMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  // Função para aplicar filtros de data
  function applyDateFilter(user: User) {
    if (dateFilter === 'all') return true;
    
    // Se não tiver data de assinatura, não passa no filtro de data
    if (!user.dataassinatura) return false;
    
    const assinatura = new Date(user.dataassinatura);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case 'today':
        return assinatura.toDateString() === today.toDateString();
      case 'last7days':
        const sevenDaysAgo = subDays(today, 7);
        return assinatura >= sevenDaysAgo;
      case 'last30days':
        const thirtyDaysAgo = subDays(today, 30);
        return assinatura >= thirtyDaysAgo;
      case 'thisMonth':
        return assinatura.getMonth() === today.getMonth() && 
               assinatura.getFullYear() === today.getFullYear();
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return assinatura.getMonth() === lastMonth.getMonth() && 
               assinatura.getFullYear() === lastMonth.getFullYear();
      case 'custom':
        if (!fromDate) return false;
        const fromDateStart = new Date(fromDate);
        fromDateStart.setHours(0, 0, 0, 0);
        
        if (!toDate) return assinatura >= fromDateStart;
        
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        
        return assinatura >= fromDateStart && assinatura <= toDateEnd;
      default:
        return true;
    }
  }
  
  // Função para exportar dados
  function exportData(users: User[]) {
    if (!users || users.length === 0) {
      toast({
        title: "Erro ao exportar",
        description: "Não há dados para exportar.",
        variant: "destructive"
      });
      return;
    }
    
    // Aplicar todos os filtros ativos aos dados antes de exportar
    const filteredData = users
      .filter(user => {
        // Aplicar filtro de status
        if (statusFilter !== 'all') {
          if (statusFilter === 'active' && user.planstatus !== 'active') return false;
          if (statusFilter === 'expired' && user.planstatus !== 'expired') return false;
          if (statusFilter === 'trial' && user.planstatus !== 'trial') return false;
        }
        
        // Aplicar filtro de origem
        if (originFilter !== 'all') {
          const userOrigin = user.origemassinatura?.toLowerCase() || '';
          if (originFilter === 'hotmart' && userOrigin !== 'hotmart') return false;
          if (originFilter === 'doppus' && userOrigin !== 'doppus') return false;
          if (originFilter === 'manual' && userOrigin !== 'manual') return false;
        }
        
        // Aplicar filtro de plano
        if (planFilter !== 'all') {
          const userPlan = user.tipoplano?.toLowerCase() || '';
          if (planFilter === 'mensal' && userPlan !== 'mensal') return false;
          if (planFilter === 'trimestral' && userPlan !== 'trimestral') return false;
          if (planFilter === 'anual' && userPlan !== 'anual') return false;
          if (planFilter === 'vitalicio' && userPlan !== 'vitalicio') return false;
        }
        
        // Aplicar filtro de data
        if (dateFilter !== 'all' && !applyDateFilter(user)) return false;
        
        // Aplicar filtro de busca
        if (searchTerm) {
          const termLower = searchTerm.toLowerCase();
          const nameMatch = user.name?.toLowerCase().includes(termLower) || false;
          const usernameMatch = user.username.toLowerCase().includes(termLower);
          const emailMatch = user.email.toLowerCase().includes(termLower);
          
          if (!nameMatch && !usernameMatch && !emailMatch) return false;
        }
        
        return true;
      })
      .map(user => {
        // Criar objeto apenas com os campos selecionados
        const userData: Record<string, any> = {};
        exportFields.forEach(field => {
          // Usar indexação para acessar propriedades de forma segura
          if (field === 'dataassinatura' || field === 'dataexpiracao') {
            const value = user[field as keyof User];
            userData[field] = value ? format(new Date(value as string), 'dd/MM/yyyy') : '';
          } else {
            // Mesmo padrão para outras propriedades
            const value = user[field as keyof User];
            userData[field] = value || '';
          }
        });
        return userData;
      });
    
    if (filteredData.length === 0) {
      toast({
        title: "Erro ao exportar",
        description: "Não há dados para exportar após aplicar os filtros.",
        variant: "destructive"
      });
      return;
    }
    
    // Converter para CSV/Excel
    if (exportFormat === 'csv') {
      // Gerar CSV
      const headers = exportFields.map(field => {
        // Mapear nomes de campos para nomes mais amigáveis
        const fieldNames: Record<string, string> = {
          username: 'Nome de Usuário',
          email: 'E-mail',
          name: 'Nome Completo',
          origemassinatura: 'Origem',
          tipoplano: 'Plano',
          dataassinatura: 'Data de Assinatura',
          dataexpiracao: 'Data de Expiração'
        };
        return fieldNames[field] || field;
      });
      
      let csv = headers.join(',') + '\n';
      
      filteredData.forEach(data => {
        const row = exportFields.map(field => {
          const value = data[field] || '';
          // Escapar valores com vírgulas
          return value.toString().includes(',') ? `"${value}"` : value;
        });
        csv += row.join(',') + '\n';
      });
      
      // Criar o download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `assinantes_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída",
        description: `${filteredData.length} registros exportados com sucesso.`,
        variant: "default"
      });
    } else {
      // Para Excel, usamos CSV mas com outra extensão, já que é suficiente para abrir no Excel
      const headers = exportFields.map(field => {
        // Mapear nomes de campos para nomes mais amigáveis
        const fieldNames: Record<string, string> = {
          username: 'Nome de Usuário',
          email: 'E-mail',
          name: 'Nome Completo',
          origemassinatura: 'Origem',
          tipoplano: 'Plano',
          dataassinatura: 'Data de Assinatura',
          dataexpiracao: 'Data de Expiração'
        };
        return fieldNames[field] || field;
      });
      
      let csv = headers.join('\t') + '\n';
      
      filteredData.forEach(data => {
        const row = exportFields.map(field => data[field] || '');
        csv += row.join('\t') + '\n';
      });
      
      // Criar o download
      const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `assinantes_${format(new Date(), 'dd-MM-yyyy')}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída",
        description: `${filteredData.length} registros exportados com sucesso.`,
        variant: "default"
      });
    }
    
    setShowExportDialog(false);
  }
  
  
}