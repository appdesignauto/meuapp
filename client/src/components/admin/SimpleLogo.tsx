import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

/**
 * Componente simples e direto para o upload de logo
 * Focado em uma única responsabilidade sem complicações
 */
const SimpleLogo = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  // Carregar o logo atual
  useState(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.logoUrl) {
          // Adicionar parâmetro para evitar cache
          setCurrentLogo(`${data.logoUrl}?t=${Date.now()}`);
        }
      })
      .catch(error => {
        console.error('Erro ao carregar logo atual:', error);
      });
  });
  
  // Função para visualizar o logo selecionado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Função simples para fazer upload do logo
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
    
    setIsUploading(true);
    
    // Criar um FormData simples
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
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
      
      // Atualizar o estado local para mostrar o novo logo
      setCurrentLogo(`${data.logoUrl}?t=${Date.now()}`);
      
      // Criar e disparar um evento personalizado para notificar outros componentes
      const logoEvent = new CustomEvent('logo-updated', {
        detail: { logoUrl: data.logoUrl, timestamp: Date.now() }
      });
      window.dispatchEvent(logoEvent);
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
          <div className="border rounded-lg p-4 w-full max-w-sm h-32 flex items-center justify-center bg-gray-50">
            {logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Preview do Logo" 
                className="h-full max-w-full object-contain" 
              />
            ) : currentLogo ? (
              <img 
                src={currentLogo} 
                alt="Logo Atual" 
                className="h-full max-w-full object-contain" 
              />
            ) : (
              <div className="text-gray-400 text-center">
                <Upload className="mx-auto h-12 w-12 mb-2" />
                <p>Nenhum logo configurado</p>
              </div>
            )}
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
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
};

export default SimpleLogo;