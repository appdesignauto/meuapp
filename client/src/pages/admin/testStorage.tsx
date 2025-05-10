import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function TestStoragePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const testStorage = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/admin/test-storage-service');
      const data = await response.json();
      setResults(data);
      
      toast({
        title: "Teste concluído",
        description: data.configStatus.success 
          ? "Conexão com o serviço de armazenamento está funcionando corretamente" 
          : "Problemas detectados na conexão com o serviço de armazenamento",
        variant: data.configStatus.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Erro ao testar serviço de storage:", error);
      toast({
        title: "Erro ao testar serviço",
        description: "Não foi possível executar o teste de armazenamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Diagnóstico de Armazenamento</h1>
        <p className="text-gray-600 mb-6">
          Esta página permite testar a conexão com o serviço de armazenamento (Supabase Storage)
          e diagnosticar possíveis problemas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Conexão</CardTitle>
              <CardDescription>
                Execute o teste para verificar se o sistema consegue se conectar e realizar 
                operações básicas no serviço de armazenamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testStorage} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executando teste...
                  </>
                ) : (
                  'Executar Teste de Conexão'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas para Solução de Problemas</CardTitle>
              <CardDescription>
                Caso haja problemas, verifique as seguintes configurações:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Verifique se as chaves da API do Supabase estão configuradas corretamente</li>
                <li>Confirme que a URL do Supabase está correta</li>
                <li>Verifique se o bucket "designautoimages" existe</li>
                <li>Verifique as permissões do bucket</li>
                <li>Certifique-se de estar usando a SERVICE_ROLE_KEY para contornar o RLS</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {results && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Resultados do Teste</CardTitle>
              <CardDescription>
                Detalhes do diagnóstico do serviço de armazenamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Configuração do Supabase</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge variant={results.configStatus.serviceRoleConfigured ? "default" : "destructive"} className="mr-2">
                        {results.configStatus.serviceRoleConfigured ? "OK" : "FALTA"}
                      </Badge>
                      <span>SERVICE_ROLE_KEY: {results.configStatus.serviceRoleConfigured ? "Configurada" : "Não configurada"}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant={results.configStatus.anonKeyConfigured ? "default" : "destructive"} className="mr-2">
                        {results.configStatus.anonKeyConfigured ? "OK" : "FALTA"}
                      </Badge>
                      <span>ANON_KEY: {results.configStatus.anonKeyConfigured ? "Configurada" : "Não configurada"}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant={results.configStatus.supabaseUrlConfigured ? "default" : "destructive"} className="mr-2">
                        {results.configStatus.supabaseUrlConfigured ? "OK" : "FALTA"}
                      </Badge>
                      <span>SUPABASE_URL: {results.configStatus.supabaseUrlConfigured ? "Configurada" : "Não configurada"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Teste de Listagem de Buckets</h3>
                  <div className="p-4 bg-gray-100 rounded-md">
                    {results.bucketsResult.success ? (
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Sucesso</p>
                          <p className="text-sm text-gray-600">
                            Buckets encontrados: {results.bucketsResult.buckets?.join(', ')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Falha</p>
                          <p className="text-sm text-red-600">{results.bucketsResult.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Teste de Upload de Imagem</h3>
                  <div className="p-4 bg-gray-100 rounded-md">
                    {results.uploadResult.success ? (
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Sucesso</p>
                          <p className="text-sm text-gray-600">
                            Imagem enviada com sucesso: {results.uploadResult.imageUrl}
                          </p>
                          <p className="text-sm text-gray-600">
                            Tipo de armazenamento: {results.uploadResult.storageType}
                          </p>
                          {results.uploadResult.imageUrl && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Imagem enviada:</p>
                              <img 
                                src={results.uploadResult.imageUrl} 
                                alt="Imagem de teste enviada" 
                                className="border border-gray-300 rounded-md h-32 w-32 object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Falha</p>
                          <p className="text-sm text-red-600">{results.uploadResult.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {results.uploadResult.logs && results.uploadResult.logs.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Logs de Diagnóstico</h3>
                      <div className="p-4 bg-black text-white rounded-md font-mono text-sm overflow-x-auto">
                        <pre className="whitespace-pre-wrap">
                          {results.uploadResult.logs.join('\n')}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Links Úteis para Solução de Problemas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <a 
                  href="https://supabase.com/docs/guides/storage/security/access-control" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Documentação de Controle de Acesso do Supabase Storage
                </a>
              </li>
              <li>
                <a 
                  href="https://supabase.com/docs/reference/javascript/storage-createbucket" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  API de Buckets do Supabase
                </a>
              </li>
              <li>
                <a 
                  href="https://supabase.com/docs/guides/storage/uploads" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Guia de Uploads no Supabase Storage
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}