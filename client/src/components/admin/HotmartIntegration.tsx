import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Upload,
  Users,
  Info,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Tipo para as estatísticas de assinatura
interface SubscriptionStats {
  general: {
    total_users: number;
    active_subscriptions: number;
    lifetime_users: number;
    expired_subscriptions: number;
    hotmart_users: number;
  };
  planDistribution: {
    tipoplano: string;
    count: number;
  }[];
}

// Tipo para os logs de sincronização
interface SyncLog {
  id: number;
  status: string;
  message: string;
  details: any;
  created_at: string;
}

const HotmartIntegration = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Buscar estatísticas de assinatura
  const { 
    data: stats, 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useQuery({
    queryKey: ['/api/hotmart/subscription/stats'],
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Buscar logs de sincronização
  const { 
    data: syncLogs, 
    isLoading: isLoadingLogs, 
    error: logsError 
  } = useQuery({
    queryKey: ['/api/hotmart/sync/logs'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    enabled: activeTab === 'logs',
  });

  // Mutação para iniciar sincronização manual
  const startSyncMutation = useMutation({
    mutationFn: () => 
      fetch('/api/hotmart/sync/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => {
        if (!res.ok) {
          throw new Error('Erro ao iniciar sincronização');
        }
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: 'Sincronização iniciada com sucesso',
        description: 'Os dados estão sendo sincronizados em segundo plano.',
        variant: 'default',
      });
      // Atualizar os logs após iniciar a sincronização
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/hotmart/sync/logs'] });
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao iniciar sincronização',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Renderizar badge de status do log
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Concluído</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Falha</Badge>;
      case 'started':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Em andamento</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // Renderizar detalhes do log formatados
  const renderLogDetails = (details: any) => {
    if (!details) return <span className="text-gray-500">Sem detalhes</span>;
    
    try {
      // Se os detalhes já forem um objeto, usar diretamente
      const detailsObj = typeof details === 'string' ? JSON.parse(details) : details;
      
      return (
        <div className="text-sm">
          {detailsObj.error && (
            <div className="text-red-500">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Erro: {detailsObj.error}
            </div>
          )}
          
          {detailsObj.users_processed !== undefined && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="font-medium">Usuários:</span> {detailsObj.users_processed}
              </div>
              <div>
                <span className="font-medium">Transações:</span> {detailsObj.transactions_processed || 0}
              </div>
              <div>
                <span className="font-medium">Assinaturas:</span> {detailsObj.subscriptions_updated || 0}
              </div>
              <div>
                <span className="font-medium">Erros:</span> {detailsObj.errors || 0}
              </div>
            </div>
          )}
          
          {!detailsObj.error && !detailsObj.users_processed && (
            <div className="text-gray-500">
              <Info className="h-3 w-3 inline mr-1" />
              {detailsObj.message || 'Detalhes adicionais não disponíveis'}
            </div>
          )}
        </div>
      );
    } catch (e) {
      return <span className="text-gray-500">{details}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Card de Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Usuários</CardTitle>
                <CardDescription>Visão geral dos usuários e assinaturas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingStats ? (
                  <div className="py-6 flex justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : statsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar estatísticas</AlertTitle>
                    <AlertDescription>
                      {(statsError as Error).message || 'Não foi possível carregar as estatísticas'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Total de Usuários</span>
                        <span className="text-2xl font-bold">{stats?.general?.total_users || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Assinaturas Ativas</span>
                        <span className="text-2xl font-bold">{stats?.general?.active_subscriptions || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Usuários Vitalícios</span>
                        <span className="text-2xl font-bold">{stats?.general?.lifetime_users || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Assinaturas Expiradas</span>
                        <span className="text-2xl font-bold">{stats?.general?.expired_subscriptions || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/hotmart/subscription/stats'] })}
                  disabled={isLoadingStats}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </CardFooter>
            </Card>

            {/* Card de Distribuição por Planos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Planos</CardTitle>
                <CardDescription>Usuários por tipo de plano</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="py-6 flex justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : statsError ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>
                      Não foi possível carregar a distribuição de planos
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {stats?.planDistribution && stats.planDistribution.length > 0 ? (
                      <div className="space-y-4">
                        {stats.planDistribution.map((plan, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-primary" />
                              <span>{plan.tipoplano || 'Sem plano'}</span>
                            </div>
                            <Badge variant="secondary">{plan.count}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-muted-foreground">
                        Nenhum plano encontrado
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Card de Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Ferramentas de sincronização</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => startSyncMutation.mutate()}
                  disabled={startSyncMutation.isPending}
                >
                  {startSyncMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Sincronizar Dados Agora
                    </>
                  )}
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  <p>A sincronização automática ocorre a cada hora.</p>
                  <p className="mt-2">Use o botão acima para forçar uma sincronização imediata com a Hotmart.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Logs de Sincronização */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Sincronização</CardTitle>
              <CardDescription>Histórico de sincronizações realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="py-6 flex justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro ao carregar logs</AlertTitle>
                  <AlertDescription>
                    {(logsError as Error).message || 'Não foi possível carregar o histórico de sincronizações'}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {syncLogs && syncLogs.length > 0 ? (
                    <Table>
                      <TableCaption>Histórico das últimas sincronizações</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Mensagem</TableHead>
                          <TableHead>Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncLogs.map((log: SyncLog) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {formatDate(log.created_at)}
                            </TableCell>
                            <TableCell>
                              {renderStatusBadge(log.status)}
                            </TableCell>
                            <TableCell>{log.message}</TableCell>
                            <TableCell>
                              {renderLogDetails(log.details)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground">
                      Nenhum log de sincronização encontrado
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/hotmart/sync/logs'] })}
                disabled={isLoadingLogs}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                Atualizar Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Configurações */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Integração</CardTitle>
              <CardDescription>Configurações da conexão com a Hotmart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Importante</AlertTitle>
                  <AlertDescription>
                    As credenciais da Hotmart são gerenciadas de forma segura através de variáveis de ambiente.
                    Para alterar essas credenciais, entre em contato com o administrador do sistema.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium">Credenciais Atuais</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Client ID:</span>
                        <span className="text-sm">••••••••••••••••</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Client Secret:</span>
                        <span className="text-sm">••••••••••••••••</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium">Configurações de Sincronização</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Frequência:</span>
                        <span className="text-sm">A cada hora</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Período de busca:</span>
                        <span className="text-sm">Últimos 7 dias</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HotmartIntegration;