import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Loader2, RefreshCw, Search, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para o log de webhook
interface WebhookLog {
  id: number;
  eventType: string;
  payloadData: string;
  status: 'received' | 'processed' | 'pending' | 'error';
  errorMessage: string | null;
  userId: number | null;
  sourceIp: string;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Interface para detalhes do log
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

// Interface para a resposta da API
interface WebhookLogsResponse {
  logs: WebhookLog[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Componente para mostrar o status do webhook com cores
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let variant:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | null
    | undefined = 'default';
  
  switch (status) {
    case 'processed':
      variant = 'default'; // verde
      break;
    case 'received':
      variant = 'secondary'; // cinza
      break;
    case 'pending':
      variant = 'outline'; // outline
      break;
    case 'error':
      variant = 'destructive'; // vermelho
      break;
    default:
      variant = 'outline';
  }
  
  return <Badge variant={variant}>{status}</Badge>;
};

// Componente principal
const WebhookList: React.FC = () => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    eventType: '',
    search: '',
  });
  const [selectedLog, setSelectedLog] = useState<WebhookLogDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Buscar logs de webhook
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<WebhookLogsResponse>({
    queryKey: ['/api/webhooks/logs', {
      page,
      limit,
      ...filters
    }],
    // Usar o queryFn padrão do sistema que está configurado no queryClient
  });

  // Buscar detalhes de um log específico
  const handleViewDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/webhooks/logs/${id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do log');
      }
      
      const data = await response.json();
      setSelectedLog(data);
      setIsDetailsOpen(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do log',
        variant: 'destructive',
      });
    }
  };

  // Função para reprocessar um webhook
  const handleReprocess = async (id: number) => {
    if (isReprocessing) return;
    
    setIsReprocessing(true);
    
    try {
      const response = await apiRequest('POST', `/api/webhooks/logs/${id}/reprocess`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: 'Sucesso',
            description: 'Webhook reprocessado com sucesso',
          });
          
          // Atualizar os dados
          refetch();
          
          // Se estiver vendo detalhes, atualizar também
          if (selectedLog && selectedLog.log.id === id) {
            handleViewDetails(id);
          }
        } else {
          toast({
            title: 'Aviso',
            description: result.message || 'Não foi possível reprocessar o webhook',
            variant: 'destructive',
          });
        }
      } else {
        throw new Error('Erro ao reprocessar webhook');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao reprocessar o webhook',
        variant: 'destructive',
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  // Função para formatar o JSON
  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  // Renderizar paginação
  const renderPagination = () => {
    if (!data) return null;
    
    const { totalPages } = data;
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)
            )
            .map((p, i, arr) => {
              // Adicionar reticências
              if (i > 0 && arr[i - 1] !== p - 1) {
                return (
                  <React.Fragment key={`ellipsis-${p}`}>
                    <PaginationItem>
                      <PaginationLink className="pointer-events-none opacity-50">...</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        isActive={page === p}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              }
              
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={page === p}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(prev => (prev < totalPages ? prev + 1 : prev))}
              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Renderizar o conteúdo principal
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando logs de webhook...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
        <h3 className="text-lg font-medium">Erro ao carregar logs</h3>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os logs de webhook. Tente novamente mais tarde.
        </p>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-xl flex justify-between items-center">
            <span>Logs de Webhooks da Hotmart</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
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
                  placeholder="Buscar por transação ou erro..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
                  <SelectItem value="">Todos</SelectItem>
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
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PURCHASE_APPROVED">Compra Aprovada</SelectItem>
                  <SelectItem value="PURCHASE_REFUNDED">Reembolso</SelectItem>
                  <SelectItem value="PURCHASE_CANCELED">Cancelamento</SelectItem>
                  <SelectItem value="SUBSCRIPTION_CANCELED">Assinatura Cancelada</SelectItem>
                  <SelectItem value="SUBSCRIPTION_REACTIVATED">Assinatura Reativada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela */}
          {data && data.logs.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Transação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.id}</TableCell>
                      <TableCell>{log.eventType}</TableCell>
                      <TableCell>
                        {log.transactionId || <span className="text-muted-foreground italic">N/A</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewDetails(log.id)}
                          className="mr-1"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {log.status === 'error' || log.status === 'pending' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleReprocess(log.id)}
                            disabled={isReprocessing}
                          >
                            <RefreshCw className={`h-4 w-4 ${isReprocessing ? 'animate-spin' : ''}`} />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground border rounded-md">
              Nenhum log de webhook encontrado.
            </div>
          )}

          {/* Paginação */}
          {data && data.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              {renderPagination()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook #{selectedLog?.log.id}</DialogTitle>
            <DialogDescription>
              Informações completas sobre o registro de webhook
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Informações Básicas</h4>
                  <div className="border rounded-md p-3 space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">ID:</span>
                      <span className="text-sm ml-2 font-medium">{selectedLog.log.id}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Tipo de Evento:</span>
                      <span className="text-sm ml-2 font-medium">{selectedLog.log.eventType}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">ID da Transação:</span>
                      <span className="text-sm ml-2 font-medium">
                        {selectedLog.log.transactionId || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span className="ml-2">
                        <StatusBadge status={selectedLog.log.status} />
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">IP de Origem:</span>
                      <span className="text-sm ml-2 font-medium">{selectedLog.log.sourceIp}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Data de Criação:</span>
                      <span className="text-sm ml-2 font-medium">
                        {formatDate(selectedLog.log.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Última Atualização:</span>
                      <span className="text-sm ml-2 font-medium">
                        {formatDate(selectedLog.log.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedLog.userData && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Dados do Usuário</h4>
                    <div className="border rounded-md p-3 space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">ID:</span>
                        <span className="text-sm ml-2 font-medium">{selectedLog.userData.id}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Nome:</span>
                        <span className="text-sm ml-2 font-medium">{selectedLog.userData.name}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm ml-2 font-medium">{selectedLog.userData.email}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Usuário:</span>
                        <span className="text-sm ml-2 font-medium">{selectedLog.userData.username}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Nível de Acesso:</span>
                        <span className="text-sm ml-2 font-medium">{selectedLog.userData.nivelacesso}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Data da Assinatura:</span>
                        <span className="text-sm ml-2 font-medium">
                          {selectedLog.userData.dataassinatura 
                            ? formatDate(selectedLog.userData.dataassinatura) 
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Data de Expiração:</span>
                        <span className="text-sm ml-2 font-medium">
                          {selectedLog.userData.dataexpiracao 
                            ? formatDate(selectedLog.userData.dataexpiracao) 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedLog.log.errorMessage && (
                <div>
                  <h4 className="text-sm font-medium text-destructive mb-1">Mensagem de Erro</h4>
                  <div className="border border-destructive bg-destructive/10 rounded-md p-3">
                    <p className="text-sm">{selectedLog.log.errorMessage}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-1">Dados do Payload</h4>
                <div className="border rounded-md p-3">
                  <pre className="text-xs overflow-auto max-h-[200px] whitespace-pre-wrap">
                    {formatJson(selectedLog.log.payloadData)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando detalhes...</span>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            {selectedLog && (selectedLog.log.status === 'error' || selectedLog.log.status === 'pending') && (
              <Button 
                onClick={() => handleReprocess(selectedLog.log.id)}
                disabled={isReprocessing}
              >
                {isReprocessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reprocessando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reprocessar
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhookList;