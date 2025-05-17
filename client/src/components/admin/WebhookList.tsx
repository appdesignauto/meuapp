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
} from '@/components/ui/dialog';
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type WebhookLog = {
  id: number;
  eventType: string;
  status: string;
  createdAt: string;
  source: string;
  payloadData: string;
};

type LogsResponse = {
  logs: WebhookLog[];
  totalCount: number;
};

export default function WebhookList() {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery<LogsResponse, Error>({
    queryKey: ['/api/webhooks/logs', page],
    queryFn: async () => {
      try {
        // Incluir credenciais nas requisições para garantir que cookies sejam enviados
        const response = await fetch(`/api/webhooks/logs?page=${page}&limit=${limit}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          console.error('Resposta não ok:', await response.text());
          throw new Error(`Erro ao buscar logs de webhook: ${response.status}`);
        }
        
        // Tentar fazer parsing do JSON
        const jsonData = await response.json();
        console.log('Dados recebidos:', jsonData);
        
        // Se não houver logs no retorno, criar uma estrutura padrão com array vazio
        if (!jsonData || !Array.isArray(jsonData)) {
          console.warn('Resposta não contém um array de logs, usando array vazio');
          return { logs: [], totalCount: 0 };
        }
        
        // Formatar a resposta para o formato esperado pelo componente
        return {
          logs: jsonData,
          totalCount: jsonData.length
        };
      } catch (err) {
        console.error('Erro ao buscar logs de webhook:', err);
        // Em caso de erro de autenticação 401, mostrar mensagem amigável
        if (err.message && err.message.includes('401')) {
          toast({
            title: 'Erro de autenticação',
            description: 'Sua sessão pode ter expirado. Tente fazer login novamente.',
            variant: 'destructive',
          });
        }
        // Retornar array vazio em vez de lançar erro para evitar tela de erro
        return { logs: [], totalCount: 0 };
      }
    },
    // Não falhar completamente em caso de erros, permitir recuperação
    retry: 1,
  });

  const maxPage = data ? Math.ceil(data.totalCount / limit) : 1;

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= maxPage) {
      setPage(newPage);
    }
  };

  const handleViewDetails = (log: WebhookLog) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };

  const renderPagination = () => {
    const pages = [];
    const displayRange = 2;

    // Botão anterior
    pages.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (page > 1) handlePageChange(page - 1);
          }} 
          className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    );

    // Primeira página sempre
    if (page > displayRange + 1) {
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(1);
            }}
            isActive={page === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis se necessário
    if (page > displayRange + 2) {
      pages.push(
        <PaginationItem key="ellipsis1">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }

    // Páginas ao redor da atual
    for (let i = Math.max(1, page - displayRange); i <= Math.min(maxPage, page + displayRange); i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis se necessário
    if (page < maxPage - displayRange - 1) {
      pages.push(
        <PaginationItem key="ellipsis2">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }

    // Última página sempre
    if (page < maxPage - displayRange) {
      pages.push(
        <PaginationItem key={maxPage}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(maxPage);
            }}
            isActive={page === maxPage}
          >
            {maxPage}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Botão próximo
    pages.push(
      <PaginationItem key="next">
        <PaginationNext 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (page < maxPage) handlePageChange(page + 1);
          }} 
          className={page >= maxPage ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    );

    return pages;
  };

  const formatPayload = (jsonString: string) => {
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonString;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'success';
      case 'error':
        return 'destructive';
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg">
        <h3 className="font-medium text-destructive mb-2">Erro ao carregar logs</h3>
        <p className="text-destructive/80">{error?.message || 'Ocorreu um erro desconhecido.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Logs de Webhooks</CardTitle>
          <Badge variant="outline">
            {data?.totalCount || 0} registro{data?.totalCount !== 1 ? 's' : ''}
          </Badge>
        </CardHeader>
        <CardContent>
          {data && data.logs.length > 0 ? (
            <>
              <div className="rounded-md border overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.eventType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(log.status)}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {log.source || 'Desconhecida'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {maxPage > 1 && (
                <Pagination>
                  <PaginationContent>
                    {renderPagination()}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum registro de webhook encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook</DialogTitle>
            <DialogDescription>
              ID: {selectedLog?.id} | Tipo: {selectedLog?.eventType} | Data: {selectedLog && new Date(selectedLog.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Status</h4>
              <Badge variant={selectedLog ? getStatusBadgeVariant(selectedLog.status) : 'default'}>
                {selectedLog?.status}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Origem</h4>
              <Badge variant="secondary">
                {selectedLog?.source || 'Desconhecida'}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Payload</h4>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                {selectedLog && formatPayload(selectedLog.payloadData)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}