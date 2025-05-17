import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { queryClient, apiRequest, getQueryFn } from '@/lib/queryClient';
import { Loader2, RefreshCw, Search, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importamos o componente de diagnóstico avançado
import WebhookDiagnosticsTab from './WebhookDiagnosticsNew';

// Interface para o log de webhook
interface WebhookLog {
  id: number;
  eventType: string;
  payloadData: string;
  status: 'received' | 'processed' | 'pending' | 'error';
  source: 'hotmart' | 'doppus' | null; // Fonte do webhook (Hotmart ou Doppus)
  errorMessage: string | null;
  userId: number | null;
  sourceIp: string;
  transactionId: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

// Interface para os detalhes do log de webhook
interface WebhookLogDetails {
  log: WebhookLog;
  userData: {
    id: number;
    username: string;
    email: string;
    name: string;
    nivelacesso: string;
    dataassinatura: string | null;
    dataexpiracao: string | null;
  } | null;
}

// Interface para a resposta da API de logs de webhook
interface WebhookLogsResponse {
  logs: WebhookLog[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Componente auxiliar para formatar o status do webhook
const WebhookStatus: React.FC<{ status: string }> = ({ status }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let displayText = status;

  switch (status) {
    case 'processed':
      variant = "default";
      displayText = "Processado";
      break;
    case 'received':
      variant = "secondary";
      displayText = "Recebido";
      break;
    case 'pending':
      variant = "outline";
      displayText = "Pendente";
      break;
    case 'error':
      variant = "destructive";
      displayText = "Erro";
      break;
  }

  return <Badge variant={variant}>{displayText}</Badge>;
};

// Componente auxiliar para formatar a fonte do webhook
const WebhookSource: React.FC<{ source: string | null }> = ({ source }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let displayText = source || "Desconhecido";

  switch (source) {
    case 'hotmart':
      variant = "default";
      displayText = "Hotmart";
      break;
    case 'doppus':
      variant = "secondary";
      displayText = "Doppus";
      break;
    default:
      variant = "outline";
      displayText = "Desconhecido";
  }

  return <Badge variant={variant}>{displayText}</Badge>;
};

// Componente principal de lista de webhooks
const WebhookList: React.FC = () => {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState('logs');
  const [filters, setFilters] = useState({
    status: 'all',
    eventType: 'all',
    source: 'all', // 'all', 'hotmart', 'doppus'
    search: '',
  });
  
  // Estado separado para o campo de pesquisa para evitar re-renderização a cada tecla
  const [searchText, setSearchText] = useState('');
  const [selectedLog, setSelectedLog] = useState<WebhookLogDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Construir query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  if (filters.status !== 'all') {
    queryParams.append('status', filters.status);
  }
  
  if (filters.eventType !== 'all') {
    queryParams.append('eventType', filters.eventType);
  }
  
  if (filters.source !== 'all') {
    queryParams.append('source', filters.source);
  }
  
  if (filters.search) {
    queryParams.append('search', filters.search);
  }

  // Buscar logs de webhook
  const {
    data,
    isLoading,
    refetch,
  } = useQuery<WebhookLogsResponse>({
    queryKey: ['/api/webhooks/logs', page, limit, filters.status, filters.eventType, filters.source, filters.search],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // Construir o URL para a consulta
  const queryString = queryParams.toString();
  const apiUrl = `/api/webhooks/logs${queryString ? `?${queryString}` : ''}`;

  // Buscar detalhes de um log de webhook
  const fetchLogDetails = async (logId: number) => {
    try {
      const response = await apiRequest('GET', `/api/webhooks/logs/${logId}`);
      const data = await response.json();
      setSelectedLog(data);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Erro ao buscar detalhes do log:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do log.',
        variant: 'destructive',
      });
    }
  };

  // Reprocessar um webhook
  const reprocessWebhook = async (logId: number) => {
    if (isReprocessing) return;
    
    setIsReprocessing(true);
    
    try {
      const response = await apiRequest('POST', `/api/webhooks/reprocess/${logId}`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Webhook reprocessado com sucesso!',
        });
        
        // Atualizar detalhes e lista
        fetchLogDetails(logId);
        refetch();
      } else {
        throw new Error(data.message || 'Falha ao reprocessar webhook');
      }
    } catch (error) {
      console.error('Erro ao reprocessar webhook:', error);
      toast({
        title: 'Erro no reprocessamento',
        description: error instanceof Error ? error.message : 'Não foi possível reprocessar o webhook.',
        variant: 'destructive',
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  // Função para lidar com a pesquisa com debounce
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    searchTimerRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPage(1); // Voltar para a primeira página
    }, 500);
  };

  // Mostrar indicação de carregamento
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Carregando logs de webhook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="logs">Logs de Webhooks</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnóstico Avançado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-xl flex justify-between items-center">
                <span>Logs de Webhooks</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log("Botão Atualizar clicado");
                    // Ativar estado de atualização para feedback visual
                    setIsRefreshing(true);
                    
                    // Resetar filtros e estado
                    setPage(1);
                    setSearchText(''); // Limpar também o campo de texto de pesquisa
                    setFilters({
                      status: 'all',
                      eventType: 'all',
                      source: 'all',
                      search: '',
                    });
                    
                    // Invalidar e atualizar os dados sem redirecionamento
                    queryClient.invalidateQueries({ queryKey: ['/api/webhooks/logs'] });
                    
                    // Forçar a atualização imediata com um pequeno delay
                    setTimeout(() => {
                      refetch().finally(() => {
                        // Desativar estado de atualização quando terminar
                        setTimeout(() => setIsRefreshing(false), 500);
                      });
                    }, 100);
                    
                    // Feedback visual de que algo aconteceu
                    toast({
                      title: "Atualizando logs",
                      description: "Os dados estão sendo recarregados...",
                    });
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {/* Filtros */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative w-full">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Search className="h-4 w-4 opacity-50" />
                    </div>
                    <Input
                      placeholder="Buscar por transação, email ou erro..."
                      value={searchText}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-9"
                    />
                  </div>
                </div>
                <div className="w-[150px]">
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="processed">Processados</SelectItem>
                      <SelectItem value="received">Recebidos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="error">Erros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[200px]">
                  <Select
                    value={filters.eventType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os eventos</SelectItem>
                      <SelectItem value="PURCHASE_APPROVED">Compra Aprovada</SelectItem>
                      <SelectItem value="PURCHASE_COMPLETE">Compra Completa</SelectItem>
                      <SelectItem value="PURCHASE_CANCELED">Compra Cancelada</SelectItem>
                      <SelectItem value="PURCHASE_REFUNDED">Compra Reembolsada</SelectItem>
                      <SelectItem value="PURCHASE_CHARGEBACK">Chargeback</SelectItem>
                      <SelectItem value="PURCHASE_DELAYED">Pagamento Atrasado</SelectItem>
                      <SelectItem value="SUBSCRIPTION_CANCELLATION">Cancelamento de Assinatura</SelectItem>
                      <SelectItem value="RECURRENCE_BILLED">Recorrência Cobrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[150px]">
                  <Select
                    value={filters.source}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as fontes</SelectItem>
                      <SelectItem value="hotmart">Hotmart</SelectItem>
                      <SelectItem value="doppus">Doppus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabela de logs */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead className="w-[140px]">Status</TableHead>
                      <TableHead className="w-[170px]">Tipo de Evento</TableHead>
                      <TableHead className="w-[120px]">Fonte</TableHead>
                      <TableHead>Email / Transação</TableHead>
                      <TableHead className="w-[180px]">Data</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.logs && data.logs.length > 0 ? (
                      data.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.id}</TableCell>
                          <TableCell><WebhookStatus status={log.status} /></TableCell>
                          <TableCell>{log.eventType}</TableCell>
                          <TableCell><WebhookSource source={log.source} /></TableCell>
                          <TableCell>
                            {log.email ? (
                              <span className="font-medium text-primary">{log.email}</span>
                            ) : log.transactionId ? (
                              <span className="text-muted-foreground">{log.transactionId}</span>
                            ) : (
                              <span className="text-muted-foreground italic">Não informado</span>
                            )}
                            {log.status === 'error' && log.errorMessage && (
                              <div className="flex items-center mt-1 text-xs text-destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {log.errorMessage.length > 50 
                                  ? `${log.errorMessage.substring(0, 50)}...` 
                                  : log.errorMessage}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => fetchLogDetails(log.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhum log de webhook encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {data && data.totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: data.totalPages }).map((_, i) => {
                        const pageNumber = i + 1;
                        // Mostrar apenas 5 páginas ao redor da página atual
                        if (
                          pageNumber === 1 || 
                          pageNumber === data.totalPages || 
                          (pageNumber >= page - 2 && pageNumber <= page + 2)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink 
                                isActive={page === pageNumber}
                                onClick={() => setPage(pageNumber)}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          (pageNumber === page - 3 && page > 3) || 
                          (pageNumber === page + 3 && page < data.totalPages - 2)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink className="cursor-default">...</PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                          className={page >= data.totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="diagnostics">
          <WebhookDiagnosticsTab />
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes do webhook */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLog ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  Webhook #{selectedLog.log.id}
                  <WebhookStatus status={selectedLog.log.status} />
                  <WebhookSource source={selectedLog.log.source} />
                </DialogTitle>
                <DialogDescription>
                  Detalhes do webhook recebido em {format(new Date(selectedLog.log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Tipo de Evento:</span> {selectedLog.log.eventType}
                    </div>
                    <div>
                      <span className="font-medium">Transação ID:</span> {selectedLog.log.transactionId || 'Não informado'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedLog.log.email || 'Não informado'}
                    </div>
                    <div>
                      <span className="font-medium">IP de Origem:</span> {selectedLog.log.sourceIp}
                    </div>
                    {selectedLog.log.status === 'error' && (
                      <div>
                        <span className="font-medium text-destructive">Erro:</span> 
                        <p className="text-sm text-destructive mt-1">{selectedLog.log.errorMessage}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedLog.userData && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Informações do Usuário</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Nome:</span> {selectedLog.userData.name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {selectedLog.userData.email}
                      </div>
                      <div>
                        <span className="font-medium">Usuário:</span> {selectedLog.userData.username}
                      </div>
                      <div>
                        <span className="font-medium">Nível de Acesso:</span> {selectedLog.userData.nivelacesso}
                      </div>
                      <div>
                        <span className="font-medium">Assinatura:</span> {selectedLog.userData.dataassinatura ? format(new Date(selectedLog.userData.dataassinatura), 'dd/MM/yyyy', { locale: ptBR }) : 'Não possui'}
                      </div>
                      <div>
                        <span className="font-medium">Expiração:</span> {selectedLog.userData.dataexpiracao ? format(new Date(selectedLog.userData.dataexpiracao), 'dd/MM/yyyy', { locale: ptBR }) : 'Não aplicável'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Payload</h3>
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(selectedLog.log.payloadData), null, 2)}
                  </pre>
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center mt-4">
                <div>
                  {selectedLog.log.status !== 'processed' && (
                    <Button 
                      variant="default" 
                      onClick={() => reprocessWebhook(selectedLog.log.id)}
                      disabled={isReprocessing}
                    >
                      {isReprocessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Reprocessando...
                        </>
                      ) : (
                        'Reprocessar Webhook'
                      )}
                    </Button>
                  )}
                </div>
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex justify-center items-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhookList;