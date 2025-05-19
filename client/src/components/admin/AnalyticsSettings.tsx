import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

// Interface para as informações de ambiente
interface EnvInfo {
  hotmartConfigured: boolean;
  supabaseConfigured: boolean;
  r2Configured: boolean;
  brevoConfigured: boolean;
}

export default function AnalyticsSettings() {
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
    <Tabs defaultValue="hotmart">
      <TabsList>
        <TabsTrigger value="hotmart">Hotmart</TabsTrigger>
        <TabsTrigger value="armazenamento">Armazenamento</TabsTrigger>
      </TabsList>

      <TabsContent value="hotmart">
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Hotmart</CardTitle>
            <CardDescription>
              Teste suas credenciais da Hotmart para garantir o funcionamento correto das integrações
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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

          <CardFooter>
            <Button
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
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="armazenamento">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Armazenamento</CardTitle>
            <CardDescription>
              Gerencie configurações de armazenamento (Supabase e Cloudflare R2)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEnvInfo ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {envInfo?.supabaseConfigured && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Supabase Configurado</AlertTitle>
                    <AlertDescription className="text-green-700">
                      As credenciais do Supabase estão configuradas nas variáveis de ambiente.
                    </AlertDescription>
                  </Alert>
                )}
                
                {envInfo?.r2Configured && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Cloudflare R2 Configurado</AlertTitle>
                    <AlertDescription className="text-green-700">
                      As credenciais do Cloudflare R2 estão configuradas nas variáveis de ambiente.
                    </AlertDescription>
                  </Alert>
                )}
                
                {!envInfo?.supabaseConfigured && !envInfo?.r2Configured && (
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-800">Nenhum Armazenamento Configurado</AlertTitle>
                    <AlertDescription className="text-red-700">
                      Configure Supabase ou Cloudflare R2 para armazenamento de arquivos.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}