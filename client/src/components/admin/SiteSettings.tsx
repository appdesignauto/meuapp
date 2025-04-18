import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Definição da interface para o tipo de dados SiteSettings
interface SiteSettings {
  id: number;
  logoUrl: string;
  faviconUrl: string;
  siteName: string;
  primaryColor: string;
  footerText: string;
  metaDescription: string;
  contactEmail: string;
  updatedAt: string;
  updatedBy: number;
}

// Componente LogoUploader - criado para simplificar o código
const LogoUploader = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Função para carregar as configurações do site
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Adicionar parâmetro de timestamp para evitar cache
      const timestamp = Date.now();
      const response = await fetch(`/api/site-settings?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar configurações do site');
      }
      
      const data = await response.json();
      console.log('Configurações carregadas:', data);
      setSettings(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
  }, []);

  // Manipulador para o preview da imagem quando selecionada
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para fazer upload do logo
  const handleLogoUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione uma imagem para o logo.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setUploadingLogo(true);
      
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('timestamp', Date.now().toString());
      
      // Fazer upload diretamente
      const response = await fetch(`/api/site-settings?t=${Date.now()}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // Evitar que o navegador use cache de requisições anteriores
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar o logo. Por favor, tente novamente.');
      }
      
      const data = await response.json();
      console.log('Logo atualizado com sucesso:', data);
      
      toast({
        title: 'Logo atualizado',
        description: 'O logo foi atualizado com sucesso! A página será recarregada.',
        variant: 'default',
      });
      
      // Recarregar completamente a página para aplicar as mudanças em todos os componentes
      setTimeout(() => {
        window.location.href = `/admin?reload=true&t=${Date.now()}`;
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao fazer upload do logo:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Ocorreu um erro ao atualizar o logo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Falha ao carregar as configurações do site. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Configurações do Site</h2>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card para upload do logo */}
            <Card>
              <CardHeader>
                <CardTitle>Logo do Site</CardTitle>
                <CardDescription>
                  Personalize o logo exibido no cabeçalho do site.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="border rounded-lg p-6 flex items-center justify-center bg-gray-50">
                    {logoPreview ? (
                      <div className="h-32 flex items-center justify-center">
                        <img 
                          src={logoPreview} 
                          alt="Preview do Logo" 
                          className="h-full max-w-full object-contain" 
                        />
                      </div>
                    ) : settings?.logoUrl ? (
                      <div className="h-32 flex items-center justify-center">
                        <img 
                          src={`${settings.logoUrl}?v=${Date.now()}`}
                          alt="Logo Atual" 
                          key={`logo-preview-${Date.now()}`}
                          className="h-full max-w-full object-contain" 
                          onError={(e) => {
                            console.error('Erro ao carregar logo:', e);
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/logo.png";
                            target.onerror = null;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Upload className="mx-auto h-12 w-12 mb-2" />
                        <p>Nenhum logo configurado</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="logo-upload">Escolher arquivo:</Label>
                  <div className="flex mt-1">
                    <Input
                      id="logo-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Formatos recomendados: PNG, WEBP ou SVG com fundo transparente</p>
                    <p>Tamanho ideal: altura de 40-60px, proporção original de aspecto</p>
                    <p>Dimensões máximas: até 1200px de largura, até 400px de altura</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleLogoUpload}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Salvar Logo
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Outras configurações de aparência podem ser adicionadas aqui */}
          </div>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configure detalhes técnicos e informações do site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="site-name">Nome do Site</Label>
                  <Input
                    id="site-name"
                    placeholder="DesignAuto"
                    defaultValue={settings?.siteName}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex mt-1 gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      defaultValue={settings?.primaryColor || "#1e40af"}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      placeholder="#1e40af"
                      defaultValue={settings?.primaryColor}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="meta-description">Descrição do Site (meta)</Label>
                  <Input
                    id="meta-description"
                    placeholder="Descrição curta para SEO"
                    defaultValue={settings?.metaDescription}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact-email">Email de Contato</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="contato@designauto.app"
                    defaultValue={settings?.contactEmail}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="footer-text">Texto do Rodapé</Label>
                  <Input
                    id="footer-text"
                    placeholder="© DesignAuto App. Todos os direitos reservados."
                    defaultValue={settings?.footerText}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="mr-2">
                Cancelar
              </Button>
              <Button>
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente principal SiteSettings que apenas envolve o LogoUploader
const SiteSettings = () => {
  return <LogoUploader />;
};

export default SiteSettings;