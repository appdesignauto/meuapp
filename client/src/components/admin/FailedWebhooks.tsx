import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Eye, RotateCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para os dados de webhooks falhos
type FailedWebhook = {
  id: number;
  webhookLogId: number;
  source: string;
  payload: any;
  errorMessage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  lastRetryAt: string | null;
};

// Tipos para estatísticas
type WebhookStats = {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  failed: number;
  bySource: Record<string, number>;
};

export default function FailedWebhooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedWebhook, setSelectedWebhook] = useState<FailedWebhook | null>(null);
  const [dialogType, setDialogType] = useState<'view' | 'retry'>('view');
  
  // Consulta para buscar webhooks falhos
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/webhooks/failed', statusFilter, sourceFilter],
    queryFn: async () => {
      const url = `/api/webhooks/failed?status=${statusFilter}&source=${sourceFilter}`;
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });
  
  // Mutação para reprocessar um webhook
  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/failed-webhooks/${id}/retry`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Webhook reprocessado',
        description: 'O webhook foi reprocessado com sucesso',
        variant: 'default',
      });
      
      // Invalidar consultas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks/failed'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao reprocessar webhook: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Função para abrir o diálogo de visualização
  const handleViewPayload = (webhook: FailedWebhook) => {
    setSelectedWebhook(webhook);
    setDialogType('view');
  };
  
  // Função para abrir o diálogo de reprocessamento
  const handleOpenRetryDialog = (webhook: FailedWebhook) => {
    setSelectedWebhook(webhook);
    setDialogType('retry');
  };
  
  // Função para executar o reprocessamento
  const handleRetry = () => {
    if (selectedWebhook) {
      retryMutation.mutate(selectedWebhook.id);
    }
  };
  
  // Renderizar status com cores apropriadas
  const renderStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processando</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Resolvido</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="h-3 w-3 mr-1" /> Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Renderizar origem com cores apropriadas
  const renderSource = (source: string) => {
    switch (source) {
      case 'hotmart':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Hotmart</Badge>;
      case 'doppus':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Doppus</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando webhooks...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-medium">Erro ao carregar webhooks</h3>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro ao buscar os webhooks falhos. Por favor, tente novamente.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/webhooks/failed'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }
  
  const webhooks = data?.webhooks || [];
  const stats: WebhookStats = data?.stats || {
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
    failed: 0,
    bySource: {}
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Webhooks Falhos</CardTitle>
        <CardDescription>
          Gerencie webhooks que falharam durante o processamento e precisam ser reprocessados.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="webhooks" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="webhooks">Lista de Webhooks</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>
          
          {/* Tab de lista de webhooks */}
          <TabsContent value="webhooks">
            <div className="flex flex-col space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium" htmlFor="status-filter">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger id="status-filter" className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="processing">Em processamento</SelectItem>
                      <SelectItem value="resolved">Resolvidos</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium" htmlFor="source-filter">
                    Origem
                  </label>
                  <Select
                    value={sourceFilter}
                    onValueChange={setSourceFilter}
                  >
                    <SelectTrigger id="source-filter" className="w-[180px]">
                      <SelectValue placeholder="Filtrar por origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="hotmart">Hotmart</SelectItem>
                      <SelectItem value="doppus">Doppus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('all');
                      setSourceFilter('all');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>
              
              {/* Tabela de webhooks */}
              {webhooks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum webhook falho encontrado com os filtros atuais.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Erro</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tentativas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((webhook: FailedWebhook) => (
                        <TableRow key={webhook.id}>
                          <TableCell className="font-medium">{webhook.id}</TableCell>
                          <TableCell>{renderSource(webhook.source)}</TableCell>
                          <TableCell>{renderStatus(webhook.status)}</TableCell>
                          <TableCell className="max-w-xs truncate" title={webhook.errorMessage}>
                            {webhook.errorMessage.length > 40
                              ? webhook.errorMessage.substring(0, 40) + '...'
                              : webhook.errorMessage}
                          </TableCell>
                          <TableCell title={new Date(webhook.createdAt).toLocaleString('pt-BR')}>
                            {formatDistanceToNow(new Date(webhook.createdAt), { locale: ptBR, addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            {webhook.retryCount || 0}
                            {webhook.lastRetryAt && (
                              <span className="text-xs text-muted-foreground block">
                                Última: {formatDistanceToNow(new Date(webhook.lastRetryAt), { locale: ptBR, addSuffix: true })}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPayload(webhook)}
                              title="Ver payload"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenRetryDialog(webhook)}
                              disabled={webhook.status === 'processing' || webhook.status === 'resolved'}
                              title="Reprocessar"
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Tab de estatísticas */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total || 0}</div>
                  <p className="text-sm text-muted-foreground">webhooks falhos</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats.pending || 0}</div>
                  <p className="text-sm text-muted-foreground">aguardando reprocessamento</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Resolvidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.resolved || 0}</div>
                  <p className="text-sm text-muted-foreground">reprocessados com sucesso</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Por origem</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stats.bySource || {}).map(([source, count]) => (
                  <Card key={source}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        {renderSource(source)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-sm text-muted-foreground">webhooks</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Diálogo para visualizar o payload do webhook */}
        <Dialog>
          <DialogTrigger asChild>
            <span className="hidden">Open Dialog</span> {/* Elemento invisível, controlado programaticamente */}
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogType === 'view' ? 'Detalhes do Webhook' : 'Reprocessar Webhook'}
              </DialogTitle>
              <DialogDescription>
                {dialogType === 'view' 
                  ? 'Visualizando payload completo do webhook.' 
                  : 'Tem certeza que deseja tentar reprocessar este webhook?'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedWebhook && (
              <div>
                {dialogType === 'view' && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-1">ID</h4>
                        <p>{selectedWebhook.id}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Origem</h4>
                        <p>{renderSource(selectedWebhook.source)}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Status</h4>
                        <p>{renderStatus(selectedWebhook.status)}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Data</h4>
                        <p>{new Date(selectedWebhook.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="col-span-2">
                        <h4 className="font-medium mb-1">Mensagem de erro</h4>
                        <p className="text-red-600">{selectedWebhook.errorMessage}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Payload (JSON)</h4>
                      <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
                        {JSON.stringify(selectedWebhook.payload, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
                
                {dialogType === 'retry' && (
                  <>
                    <div className="mb-4">
                      <p className="mb-2">
                        Você está prestes a reprocessar o webhook <strong>#{selectedWebhook.id}</strong>.
                      </p>
                      <p className="text-muted-foreground">
                        Este processo tentará executar novamente o webhook que falhou. Se funcionar, 
                        o status será atualizado para "Resolvido". Caso contrário, a contagem de tentativas 
                        será incrementada e o status permanecerá como "Falhou".
                      </p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-md mb-4">
                      <h4 className="font-medium mb-1">Detalhes</h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">ID:</span> {selectedWebhook.id}</li>
                        <li><span className="font-medium">Origem:</span> {selectedWebhook.source}</li>
                        <li><span className="font-medium">Erro original:</span> {selectedWebhook.errorMessage}</li>
                        <li><span className="font-medium">Tentativas anteriores:</span> {selectedWebhook.retryCount || 0}</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <DialogFooter>
              {dialogType === 'retry' && (
                <Button
                  variant="destructive"
                  onClick={handleRetry}
                  disabled={retryMutation.isPending}
                >
                  {retryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {retryMutation.isPending ? 'Reprocessando...' : 'Reprocessar webhook'}
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline">
                  {dialogType === 'view' ? 'Fechar' : 'Cancelar'}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}