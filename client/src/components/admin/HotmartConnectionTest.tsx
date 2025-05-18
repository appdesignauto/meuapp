import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HotmartConnectionTest() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastConnectionStatus, setLastConnectionStatus] = useState<{
    success: boolean;
    message: string;
    timestamp: Date;
  } | null>(null);

  // Carregar o status da última conexão do localStorage ao inicializar
  useEffect(() => {
    const savedStatus = localStorage.getItem('hotmartLastConnectionStatus');
    if (savedStatus) {
      try {
        const parsed = JSON.parse(savedStatus);
        setLastConnectionStatus({
          ...parsed,
          timestamp: new Date(parsed.timestamp)
        });
      } catch (error) {
        console.error('Erro ao carregar status de conexão:', error);
      }
    }
  }, []);

  // Função para testar a conexão com a API da Hotmart
  const testConnection = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/hotmart/check-connectivity');
      
      if (!response.ok) {
        throw new Error('Falha ao verificar conectividade');
      }
      
      const data = await response.json();
      const status = {
        success: data.success,
        message: data.message || (data.success ? 'Conexão estabelecida com sucesso!' : 'Falha na conexão'),
        timestamp: new Date()
      };
      
      // Atualiza o estado
      setLastConnectionStatus(status);
      
      // Salva o status no localStorage
      localStorage.setItem('hotmartLastConnectionStatus', JSON.stringify(status));
      
      // Exibe notificação
      toast({
        title: data.success ? "Conexão bem-sucedida" : "Falha na conexão",
        description: data.message || (data.success ? 'API da Hotmart conectada com sucesso!' : 'Não foi possível conectar à API da Hotmart.'),
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Erro ao testar conexão com a Hotmart:', error);
      const status = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao verificar conexão',
        timestamp: new Date()
      };
      
      // Atualiza o estado
      setLastConnectionStatus(status);
      
      // Salva o status no localStorage
      localStorage.setItem('hotmartLastConnectionStatus', JSON.stringify(status));
      
      // Exibe notificação
      toast({
        title: "Erro de conexão",
        description: "Não foi possível verificar a conexão com a API da Hotmart.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status da Integração Hotmart</CardTitle>
        <CardDescription>
          Verifique a conectividade com a API da Hotmart para garantir o funcionamento correto da integração
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lastConnectionStatus && (
          <Alert variant={lastConnectionStatus.success ? "default" : "destructive"} className="mb-4">
            <div className="flex items-center gap-2">
              {lastConnectionStatus.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{lastConnectionStatus.success ? 'Conexão estabelecida' : 'Problema de conexão'}</AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {lastConnectionStatus.message}
              <p className="text-xs text-muted-foreground mt-1">
                Última verificação: {lastConnectionStatus.timestamp.toLocaleString()}
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-muted-foreground mt-2">
          <p>
            A conexão com a API da Hotmart é necessária para:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Obter informações atualizadas sobre produtos</li>
            <li>Verificar status de assinaturas</li>
            <li>Atualizar automaticamente planos de usuários</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={testConnection} 
          disabled={isLoading} 
          variant="outline"
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? 'Verificando...' : 'Verificar Conexão'}
        </Button>
      </CardFooter>
    </Card>
  );
}