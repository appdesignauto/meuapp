import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Página de teste para as configurações de assinatura
 * Esta página é temporária e serve apenas para testar a funcionalidade
 */
export default function TestSubscriptionSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar as configurações
  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/subscription-settings');
      const data = await response.json();
      
      setSettings(data);
      console.log("Configurações carregadas:", data);
      
      toast({
        title: "Sucesso",
        description: "Configurações carregadas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      setError("Erro ao carregar configurações: " + (error instanceof Error ? error.message : String(error)));
      
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para salvar as configurações
  const saveTestSettings = async () => {
    setIsSaving(true);
    
    try {
      // Criar dados de teste para enviar
      const testData = {
        webhookUrl: 'https://example.com/webhook',
        webhookSecretKey: 'test-secret-key-123',
        hotmartEnvironment: 'sandbox',
        graceHoursAfterExpiration: 72,
        sendExpirationWarningDays: 5,
        defaultSubscriptionDuration: 12,
        autoDowngradeAfterExpiration: true,
        sendExpirationWarningEmails: true,
        autoMapProductCodes: true,
        notificationEmailSubject: 'Teste de notificação',
        notificationEmailTemplate: '<p>Template de teste</p>'
      };
      
      const response = await apiRequest('PUT', '/api/subscription-settings', testData);
      const data = await response.json();
      
      console.log("Resposta da API:", data);
      
      if (data.success) {
        toast({
          title: "Configurações salvas",
          description: "As configurações foram atualizadas com sucesso",
        });
        
        // Atualizar as configurações exibidas
        fetchSettings();
      } else {
        throw new Error(data.message || "Erro desconhecido");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar configurações ao montar o componente
  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Teste de Configurações de Assinatura</h1>
      
      <div className="flex space-x-4 mb-6">
        <Button
          onClick={fetchSettings}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Carregando...
            </>
          ) : (
            'Recarregar Configurações'
          )}
        </Button>
        
        <Button
          onClick={saveTestSettings}
          disabled={isSaving}
          variant="default"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações de Teste'
          )}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Erro:</p>
          <p>{error}</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Assinatura</CardTitle>
          <CardDescription>
            Visualização das configurações atuais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : settings ? (
            <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-[500px]">
              {JSON.stringify(settings, null, 2)}
            </pre>
          ) : (
            <p className="text-center text-muted-foreground">
              Nenhuma configuração encontrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}