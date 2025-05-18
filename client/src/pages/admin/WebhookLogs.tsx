import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import WebhookLogList from '@/components/admin/WebhookLogList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Página principal de logs de webhook
export default function WebhookLogsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      webhookUrl: 'https://designauto.com.br/webhook/hotmart',
      secret: ''
    }
  });

  // Consulta para verificar o status da conexão com Hotmart
  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/admin/webhook/status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/webhook/status');
      if (!response.ok) {
        throw new Error('Erro ao verificar status da conexão');
      }
      return response.json();
    }
  });

  // Testar a conexão webhook manualmente
  const testWebhook = async (values: { webhookUrl: string; secret: string }) => {
    try {
      const response = await fetch('/api/admin/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao testar webhook: ${response.statusText}`);
      }
      
      const data = await response.json();
      toast({
        title: 'Teste realizado com sucesso',
        description: data.message || 'O teste do webhook foi concluído com sucesso',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Erro ao testar webhook',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Logs de Webhook | DesignAuto Admin</title>
      </Helmet>

      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Webhooks</h1>
            <p className="text-muted-foreground">
              Monitore e gerencie webhooks recebidos de integrações externas como Hotmart e Doppus
            </p>
          </div>
        </div>

        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="list">Logs de Webhook</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnóstico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <WebhookLogList />
          </TabsContent>
          
          <TabsContent value="diagnostics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status da conexão */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Status da Conexão</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => refetchStatus()}
                      disabled={isStatusLoading}
                    >
                      {isStatusLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Informações sobre a configuração de webhooks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isStatusLoading ? (
                    <div className="py-6 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : statusData ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Hotmart</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">URL do Webhook:</div>
                          <div className="font-mono">{statusData.hotmart?.webhookUrl || 'Não configurado'}</div>
                          
                          <div className="text-muted-foreground">Chave Secreta:</div>
                          <div className="font-mono">{statusData.hotmart?.hasSecret ? '••••••••' : 'Não configurado'}</div>
                          
                          <div className="text-muted-foreground">Status:</div>
                          <div className={`${statusData.hotmart?.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                            {statusData.hotmart?.isConfigured ? 'Configurado' : 'Não configurado'}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Doppus</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">URL do Webhook:</div>
                          <div className="font-mono">{statusData.doppus?.webhookUrl || 'Não configurado'}</div>
                          
                          <div className="text-muted-foreground">Chave Secreta:</div>
                          <div className="font-mono">{statusData.doppus?.hasSecret ? '••••••••' : 'Não configurado'}</div>
                          
                          <div className="text-muted-foreground">Status:</div>
                          <div className={`${statusData.doppus?.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                            {statusData.doppus?.isConfigured ? 'Configurado' : 'Não configurado'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground">
                      Nenhuma informação disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ferramenta de teste de webhook */}
              <Card>
                <CardHeader>
                  <CardTitle>Teste de Webhook</CardTitle>
                  <CardDescription>
                    Envie um webhook de teste para diagnosticar problemas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form 
                      onSubmit={form.handleSubmit(testWebhook)} 
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="webhookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Webhook</FormLabel>
                            <FormControl>
                              <Input placeholder="https://designauto.com.br/webhook/hotmart" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="secret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave Secreta (opcional)</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Chave secreta para assinatura" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={form.formState.isSubmitting}
                        >
                          {form.formState.isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testando...
                            </>
                          ) : (
                            'Testar Webhook'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Documentação */}
            <Card>
              <CardHeader>
                <CardTitle>Documentação e Recursos</CardTitle>
                <CardDescription>
                  Links úteis para configuração de webhooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                    href="https://developers.hotmart.com/docs/pt-BR/webhooks/introducao/" 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="mr-4">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <ExternalLink className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">Documentação da Hotmart</h3>
                      <p className="text-sm text-muted-foreground">
                        Recursos oficiais para configuração de webhooks na Hotmart
                      </p>
                    </div>
                  </a>
                  
                  <a 
                    href="https://documenter.getpostman.com/view/215460/Szf51VnD#3b9d6e09-8b64-46b8-a59f-e0e24d244e43" 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="mr-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <ExternalLink className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">API da Doppus</h3>
                      <p className="text-sm text-muted-foreground">
                        Documentação da API da Doppus para integrações
                      </p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}