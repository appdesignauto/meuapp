import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, TrendingUp, Clock, Send, Eye, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface UpgradeStats {
  totalSent: number;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
}

interface EligibleUser {
  id: number;
  name: string;
  email: string;
  username: string;
  criadoem: string;
  nivelacesso: string;
  origemassinatura: string | null;
  isactive: boolean;
}

export default function UpgradeEmailsTab() {
  const [stats, setStats] = useState<UpgradeStats>({
    totalSent: 0,
    sentToday: 0,
    sentThisWeek: 0,
    sentThisMonth: 0
  });
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Buscar estatísticas
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/upgrade-emails/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // Buscar usuários elegíveis
  const fetchEligibleUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/upgrade-emails/eligible');
      const data = await response.json();
      setEligibleUsers(data.users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários elegíveis:', error);
      toast({
        title: "Erro",
        description: "Falha ao buscar usuários elegíveis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Enviar e-mails em lote
  const sendBatchEmails = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/upgrade-emails/send-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      toast({
        title: "Processamento Concluído",
        description: `${data.sent} e-mails enviados, ${data.failed} falharam`,
        variant: data.sent > 0 ? "default" : "destructive"
      });

      // Atualizar dados após envio
      await fetchStats();
      await fetchEligibleUsers();
    } catch (error) {
      console.error('Erro ao enviar e-mails em lote:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar e-mails em lote",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Enviar e-mail para usuário específico
  const sendToUser = async (userId: number, userEmail: string) => {
    try {
      const response = await fetch('/api/upgrade-emails/send-to-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "E-mail Enviado",
          description: `E-mail de upgrade enviado para ${userEmail}`,
          variant: "default"
        });

        // Atualizar dados após envio
        await fetchStats();
        await fetchEligibleUsers();
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar e-mail",
        variant: "destructive"
      });
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchStats();
    fetchEligibleUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">E-mails de Upgrade</h2>
          <p className="text-gray-600">Gerencie e-mails de upgrade para usuários orgânicos</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => { fetchStats(); fetchEligibleUsers(); }}
            variant="outline"
            disabled={loading}
          >
            <Eye className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={sendBatchEmails}
            disabled={sending || eligibleUsers.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Enviando...' : 'Enviar em Lote'}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-muted-foreground">Todos os tempos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentToday}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentThisWeek}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentThisMonth}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários Elegíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários Elegíveis para Upgrade
            <Badge variant="secondary">{eligibleUsers.length}</Badge>
          </CardTitle>
          <CardDescription>
            Usuários cadastrados organicamente (não via webhooks) nos últimos 30 dias que ainda não receberam e-mail de upgrade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Carregando usuários...</p>
              </div>
            </div>
          ) : eligibleUsers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário elegível</h3>
              <p className="text-gray-600">
                Não há usuários elegíveis para receber e-mail de upgrade no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eligibleUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{user.name || user.username}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {user.nivelacesso}
                        </Badge>
                        {!user.origemassinatura && (
                          <Badge variant="secondary" className="text-xs">
                            Orgânico
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Cadastrado em: {new Date(user.criadoem).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    onClick={() => sendToUser(user.id, user.email)}
                    size="sm"
                    variant="outline"
                    className="ml-4"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Enviar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações do Template */}
      <Card>
        <CardHeader>
          <CardTitle>Template Ativo</CardTitle>
          <CardDescription>
            E-mail de upgrade para usuários orgânicos com planos especiais e links de checkout da Doppus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Template Key:</Badge>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">upgrade_organico</code>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Variáveis:</Badge>
              <span className="text-sm">nome, email</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Critérios:</Badge>
              <span className="text-sm">Usuários com nível 'usuario', sem origem webhook, últimos 30 dias</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}