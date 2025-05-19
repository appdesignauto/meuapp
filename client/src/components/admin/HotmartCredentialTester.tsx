import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

// Tipos para os resultados dos testes
type TestResult = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

const HotmartCredentialTester = () => {
  // Estados para armazenar as credenciais
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [environment, setEnvironment] = useState("sandbox"); // 'sandbox' ou 'production'
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Função para testar as credenciais
  const testCredentials = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch("/api/hotmart-test/test-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
          environment
        }),
      });
      
      const data = await response.json();
      
      setTestResult({
        success: data.success,
        message: data.message,
        data: data.data
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: "Erro ao testar credenciais",
        error: error.message || "Erro desconhecido"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verifica se o formulário está válido
  const isFormValid = clientId.trim() !== "" && clientSecret.trim() !== "";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Testar Credenciais da API Hotmart</CardTitle>
        <CardDescription>
          Preencha as credenciais da API Hotmart para verificar se elas estão funcionando corretamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={environment} onValueChange={setEnvironment}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sandbox">Ambiente Sandbox</TabsTrigger>
            <TabsTrigger value="production">Ambiente de Produção</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sandbox" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sandbox-client-id">Client ID (Sandbox)</Label>
              <Input
                id="sandbox-client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Digite o Client ID do ambiente sandbox"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sandbox-client-secret">Client Secret (Sandbox)</Label>
              <Input
                id="sandbox-client-secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Digite o Client Secret do ambiente sandbox"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="production" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="production-client-id">Client ID (Produção)</Label>
              <Input
                id="production-client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Digite o Client ID do ambiente de produção"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="production-client-secret">Client Secret (Produção)</Label>
              <Input
                id="production-client-secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Digite o Client Secret do ambiente de produção"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Área de resultado do teste */}
        {testResult && (
          <div className="mt-6">
            {testResult.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">Credenciais válidas!</AlertTitle>
                <AlertDescription className="text-green-700">
                  {testResult.message}
                  {testResult.data && (
                    <pre className="mt-2 p-2 bg-green-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800">Erro nas credenciais</AlertTitle>
                <AlertDescription className="text-red-700">
                  {testResult.message}
                  {testResult.error && (
                    <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-x-auto">
                      {testResult.error}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          <AlertCircle className="inline-block mr-1 h-4 w-4" />
          As credenciais serão usadas apenas para teste, não serão armazenadas
        </div>
        <Button 
          onClick={testCredentials} 
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            'Testar Credenciais'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HotmartCredentialTester;