import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ClipboardCopy, Loader2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HotmartCredentialTester() {
  const { toast } = useToast();
  const [environment, setEnvironment] = useState<'prod' | 'sandbox'>('prod');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [basicToken, setBasicToken] = useState('');
  const [showTestForm, setShowTestForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
  } | null>(null);

  // Gera o token Basic a partir do Client ID e Client Secret
  const generateBasicToken = () => {
    if (!clientId || !clientSecret) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, preencha o Client ID e o Client Secret.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = btoa(`${clientId}:${clientSecret}`);
      setBasicToken(`Basic ${token}`);
      setShowTestForm(true);
      
      toast({
        title: "Token gerado com sucesso",
        description: "Seu token Basic foi gerado. Agora você pode testar suas credenciais.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar token",
        description: "Ocorreu um erro ao gerar o token Basic. Verifique as credenciais.",
        variant: "destructive",
      });
    }
  };

  // Copia o token para a área de transferência
  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(basicToken);
    toast({
      title: "Token copiado",
      description: "O token foi copiado para a área de transferência.",
    });
  };

  // Testa as credenciais na API da Hotmart
  const testCredentials = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);

      // Configuração da URL de acordo com o ambiente
      const baseUrl = environment === 'prod' 
        ? 'https://developers.hotmart.com' 
        : 'https://sandbox.hotmart.com';
      
      const authUrl = `${baseUrl}/security/oauth/token`;
      
      // Prepara os parâmetros da requisição
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      
      // Configuração da requisição
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Authorization': basicToken,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params,
      });
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        setTestResult({
          success: true,
          data: data,
        });
        
        toast({
          title: "Credenciais válidas!",
          description: "Suas credenciais foram testadas com sucesso.",
        });
      } else {
        setTestResult({
          success: false,
          error: data.error_description || 'Erro ao verificar credenciais',
          data: data,
        });
        
        toast({
          title: "Credenciais inválidas",
          description: data.error_description || "Não foi possível autenticar com estas credenciais.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao testar credenciais:', error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      
      toast({
        title: "Erro ao testar",
        description: "Ocorreu um erro ao testar as credenciais. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resetar o formulário
  const resetForm = () => {
    setShowTestForm(false);
    setTestResult(null);
    setClientId('');
    setClientSecret('');
    setBasicToken('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Testador de API Hotmart</CardTitle>
        <CardDescription>
          Teste suas credenciais de API da Hotmart para garantir que estão funcionando corretamente
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!showTestForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="environment">Ambiente</Label>
              <Select
                value={environment}
                onValueChange={(value) => setEnvironment(value as 'prod' | 'sandbox')}
              >
                <SelectTrigger id="environment">
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prod">Produção</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-id">Client ID</Label>
              <Input
                id="client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Digite seu Client ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-secret">Client Secret</Label>
              <Input
                id="client-secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Digite seu Client Secret"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="basic-token">Token Basic</Label>
              <div className="flex">
                <Input
                  id="basic-token"
                  value={basicToken}
                  readOnly
                  className="rounded-r-none"
                />
                <Button
                  variant="outline"
                  className="rounded-l-none"
                  onClick={copyTokenToClipboard}
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Este é seu token Basic que será usado na autenticação
              </p>
            </div>
            
            {testResult && (
              <div className="mt-4">
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {testResult.success ? "Credenciais válidas!" : "Credenciais inválidas"}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    {testResult.success 
                      ? "Suas credenciais foram verificadas com sucesso. Você recebeu um token de acesso válido."
                      : `Erro: ${testResult.error}`
                    }
                  </AlertDescription>
                </Alert>
                
                <div className="mt-4 bg-muted p-4 rounded overflow-auto max-h-48">
                  <pre className="text-xs">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className={`${!showTestForm ? 'justify-end' : 'justify-between'}`}>
        {!showTestForm ? (
          <Button onClick={generateBasicToken}>
            Gerar Token Basic
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={resetForm}>
              Voltar
            </Button>
            
            {testResult ? (
              <Button onClick={resetForm}>
                Novo Teste
              </Button>
            ) : (
              <Button 
                onClick={testCredentials}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Testando...' : 'Testar Credenciais'}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}