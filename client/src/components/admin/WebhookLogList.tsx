import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

import { 
  ArrowDown, 
  ArrowUp, 
  RefreshCw,
  SearchIcon,
  Filter,
  X
} from 'lucide-react';

// Tipo para os logs de webhook
interface WebhookLog {
  id: number;
  eventType: string;
  status: string;
  email: string;
  source: string;
  transactionId: string;
  sourceIp: string;
  createdAt: string;
  webhookData?: string;
}

// Componente principal de listagem de logs
export default function WebhookLogList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState({
    email: '',
    eventType: '',
    source: '',
    status: '',
    transactionId: ''
  });
  const [sort, setSort] = useState({
    field: 'createdAt',
    direction: 'desc'
  });
  const pageSize = 10;

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setFilter({
      email: '',
      eventType: '',
      source: '',
      status: '',
      transactionId: ''
    });
  };

  // Consulta para obter os logs de webhook
  const { data, isLoading, error, refetch } = useQuery<{
    logs: WebhookLog[];
    total: number;
  }>({
    queryKey: ['/api/admin/webhook-logs', currentPage, filter, sort],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_field: sort.field,
        sort_direction: sort.direction,
        ...Object.fromEntries(
          Object.entries(filter).filter(([_, value]) => value !== '')
        )
      });

      console.log('Buscando logs de webhook com URL:', `/api/admin/webhook-logs?${queryParams}`);
      const response = await fetch(`/api/admin/webhook-logs?${queryParams}`);
      if (!response.ok) {
        console.error('Erro ao carregar logs de webhook:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Resposta de erro:', errorText);
        throw new Error(`Erro ao carregar logs de webhook: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }
  });

  // Manipulador de ordenação
  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Renderiza a direção da ordenação
  const renderSortIcon = (field: string) => {
    if (sort.field !== field) return null;
    return sort.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Renderiza o status com cores
  const renderStatus = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      received: { color: 'bg-green-500', label: 'Recebido' },
      processed: { color: 'bg-blue-500', label: 'Processado' },
      error: { color: 'bg-red-500', label: 'Erro' },
      pending: { color: 'bg-yellow-500', label: 'Pendente' }
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-500', label: status };

    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Renderiza a fonte com cores
  const renderSource = (source: string) => {
    const sourceMap: Record<string, { color: string }> = {
      hotmart: { color: 'bg-purple-500' },
      doppus: { color: 'bg-indigo-500' },
      debug: { color: 'bg-yellow-500' }
    };

    const sourceInfo = sourceMap[source] || { color: 'bg-gray-500' };

    return (
      <Badge className={sourceInfo.color}>
        {source.charAt(0).toUpperCase() + source.slice(1)}
      </Badge>
    );
  };

  // Calcula o número total de páginas
  const totalPages = data?.total 
    ? Math.ceil(data.total / pageSize) 
    : 0;

  // Renderiza o componente de paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i} 
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}
          
          {pages}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Renderização condicional para carregamento
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs de Webhook</CardTitle>
          <CardDescription>Carregando logs de webhook...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array(5).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderização condicional para erro
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
          <CardDescription>Ocorreu um erro ao carregar os logs de webhook.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Logs de Webhook</CardTitle>
          <CardDescription>
            Visualize e gerencie logs de webhooks recebidos.
            {data?.total && ` Total de registros: ${data.total}`}
          </CardDescription>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2" size="sm">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Email"
              value={filter.email}
              onChange={(e) => setFilter({ ...filter, email: e.target.value })}
              className="pl-8"
            />
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Transação"
              value={filter.transactionId}
              onChange={(e) => setFilter({ ...filter, transactionId: e.target.value })}
              className="pl-8"
            />
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          
          <Select value={filter.eventType} onValueChange={(value) => setFilter({ ...filter, eventType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="PURCHASE_APPROVED">PURCHASE_APPROVED</SelectItem>
              <SelectItem value="SUBSCRIPTION_CANCELLATION">SUBSCRIPTION_CANCELLATION</SelectItem>
              <SelectItem value="SUBSCRIPTION_REACTIVATION">SUBSCRIPTION_REACTIVATION</SelectItem>
              <SelectItem value="PURCHASE_REFUNDED">PURCHASE_REFUNDED</SelectItem>
              <SelectItem value="PURCHASE_DELAYED">PURCHASE_DELAYED</SelectItem>
              <SelectItem value="PURCHASE_COMPLETE">PURCHASE_COMPLETE</SelectItem>
              <SelectItem value="PURCHASE_OVERDUE">PURCHASE_OVERDUE</SelectItem>
              <SelectItem value="CHARGEBACK_REQUESTED">CHARGEBACK_REQUESTED</SelectItem>
              <SelectItem value="CHARGEBACK_DISPUTE_SOLVED">CHARGEBACK_DISPUTE_SOLVED</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filter.source} onValueChange={(value) => setFilter({ ...filter, source: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="hotmart">Hotmart</SelectItem>
              <SelectItem value="doppus">Doppus</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              className="flex items-center gap-1"
              size="icon"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => refetch()}
              className="flex-1 flex items-center gap-1"
            >
              <Filter className="h-4 w-4" /> Filtrar
            </Button>
          </div>
        </div>

        {/* Tabela de logs */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('eventType')}>
                  <div className="flex items-center gap-2">
                    Evento {renderSortIcon('eventType')}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-2">
                    Email {renderSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('transactionId')}>
                  <div className="flex items-center gap-2">
                    Transaction ID {renderSortIcon('transactionId')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-2">
                    Data {renderSortIcon('createdAt')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.logs && data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderStatus(log.status)}</TableCell>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>{renderSource(log.source)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.transactionId}
                    </TableCell>
                    <TableCell>
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Nenhum log de webhook encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {renderPagination()}
      </CardContent>
    </Card>
  );
}