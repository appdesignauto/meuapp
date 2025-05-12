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
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  reviewing: { label: 'Em análise', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  resolved: { label: 'Resolvido', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
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

  // Consulta para obter tipos de denúncia
  const { 
    data: reportTypes = [],
    isLoading: isLoadingTypes,
    isError: isTypesError 
  } = useQuery({
    queryKey: ['/api/reports/types'],
    queryFn: async () => {
      try {
        // Primeiro tentamos carregar do endpoint da API
        const response = await fetch('/api/reports/types');
        if (response.ok) {
          return await response.json();
        }
        
        // Se a API falhar, carregamos do arquivo estático
        const staticResponse = await fetch('/data/report-types.json');
        if (staticResponse.ok) {
          return await staticResponse.json();
        }
        
        throw new Error('Não foi possível carregar os tipos de denúncia');
      } catch (error) {
        console.error('Erro ao carregar tipos de denúncia:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Consulta para obter denúncias
  const {
    data: reportsData = { reports: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
    isLoading: isLoadingReports,
    isError: isReportsError,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['/api/reports', activeTab],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/reports?page=1&limit=50`);
        console.log('Resposta da API de reports:', response);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao carregar denúncias');
        }
        
        const data = await response.json();
        console.log('Dados recebidos dos reports:', data);
        return data;
      } catch (error) {
        console.error('Erro ao buscar reports:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false
  });

  // Mutation para atualizar o status de uma denúncia
  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status, adminFeedback }: { id: number, status: string, adminFeedback?: string }) => {
      const data: any = { status };
      if (adminFeedback) {
        data.adminFeedback = adminFeedback;
      }
      
      const response = await apiRequest('PUT', `/api/reports/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar denúncia');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setIsDetailsOpen(false);
      setFeedbackInput('');
      
      toast({
        title: 'Denúncia atualizada',
        description: 'O status da denúncia foi atualizado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar denúncia',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para excluir uma denúncia
  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/reports/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir denúncia');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setIsDetailsOpen(false);
      
      toast({
        title: 'Denúncia excluída',
        description: 'A denúncia foi removida permanentemente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir denúncia',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Filtra denúncias com base nos critérios de pesquisa e filtros
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
          report.typeId === parseInt(selectedTypeFilter);
          
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
    
    updateReportMutation.mutate({
      id: currentReport.id,
      status,
      adminFeedback: feedbackInput
    });
  };

  // Função para excluir denúncia
  const handleDeleteReport = () => {
    if (!currentReport) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta denúncia? Esta ação não pode ser desfeita.')) {
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
          <AlertDescription>Não foi possível carregar as denúncias. Tente novamente mais tarde.</AlertDescription>
        </Alert>
      );
    }

    if (paginatedReports.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Nenhuma denúncia encontrada</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all'
              ? 'Tente ajustar os filtros ou critérios de pesquisa'
              : 'Não há denúncias nesta categoria no momento'}
          </p>
        </div>
      );
    }

    return (
      <>
        <Table>
          <TableCaption>
            Mostrando {paginatedReports.length} de {filteredReports.length} denúncias
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
                  {report.type?.name || 
                   reportTypes.find((type: ReportType) => type.id === report.typeId)?.name || 
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

  // Renderiza as estatísticas das denúncias
  const renderStats = () => {
    if (isLoadingReports) return null;
    
    // Conta denúncias por status
    const reportStats = {
      total: reportsData.reports?.length || 0,
      pending: reportsData.reports?.filter((r: Report) => r.status === 'pending').length || 0,
      reviewing: reportsData.reports?.filter((r: Report) => r.status === 'reviewing').length || 0,
      resolved: reportsData.reports?.filter((r: Report) => r.status === 'resolved').length || 0,
      rejected: reportsData.reports?.filter((r: Report) => r.status === 'rejected').length || 0,
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
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Denúncias</h2>
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
            placeholder="Pesquisar denúncias..."
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
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="reviewing">Em análise</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="mb-4 border-b w-full justify-start rounded-none gap-4 bg-transparent p-0">
          <TabsTrigger 
            value="pending" 
            className={`rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent`}
          >
            Pendentes
          </TabsTrigger>
          <TabsTrigger 
            value="reviewing" 
            className={`rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent`}
          >
            Em análise
          </TabsTrigger>
          <TabsTrigger 
            value="resolved" 
            className={`rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent`}
          >
            Resolvidas
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className={`rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent`}
          >
            Rejeitadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-0">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="reviewing" className="mt-0">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="resolved" className="mt-0">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-0">
          {renderContent()}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Denúncia #{currentReport?.id}</DialogTitle>
            <DialogDescription>
              Criada em {currentReport && new Date(currentReport.createdAt).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Tipo de Denúncia</Label>
                <p>
                  {currentReport?.type?.name || 
                   reportTypes.find((type: ReportType) => type.id === currentReport?.typeId)?.name || 
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
              
              {currentReport?.evidenceUrl && (
                <div>
                  <Label className="font-semibold">Evidência</Label>
                  <div className="mt-1">
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={currentReport.evidenceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <FileIcon className="h-4 w-4" />
                        Ver Evidência
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
                  placeholder="Adicione observações ou feedbacks sobre esta denúncia"
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
                onClick={() => handleUpdateStatus('pending')}
                className="flex items-center gap-2"
                disabled={currentReport?.status === 'pending'}
              >
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Pendente
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('reviewing')}
                className="flex items-center gap-2"
                disabled={currentReport?.status === 'reviewing'}
              >
                <Search className="h-4 w-4 text-blue-600" />
                Em análise
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('rejected')}
                className="flex items-center gap-2"
                disabled={currentReport?.status === 'rejected'}
              >
                <XCircle className="h-4 w-4 text-red-600" />
                Rejeitar
              </Button>
              
              <Button
                variant="default"
                onClick={() => handleUpdateStatus('resolved')}
                className="flex items-center gap-2"
                disabled={currentReport?.status === 'resolved'}
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