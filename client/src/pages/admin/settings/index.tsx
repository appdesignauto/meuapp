import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const HotmartSettings = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const { toast } = useToast();

  const handleTestCredentials = async () => {
    setIsTestingCredentials(true);
    setTestResult(null);
    
    try {
      // Usar as credenciais enviadas pelo usuário ou as armazenadas como variáveis de ambiente
      const response = await apiRequest('POST', '/api/test-hotmart-credentials', {
        clientId: clientId.trim() || undefined,
        clientSecret: clientSecret.trim() || undefined
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: 'Credenciais válidas',
          description: 'As credenciais da Hotmart foram validadas com sucesso.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Credenciais inválidas',
          description: result.message || 'Não foi possível validar as credenciais da Hotmart.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao testar credenciais:', error);
      setTestResult({
        success: false,
        message: 'Erro ao conectar com o servidor para testar as credenciais'
      });
      
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao testar as credenciais. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integração com Hotmart</CardTitle>
        <CardDescription>
          Teste as credenciais da API da Hotmart para verificar se a integração está funcionando corretamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="client-id">
              Client ID da Hotmart
            </label>
            <Input
              id="client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Deixe em branco para usar o valor configurado nas variáveis de ambiente"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium" htmlFor="client-secret">
              Client Secret da Hotmart
            </label>
            <Input
              id="client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Deixe em branco para usar o valor configurado nas variáveis de ambiente"
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={handleTestCredentials} 
            disabled={isTestingCredentials}
            className="mt-4"
          >
            {isTestingCredentials ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              'Testar Credenciais'
            )}
          </Button>
          
          {testResult && (
            <div className={`mt-4 p-4 rounded-md ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SiteSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Site</CardTitle>
        <CardDescription>
          Gerenciar configurações gerais do site como cores, logo e informações de contato.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-gray-500 italic text-center py-10">
          As configurações do site são gerenciadas na seção "Config Site"
        </div>
      </CardContent>
    </Card>
  );
};

const AnalyticsSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>
          Configurações de rastreamento e analytics do site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-gray-500 italic text-center py-10">
          As configurações de analytics são gerenciadas na seção "Analytics"
        </div>
      </CardContent>
    </Card>
  );
};

const SettingsPage = () => {
  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        <p className="text-gray-500">
          Gerencie as configurações globais e integrações do DesignAuto.
        </p>
        
        <Tabs defaultValue="hotmart">
          <TabsList className="mb-6">
            <TabsTrigger value="hotmart">Integração Hotmart</TabsTrigger>
            <TabsTrigger value="site">Configurações do Site</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hotmart">
            <HotmartSettings />
          </TabsContent>
          
          <TabsContent value="site">
            <SiteSettings />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;