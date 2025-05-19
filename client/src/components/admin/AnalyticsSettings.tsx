import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AnalyticsSettings() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
    useSandbox: true
  });

  const handleCredentialsTest = async () => {
    try {
      setTesting(true);

      const response = await fetch('/api/analytics/admin/hotmart-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: 'Credenciais da Hotmart validadas com sucesso.',
          variant: 'default',
        });
      } else {
        throw new Error(data.message || 'Erro ao validar credenciais');
      }
    } catch (error) {
      console.error('Erro ao testar credenciais:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao validar credenciais',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Tabs defaultValue="hotmart">
      <TabsList>
        <TabsTrigger value="hotmart">Hotmart</TabsTrigger>
      </TabsList>

      <TabsContent value="hotmart">
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Hotmart</CardTitle>
            <CardDescription>
              Teste as credenciais da API da Hotmart antes de configurar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={credentials.clientId}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  clientId: e.target.value
                }))}
                placeholder="Digite o Client ID da Hotmart"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={credentials.clientSecret}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  clientSecret: e.target.value
                }))}
                placeholder="Digite o Client Secret da Hotmart"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="useSandbox"
                checked={credentials.useSandbox}
                onCheckedChange={(checked) => setCredentials(prev => ({
                  ...prev,
                  useSandbox: checked
                }))}
              />
              <Label htmlFor="useSandbox">Usar ambiente Sandbox</Label>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              onClick={handleCredentialsTest}
              disabled={testing || !credentials.clientId || !credentials.clientSecret}
            >
              {testing ? (
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
      </TabsContent>
    </Tabs>
  );
}