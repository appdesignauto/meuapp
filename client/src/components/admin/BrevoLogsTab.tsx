import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, RefreshCw, Trash2, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailLog {
  timestamp: string;
  level: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface EmailStatus {
  apiKeyStatus: string;
  mode: string;
  environment: string;
  timestamps: {
    serverTime: string;
    localTime: string;
  };
}

interface SimulatedEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  sentAt: Date;
}

export default function BrevoLogsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Teste do Brevo - DesignAuto');
  const { toast } = useToast();

  const fetchEmailStatus = async () => {
    try {
      const response = await apiRequest('/api/email-diagnostics/status');
      setStatus(response);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar status do serviço de email",
        variant: "destructive",
      });
    }
  };

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/email-diagnostics/logs');
      
      // Processar logs para extrair informações relevantes
      const processedLogs = response.logs.map((log: string) => {
        const timestamp = new Date().toISOString();
        let type: 'success' | 'error' | 'info' | 'warning' = 'info';
        
        if (log.includes('✅') || log.includes('sucesso')) type = 'success';
        else if (log.includes('❌') || log.includes('Erro')) type = 'error';
        else if (log.includes('⚠️')) type = 'warning';
        
        return {
          timestamp,
          level: type,
          message: log,
          type
        };
      });
      
      setLogs(processedLogs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar logs de email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSimulatedEmails = async () => {
    try {
      const response = await apiRequest('/api/email-diagnostics/simulated-emails');
      setSimulatedEmails(response.emails || []);
    } catch (error) {
      console.error('Erro ao buscar emails simulados:', error);
    }
  };

  const clearLogs = async () => {
    try {
      await apiRequest('/api/email-diagnostics/clear-logs', {
        method: 'POST'
      });
      
      setLogs([]);
      toast({
        title: "Logs limpos",
        description: "Logs de email foram limpos com sucesso",
      });
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar logs",
        variant: "destructive",
      });
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email obrigatório",
        description: "Digite um email para teste",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest('/api/email-diagnostics/send-test', {
        method: 'POST',
        body: JSON.stringify({
          to: testEmail,
          subject: testSubject,
          html: `<h1>Teste do Brevo - DesignAuto</h1><p>Este é um email de teste enviado em ${new Date().toLocaleString()}.</p><p>Se você recebeu este email, a integração está funcionando corretamente!</p>`
        })
      });

      toast({
        title: "Email enviado",
        description: `Email de teste enviado para ${testEmail}`,
      });

      // Atualizar logs após envio
      await fetchEmailLogs();
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar email de teste",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Mail className="w-4 h-4 text-blue-500" />;
    }
  };

  useEffect(() => {
    fetchEmailStatus();
    fetchEmailLogs();
    fetchSimulatedEmails();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Logs do Brevo</h2>
          <p className="text-gray-600">Monitore os disparos de email via Brevo</p>
        </div>
        <Button
          onClick={() => {
            fetchEmailStatus();
            fetchEmailLogs();
            fetchSimulatedEmails();
          }}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status do Serviço */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Status do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium">API Key:</span>
                <div className="mt-1">
                  <Badge variant={status.apiKeyStatus.includes('Configurada') ? 'default' : 'destructive'}>
                    {status.apiKeyStatus}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Modo:</span>
                <div className="mt-1">
                  <Badge variant={status.mode === 'Produção' ? 'default' : 'secondary'}>
                    {status.mode}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Ambiente:</span>
                <div className="mt-1">
                  <Badge variant="outline">
                    {status.environment}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">Logs de Envio</TabsTrigger>
          <TabsTrigger value="test">Testar Envio</TabsTrigger>
          <TabsTrigger value="simulated">Emails Simulados</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Histórico de Envios</h3>
            <Button
              onClick={clearLogs}
              variant="outline"
              size="sm"
              disabled={logs.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Logs
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum log de email encontrado. Os logs aparecerão aqui após envios de email.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
                >
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 break-words">
                      {log.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Testar Envio de Email
              </CardTitle>
              <CardDescription>
                Envie um email de teste para verificar se a integração está funcionando
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email de destino:</label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Digite seu email para teste"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assunto:</label>
                <Input
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={sendTestEmail}
                disabled={!testEmail || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email de Teste
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emails Simulados</CardTitle>
              <CardDescription>
                Emails que foram simulados durante desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {simulatedEmails.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nenhum email simulado encontrado.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {simulatedEmails.map((email, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{email.subject}</span>
                        <Badge variant="secondary">Simulado</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>De: {email.from}</p>
                        <p>Para: {email.to}</p>
                        <p>Enviado: {format(new Date(email.sentAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}