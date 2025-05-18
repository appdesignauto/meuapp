import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interface para os logs de sincronização
interface SyncLog {
  id: number;
  status: 'started' | 'completed' | 'failed' | 'requested';
  message: string;
  details: any;
  created_at: string;
}

// Interface para estatísticas de assinaturas
interface SubscriptionStats {
  general: {
    total_users: number;
    lifetime_users: number;
    active_subscriptions: number;
    expired_subscriptions: number;
    hotmart_users: number;
  };
  planDistribution: {
    tipoplano: string;
    count: number;
  }[];
}

export default function HotmartIntegration() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Buscar logs de sincronização
  const { 
    data: syncLogs = [],
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refetchLogs
  } = useQuery<SyncLog[]>({ 
    queryKey: ['/api/hotmart/sync/logs'],
    enabled: activeTab === 'logs',
  });

  // Buscar estatísticas de assinaturas
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery<SubscriptionStats>({ 
    queryKey: ['/api/hotmart/subscription/stats'],
    enabled: activeTab === 'overview',
  });

  // Mutação para iniciar sincronização manual
  const startSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/hotmart/sync/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao iniciar sincronização');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sincronização iniciada',
        description: 'A sincronização manual foi iniciada com sucesso',
      });
      // Atualizar logs após sincronização
      setTimeout(() => {
        refetchLogs();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao iniciar sincronização',
        description: error.message || 'Ocorreu um erro ao iniciar a sincronização',
        variant: 'destructive',
      });
    },
  });

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Função para renderizar badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'started':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Em progresso</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Falha</Badge>;
      case 'requested':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Solicitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Função para renderizar ícone de status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'requested':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <InfoIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Integração Hotmart</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              refetchLogs();
              refetchStats();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            onClick={() => startSyncMutation.mutate()}
            disabled={startSyncMutation.isPending}
          >
            {startSyncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Iniciar Sincronização
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {isLoadingStats ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : statsError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Não foi possível carregar as estatísticas. Tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Usuários</CardTitle>
                  <CardDescription>Visão geral das assinaturas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de usuários:</span>
                      <span className="font-medium">{stats.general.total_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assinaturas ativas:</span>
                      <span className="font-medium text-green-600">{stats.general.active_subscriptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Acessos vitalícios:</span>
                      <span className="font-medium text-blue-600">{stats.general.lifetime_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assinaturas expiradas:</span>
                      <span className="font-medium text-orange-600">{stats.general.expired_subscriptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usuários Hotmart:</span>
                      <span className="font-medium text-purple-600">{stats.general.hotmart_users}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Plano</CardTitle>
                  <CardDescription>Tipos de planos dos usuários</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.planDistribution.length > 0 ? (
                      stats.planDistribution.map((plan, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-muted-foreground">{plan.tipoplano || "Sem plano"}</span>
                          <span className="font-medium">{plan.count}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Nenhum plano encontrado
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="logs">
          {isLoadingLogs ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logsError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Não foi possível carregar os logs. Tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          ) : syncLogs && syncLogs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Logs de Sincronização</CardTitle>
                <CardDescription>Histórico de sincronizações com a Hotmart</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncLogs.map((log: SyncLog) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {renderStatusIcon(log.status)}
                          <span className="ml-2 font-medium">{log.message}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStatusBadge(log.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {log.details && (
                        <>
                          <Separator className="my-2" />
                          <div className="mt-2 text-sm">
                            <div className="bg-muted rounded p-2 overflow-auto max-h-32">
                              <pre className="text-xs">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Nenhum log encontrado</h3>
                <p className="mt-2 text-center text-muted-foreground">
                  Não há logs de sincronização disponíveis. Inicie uma sincronização manual ou aguarde a próxima sincronização automática.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}