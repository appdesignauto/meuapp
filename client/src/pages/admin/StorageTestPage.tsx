import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Upload, HardDrive, XCircle, Info, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface StorageConnectionStatus {
  connected: boolean;
  message: string;
  logs: string[];
}

interface R2DirectTestResult {
  message: string;
  results: Array<{
    description: string;
    url: string;
    status?: number;
    success: boolean;
    error?: string;
    headers?: Record<string, string>;
    config?: any;
  }>;
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

export default function StorageTestPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("connection");
  const [selectedService, setSelectedService] = useState<"supabase" | "r2">("supabase");
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StorageConnectionStatus | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDirect, setIsDirect] = useState(false); // Controla se está usando upload direto (sem sharp)
  const [uploadResult, setUploadResult] = useState<UploadTestResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [r2DirectTestResult, setR2DirectTestResult] = useState<R2DirectTestResult | null>(null);
  const [isTestingR2Direct, setIsTestingR2Direct] = useState(false);

  // Efeito visual para progresso de upload
  const simulateProgress = useCallback(() => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = prev + Math.random() * 15;
        if (next >= 95) {
          clearInterval(interval);
          return 95;
        }
        return next;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const checkConnection = async (service: "supabase" | "r2") => {
    setIsCheckingConnection(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch(`/api/admin/storage/check-connection?service=${service}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha na resposta da API: ${errorText}`);
      }
      
      const result = await response.json();
      
      setConnectionStatus({
        connected: result.connected,
        message: result.message,
        logs: result.logs || []
      });
      
      toast({
        title: result.connected ? "Conexão estabelecida" : "Falha na conexão",
        description: result.message,
        variant: result.connected ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setConnectionStatus({
        connected: false,
        message: `Erro ao verificar conexão: ${error instanceof Error ? error.message : String(error)}`,
        logs: ["Erro no cliente ao tentar conectar com o serviço"]
      });
      
      toast({
        title: "Erro ao verificar conexão",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Verificar se é uma imagem
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar tamanho (limitar a 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      setUploadFile(selectedFile);
      setUploadResult(null);
      
      toast({
        title: "Arquivo selecionado",
        description: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
      });
    }
  };

  // Método para fazer upload com processamento de imagem (usando sharp)
  const handleUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo para upload.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadResult(null);
    const cleanup = simulateProgress();
    
    try {
      const formData = new FormData();
      formData.append('image', uploadFile);
      
      // Define o endpoint com base no modo selecionado (direto ou com processamento)
      const endpoint = isDirect 
        ? `/api/admin/storage/test-upload-direct?service=${selectedService}` 
        : `/api/admin/storage/test-upload?service=${selectedService}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha na resposta da API: ${errorText}`);
      }
      
      const result = await response.json();
      
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadResult(result);
      }, 500);
      
      toast({
        title: result.success ? "Upload realizado com sucesso" : "Falha no upload",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      
      setUploadResult({
        success: false,
        message: `Erro ao fazer upload: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Erro ao fazer upload",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      cleanup();
    }
  };
  
  // Método para testar direto a conexão com o R2 com diagnóstico completo
  const testR2Direct = async () => {
    setIsTestingR2Direct(true);
    setR2DirectTestResult(null);
    
    try {
      const response = await fetch('/api/admin/storage/test-r2-direct');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha na resposta da API: ${errorText}`);
      }
      
      const result = await response.json();
      setR2DirectTestResult(result);
      
      toast({
        title: "Diagnóstico R2 Completo",
        description: result.message,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao testar R2 diretamente:", error);
      
      toast({
        title: "Erro no diagnóstico R2",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsTestingR2Direct(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Teste de Armazenamento</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Seleção de Serviço */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Selecione o Serviço</CardTitle>
            <CardDescription>
              Escolha o serviço de armazenamento para testar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <div
                  className={`relative p-4 border rounded-md cursor-pointer transition-all ${
                    selectedService === "supabase"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedService("supabase")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-md">
                        <svg
                          className="w-6 h-6 text-indigo-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21.602 14.714c-.3 0-.503.117-.803.117-1.804.2-2.105.784-2.105 1.567 0 .784.402 1.351 2.005 1.252 1.402-.1 1.503-1.252.903-2.936zM13.292 7.028c0-.784.1-1.468.2-2.035-4.612-.1-5.615.784-5.615 3.503v7.007c0 1.568-.502 2.035-1.304 2.035H5.37c-.802 0-1.304-.467-1.304-2.035V3.525c0-.784.402-1.351.803-1.568-1.403.2-3.208 1.068-3.208 3.736v10.644c0 1.568.502 2.919 2.606 2.919h2.306c2.005 0 2.606-1.351 2.606-2.919v-3.736c0-3.220.702-4.104 4.11-4.104v-1.468zM20.297 10.08c1.203-.2 3.409-.784 3.409-3.602 0-3.503-2.406-4.121-5.414-4.121h-5.816l-.1 17.484h4.11V4.643h1.102c1.704 0 2.206.668 2.206 2.152 0 1.568-.502 2.152-1.704 2.152h-.701c1.203.784 1.905 3.62 2.807 5.788.601 1.468.802 1.902 1.905 1.902 1.002 0 2.005-.668 2.005-1.902-.1-.784-.802-2.686-1.804-4.654z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Supabase Storage</h3>
                        <p className="text-sm text-muted-foreground">
                          Armazenamento atual do DesignAuto
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedService === "supabase"
                          ? "border-primary"
                          : "border-muted"
                      }`}
                    >
                      {selectedService === "supabase" && (
                        <div className="w-3 h-3 bg-primary rounded-full m-[3px]" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div
                  className={`relative p-4 border rounded-md cursor-pointer transition-all ${
                    selectedService === "r2"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedService("r2")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-md">
                        <svg
                          className="w-6 h-6 text-orange-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.85 16.896c.149-.75.224-1.522.224-2.297 0-.788-.075-1.561-.224-2.311.839-.326 1.7-1.025 1.7-2.237 0-1.136-.923-2.386-2.57-2.386-.326 0-.615.05-.866.149.14.062.309.099.474.099.712 0 1.36-.59 1.36-1.374 0-.696-.473-1.76-1.945-1.76-2.022 0-3.995 1.885-3.995 5.03 0 .388.022.766.083 1.136-.44.3-.786.873-.786 1.56 0 .924.583 1.586 1.337 1.884-.149.749-.224 1.523-.224 2.312 0 .774.075 1.546.224 2.297-.902.325-1.436 1.123-1.436 2.06 0 1.188.806 2.27 2.445 2.27.44 0 .811-.073 1.119-.224-.188-.075-.35-.136-.5-.261-.4-.313-.599-.811-.599-1.287 0-.726.485-1.35 1.262-1.35.326 0 .636.1.839.2.224-.736.326-1.434.326-2.12 0-.674-.102-1.371-.326-2.082-.19.074-.5.173-.827.173-.8 0-1.262-.598-1.262-1.337 0-.463.213-.975.63-1.274zm8.147-.21v-.001c0-2.248-1.264-3.53-3.378-3.666.328-.414.501-.912.501-1.457 0-1.375-.976-2.227-2.38-2.227-.926 0-1.731.414-2.244 1.1.513-.101 1.05-.151 1.636-.151 1.66 0 2.91.752 2.91 2.17 0 .538-.207 1.015-.515 1.427 2.246.025 3.47 1.238 3.47 3.543 0 3.36-2.86 5.93-7.378 5.93-5.27 0-8.354-3.384-8.354-8.316 0-4.945 3.097-8.315 8.354-8.315 2.256 0 4.05.49 5.415 1.474 1.175.85 1.876 2.074 1.876 3.53a3.63 3.63 0 01-.739 2.273c.514.614.826 1.39.826 2.286 0 2.562-2.12 4.312-5.502 4.312-2.683 0-4.614-1.15-5.303-2.912-.14.375-.27.775-.372 1.19.816 1.511 2.607 2.46 5.113 2.46 3.946 0 5.89-1.888 5.89-3.98 0-.689-.201-1.326-.502-1.864.388-.55.576-1.213.576-1.988z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Cloudflare R2</h3>
                        <p className="text-sm text-muted-foreground">
                          Alternativa para armazenamento
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedService === "r2"
                          ? "border-primary"
                          : "border-muted"
                      }`}
                    >
                      {selectedService === "r2" && (
                        <div className="w-3 h-3 bg-primary rounded-full m-[3px]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setConnectionStatus(null);
                setUploadResult(null);
                setUploadFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Limpar Resultados
            </Button>
          </CardFooter>
        </Card>
        
        {/* Painel de Testes */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Testes de Armazenamento</CardTitle>
            <CardDescription>
              Verifique a conexão e realize testes de upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="connection" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="connection">Teste de Conexão</TabsTrigger>
                <TabsTrigger value="upload">Teste de Upload</TabsTrigger>
              </TabsList>
              
              {/* Conteúdo da Aba de Conexão */}
              <TabsContent value="connection" className="space-y-4">
                <Alert
                  className={`${
                    connectionStatus
                      ? connectionStatus.connected
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
                  <div className="flex items-start">
                    {connectionStatus ? (
                      connectionStatus.connected ? (
                        <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 mr-2 text-red-500" />
                      )
                    ) : (
                      <Info className="h-5 w-5 mr-2 text-blue-500" />
                    )}
                    <div>
                      <AlertTitle>
                        {connectionStatus 
                          ? (connectionStatus.connected 
                            ? "Conexão estabelecida com sucesso" 
                            : "Falha na conexão")
                          : "Clique em 'Verificar Conexão' para testar"}
                      </AlertTitle>
                      <AlertDescription>
                        {connectionStatus 
                          ? connectionStatus.message
                          : `O teste irá verificar se o serviço ${selectedService === "supabase" ? "Supabase Storage" : "Cloudflare R2"} está acessível e configurado corretamente.`}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
                
                {connectionStatus && connectionStatus.logs.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Logs de Conexão</h3>
                    <ScrollArea className="h-48 w-full rounded-md border">
                      <div className="p-4">
                        {connectionStatus.logs.map((log, index) => (
                          <div key={index} className="text-xs font-mono mb-1">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={() => checkConnection(selectedService)} 
                    disabled={isCheckingConnection}
                    className="w-full sm:w-auto"
                  >
                    {isCheckingConnection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <HardDrive className="mr-2 h-4 w-4" />
                        Verificar Conexão com {selectedService === "supabase" ? "Supabase" : "R2"}
                      </>
                    )}
                  </Button>
                  
                  {selectedService === "r2" && (
                    <Button
                      onClick={testR2Direct}
                      disabled={isTestingR2Direct}
                      variant="secondary"
                      className="ml-2"
                    >
                      {isTestingR2Direct ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Diagnóstico Avançado...
                        </>
                      ) : (
                        <>
                          <Info className="mr-2 h-4 w-4" />
                          Diagnóstico Avançado
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Resultados do Diagnóstico R2 Direto */}
                {selectedService === "r2" && r2DirectTestResult && (
                  <div className="mt-4">
                    <Alert className={`${
                      r2DirectTestResult.results.every(r => r.success)
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}>
                      <div className="flex items-start">
                        {r2DirectTestResult.results.every(r => r.success) ? (
                          <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                        )}
                        <div>
                          <AlertTitle>Resultado do Diagnóstico R2</AlertTitle>
                          <AlertDescription>
                            {r2DirectTestResult.message}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                    
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Detalhes do Diagnóstico:</h3>
                      <ScrollArea className="h-60 rounded-md border">
                        <div className="p-4">
                          {r2DirectTestResult.results.map((result, index) => (
                            <div key={index} className={`mb-4 p-3 rounded-md ${
                              result.success 
                                ? "bg-green-50 border border-green-100" 
                                : "bg-red-50 border border-red-100"
                            }`}>
                              <div className="flex items-center mb-1">
                                {result.success ? (
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                )}
                                <h4 className="font-medium text-sm">
                                  {result.description}
                                </h4>
                              </div>
                              
                              <div className="ml-6 text-xs space-y-1">
                                <p className="font-mono break-all bg-black bg-opacity-5 p-1 rounded">
                                  URL: {result.url}
                                </p>
                                
                                {result.status && (
                                  <p>Status: {result.status}</p>
                                )}
                                
                                {result.error && (
                                  <p className="text-red-600 whitespace-pre-wrap break-words">{result.error}</p>
                                )}
                                
                                {result.headers && Object.keys(result.headers).length > 0 && (
                                  <div>
                                    <p className="font-medium mt-1">Headers:</p>
                                    <pre className="text-xs p-1 bg-black bg-opacity-5 rounded max-h-20 overflow-auto">
                                      {JSON.stringify(result.headers, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Conteúdo da Aba de Upload */}
              <TabsContent value="upload" className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                  <Info className="h-5 w-5 mr-2 text-blue-500" />
                  <AlertTitle>Teste de Upload de Imagem</AlertTitle>
                  <AlertDescription>
                    Faça upload de uma imagem para testar o serviço {selectedService === "supabase" ? "Supabase Storage" : "Cloudflare R2"}.
                    {isDirect 
                      ? "Upload direto sem processamento de imagem (sem usar Sharp)."
                      : "As imagens são enviadas para uma pasta de teste e otimizadas automaticamente."}
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-md border">
                    <div className="space-y-0.5">
                      <div className="font-medium">Modo de upload</div>
                      <div className="text-sm text-muted-foreground">
                        {isDirect 
                          ? "Upload direto sem processamento (para diagnóstico)" 
                          : "Com otimização de imagem (usando Sharp)"}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Normal</span>
                      <div 
                        onClick={() => setIsDirect(!isDirect)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          isDirect ? 'bg-primary' : 'bg-input'
                        } cursor-pointer`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                            isDirect ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">Direto</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="file-upload">Selecione uma imagem (máx. 5MB)</Label>
                    <div className="grid gap-2">
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Selecionar Arquivo
                          </Button>
                          <Button
                            onClick={handleUpload}
                            disabled={!uploadFile || isUploading}
                            className="w-full"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <HardDrive className="mr-2 h-4 w-4" />
                                Fazer Upload
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {uploadFile && (
                          <div className="text-sm">
                            Arquivo selecionado: <Badge variant="outline">{uploadFile.name}</Badge> ({(uploadFile.size / 1024).toFixed(2)} KB)
                          </div>
                        )}
                        
                        {isUploading && (
                          <div className="w-full mt-2">
                            <Progress value={uploadProgress} className="h-2 w-full" />
                            <div className="text-xs text-muted-foreground mt-1 text-right">
                              {uploadProgress.toFixed(0)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {uploadResult && (
                  <div className="mt-6">
                    <Alert className={uploadResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}>
                      {uploadResult.success ? (
                        <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                      )}
                      <AlertTitle>{uploadResult.message}</AlertTitle>
                      <AlertDescription>
                        {uploadResult.success 
                          ? "O upload foi concluído com sucesso. Veja os detalhes abaixo."
                          : `Ocorreu um erro: ${uploadResult.error || "Erro desconhecido"}`}
                      </AlertDescription>
                    </Alert>
                    
                    {uploadResult.success && uploadResult.imageUrl && (
                      <div className="mt-4 space-y-4">
                        <div className="rounded-lg overflow-hidden border">
                          <div className="relative aspect-video bg-muted">
                            <img
                              src={uploadResult.imageUrl}
                              alt="Imagem enviada"
                              className="object-contain w-full h-full"
                            />
                          </div>
                          <div className="p-2 bg-muted/30 flex justify-between items-center">
                            <span className="text-xs truncate">
                              {uploadResult.imageUrl}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(uploadResult.imageUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {uploadResult.optimizedSummary && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Resumo da Otimização</h4>
                            <Table>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">Tamanho Original</TableCell>
                                  <TableCell>{(uploadResult.optimizedSummary.originalSize / 1024).toFixed(2)} KB</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Tamanho Otimizado</TableCell>
                                  <TableCell>{(uploadResult.optimizedSummary.optimizedSize / 1024).toFixed(2)} KB</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Redução</TableCell>
                                  <TableCell>{uploadResult.optimizedSummary.reduction.toFixed(2)}%</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Formato</TableCell>
                                  <TableCell>{uploadResult.optimizedSummary.format}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Dimensões</TableCell>
                                  <TableCell>{uploadResult.optimizedSummary.width} x {uploadResult.optimizedSummary.height}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        
                        {uploadResult.timings && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Tempos de Processamento</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Etapa</TableHead>
                                  <TableHead>Tempo</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {uploadResult.timings.optimization !== undefined && (
                                  <TableRow>
                                    <TableCell>Otimização</TableCell>
                                    <TableCell>{uploadResult.timings.optimization} ms</TableCell>
                                  </TableRow>
                                )}
                                {uploadResult.timings.upload !== undefined && (
                                  <TableRow>
                                    <TableCell>Upload</TableCell>
                                    <TableCell>{uploadResult.timings.upload} ms</TableCell>
                                  </TableRow>
                                )}
                                <TableRow>
                                  <TableCell className="font-medium">Total</TableCell>
                                  <TableCell>{uploadResult.timings.total} ms</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}