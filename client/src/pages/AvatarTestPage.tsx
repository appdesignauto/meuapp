import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, RefreshCcw, Check, AlertCircle, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";

export default function AvatarTestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Função para selecionar arquivo
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Função para lidar com a mudança do arquivo
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
    setUploadError(null);
    setUploadResult(null);

    // Criar URL para preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Limpar URL ao desmontar
    return () => URL.revokeObjectURL(objectUrl);
  };

  // Função para fazer upload do avatar
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione uma imagem para upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      // Criar FormData
      const formData = new FormData();
      formData.append("image", selectedFile);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);

      // Tentar upload pela rota normal
      try {
        const response = await fetch("/api/users/profile-image", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        clearInterval(progressInterval);
        setUploadProgress(95);

        const data = await response.json();
        console.log("Resposta do upload regular:", data);

        if (!response.ok) {
          throw new Error(data.message || "Erro no upload do avatar");
        }

        setUploadResult({
          route: "regular",
          data,
          status: response.status,
          success: true,
        });

        toast({
          title: "Upload bem-sucedido",
          description: "Avatar atualizado com sucesso pela rota regular.",
        });
      } catch (regularError: any) {
        console.error("Erro na rota regular:", regularError);

        // Se falhar, tentar via endpoint de teste
        try {
          console.log("Tentando upload pela rota de teste...");
          
          const testResponse = await fetch("/api/debug/test-avatar-upload", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          const testData = await testResponse.json();
          console.log("Resposta do upload de teste:", testData);

          if (!testResponse.ok) {
            throw new Error(testData.message || testData.error || "Erro no upload de teste");
          }

          setUploadResult({
            route: "test",
            data: testData,
            status: testResponse.status,
            success: true,
          });

          toast({
            title: "Upload de teste bem-sucedido",
            description: "Avatar atualizado com sucesso pela rota de teste.",
          });
        } catch (testError: any) {
          console.error("Erro também na rota de teste:", testError);
          
          setUploadError(testError.message || "Falha em ambas as rotas de upload");
          
          setUploadResult({
            route: "both_failed",
            regularError: regularError.message,
            testError: testError.message,
            success: false,
          });
          
          toast({
            title: "Falha no upload",
            description: "O upload falhou em ambas as rotas. Verifique os logs para mais detalhes.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Erro geral no upload:", error);
      setUploadError(error.message || "Erro desconhecido no upload");
      
      setUploadResult({
        success: false,
        error: error.message,
      });
      
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro durante o upload do avatar.",
        variant: "destructive",
      });
    } finally {
      setUploadProgress(100);
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
    setUploadError(null);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Teste de Upload de Avatar</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload de Teste</CardTitle>
            <CardDescription>
              Esta página testa o upload de avatar de forma isolada para diagnosticar problemas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32 border-2 border-primary/20">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt="Preview" />
                ) : (
                  <AvatarImage src={user?.profileimageurl || ""} alt={user?.name || "Usuário"} />
                )}
                <AvatarFallback className="text-2xl">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
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
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    )}
                    Testar Upload
                  </Button>
                )}
                
                {(selectedFile || uploadResult || uploadError) && (
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
              
              {uploadError && (
                <div className="w-full p-3 bg-destructive/10 text-destructive rounded-md text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Erro no upload:</p>
                      <p>{uploadError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {uploadResult && uploadResult.success && (
                <div className="w-full p-3 bg-green-500/10 text-green-600 rounded-md text-xs">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Upload bem-sucedido:</p>
                      <p>Rota: {uploadResult.route}</p>
                      <p>URL: {uploadResult.data?.imageUrl || uploadResult.data?.url || "N/A"}</p>
                      <p>Tipo de armazenamento: {uploadResult.data?.storageType || "N/A"}</p>
                      {uploadResult.data?.strategy && (
                        <p>Estratégia: {uploadResult.data.strategy}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico do Usuário</CardTitle>
            <CardDescription>
              Informações do usuário atual para diagnóstico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">ID:</div>
                  <div>{user.id}</div>
                  
                  <div className="font-semibold">Username:</div>
                  <div>{user.username}</div>
                  
                  <div className="font-semibold">Email:</div>
                  <div>{user.email}</div>
                  
                  <div className="font-semibold">Nome:</div>
                  <div>{user.name || "N/A"}</div>
                  
                  <div className="font-semibold">Nível de Acesso:</div>
                  <div>{user.nivelacesso || "N/A"}</div>
                  
                  <div className="font-semibold">URL da Imagem:</div>
                  <div className="truncate text-xs">
                    {user.profileimageurl || "Sem imagem"}
                  </div>
                </div>
                
                <div className="text-xs">
                  <p className="font-semibold mb-1">O que este teste faz:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Tenta fazer upload pela rota normal <code>/api/users/profile-image</code></li>
                    <li>Se falhar, tenta pela rota de diagnóstico <code>/api/debug/test-avatar-upload</code></li>
                    <li>Exibe resultados detalhados para diagnóstico</li>
                  </ol>
                </div>
                
                {user.username === "fernandosim20188718" && (
                  <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-md text-xs">
                    <p className="font-semibold">⚠️ Usuário especial detectado</p>
                    <p>Este usuário está marcado para tratamento especial de upload de avatar usando múltiplas estratégias e fallbacks automáticos.</p>
                    <p className="mt-1">O sistema aplicará as seguintes estratégias em sequência até que uma tenha sucesso:</p>
                    <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                      <li>Upload direto sem otimização para bucket de designautoimages</li>
                      <li>Upload para bucket principal com otimização moderada</li>
                      <li>Upload usando nome de arquivo ultra-simplificado</li>
                      <li>Armazenamento local com configurações mínimas</li>
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>Você precisa estar logado para usar esta ferramenta</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}