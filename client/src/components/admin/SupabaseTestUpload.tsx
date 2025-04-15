import { useState, useRef } from "react";
import { UploadCloud, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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