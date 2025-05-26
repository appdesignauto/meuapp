import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ExternalLink,
  FileIcon,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

interface Report {
  id: number;
  reportTypeId: number;
  userId: number;
  title: string;
  description: string;
  evidence?: string;
  status: string;
  adminResponse?: string;
  respondedBy?: number;
  respondedAt?: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  reportType?: {
    id: number;
    name: string;
    description: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
  };
  admin?: {
    id: number;
    username: string;
  };
}

interface ReportType {
  id: number;
  name: string;
  description: string;
}

const statusLabels: Record<string, { label: string, color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  'em-analise': { label: 'Em análise', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-800 hover:bg-red-200' }
};

const ITEMS_PER_PAGE = 10;

const ReportsManagement = () => {
  const [activeTab, setActiveTab] = useState<string>('pendente');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta para obter tipos de report
  const { 
    data: reportTypes = [],
    isLoading: isLoadingTypes,
    isError: isTypesError 
  } = useQuery({
    queryKey: ['/api/reports-v2/types'],
    queryFn: async () => {
      try {
        // Primeiro tentamos carregar do novo endpoint da API V2
        const response = await fetch('/api/reports-v2/types');
        if (response.ok) {
          return await response.json();
        }
        
        // Se a API V2 falhar, tentamos a versão antiga
        const legacyResponse = await fetch('/api/reports/types');
        if (legacyResponse.ok) {
          return await legacyResponse.json();
        }
        
        // Se ambas APIs falharem, carregamos do arquivo estático
        const staticResponse = await fetch('/data/report-types.json');
        if (staticResponse.ok) {
          return await staticResponse.json();
        }
        
        throw new Error('Não foi possível carregar os tipos de report');
      } catch (error) {
        console.error('Erro ao carregar tipos de report:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Consulta para obter reports
  const {
    data: reportsData = { reports: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
    isLoading: isLoadingReports,
    isError: isReportsError,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['/api/reports-v2', activeTab, selectedStatusFilter],
    queryFn: async () => {
      try {
        // Preparar parâmetros da consulta
        const statusParam = selectedStatusFilter !== 'all' ? selectedStatusFilter : 
                          activeTab !== 'all' ? activeTab : null;
        
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '50'
        });
        
        if (statusParam) {
          queryParams.append('status', statusParam);
        }
        
        const queryString = queryParams.toString();
        console.log(`Consultando reports com filtros: ${queryString}`);
        
        // Primeiro tentamos a versão V2 da API com SQL puro
        console.log('Tentando API v2 para reports...');
        const v2Response = await apiRequest('GET', `/api/reports-v2?${queryString}`);
        console.log('Resposta da API V2 de reports:', v2Response);
        
        if (v2Response.ok) {
          const data = await v2Response.json();
          console.log('Dados recebidos da API V2:', data);
          return data;
        } else {
          console.warn('API V2 falhou, voltando para API V1');
        }
        
        // Se a V2 falhar, tentamos a versão original
        const response = await apiRequest('GET', `/api/reports?${queryString}`);
        console.log('Resposta da API V1 de reports:', response);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao carregar reports');
        }
        
        const data = await response.json();
        console.log('Dados recebidos dos reports (API V1):', data);
        return data;
      } catch (error) {
        console.error('Erro ao buscar reports:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false
  });

  // Mutation para atualizar o status de um report
  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status, adminFeedback, isResolved }: { id: number, status: string, adminFeedback?: string, isResolved?: boolean }) => {
      const data: any = { 
        status,
        isResolved: isResolved || false 
      };
      if (adminFeedback) {
        data.adminResponse = adminFeedback; // Renomeado para corresponder ao esperado pelo backend
      }
      
      console.log(`Enviando atualização para report #${id}:`, data);
      
      try {
        // Primeiro tentamos a V2 da API
        console.log(`Tentando atualizar report #${id} com API V2:`, data);
        const v2Response = await apiRequest('PUT', `/api/reports-v2/${id}`, data);
        console.log(`Resposta da API V2 ao atualizar report #${id}:`, v2Response);
        
        if (v2Response.ok) {
          const result = await v2Response.json();
          console.log(`Atualização V2 concluída para report #${id}:`, result);
          return result;
        } else {
          console.warn(`API V2 falhou para atualização do report #${id}, tentando API V1`);
        }
        
        // Se a V2 falhar, tentamos a versão original
        const response = await apiRequest('PUT', `/api/reports/${id}`, data);
        console.log(`Resposta da API V1 ao atualizar report #${id}:`, response);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Erro ao atualizar report #${id}:`, errorData);
          throw new Error(errorData.message || 'Erro ao atualizar report');
        }
        
        const result = await response.json();
        console.log(`Atualização V1 concluída para report #${id}:`, result);
        return result;
      } catch (error) {
        console.error(`Erro na atualização do report #${id}:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidar o cache das duas versões da API para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['/api/reports-v2'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      
      setIsDetailsOpen(false);
      setFeedbackInput('');
      
      console.log('Report atualizado com sucesso:', data);
      
      toast({
        title: 'Report atualizado',
        description: data?.message || 'O status do report foi atualizado com sucesso',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar report',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para excluir um report
  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Tentando excluir report #${id} com API V2...`);
      
      // Primeiro tentamos a V2 da API
      const v2Response = await apiRequest('DELETE', `/api/reports-v2/${id}`);
      console.log(`Resposta da API V2 ao excluir report #${id}:`, v2Response);
      
      if (v2Response.ok) {
        const result = await v2Response.json();
        console.log(`Exclusão V2 concluída para report #${id}:`, result);
        return result;
      } else {
        console.warn(`API V2 falhou para exclusão do report #${id}, tentando API V1`);
      }
      
      // Se a V2 falhar, tentamos a versão original
      const response = await apiRequest('DELETE', `/api/reports/${id}`);
      console.log(`Resposta da API V1 ao excluir report #${id}:`, response);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Erro ao excluir report #${id}:`, errorData);
        throw new Error(errorData.message || 'Erro ao excluir report');
      }
      
      const result = await response.json();
      console.log(`Exclusão V1 concluída para report #${id}:`, result);
      return result;
    },
    onSuccess: () => {
      // Invalidar o cache das duas versões da API para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['/api/reports-v2'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      
      setIsDetailsOpen(false);
      
      toast({
        title: 'Report excluído',
        description: 'O report foi removido permanentemente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir report',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    console.log('Reports data:', reportsData);
  }, [reportsData]);

  // Filtra reports com base nos critérios de pesquisa e filtros
  const filteredReports = reportsData.reports
    ? reportsData.reports.filter((report: Report) => {
        // Filtro por termo de pesquisa
        const matchesSearch = 
          searchTerm === '' || 
          report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (report.user?.username || '').toLowerCase().includes(searchTerm.toLowerCase());
          
        // Filtro por tipo
        const matchesType = 
          selectedTypeFilter === 'all' || 
          report.reportTypeId === parseInt(selectedTypeFilter);
          
        // Filtro por status
        const matchesStatus = 
          selectedStatusFilter === 'all' || 
          report.status === selectedStatusFilter;
          
        return matchesSearch && matchesType && matchesStatus;
      })
    : [];

  // Paginação
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Atualiza a página atual quando mudamos de aba ou filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedStatusFilter, selectedTypeFilter, searchTerm]);

  // Função para abrir o modal de detalhes
  const handleViewDetails = (report: Report) => {
    setCurrentReport(report);
    setFeedbackInput(report.adminFeedback || '');
    setIsDetailsOpen(true);
  };

  // Função para atualizar o status
  const handleUpdateStatus = (status: string) => {
    if (!currentReport) return;
    
    console.log(`Atualizando status do report para: ${status}`);
    
    // Se o status for "resolvido", definimos isResolved como true
    const isResolved = status === 'resolvido';
    
    updateReportMutation.mutate({
      id: currentReport.id,
      status,
      adminFeedback: feedbackInput,
      isResolved
    });
  };

  // Função para excluir report
  const handleDeleteReport = () => {
    if (!currentReport) return;
    
    if (window.confirm('Tem certeza que deseja excluir este report? Esta ação não pode ser desfeita.')) {
      deleteReportMutation.mutate(currentReport.id);
    }
  };

  // Renderiza o conteúdo adequado baseado no estado de carregamento e erros
  const renderContent = () => {
    if (isLoadingReports) {
      return (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (isReportsError) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Não foi possível carregar os reports. Tente novamente mais tarde.</AlertDescription>
        </Alert>
      );
    }

    if (paginatedReports.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Nenhum report encontrado</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all'
              ? 'Tente ajustar os filtros ou critérios de pesquisa'
              : 'Não há reports nesta categoria no momento'}
          </p>
        </div>
      );
    }

    return (
      <>
        <Table>
          <TableCaption>
            Mostrando {paginatedReports.length} de {filteredReports.length} reports
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReports.map((report: Report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.id}</TableCell>
                <TableCell className="max-w-xs truncate" title={report.title}>
                  {report.title}
                </TableCell>
                <TableCell>
                  {report.reportType?.name || 
                   reportTypes.find((type: ReportType) => type.id === report.reportTypeId)?.name || 
                   'Desconhecido'}
                </TableCell>
                <TableCell>
                  {report.user?.username || 'Anônimo'}
                </TableCell>
                <TableCell>
                  {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Badge className={statusLabels[report.status].color}>
                    {statusLabels[report.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleViewDetails(report)}
                    title="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink 
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </>
    );
  };

  // Consulta para obter todos os reports (para estatísticas)
  const {
    data: allReportsData = { reports: [] },
    isLoading: isLoadingAllReports,
  } = useQuery({
    queryKey: ['/api/reports-v2/all'],
    queryFn: async () => {
      try {
        // Fazemos uma consulta sem filtros para obter todos os reports para estatísticas
        const response = await apiRequest('GET', `/api/reports-v2?limit=1000`);
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
        
        // Fallback para a API V1 se necessário
        const fallbackResponse = await apiRequest('GET', `/api/reports?limit=1000`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          return data;
        }
        
        throw new Error('Não foi possível carregar todos os reports');
      } catch (error) {
        console.error('Erro ao carregar todos os reports:', error);
        return { reports: [] };
      }
    },
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  // Renderiza as estatísticas dos reports
  const renderStats = () => {
    if (isLoadingAllReports) return null;
    
    // Conta reports por status usando todos os reports (sem filtros)
    const reportStats = {
      total: allReportsData.reports?.length || 0,
      pending: allReportsData.reports?.filter((r: Report) => r.status === 'pendente').length || 0,
      reviewing: allReportsData.reports?.filter((r: Report) => r.status === 'em-analise').length || 0,
      resolved: allReportsData.reports?.filter((r: Report) => r.status === 'resolvido').length || 0,
      rejected: allReportsData.reports?.filter((r: Report) => r.status === 'rejeitado').length || 0,
    };
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reportStats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-yellow-700">Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{reportStats.pending}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((reportStats.pending / reportStats.total) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-blue-700">Em análise</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{reportStats.reviewing}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((reportStats.reviewing / reportStats.total) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-green-700">Resolvidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{reportStats.resolved}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((reportStats.resolved / reportStats.total) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-red-700">Rejeitadas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{reportStats.rejected}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((reportStats.rejected / reportStats.total) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Reports</h2>
        <Button 
          onClick={() => refetchReports()} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>
      
      {renderStats()}

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Pesquisar reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select 
            value={selectedTypeFilter} 
            onValueChange={setSelectedTypeFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {reportTypes.map((type: ReportType) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedStatusFilter} 
            onValueChange={setSelectedStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="em-analise">Em análise</SelectItem>
              <SelectItem value="resolvido">Resolvidos</SelectItem>
              <SelectItem value="rejeitado">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as any);
        setSelectedStatusFilter(value);
      }}>
        <TabsList className="mb-4 border-b w-full justify-start rounded-none gap-4 bg-transparent p-0">
          <TabsTrigger 
            value="pendente" 
            className={`rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent`}
          >
            <div className="flex gap-2 items-center">
              <span>Pendentes</span>
              <Badge variant="outline">{allReportsData.reports?.filter(r => r.status === 'pendente').length || 0}</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="em-analise" 
            className={`rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent`}
          >
            <div className="flex gap-2 items-center">
              <span>Em análise</span>
              <Badge variant="outline">{allReportsData.reports?.filter(r => r.status === 'em-analise').length || 0}</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="resolvido" 
            className={`rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent`}
          >
            <div className="flex gap-2 items-center">
              <span>Resolvidas</span>
              <Badge variant="outline">{allReportsData.reports?.filter(r => r.status === 'resolvido').length || 0}</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="rejeitado" 
            className={`rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent`}
          >
            <div className="flex gap-2 items-center">
              <span>Rejeitadas</span>
              <Badge variant="outline">{allReportsData.reports?.filter(r => r.status === 'rejeitado').length || 0}</Badge>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendente" className="mt-0">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="em-analise" className="mt-0">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="resolvido" className="mt-0">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="rejeitado" className="mt-0">
          {renderContent()}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Report #{currentReport?.id}</DialogTitle>
            <DialogDescription>
              Criada em {currentReport && new Date(currentReport.createdAt).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Tipo de Report</Label>
                <p>
                  {currentReport?.type?.name || 
                   reportTypes.find((type: ReportType) => type.id === currentReport?.reportTypeId)?.name || 
                   'Desconhecido'}
                </p>
              </div>
              
              <div>
                <Label className="font-semibold">Título</Label>
                <p>{currentReport?.title}</p>
              </div>
              
              <div>
                <Label className="font-semibold">Descrição</Label>
                <div className="max-h-36 overflow-y-auto bg-muted p-2 rounded text-sm">
                  {currentReport?.description}
                </div>
              </div>
              
              {currentReport?.url && (
                <div>
                  <Label className="font-semibold">URL Reportada</Label>
                  <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                    <a href={currentReport.url} target="_blank" rel="noopener noreferrer">
                      {currentReport.url.substring(0, 40)}
                      {currentReport.url.length > 40 ? '...' : ''}
                    </a>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              )}
              
              {currentReport?.evidence && (
                <div>
                  <Label className="font-semibold">Evidência</Label>
                  <div className="mt-1">
                    <div className="rounded-md overflow-hidden border border-gray-200 mb-2">
                      <img 
                        src={currentReport.evidence} 
                        alt="Evidência enviada" 
                        className="w-full max-h-[300px] object-contain"
                      />
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={currentReport.evidence} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <FileIcon className="h-4 w-4" />
                        Ver em tamanho original
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Status Atual</Label>
                <div className="mt-1">
                  <Badge className={`${statusLabels[currentReport?.status || 'pending'].color} text-xs`}>
                    {statusLabels[currentReport?.status || 'pending'].label}
                  </Badge>
                </div>
                {currentReport?.resolvedat && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Resolvido em: {new Date(currentReport.resolvedat).toLocaleString('pt-BR')}
                  </p>
                )}
                {currentReport?.respondedBy && currentReport?.admin?.username && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Por: {currentReport.admin.username}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="font-semibold">Usuário</Label>
                <p>{currentReport?.user?.username || 'Anônimo'}</p>
                {currentReport?.user?.email && (
                  <p className="text-sm text-muted-foreground">{currentReport.user.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="adminFeedback" className="font-semibold">
                  Feedback do Administrador
                </Label>
                <Textarea
                  id="adminFeedback"
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Adicione observações ou feedbacks sobre este report"
                  rows={3}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="font-semibold">Último Administrador</Label>
                <p>{currentReport?.admin?.username || 'Nenhum'}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="destructive" 
              onClick={handleDeleteReport}
              className="sm:order-first flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
            
            <div className="flex gap-2 flex-wrap sm:ml-auto">
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('pendente')}
                className="flex items-center gap-2"
                disabled={currentReport?.status === 'pendente'}
              >
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Pendente
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('em-analise')}
                className="flex items-center gap-2"
                disabled={currentReport?.status === 'em-analise'}
              >
                <Search className="h-4 w-4 text-blue-600" />
                Em análise
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('rejeitado')}
                className="flex items-center gap-2"
                disabled={currentReport?.status === 'rejeitado'}
              >
                <XCircle className="h-4 w-4 text-red-600" />
                Rejeitar
              </Button>
              
              <Button
                variant="default"
                onClick={() => handleUpdateStatus('resolvido')}
                className="flex items-center gap-2"
                disabled={currentReport?.status === 'resolvido'}
              >
                <CheckCircle2 className="h-4 w-4" />
                Resolver
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsManagement;