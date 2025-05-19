import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  CheckCircle2, 
  CloudCog,
  Database,
  Loader2, 
  RefreshCw, 
  Server 
} from 'lucide-react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Interface para as informações de ambiente
interface EnvInfo {
  hotmartConfigured: boolean;
  supabaseConfigured: boolean;
  r2Configured: boolean;
  brevoConfigured: boolean;
}

// Componente principal da página de configurações do sistema
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>('hotmart');
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Configurações do Sistema</h1>
        
        <Tabs defaultValue="hotmart" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="hotmart" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>Hotmart</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <CloudCog className="w-4 h-4" />
              <span>Armazenamento</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>Banco de Dados</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Logs</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="hotmart">
            <HotmartSettings />
          </TabsContent>
          
          <TabsContent value="storage">
            <StorageSettings />
          </TabsContent>
          
          <TabsContent value="database">
            <DatabaseSettings />
          </TabsContent>
          
          <TabsContent value="logs">
            <LogSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Componente para as configurações da Hotmart
function HotmartSettings() {
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tokenInfo?: {
      expiraEm: number;
      tipo: string;
    };
  } | null>(null);
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null);
  const [isLoadingEnvInfo, setIsLoadingEnvInfo] = useState<boolean>(false);

  // Carregar informações do ambiente quando o componente for montado
  useEffect(() => {
    fetchEnvInfo();
  }, []);

  // Função para buscar informações do ambiente
  const fetchEnvInfo = async () => {
    setIsLoadingEnvInfo(true);
    try {
      const response = await apiRequest('GET', '/api/env-info');
      const data = await response.json();
      setEnvInfo(data);
    } catch (error) {
      console.error('Erro ao buscar informações do ambiente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as informações do ambiente',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEnvInfo(false);
    }
  };

  // Função para testar as credenciais da Hotmart
  const testCredentials = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Se os campos estiverem vazios e houver credenciais configuradas no .env, testar com essas
      const useEnvCredentials = !clientId && !clientSecret && envInfo?.hotmartConfigured;

      // Preparar os dados para enviar ao endpoint de teste
      const body = useEnvCredentials 
        ? {} 
        : { clientId, clientSecret };

      const response = await apiRequest('POST', '/api/test-hotmart-credentials', body);
      const data = await response.json();
      
      setTestResult(data);
      
      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Credenciais da Hotmart validadas com sucesso',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao validar credenciais da Hotmart',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao testar credenciais:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao testar credenciais',
      });
      toast({
        title: 'Erro',
        description: 'Falha ao comunicar com o servidor',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração da Hotmart</CardTitle>
          <CardDescription>
            Teste suas credenciais da Hotmart para garantir o funcionamento correto das integrações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEnvInfo ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {envInfo?.hotmartConfigured && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Credenciais Configuradas</AlertTitle>
                  <AlertDescription className="text-green-700">
                    As credenciais da Hotmart estão configuradas nas variáveis de ambiente. 
                    Você pode testá-las clicando no botão abaixo ou fornecer novas credenciais para teste.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    placeholder={envInfo?.hotmartConfigured ? "Usando valor configurado no .env" : "Insira seu Client ID da Hotmart"}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    placeholder={envInfo?.hotmartConfigured ? "Usando valor configurado no .env" : "Insira seu Client Secret da Hotmart"}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                  />
                </div>

                <Button
                  className="mt-4 w-full sm:w-auto"
                  onClick={testCredentials}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Testar Credenciais
                    </>
                  )}
                </Button>

                {testResult && (
                  <Alert className={`mt-4 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                      {testResult.success ? 'Credenciais Válidas' : 'Credenciais Inválidas'}
                    </AlertTitle>
                    <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                      {testResult.message}
                      {testResult.success && testResult.tokenInfo && (
                        <div className="mt-2">
                          <p><strong>Tipo de Token:</strong> {testResult.tokenInfo.tipo}</p>
                          <p><strong>Expira em:</strong> {testResult.tokenInfo.expiraEm} segundos</p>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Outros componentes de configuração (implementação básica por enquanto)
function StorageSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Armazenamento</CardTitle>
        <CardDescription>
          Gerencie configurações de armazenamento (Supabase e Cloudflare R2)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Funcionalidade em desenvolvimento. Esta seção permitirá testar e gerenciar as configurações de armazenamento.</p>
      </CardContent>
    </Card>
  );
}

function DatabaseSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Banco de Dados</CardTitle>
        <CardDescription>
          Gerencie e monitore o banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Funcionalidade em desenvolvimento. Esta seção permitirá visualizar estatísticas e gerenciar o banco de dados.</p>
      </CardContent>
    </Card>
  );
}

function LogSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs do Sistema</CardTitle>
        <CardDescription>
          Visualize logs e eventos do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Funcionalidade em desenvolvimento. Esta seção permitirá visualizar logs e eventos do sistema.</p>
      </CardContent>
    </Card>
  );
}