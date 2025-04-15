import { useState, useRef } from 'react';
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label'; 
import { useToast } from '@/hooks/use-toast';

const R2TestUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [skipOptimization, setSkipOptimization] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    imageUrl?: string;
    thumbnailUrl?: string;
    storageType?: string;
    uploadType?: string;
    error?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('idle');
    setUploadResult({});

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Construir a URL com o parâmetro de consulta para pular a otimização
      let uploadUrl = '/api/admin/upload';
      if (skipOptimization) {
        uploadUrl += '?skipOptimization=true';
      }
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer upload da imagem');
      }
      
      const data = await response.json();
      setUploadResult(data);
      setUploadStatus('success');
      
      const uploadTypeStr = skipOptimization ? ' (sem otimização)' : ' (com otimização)';
      
      toast({
        title: 'Upload realizado com sucesso',
        description: `Armazenamento: ${data.storageType || 'local'}${uploadTypeStr}`,
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setUploadStatus('error');
      setUploadResult({ error: error.message });
      
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer o upload da imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center space-x-2">
        <Switch
          id="skip-optimization"
          checked={skipOptimization}
          onCheckedChange={setSkipOptimization}
        />
        <Label htmlFor="skip-optimization">
          Pular otimização (teste para verificar se o conversor interfere na conexão com R2)
        </Label>
      </div>
    
      <div className="flex items-center gap-4 mb-4">
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex gap-2 items-center"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Selecionar Imagem
            </>
          )}
        </Button>
        
        <div className="flex items-center">
          {uploadStatus === 'success' && (
            <span className="flex items-center text-green-600 text-sm">
              <Check className="h-4 w-4 mr-1" />
              Upload bem-sucedido {skipOptimization ? '(sem otimização)' : ''}
            </span>
          )}
          
          {uploadStatus === 'error' && (
            <span className="flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Falha no upload
            </span>
          )}
        </div>
      </div>

      {(uploadStatus === 'success' || uploadStatus === 'error') && (
        <Card className="p-4 mt-4 max-w-2xl">
          <h4 className="font-medium mb-2">Resultado do Upload</h4>
          
          {uploadStatus === 'success' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Serviço de Armazenamento:</p>
                <p className="text-sm">{uploadResult.storageType === 'r2' ? 'Cloudflare R2' : 'Armazenamento Local (Fallback)'}</p>
              </div>
              
              {uploadResult.imageUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Imagem Original:</p>
                  <div className="flex gap-4 items-start">
                    <img 
                      src={uploadResult.imageUrl} 
                      alt="Uploaded" 
                      className="w-40 h-40 object-cover rounded border"
                    />
                    <div>
                      <p className="text-xs text-gray-600 mb-1">URL:</p>
                      <code className="text-xs bg-gray-100 p-1 rounded block whitespace-normal break-all max-w-md">
                        {uploadResult.imageUrl}
                      </code>
                    </div>
                  </div>
                </div>
              )}
              
              {uploadResult.thumbnailUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Miniatura:</p>
                  <div className="flex gap-4 items-start">
                    <img 
                      src={uploadResult.thumbnailUrl} 
                      alt="Thumbnail" 
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <div>
                      <p className="text-xs text-gray-600 mb-1">URL:</p>
                      <code className="text-xs bg-gray-100 p-1 rounded block whitespace-normal break-all max-w-md">
                        {uploadResult.thumbnailUrl}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="text-red-600">
              <p className="text-sm font-medium">Erro:</p>
              <p className="text-sm">{uploadResult.error}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default R2TestUpload;