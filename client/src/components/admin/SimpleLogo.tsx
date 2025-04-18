import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash, RefreshCw } from 'lucide-react';

/**
 * Componente melhorado para o upload e gerenciamento do logo
 * Garante comunicação eficiente com outros componentes e evita problemas de cache
 */
const SimpleLogo = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  // Função para carregar o logo atual
  const loadCurrentLogo = () => {
    setIsLoading(true);
    fetch(`/api/site-settings?t=${Date.now()}`) // Usar timestamp para evitar cache
      .then(res => res.json())
      .then(data => {
        if (data.logoUrl) {
          // Adicionar parâmetro para evitar cache
          setCurrentLogo(`${data.logoUrl}?t=${Date.now()}`);
        } else {
          setCurrentLogo('/images/logo.png');
        }
      })
      .catch(error => {
        console.error('Erro ao carregar logo atual:', error);
        setCurrentLogo('/images/logo.png');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  // Carregar o logo atual quando o componente montar
  useEffect(() => {
    loadCurrentLogo();
  }, []);
  
  // Função para visualizar o logo selecionado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Função para remover completamente o logo do sistema e notificar todos os componentes
  const handleRemoveLogo = async () => {
    if (!currentLogo || currentLogo.includes('/images/logo.png')) {
      toast({
        title: 'Sem logo para remover',
        description: 'Não há logo personalizado configurado para remover.',
        variant: 'destructive',
      });
      return;
    }
    
    // Confirmar com o usuário
    if (!confirm('Tem certeza que deseja remover completamente o logo atual? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      const response = await fetch('/api/remove-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para a autenticação
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao remover o logo. Tente novamente.');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Logo removido com sucesso',
        description: 'O logo foi completamente removido do sistema.',
        variant: 'default',
      });
      
      // Atualizar o estado local para mostrar o logo padrão
      setCurrentLogo(`${data.logoUrl}?t=${Date.now()}`);
      setLogoPreview(null);
      
      // Limpar o campo de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Criar e disparar um evento de remoção do logo
      const logoRemovedEvent = new CustomEvent('logo-removed', {
        detail: { logoUrl: data.logoUrl, timestamp: Date.now() }
      });
      window.dispatchEvent(logoRemovedEvent);
      
      // Também disparar o evento de atualização para manter compatibilidade
      const logoUpdatedEvent = new CustomEvent('logo-updated', {
        detail: { logoUrl: data.logoUrl, timestamp: Date.now() }
      });
      window.dispatchEvent(logoUpdatedEvent);
      
      // Forçar recarregamento da página após um breve intervalo
      // Isso garante que todos os componentes vejam a mudança
      setTimeout(() => {
        loadCurrentLogo();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast({
        title: 'Erro na remoção',
        description: error.message || 'Não foi possível remover o logo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Função aprimorada para fazer upload do logo e notificar todos os componentes
  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione uma imagem para o logo.',
        variant: 'destructive',
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    
    // Verificar tamanho do arquivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 2MB. Por favor, selecione uma imagem menor.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    // Criar um FormData para o upload
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Importante para a autenticação
      });
      
      if (!response.ok) {
        throw new Error('Falha no upload. Tente novamente.');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Logo atualizado com sucesso',
        description: 'O novo logo foi aplicado com sucesso.',
        variant: 'default',
      });
      
      // Atualizar o estado local para mostrar o novo logo com timestamp para evitar cache
      setCurrentLogo(`${data.logoUrl}?t=${Date.now()}`);
      setLogoPreview(null);
      
      // Limpar o campo de arquivo para permitir novo upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Criar e disparar eventos personalizados para notificar todos os componentes
      const logoUpdatedEvent = new CustomEvent('logo-updated', {
        detail: { logoUrl: data.logoUrl, timestamp: Date.now() }
      });
      window.dispatchEvent(logoUpdatedEvent);
      
      // Forçar recarregamento após um breve intervalo
      setTimeout(() => {
        loadCurrentLogo();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload do logo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload de Logo</CardTitle>
        <CardDescription>
          Selecione uma imagem para usar como logo do site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-center">
          <div className="border rounded-lg p-4 w-full max-w-sm h-32 flex flex-col items-center justify-center bg-gray-50 relative">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-gray-500">Carregando logo...</p>
              </div>
            ) : logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Preview do Logo" 
                className="h-full max-w-full object-contain" 
              />
            ) : currentLogo ? (
              <>
                <img 
                  src={currentLogo} 
                  alt="Logo Atual" 
                  className="h-full max-w-full object-contain" 
                />
                <span className="absolute bottom-1 right-1 text-xs text-gray-400">
                  {currentLogo.includes('/images/logo.png') ? 'Logo padrão' : 'Logo personalizado'}
                </span>
              </>
            ) : (
              <div className="text-gray-400 text-center">
                <Upload className="mx-auto h-12 w-12 mb-2" />
                <p>Nenhum logo configurado</p>
              </div>
            )}
            
            {/* Botão para recarregar o logo atual */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-1 right-1 h-6 w-6 rounded-full hover:bg-gray-200"
              onClick={loadCurrentLogo}
              disabled={isLoading}
              title="Recarregar logo"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
          />
          <small className="text-gray-500">
            Formatos aceitos: PNG, JPG, GIF, SVG. Tamanho máximo: 2MB
          </small>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button 
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Enviar Logo
            </>
          )}
        </Button>

        {currentLogo && (
          <Button
            onClick={handleRemoveLogo}
            disabled={isUploading}
            variant="destructive"
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removendo...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                Remover Logo Atual
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SimpleLogo;