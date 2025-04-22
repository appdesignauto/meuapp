import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  onSuccess?: (newAvatarUrl: string) => void;
}

export default function AvatarUploader({ currentAvatarUrl, onSuccess }: AvatarUploaderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gera uma URL de avatar padrão baseada no nome do usuário
  const generatePlaceholderAvatar = () => {
    if (!user) return '/images/avatar-placeholder.png';
    
    // Usar a primeira letra do nome ou username para um avatar colorido
    const initial = user.name?.charAt(0) || user.username.charAt(0);
    const colors = ['4f46e5', '7c3aed', 'db2777', 'ea580c', '16a34a', '0891b2'];
    const colorIndex = user.id % colors.length;
    const bgColor = colors[colorIndex];
    
    return `https://ui-designautoimages.com/api/?name=${initial}&background=${bgColor}&color=fff&size=200`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho do arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Máximo de 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      // Criar um FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('avatar', file);

      // Simular progresso durante o upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const increment = Math.floor(Math.random() * 10) + 5;
          const newProgress = Math.min(prev + increment, 90);
          return newProgress;
        });
      }, 500);

      // Usar apenas a rota principal
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload do avatar');
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        setUploadProgress(100);
        setAvatarUrl(data.url);
        
        toast({
          title: 'Avatar atualizado',
          description: 'Seu avatar foi atualizado com sucesso.',
          variant: 'default',
        });
        
        // Chamar callback, se fornecido
        if (onSuccess) {
          onSuccess(data.url);
        }
      } else {
        throw new Error('Resposta do servidor não contém URL do avatar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload do avatar');
      
      toast({
        title: 'Erro no upload',
        description: err instanceof Error ? err.message : 'Erro ao fazer upload do avatar',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center"
            onClick={triggerFileInput}
            style={{ cursor: isUploading ? 'default' : 'pointer' }}
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback para avatar padrão em caso de erro
                  (e.target as HTMLImageElement).src = generatePlaceholderAvatar();
                }}
              />
            ) : (
              <User className="w-16 h-16 text-muted-foreground" />
            )}
            
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center gap-2 w-full">
            <Button 
              onClick={triggerFileInput}
              disabled={isUploading}
              variant="outline"
              className="w-full max-w-xs"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Enviando...' : 'Escolher imagem'}
            </Button>
            
            {uploadProgress > 0 && (
              <div className="w-full max-w-xs">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  {uploadProgress < 100 ? `Enviando... ${uploadProgress}%` : 'Concluído!'}
                </p>
              </div>
            )}
            
            {error && (
              <div className="flex items-center text-destructive text-sm mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{error}</span>
              </div>
            )}
            
            {!isUploading && uploadProgress === 100 && (
              <div className="flex items-center text-primary text-sm mt-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Avatar atualizado com sucesso!</span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-2 text-center max-w-xs">
              Clique na imagem ou no botão para fazer upload. 
              Imagens até 5MB, JPG, PNG ou GIF.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}