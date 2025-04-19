import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, AlertCircle, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StorageTestPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("supabase");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{
    supabase: "unknown" | "connected" | "error";
    r2: "unknown" | "connected" | "error";
  }>({
    supabase: "unknown",
    r2: "unknown"
  });

  // Função para adicionar log
  const addLog = (message: string) => {
    setTestLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Verificar conexão com os serviços
  const checkConnections = async () => {
    addLog("Iniciando verificação de conexão com serviços de armazenamento...");
    
    // Verificar Supabase
    try {
      setConnectionStatus(prev => ({ ...prev, supabase: "unknown" }));
      addLog("Verificando conexão com Supabase...");
      
      const supabaseResponse = await fetch("/api/admin/storage/check-connection?service=supabase");
      const supabaseData = await supabaseResponse.json();
      
      if (supabaseResponse.ok && supabaseData.connected) {
        setConnectionStatus(prev => ({ ...prev, supabase: "connected" }));
        addLog("✅ Conexão com Supabase estabelecida com sucesso!");
        addLog(`Detalhes: ${supabaseData.message || "Serviço disponível"}`);
      } else {
        setConnectionStatus(prev => ({ ...prev, supabase: "error" }));
        addLog(`❌ Falha na conexão com Supabase: ${supabaseData.message || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      setConnectionStatus(prev => ({ ...prev, supabase: "error" }));
      addLog(`❌ Erro ao verificar conexão com Supabase: ${error.message || "Erro desconhecido"}`);
    }
    
    // Verificar R2
    try {
      setConnectionStatus(prev => ({ ...prev, r2: "unknown" }));
      addLog("Verificando conexão com Cloudflare R2...");
      
      const r2Response = await fetch("/api/admin/storage/check-connection?service=r2");
      const r2Data = await r2Response.json();
      
      if (r2Response.ok && r2Data.connected) {
        setConnectionStatus(prev => ({ ...prev, r2: "connected" }));
        addLog("✅ Conexão com Cloudflare R2 estabelecida com sucesso!");
        addLog(`Detalhes: ${r2Data.message || "Serviço disponível"}`);
      } else {
        setConnectionStatus(prev => ({ ...prev, r2: "error" }));
        addLog(`❌ Falha na conexão com Cloudflare R2: ${r2Data.message || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      setConnectionStatus(prev => ({ ...prev, r2: "error" }));
      addLog(`❌ Erro ao verificar conexão com Cloudflare R2: ${error.message || "Erro desconhecido"}`);
    }
  };

  // Selecionar arquivo
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Lidar com a mudança do arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar o arquivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Armazenar o arquivo selecionado
    setSelectedFile(file);
    setUploadResult(null);

    // Criar URL para preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    addLog(`Arquivo selecionado: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Limpar URL ao desmontar
    return () => URL.revokeObjectURL(objectUrl);
  };

  // Testar upload
  const handleTestUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione uma imagem para teste.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadResult(null);
    
    const service = activeTab; // "supabase" ou "r2"
    
    addLog(`Iniciando teste de upload para ${service.toUpperCase()}...`);
    addLog(`Arquivo: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`);

    try {
      // Criar FormData
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("service", service);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);

      // Fazer upload
      addLog(`Enviando requisição para /api/admin/storage/test-upload?service=${service}`);
      const response = await fetch(`/api/admin/storage/test-upload?service=${service}`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(95);

      const data = await response.json();
      addLog(`Resposta recebida: ${response.status} ${response.statusText}`);
      
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(data.message || data.error || "Erro no teste de upload");
      }

      // Upload bem-sucedido
      addLog(`✅ Upload para ${service.toUpperCase()} bem-sucedido!`);
      addLog(`URL da imagem: ${data.imageUrl}`);
      addLog(`Tipo de armazenamento: ${data.storageType || service}`);
      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((log: string) => addLog(`📋 ${log}`));
      }

      setUploadResult({
        success: true,
        data,
      });

      toast({
        title: `Upload para ${service.toUpperCase()} bem-sucedido`,
        description: "O teste foi concluído com sucesso.",
      });
    } catch (error: any) {
      setUploadProgress(100);
      addLog(`❌ Erro no teste de upload para ${service.toUpperCase()}: ${error.message}`);
      
      setUploadResult({
        success: false,
        error: error.message,
      });
      
      toast({
        title: `Erro no teste de upload para ${service.toUpperCase()}`,
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Limpar o teste
  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setUploadProgress(0);
    setTestLogs([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    addLog("Área de teste limpa");
  };

  // Verificar conexões ao montar o componente
  if (testLogs.length === 0) {
    setTimeout(checkConnections, 100);
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Serviços de Armazenamento</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs 
            defaultValue="supabase" 
            className="w-full"
            onValueChange={(value) => {
              setActiveTab(value);
              setUploadResult(null);
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="supabase" className="flex items-center gap-2">
                  Supabase
                  {connectionStatus.supabase === "connected" && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Conectado
                    </Badge>
                  )}
                  {connectionStatus.supabase === "error" && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                      Erro
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="r2" className="flex items-center gap-2">
                  Cloudflare R2
                  {connectionStatus.r2 === "connected" && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Conectado
                    </Badge>
                  )}
                  {connectionStatus.r2 === "error" && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                      Erro
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <Button variant="outline" size="sm" onClick={checkConnections}>
                Verificar Conexões
              </Button>
            </div>

            <TabsContent value="supabase">
              <Card>
                <CardHeader>
                  <CardTitle>Teste de Upload para Supabase</CardTitle>
                  <CardDescription>
                    Teste o upload de imagens para armazenamento no Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32 border-2 border-primary/20">
                      {previewUrl ? (
                        <AvatarImage src={previewUrl} alt="Preview" />
                      ) : (
                        <AvatarFallback>
                          Imagem
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                          Upload em progresso: {uploadProgress}%
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={handleFileSelect}
                        disabled={uploading}
                        className="flex-1"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Selecionar Imagem
                      </Button>
                      
                      {selectedFile && (
                        <Button
                          variant="default"
                          onClick={handleTestUpload}
                          disabled={uploading}
                          className="flex-1"
                        >
                          {uploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <div className="mr-2 h-4 w-4 flex items-center justify-center">
                              {activeTab === "supabase" ? "S" : "R2"}
                            </div>
                          )}
                          Testar Upload
                        </Button>
                      )}
                      
                      {(selectedFile || uploadResult || testLogs.length > 0) && (
                        <Button
                          variant="outline"
                          onClick={handleClear}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {selectedFile && (
                      <div className="w-full p-3 bg-primary/5 rounded-md text-xs">
                        <p><strong>Arquivo selecionado:</strong> {selectedFile.name}</p>
                        <p><strong>Tamanho:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                        <p><strong>Tipo:</strong> {selectedFile.type}</p>
                      </div>
                    )}
                    
                    {uploadResult && (
                      <div className={`w-full p-3 rounded-md text-xs ${
                        uploadResult.success 
                          ? "bg-green-500/10 text-green-600" 
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        <div className="flex items-start gap-2">
                          {uploadResult.success ? (
                            <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold">
                              {uploadResult.success ? "Upload bem-sucedido:" : "Erro no upload:"}
                            </p>
                            {uploadResult.success ? (
                              <>
                                <p>URL: {uploadResult.data?.imageUrl || "N/A"}</p>
                                <p>Tipo: {uploadResult.data?.storageType || "N/A"}</p>
                                {uploadResult.data?.bucket && (
                                  <p>Bucket: {uploadResult.data.bucket}</p>
                                )}
                              </>
                            ) : (
                              <p>{uploadResult.error || "Erro desconhecido"}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="r2">
              <Card>
                <CardHeader>
                  <CardTitle>Teste de Upload para Cloudflare R2</CardTitle>
                  <CardDescription>
                    Teste o upload de imagens para armazenamento no Cloudflare R2
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32 border-2 border-primary/20">
                      {previewUrl ? (
                        <AvatarImage src={previewUrl} alt="Preview" />
                      ) : (
                        <AvatarFallback>
                          Imagem
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                          Upload em progresso: {uploadProgress}%
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={handleFileSelect}
                        disabled={uploading}
                        className="flex-1"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Selecionar Imagem
                      </Button>
                      
                      {selectedFile && (
                        <Button
                          variant="default"
                          onClick={handleTestUpload}
                          disabled={uploading}
                          className="flex-1"
                        >
                          {uploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <div className="mr-2 h-4 w-4 flex items-center justify-center">R2</div>
                          )}
                          Testar Upload
                        </Button>
                      )}
                      
                      {(selectedFile || uploadResult || testLogs.length > 0) && (
                        <Button
                          variant="outline"
                          onClick={handleClear}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {selectedFile && (
                      <div className="w-full p-3 bg-primary/5 rounded-md text-xs">
                        <p><strong>Arquivo selecionado:</strong> {selectedFile.name}</p>
                        <p><strong>Tamanho:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                        <p><strong>Tipo:</strong> {selectedFile.type}</p>
                      </div>
                    )}
                    
                    {uploadResult && (
                      <div className={`w-full p-3 rounded-md text-xs ${
                        uploadResult.success 
                          ? "bg-green-500/10 text-green-600" 
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        <div className="flex items-start gap-2">
                          {uploadResult.success ? (
                            <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold">
                              {uploadResult.success ? "Upload bem-sucedido:" : "Erro no upload:"}
                            </p>
                            {uploadResult.success ? (
                              <>
                                <p>URL: {uploadResult.data?.imageUrl || "N/A"}</p>
                                <p>Tipo: {uploadResult.data?.storageType || "N/A"}</p>
                                {uploadResult.data?.bucket && (
                                  <p>Bucket: {uploadResult.data.bucket}</p>
                                )}
                              </>
                            ) : (
                              <p>{uploadResult.error || "Erro desconhecido"}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Logs de Diagnóstico</CardTitle>
              <CardDescription>
                Informações detalhadas sobre os testes de armazenamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[480px] w-full rounded-md border p-2">
                <div className="space-y-1">
                  {testLogs.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Nenhum log disponível.
                      <br />
                      Inicie um teste para ver os logs.
                    </p>
                  ) : (
                    testLogs.map((log, index) => (
                      <div key={index} className="text-xs">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mt-8 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Informações sobre os Serviços de Armazenamento</CardTitle>
            <CardDescription>
              Detalhes sobre as configurações de armazenamento e possíveis problemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-bold text-base mb-2">Supabase Storage</h3>
                <p className="mb-2">
                  O Supabase armazenamento funciona com políticas de segurança (RLS - Row Level Security)
                  que controlam quais operações podem ser realizadas em cada bucket.
                </p>
                <div className="space-y-1">
                  <h4 className="font-semibold">Problemas comuns:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <span className="font-medium">Erro de política:</span>{" "}
                      O erro "new row violates row-level security policy" indica que as políticas
                      de acesso ao bucket não estão configuradas corretamente.
                    </li>
                    <li>
                      <span className="font-medium">Solução:</span>{" "}
                      É necessário ajustar as políticas no painel do Supabase para permitir
                      a inserção de arquivos, ou usar uma chave de API com permissões mais amplas.
                    </li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-base mb-2">Cloudflare R2</h3>
                <p className="mb-2">
                  O Cloudflare R2 é um serviço de armazenamento de objetos compatível com a API do S3,
                  oferecendo uma alternativa mais econômica para armazenamento de arquivos.
                </p>
                <div className="space-y-1">
                  <h4 className="font-semibold">Problemas comuns:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <span className="font-medium">Erro de credenciais:</span>{" "}
                      Problemas com chaves de acesso incorretas ou expiradas.
                    </li>
                    <li>
                      <span className="font-medium">Bucket não existe:</span>{" "}
                      O bucket especificado não foi criado no R2.
                    </li>
                    <li>
                      <span className="font-medium">Solução:</span>{" "}
                      Verificar e atualizar as credenciais de acesso e garantir que o bucket existe.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}