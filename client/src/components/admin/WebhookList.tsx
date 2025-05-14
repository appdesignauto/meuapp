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
  RefreshCw,
  Search,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type WebhookLogStatus = 'success' | 'error' | 'pending';

interface WebhookLog {
  id: number;
  createdAt: string;
  updatedAt: string;
  eventType: string;
  payloadData: string;
  sourceIp: string;
  status: WebhookLogStatus;
  errorMessage: string | null;
  userId: number | null;
  retryCount: number;
}

interface WebhookLogDetail extends WebhookLog {
  user: {
    id: number;
    username: string;
    email: string;
    nivelAcesso: number;
    assinatura: {
      origem: string;
      tipo: string;
      status: string;
      dataExpiracao: string;
    }
  } | null;
}

const WebhookList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Consultar logs de webhook
  const {
    data: logsData,
    isLoading: isLoadingLogs,
    isError: isErrorLogs,
    error: logsError
  } = useQuery({
    queryKey: ['/api/admin/webhook-logs', page, limit, statusFilter, eventFilter, searchTerm],
    queryFn: async () => {
      // Montar parâmetros de consulta
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      
      if (eventFilter !== 'all') {
        queryParams.append('eventType', eventFilter);
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/admin/webhook-logs?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar logs de webhook');
      }
      
      return response.json();
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });
  
  // Consultar detalhes de um webhook específico
  const {
    data: logDetail,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: detailError
  } = useQuery({
    queryKey: ['/api/admin/webhook-logs/detail', selectedLog],
    queryFn: async () => {
      if (!selectedLog) return null;
      
      const response = await fetch(`/api/admin/webhook-logs/${selectedLog}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar detalhes do webhook');
      }
      
      return response.json();
    },
    enabled: selectedLog !== null,
    refetchOnWindowFocus: false
  });
  
  // Mutation para reprocessar webhook
  const retryWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/admin/webhook-logs/${id}/retry`);
      
      if (!response.ok) {
        throw new Error('Falha ao reprocessar webhook');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Atualizar dados na tela após o reprocessamento
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/webhook-logs']
      });
      
      if (selectedLog) {
        queryClient.invalidateQueries({
          queryKey: ['/api/admin/webhook-logs/detail', selectedLog]
        });
      }
      
      toast({
        title: data.success ? 'Webhook reprocessado com sucesso' : 'Falha ao reprocessar webhook',
        description: data.message,
        variant: data.success ? 'default' : 'destructive'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao reprocessar webhook',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Formatar data e hora para exibição
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Formatar o status com cores
  const getStatusBadge = (status: WebhookLogStatus) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sucesso</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Erro</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Visualizar detalhes do webhook
  const handleViewWebhook = (id: number) => {
    setSelectedLog(id);
    setIsViewDialogOpen(true);
  };
  
  // Reprocessar webhook
  const handleRetryWebhook = () => {
    if (selectedLog) {
      retryWebhookMutation.mutate(selectedLog);
    }
  };
  
  // Função para formatar o tipo de evento em um formato mais legível
  const formatEventType = (eventType: string) => {
    // Remover prefixos e sufixos comuns, substituir underscores por espaços
    return eventType
      .replace(/^PURCHASE_|SUBSCRIPTION_/g, '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Componente de guias para os detalhes do webhook
  const WebhookDetailTabs = ({ data }: { data: WebhookLogDetail }) => {
    const [activeTab, setActiveTab] = useState('info');
    
    return (
      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="payload">Payload</TabsTrigger>
          <TabsTrigger value="user">Usuário</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">ID</p>
              <p className="text-sm">{data.id}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Evento</p>
              <p className="text-sm">{data.eventType}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-sm">{getStatusBadge(data.status)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">IP de Origem</p>
              <p className="text-sm">{data.sourceIp}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Data de Recebimento</p>
              <p className="text-sm">{formatDateTime(data.createdAt)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Última Atualização</p>
              <p className="text-sm">{formatDateTime(data.updatedAt)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Tentativas</p>
              <p className="text-sm">{data.retryCount}</p>
            </div>
            {data.status === 'error' && data.errorMessage && (
              <div className="space-y-2 col-span-2">
                <p className="text-sm font-medium text-gray-500">Mensagem de Erro</p>
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {data.errorMessage}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="payload" className="space-y-4 mt-4">
          <div className="overflow-auto max-h-96 border rounded-md">
            <pre className="p-4 text-xs whitespace-pre-wrap bg-gray-50">
              {JSON.stringify(JSON.parse(typeof data.payloadData === 'string' ? data.payloadData : JSON.stringify(data.payloadData)), null, 2)}
            </pre>
          </div>
        </TabsContent>
        
        <TabsContent value="user" className="space-y-4 mt-4">
          {data.user ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">ID do Usuário</p>
                <p className="text-sm">{data.user.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Nome de Usuário</p>
                <p className="text-sm">{data.user.username}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm">{data.user.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Nível de Acesso</p>
                <p className="text-sm">{data.user.nivelAcesso}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Origem da Assinatura</p>
                <p className="text-sm">{data.user.assinatura.origem || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Tipo de Plano</p>
                <p className="text-sm">{data.user.assinatura.tipo || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Status do Plano</p>
                <p className="text-sm">{data.user.assinatura.status || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Data de Expiração</p>
                <p className="text-sm">
                  {data.user.assinatura.dataExpiracao 
                    ? formatDateTime(data.user.assinatura.dataExpiracao) 
                    : 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500">Nenhum usuário associado a este webhook.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  };
  
  if (isErrorLogs) {
    return (
      <div className="p-4 bg-red-50 rounded-md">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Erro ao carregar logs de webhook</p>
        </div>
        <p className="mt-2 text-sm text-red-600">
          {logsError instanceof Error ? logsError.message : 'Ocorreu um erro desconhecido'}
        </p>
      </div>
    );
  }
  
  // Extrair tipos de eventos únicos para o filtro
  const uniqueEventTypes = logsData?.logs 
    ? Array.from(new Set(logsData.logs.map((log: WebhookLog) => log.eventType)))
    : [];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-xl font-semibold">Logs de Webhooks</h2>
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
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={eventFilter}
              onValueChange={setEventFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {uniqueEventTypes.map((eventType: string) => (
                  <SelectItem key={eventType} value={eventType}>
                    {formatEventType(eventType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              className="pl-10 w-full"
              placeholder="Buscar por IP ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {isLoadingLogs ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <Table>
            <TableCaption>Lista de webhooks recebidos da plataforma Hotmart</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead className="min-w-[150px]">
                  <div className="flex items-center gap-1">
                    Data <Calendar className="w-4 h-4 ml-1" />
                  </div>
                </TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsData?.logs && logsData.logs.length > 0 ? (
                logsData.logs.map((log: WebhookLog) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {formatEventType(log.eventType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono">{log.sourceIp}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewWebhook(log.id)}
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-gray-500">
                    {logsData?.logs && logsData.logs.length === 0 
                      ? 'Nenhum registro de webhook encontrado' 
                      : 'Carregando...'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Paginação */}
          {logsData?.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Página {page} de {logsData.totalPages}
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
                  onClick={() => setPage(prev => Math.min(logsData.totalPages, prev + 1))}
                  disabled={page >= logsData.totalPages}
                >
                  Próxima <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Dialog para visualizar detalhes do webhook */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook #{selectedLog}</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a notificação de webhook recebida.
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
          ) : logDetail ? (
            <>
              <WebhookDetailTabs data={logDetail} />
              
              <DialogFooter className="gap-2">
                {/* Botão de reprocessar webhook, apenas mostrar para webhooks com erro */}
                {logDetail.log.status === 'error' && (
                  <Button 
                    variant="outline"
                    onClick={handleRetryWebhook}
                    disabled={retryWebhookMutation.isPending}
                  >
                    {retryWebhookMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reprocessando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reprocessar Webhook
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhookList;