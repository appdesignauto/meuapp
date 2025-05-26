import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Eye, MessageSquare, Trash2, User, FileText, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
    queryKey: ['/api/report-types'],
    enabled: true
  });

  // SOLUÇÃO DEFINITIVA PARA O FRONTEND - React Query Corrigido
  const {
    data: statsResponse,
    isLoading: isLoadingStats,
    error: statsError,
    isError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['reports-stats'], // Chave específica
    queryFn: async () => {
      console.log('🔄 [QUERY] Iniciando busca de stats...');
      
      try {
        const response = await fetch('/api/reports/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Evitar cache
          cache: 'no-store'
        });
        
        console.log('🔄 [QUERY] Status da resposta:', response.status);
        console.log('🔄 [QUERY] Headers da resposta:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [QUERY] Erro HTTP:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const textResponse = await response.text();
        console.log('🔄 [QUERY] Resposta bruta:', textResponse);
        
        let data;
        try {
          data = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('❌ [QUERY] Erro ao fazer parse do JSON:', parseError);
          throw new Error('Resposta não é um JSON válido');
        }
        
        console.log('✅ [QUERY] Dados parseados:', JSON.stringify(data, null, 2));
        
        // Verificar estrutura da resposta
        if (!data.stats) {
          console.warn('⚠️ [QUERY] Propriedade stats não encontrada na resposta');
          console.log('🔍 [QUERY] Propriedades disponíveis:', Object.keys(data));
        }
        
        return data;
        
      } catch (error) {
        console.error('❌ [QUERY] Erro na requisição:', error);
        throw error;
      }
    },
    refetchInterval: 30000,
    staleTime: 0, // Sempre considerar dados como stale
    cacheTime: 0, // Não fazer cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      console.log('🎉 [QUERY] Sucesso! Dados recebidos:', data);
    },
    onError: (error) => {
      console.error('💥 [QUERY] Erro no useQuery:', error);
    }
  });

  // Debug do estado do hook
  console.log('🔍 [HOOK] Estado atual:', {
    isLoading: isLoadingStats,
    isError,
    error: statsError?.message,
    hasData: !!statsResponse,
    rawResponse: statsResponse
  });

  // Processamento dos dados com logs
  const statsData = React.useMemo(() => {
    console.log('🔄 [MEMO] Processando stats...');
    console.log('🔄 [MEMO] statsResponse:', statsResponse);
    
    if (!statsResponse) {
      console.log('⚠️ [MEMO] Sem dados, retornando zeros');
      return {
        pending: 0,
        reviewing: 0,
        resolved: 0,
        rejected: 0,
        total: 0
      };
    }
    
    if (!statsResponse.stats) {
      console.log('⚠️ [MEMO] Sem propriedade stats, tentando estrutura alternativa');
      console.log('🔍 [MEMO] Propriedades disponíveis:', Object.keys(statsResponse));
      
      // Tentar estruturas alternativas
      if (statsResponse.pending !== undefined) {
        const altStats = {
          pending: statsResponse.pending || 0,
          reviewing: statsResponse.reviewing || 0,
          resolved: statsResponse.resolved || 0,
          rejected: statsResponse.rejected || 0,
          total: statsResponse.total || 0
        };
        console.log('✅ [MEMO] Usando estrutura alternativa:', altStats);
        return altStats;
      }
      
      return {
        pending: 0,
        reviewing: 0,
        resolved: 0,
        rejected: 0,
        total: 0
      };
    }
    
    const processedStats = {
      pending: parseInt(statsResponse.stats.pending) || 0,
      reviewing: parseInt(statsResponse.stats.reviewing) || 0,
      resolved: parseInt(statsResponse.stats.resolved) || 0,
      rejected: parseInt(statsResponse.stats.rejected) || 0,
      total: parseInt(statsResponse.stats.total) || 0
    };
    
    console.log('✅ [MEMO] Stats processadas:', processedStats);
    return processedStats;
  }, [statsResponse]);

  // Consulta principal para obter reports
  const statusFilter = activeTab !== 'all' ? activeTab : selectedStatusFilter !== 'all' ? selectedStatusFilter : null;
  const queryString = new URLSearchParams({
    page: currentPage.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    ...(statusFilter && { status: statusFilter }),
    ...(selectedTypeFilter !== 'all' && { typeId: selectedTypeFilter }),
    ...(searchTerm && { search: searchTerm })
  }).toString();

  const { 
    data: reportsData,
    isLoading: isLoadingReports,
    isError: isReportsError,
    error: reportsError
  } = useQuery({
    queryKey: ['/api/reports', currentPage, activeTab, selectedStatusFilter, selectedTypeFilter, searchTerm],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/reports?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar reports');
      }
      
      const data = await response.json();
      return data;
    }
  });

  // Mutation para atualizar um report
  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status, adminFeedback }: { id: number, status: string, adminFeedback?: string }) => {
      const data: any = { status };
      if (adminFeedback) {
        data.adminResponse = adminFeedback;
      }
      
      const response = await apiRequest('PUT', `/api/reports/${id}/respond`, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar report');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports/stats'] });
      setIsDetailsOpen(false);
      setFeedbackInput('');
      
      toast({
        title: 'Report atualizado',
        description: 'O status do report foi atualizado com sucesso',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar report:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o report',
        variant: 'destructive'
      });
    }
  });

  // Mutation para excluir um report
  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/reports/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir report');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports/stats'] });
      setIsDetailsOpen(false);
      
      toast({
        title: 'Report excluído',
        description: 'O report foi excluído com sucesso',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir report:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o report',
        variant: 'destructive'
      });
    }
  });

  // Funções auxiliares
  const handleViewDetails = (report: Report) => {
    setCurrentReport(report);
    setFeedbackInput('');
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = (status: string) => {
    if (!currentReport) return;
    
    updateReportMutation.mutate({
      id: currentReport.id,
      status,
      adminFeedback: feedbackInput || undefined
    });
  };

  const handleDeleteReport = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este report?')) {
      deleteReportMutation.mutate(id);
    }
  };

  // Estados de carregamento e erro
  if (isLoadingReports) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando reports...</p>
        </div>
      </div>
    );
  }

  if (isReportsError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar reports</h3>
          <p>Ocorreu um erro ao carregar os reports. Tente novamente.</p>
        </div>
      </div>
    );
  }

  const reports = reportsData?.reports || [];
  const totalReports = reportsData?.total || 0;
  const totalPages = Math.ceil(totalReports / ITEMS_PER_PAGE);

  // Filtrar reports com base nos filtros aplicados
  const filteredReports = reports.filter((report: Report) => {
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user?.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTypeFilter = selectedTypeFilter === 'all' || 
      report.reportTypeId.toString() === selectedTypeFilter;
    
    return matchesSearch && matchesTypeFilter;
  });

  // Paginação
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Reports</h1>
          <p className="text-muted-foreground">
            Gerencie denúncias e reports da comunidade
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por título, descrição ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
          <SelectTrigger className="w-[200px]">
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
      </div>

      {/* Tabs de status */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pendente">
            Pendentes ({statsData.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="em-analise">
            Em Análise ({statsData.reviewing || 0})
          </TabsTrigger>
          <TabsTrigger value="resolvido">
            Resolvidos ({statsData.resolved || 0})
          </TabsTrigger>
          <TabsTrigger value="rejeitado">
            Rejeitados ({statsData.rejected || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {paginatedReports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Nenhum report encontrado</h3>
                <p className="text-gray-600">
                  Não há reports para exibir com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedReports.map((report: Report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription>
                          Tipo: {reportTypes.find((type: ReportType) => type.id === report.reportTypeId)?.name || 
                            'Tipo não encontrado'} • 
                          Por: {report.user?.username || 'Usuário desconhecido'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusLabels[report.status]?.color}>
                          {statusLabels[report.status]?.label || report.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {report.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500 gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {report.user?.email || 'Email não disponível'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <span className="flex items-center px-4 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Dialog de detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Report</DialogTitle>
            <DialogDescription>
              Analise e responda ao report abaixo
            </DialogDescription>
          </DialogHeader>
          
          {currentReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Usuário</Label>
                  <p className="text-sm">{currentReport.user?.username || 'Desconhecido'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{currentReport.user?.email || 'Não disponível'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm">
                    {reportTypes.find((type: ReportType) => type.id === currentReport.reportTypeId)?.name || 
                      'Tipo não encontrado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={statusLabels[currentReport.status]?.color}>
                    {statusLabels[currentReport.status]?.label || currentReport.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Título</Label>
                <p className="text-sm mt-1">{currentReport.title}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                  {currentReport.description}
                </p>
              </div>

              {currentReport.evidence && (
                <div>
                  <Label className="text-sm font-medium">Evidência</Label>
                  <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                    {currentReport.evidence}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Data de Criação</Label>
                <p className="text-sm">
                  {new Date(currentReport.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              {currentReport.adminResponse && (
                <div>
                  <Label className="text-sm font-medium">Resposta do Administrador</Label>
                  <p className="text-sm mt-1 bg-blue-50 p-3 rounded-md">
                    {currentReport.adminResponse}
                  </p>
                  {currentReport.respondedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Respondido em: {new Date(currentReport.respondedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="feedback" className="text-sm font-medium">
                  Feedback do Administrador
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Digite sua resposta ou feedback..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleUpdateStatus('em-analise')}
                  disabled={updateReportMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Colocar em Análise
                </Button>
                
                <Button
                  onClick={() => handleUpdateStatus('resolvido')}
                  disabled={updateReportMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marcar como Resolvido
                </Button>
                
                <Button
                  onClick={() => handleUpdateStatus('rejeitado')}
                  disabled={updateReportMutation.isPending}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsManagement;