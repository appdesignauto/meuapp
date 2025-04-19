import { useState, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  ArrowLeft, 
  Database, 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  ScrollArea,
  ScrollBar,
} from '@/components/ui/scroll-area';

interface StorageConnectionStatus {
  connected: boolean;
  message: string;
  logs: string[];
}

interface UploadTestResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  optimizedSummary?: {
    originalSize: number;
    optimizedSize: number;
    reduction: number;
    format: string;
    width: number;
    height: number;
  };
  timings?: {
    total: number;
    optimization?: number;
    upload?: number;
  };
  error?: string;
}

const StorageTestPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('supabase');
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StorageConnectionStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadTestResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Verificar se o usuário é admin
  if (user?.role !== 'admin') {
    toast({
      title: "Acesso negado",
      description: "Apenas administradores podem acessar esta página",
      variant: "destructive",
    });
    setLocation('/admin');
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      // Limpar resultados anteriores
      setUploadResult(null);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const checkConnection = async () => {
    try {
      setIsCheckingConnection(true);
      setConnectionStatus(null);
      
      const response = await fetch(`/api/admin/storage/check-connection?service=${activeTab}`);
      const data = await response.json();
      
      setConnectionStatus({
        connected: data.connected,
        message: data.message,
        logs: data.logs || []
      });

      if (data.connected) {
        toast({
          title: "Conexão estabelecida",
          description: `Conectado com sucesso ao serviço ${activeTab === 'supabase' ? 'Supabase Storage' : 'Cloudflare R2'}`,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setConnectionStatus({
        connected: false,
        message: `Erro ao verificar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        logs: []
      });
      
      toast({
        title: "Erro",
        description: "Não foi possível verificar a conexão com o serviço",
        variant: "destructive",
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const testUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Selecione um arquivo",
        description: "É necessário selecionar uma imagem para testar o upload",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadResult(null);
      
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await fetch(`/api/admin/storage/test-upload?service=${activeTab}`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      setUploadResult({
        success: result.success,
        message: result.message,
        imageUrl: result.imageUrl,
        optimizedSummary: result.optimizedSummary,
        timings: result.timings,
        error: result.error
      });
      
      if (result.success) {
        toast({
          title: "Upload concluído",
          description: `A imagem foi enviada com sucesso para ${activeTab === 'supabase' ? 'Supabase Storage' : 'Cloudflare R2'}`,
        });
      } else {
        toast({
          title: "Falha no upload",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no teste de upload:', error);
      setUploadResult({
        success: false,
        message: `Erro no teste de upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      });
      
      toast({
        title: "Erro",
        description: "Não foi possível realizar o teste de upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Renderizar logs formatados
  const renderLogs = (logs: string[]) => {
    if (!logs || logs.length === 0) return <p className="text-gray-500 italic">Nenhum log disponível</p>;
    
    return (
      <ScrollArea className="h-[200px] w-full rounded-md border">
        <div className="p-4">
          {logs.map((log, index) => (
            <div key={index} className="py-1 border-b border-gray-100 last:border-0">
              <span className="text-sm font-mono">{log}</span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header com navegação de volta */}
        <header className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="h-8 mr-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Teste de Armazenamento</h1>
            </div>
          </div>
          <p className="text-gray-500 mt-1">
            Ferramenta para diagnóstico dos serviços de armazenamento (Supabase Storage e Cloudflare R2)
          </p>
        </header>

        {/* Conteúdo principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="supabase" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Supabase Storage
              </TabsTrigger>
              <TabsTrigger value="r2" className="flex items-center">
                <HardDrive className="h-4 w-4 mr-2" />
                Cloudflare R2
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab de Supabase Storage */}
          <TabsContent value="supabase">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" /> 
                    Supabase Storage
                  </CardTitle>
                  <CardDescription>
                    Verificar conexão com o Supabase Storage e testar upload de arquivos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Status da Conexão</h3>
                      {connectionStatus && activeTab === 'supabase' ? (
                        <div className="flex items-center">
                          {connectionStatus.connected ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <span>{connectionStatus.message}</span>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">Clique em "Verificar Conexão" para testar</div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Teste de Upload</h3>
                      <div className="flex flex-col space-y-2">
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                        {selectedFile ? (
                          <div className="rounded-md border p-2 bg-gray-50 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={triggerFileInput}>
                              Trocar
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={triggerFileInput} className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar Imagem
                          </Button>
                        )}
                        
                        {uploadResult && activeTab === 'supabase' && (
                          <div className={`mt-4 p-3 rounded-md ${uploadResult.success ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                            <div className="flex items-start">
                              {uploadResult.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                              )}
                              <div>
                                <p className="font-medium">{uploadResult.message}</p>
                                {uploadResult.error && (
                                  <p className="text-sm text-red-600 mt-1">{uploadResult.error}</p>
                                )}
                                
                                {uploadResult.success && uploadResult.optimizedSummary && (
                                  <div className="mt-2 text-sm">
                                    <p>Tamanho Original: {(uploadResult.optimizedSummary.originalSize / 1024).toFixed(2)} KB</p>
                                    <p>Tamanho Otimizado: {(uploadResult.optimizedSummary.optimizedSize / 1024).toFixed(2)} KB</p>
                                    <p>Redução: {uploadResult.optimizedSummary.reduction.toFixed(2)}%</p>
                                    <p>Dimensões: {uploadResult.optimizedSummary.width}x{uploadResult.optimizedSummary.height}</p>
                                  </div>
                                )}
                                
                                {uploadResult.success && uploadResult.imageUrl && (
                                  <div className="mt-3">
                                    <a
                                      href={uploadResult.imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm flex items-center"
                                    >
                                      Ver imagem <Info className="h-3 w-3 ml-1" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between space-x-2">
                  <Button 
                    onClick={checkConnection} 
                    disabled={isCheckingConnection}
                    variant="outline"
                  >
                    {isCheckingConnection && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    {!isCheckingConnection && <Database className="h-4 w-4 mr-2" />}
                    Verificar Conexão
                  </Button>
                  
                  <Button 
                    onClick={testUpload} 
                    disabled={isUploading || !selectedFile}
                    variant="default"
                  >
                    {isUploading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    {!isUploading && <Upload className="h-4 w-4 mr-2" />}
                    Testar Upload
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Exibição de logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Diagnóstico</CardTitle>
                  <CardDescription>
                    Informações detalhadas sobre a conexão e tentativas de upload
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connectionStatus && activeTab === 'supabase' ? (
                    renderLogs(connectionStatus.logs)
                  ) : (
                    <div className="text-gray-500 italic">Realize uma verificação de conexão para ver os logs</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab de Cloudflare R2 */}
          <TabsContent value="r2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="h-5 w-5 mr-2" /> 
                    Cloudflare R2
                  </CardTitle>
                  <CardDescription>
                    Verificar conexão com o Cloudflare R2 e testar upload de arquivos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Status da Conexão</h3>
                      {connectionStatus && activeTab === 'r2' ? (
                        <div className="flex items-center">
                          {connectionStatus.connected ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <span>{connectionStatus.message}</span>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">Clique em "Verificar Conexão" para testar</div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Teste de Upload</h3>
                      <div className="flex flex-col space-y-2">
                        <input 
                          type="file" 
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                        {selectedFile ? (
                          <div className="rounded-md border p-2 bg-gray-50 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={triggerFileInput}>
                              Trocar
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={triggerFileInput} className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar Imagem
                          </Button>
                        )}
                        
                        {uploadResult && activeTab === 'r2' && (
                          <div className={`mt-4 p-3 rounded-md ${uploadResult.success ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                            <div className="flex items-start">
                              {uploadResult.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                              )}
                              <div>
                                <p className="font-medium">{uploadResult.message}</p>
                                {uploadResult.error && (
                                  <p className="text-sm text-red-600 mt-1">{uploadResult.error}</p>
                                )}
                                
                                {uploadResult.success && uploadResult.optimizedSummary && (
                                  <div className="mt-2 text-sm">
                                    <p>Tamanho Original: {(uploadResult.optimizedSummary.originalSize / 1024).toFixed(2)} KB</p>
                                    <p>Tamanho Otimizado: {(uploadResult.optimizedSummary.optimizedSize / 1024).toFixed(2)} KB</p>
                                    <p>Redução: {uploadResult.optimizedSummary.reduction.toFixed(2)}%</p>
                                    <p>Dimensões: {uploadResult.optimizedSummary.width}x{uploadResult.optimizedSummary.height}</p>
                                  </div>
                                )}
                                
                                {uploadResult.success && uploadResult.imageUrl && (
                                  <div className="mt-3">
                                    <a
                                      href={uploadResult.imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm flex items-center"
                                    >
                                      Ver imagem <Info className="h-3 w-3 ml-1" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between space-x-2">
                  <Button 
                    onClick={checkConnection} 
                    disabled={isCheckingConnection}
                    variant="outline"
                  >
                    {isCheckingConnection && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    {!isCheckingConnection && <HardDrive className="h-4 w-4 mr-2" />}
                    Verificar Conexão
                  </Button>
                  
                  <Button 
                    onClick={testUpload} 
                    disabled={isUploading || !selectedFile}
                    variant="default"
                  >
                    {isUploading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    {!isUploading && <Upload className="h-4 w-4 mr-2" />}
                    Testar Upload
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Exibição de logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Diagnóstico</CardTitle>
                  <CardDescription>
                    Informações detalhadas sobre a conexão e tentativas de upload
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connectionStatus && activeTab === 'r2' ? (
                    renderLogs(connectionStatus.logs)
                  ) : (
                    <div className="text-gray-500 italic">Realize uma verificação de conexão para ver os logs</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Guia e informações adicionais */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Sobre os Serviços de Armazenamento</CardTitle>
              <CardDescription>
                Informações sobre as opções de armazenamento e como elas funcionam no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Armazenamento Principal</AlertTitle>
                  <AlertDescription>
                    O DesignAuto utiliza o Supabase Storage como serviço principal para armazenamento de 
                    imagens, com o Cloudflare R2 configurado como alternativa para upload.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <Database className="h-4 w-4 mr-2" /> Supabase Storage
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>Serviço principal para armazenamento de imagens</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>Armazenamento separado para avatares e imagens de artes</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>Integração com as políticas de segurança do Supabase (RLS)</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <HardDrive className="h-4 w-4 mr-2" /> Cloudflare R2
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>Serviço secundário para casos de falha no Supabase</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>Funcionamento baseado na API S3 da AWS</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>Configurado para funcionar como fallback automático</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StorageTestPage;