import { useState, useRef } from "react";
import { UploadCloud, RefreshCw, AlertCircle, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface UploadResult {
  imageUrl: string;
  thumbnailUrl: string;
  storageType?: string;
  uploadType?: string;
}

export function SupabaseTestUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (skipOptimization = false, storageType = 'supabase') => {
    if (!fileInputRef.current?.files?.length) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione uma imagem para upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append("image", file);
      
      // Define qual armazenamento usar
      formData.append("storage", storageType);
      
      // URL com parâmetros de query para teste
      const url = `/api/admin/upload${skipOptimization ? '?skipOptimization=true' : ''}`;

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro desconhecido no upload");
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Upload concluído",
        description: `Imagem enviada com sucesso para ${data.storageType || 'storage'}`,
      });
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
      toast({
        title: "Erro no upload",
        description: err.message || "Não foi possível enviar a imagem",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Tabs defaultValue="upload">
      <TabsList className="mb-4">
        <TabsTrigger value="upload">Upload Test</TabsTrigger>
        <TabsTrigger value="results">Resultados</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle>Teste de Upload para Supabase Storage</CardTitle>
            <CardDescription>
              Teste de upload de imagens usando Supabase Storage como armazenamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Informação importante</AlertTitle>
              <AlertDescription>
                Antes de usar o Supabase Storage, você precisa criar um bucket chamado <strong>designautoimages</strong> no 
                painel do Supabase e configurar permissões RLS para permitir uploads.
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="h-auto p-0 text-blue-600">
                      Ver instruções detalhadas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Configuração do Supabase Storage</DialogTitle>
                      <DialogDescription>
                        Siga estas etapas para configurar corretamente o armazenamento do Supabase
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-base mb-2">1. Criar um bucket</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>Acesse o painel do Supabase</li>
                          <li>Navegue até a seção <strong>Storage</strong></li>
                          <li>Clique em <strong>New Bucket</strong></li>
                          <li>Nomeie o bucket como <strong>designautoimages</strong></li>
                          <li>Marque a opção <strong>Public bucket</strong> para tornar as imagens publicamente acessíveis</li>
                          <li>Clique em <strong>Create bucket</strong></li>
                        </ol>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-2">2. Configurar políticas de segurança (RLS)</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>Na seção Storage, selecione seu bucket recém-criado</li>
                          <li>Vá para a aba <strong>Policies</strong></li>
                          <li>Para cada operação (INSERT, SELECT), crie uma política clicando no botão <strong>New Policy</strong></li>
                          <li>Para SELECT (leitura), configure para permitir acesso público (SELECT, ALL)</li>
                          <li>Para INSERT (upload), configure para permitir uploads autenticados ou públicos, dependendo da sua necessidade</li>
                        </ol>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                        <h4 className="font-semibold text-sm mb-1 text-yellow-800">Dica para depuração</h4>
                        <p className="text-sm text-yellow-700">
                          Se estiver com problemas, você pode temporariamente definir políticas RLS permissivas para teste:
                          <br /> 
                          <code className="bg-yellow-100 px-2 py-1 rounded">CREATE POLICY "Allow all" ON storage.objects FOR ALL TO public USING (true) WITH CHECK (true);</code>
                          <br />
                          <strong>Nota:</strong> Em produção, use políticas mais restritivas!
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={() => document.querySelector('[role="dialog"] button[aria-label="Close"]')?.click()}>
                        Entendi
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="image">Imagem</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  disabled={isUploading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 flex-wrap">
            <Button
              onClick={() => uploadImage(false, 'supabase')}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Supabase
                </>
              )}
            </Button>
            
            <Button
              onClick={() => uploadImage(true, 'supabase')}
              disabled={isUploading}
              variant="outline"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Supabase (Sem Otimização)
                </>
              )}
            </Button>
            
            <Button
              onClick={() => uploadImage(false, 'r2')}
              disabled={isUploading}
              variant="secondary"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload R2
                </>
              )}
            </Button>
            
            <Button
              onClick={() => uploadImage(false, 'local')}
              disabled={isUploading}
              variant="outline"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Local
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="results">
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Upload</CardTitle>
            <CardDescription>
              {result ? `Upload realizado com sucesso (${result.storageType || 'storage'})` : 
               error ? "Erro no upload" : "Nenhum upload realizado ainda"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                <h3 className="font-medium mb-1">Erro:</h3>
                <p>{error}</p>
              </div>
            )}
            
            {result && (
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium mb-2">Detalhes:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <span className="font-medium">Tipo de armazenamento:</span> {result.storageType || "Não especificado"}
                    </li>
                    {result.uploadType && (
                      <li>
                        <span className="font-medium">Tipo de upload:</span> {result.uploadType}
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-2">Imagem Principal:</h3>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={result.imageUrl} 
                        alt="Imagem enviada" 
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {result.imageUrl}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Thumbnail:</h3>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={result.thumbnailUrl} 
                        alt="Thumbnail" 
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {result.thumbnailUrl}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default SupabaseTestUpload;