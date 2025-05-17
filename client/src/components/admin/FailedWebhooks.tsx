import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';

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

type WebhookStats = {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  failed: number;
  bySource: Record<string, number>;
};

const PayloadViewer = ({ payload }: { payload: any }) => {
  return (
    <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[500px]">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
};

const FailedWebhooksComponent = () => {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<FailedWebhook[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedWebhook, setSelectedWebhook] = useState<FailedWebhook | null>(null);
  const [isPayloadDialogOpen, setIsPayloadDialogOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      let url = '/api/webhooks/failed';
      const params = new URLSearchParams();
      
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      
      if (selectedSource !== 'all') {
        params.append('source', selectedSource);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      setWebhooks(data.webhooks || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Erro ao buscar webhooks falhos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os webhooks falhos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar webhooks ao montar componente
  useEffect(() => {
    fetchWebhooks();
  }, [selectedStatus, selectedSource]);

  const handleRetryWebhook = async (webhookId: number) => {
    setIsRetrying(true);
    try {
      const response = await apiRequest('POST', `/api/webhooks/failed/${webhookId}/retry`);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Webhook reprocessado com sucesso!',
        });
      } else {
        toast({
          title: 'Erro no reprocessamento',
          description: result.message || 'Erro ao reprocessar webhook',
          variant: 'destructive',
        });
      }
      
      // Atualizar a lista após o reprocessamento
      fetchWebhooks();
    } catch (error) {
      console.error('Erro ao reprocessar webhook:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao reprocessar o webhook. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500', label: 'Pendente' },
      processing: { color: 'bg-blue-500', label: 'Processando' },
      resolved: { color: 'bg-green-500', label: 'Resolvido' },
      failed: { color: 'bg-red-500', label: 'Falhou' },
    };
    
    const { color, label } = statusMap[status] || { color: 'bg-gray-500', label: status };
    
    return (
      <Badge className={`${color} hover:${color}`}>
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const handleViewPayload = (webhook: FailedWebhook) => {
    setSelectedWebhook(webhook);
    setIsPayloadDialogOpen(true);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Webhooks com Falha</CardTitle>
        <CardDescription>
          Gerencie e reprocesse webhooks que falharam durante o processamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Falhas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="processing">Em processamento</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Origem</label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="doppus">Doppus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3 flex items-end">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => fetchWebhooks()}
              >
                Atualizar
              </Button>
            </div>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Carregando webhooks...</p>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="py-8 text-center border rounded-md">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum webhook encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>{webhook.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {webhook.source}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                      <TableCell className="max-w-[250px] truncate" title={webhook.errorMessage}>
                        {webhook.errorMessage}
                      </TableCell>
                      <TableCell>{webhook.retryCount || 0}</TableCell>
                      <TableCell>{formatDate(webhook.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewPayload(webhook)}
                          >
                            Ver Payload
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            disabled={webhook.status === 'resolved' || webhook.status === 'processing' || isRetrying}
                            onClick={() => handleRetryWebhook(webhook.id)}
                          >
                            Reprocessar
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

      {/* Dialog para visualizar payload */}
      <Dialog open={isPayloadDialogOpen} onOpenChange={setIsPayloadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Payload do Webhook #{selectedWebhook?.id}</DialogTitle>
          </DialogHeader>
          {selectedWebhook && (
            <div className="mt-4">
              <h4 className="font-medium mb-1">Detalhes:</h4>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Origem: <span className="text-foreground font-medium">{selectedWebhook.source}</span></p>
                  <p className="text-sm text-muted-foreground">Status: <span className="text-foreground font-medium">{selectedWebhook.status}</span></p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data: <span className="text-foreground font-medium">{formatDate(selectedWebhook.createdAt)}</span></p>
                  <p className="text-sm text-muted-foreground">Tentativas: <span className="text-foreground font-medium">{selectedWebhook.retryCount || 0}</span></p>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-medium mb-1">Mensagem de Erro:</h4>
                <div className="bg-muted p-2 rounded text-sm">
                  {selectedWebhook.errorMessage}
                </div>
              </div>
              <h4 className="font-medium mb-1">Payload:</h4>
              <PayloadViewer payload={selectedWebhook.payload} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FailedWebhooksComponent;