import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
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
  const [refreshingLogo, setRefreshingLogo] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Função para carregar as configurações do site
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Adicionar parâmetro de timestamp para evitar cache
      const timestamp = Date.now();
      const response = await fetch(`/api/site-settings?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
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
  
  // Função nuclear para forçar refresh do logo
  const handleForceLogoRefresh = async () => {
    try {
      setRefreshingLogo(true);
      
      // Exibir toast para informar o usuário
      toast({
        title: 'Processando...',
        description: 'Forçando atualização do logo em todos os níveis...',
        variant: 'default',
      });
      
      // Chamar o endpoint especial que limpa completamente o cache
      const response = await fetch('/api/site-settings/force-logo-refresh', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao forçar atualização do logo');
      }
      
      const data = await response.json();
      console.log('Refresh de logo executado:', data);
      
      // Atualizar no localStorage
      localStorage.removeItem('newLogoUrl');
      localStorage.removeItem('logoUpdatedAt');
      
      setTimeout(() => {
        localStorage.setItem('newLogoUrl', data.newLogoUrl);
        localStorage.setItem('logoUpdatedAt', data.timestamp.toString());
        localStorage.setItem('forceCacheRefresh', 'true');
        
        toast({
          title: 'Processo concluído',
          description: 'A atualização radical do logo foi concluída. Recarregando página...',
          variant: 'default',
        });
        
        // Abordagem mais suave de recarregamento
        setTimeout(() => {
          console.log("Aplicando mudanças sem redirecionamento...");
          // Recarregar as configurações atual sem recarregar toda a página
          loadSettings();
          
          // Atrasar um pouco o reload completo para que o usuário veja a notificação
          setTimeout(() => {
            console.log("Recarregando configurações...");
            window.location.reload();
          }, 2000);
        }, 1000);
      }, 500);
      
    } catch (error: any) {
      console.error('Erro ao forçar refresh do logo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao forçar atualização do logo',
        variant: 'destructive',
      });
    } finally {
      setRefreshingLogo(false);
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

  // Função para fazer upload do logo - abordagem ultra-radical
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
      
      // Gera um nome de arquivo único usando múltiplas fontes de randomização
      const timestamp = Date.now();
      const randomPart1 = Math.random().toString(36).substring(2, 10);
      const randomPart2 = Math.random().toString(16).substring(2, 8);
      const uniqueFileName = `logo_${timestamp}_${randomPart1}_${randomPart2}.${file.name.split('.').pop()}`;
      
      console.log("Gerando nome único para logo:", uniqueFileName);
      
      // Criar FormData com informações detalhadas para forçar renovação
      const formData = new FormData();
      formData.append('uniqueFileName', uniqueFileName);
      
      // IMPORTANTE: A chave 'logo' deve corresponder ao campo que o multer espera no servidor!
      // No servidor está configurado para 'logo', não 'logo'
      formData.append('logo', file, file.name);
      
      console.log("Buffer do arquivo disponível?", file instanceof Blob ? "Sim" : "Não");
      console.log("Tamanho do arquivo:", file.size, "bytes");
      
      formData.append('timestamp', timestamp.toString());
      formData.append('forceNewUpload', 'true');
      formData.append('randomToken', randomPart1);
      formData.append('bypassCache', 'true');
      
      // Adicionar parâmetros de query para evitar cache também na URL
      const queryParams = new URLSearchParams({
        t: timestamp.toString(),
        forceNew: 'true',
        rand: randomPart2,
        cache: 'bust'
      }).toString();
      
      // Configurar cabeçalhos para forçar bypass de cache em todos os níveis
      const fetchHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Force-New-Upload': 'true',
        'X-No-Cache': timestamp.toString(),
        'X-Bypass-Cache': randomPart1
      };
      
      // Fazer upload com todas as medidas anti-cache possíveis
      console.log("Iniciando upload com medidas anti-cache extremas");
      const response = await fetch(`/api/site-settings?${queryParams}`, {
        method: 'PUT',
        body: formData,
        headers: fetchHeaders,
        cache: 'no-store',
        credentials: 'same-origin'  // Importante para sessões
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar o logo. Por favor, tente novamente.');
      }
      
      // Processar resposta com informações do logo
      const data = await response.json();
      console.log('Logo atualizado com sucesso:', data);
      
      // Obter URL do novo logo
      const newLogoUrl = data.logoUrl;
      
      // Adicionar timestamp ao final para garantir que a URL seja única
      const finalLogoUrl = newLogoUrl.includes('?') 
        ? `${newLogoUrl}&ts=${timestamp}&r=${randomPart1}`
        : `${newLogoUrl}?ts=${timestamp}&r=${randomPart1}`;
      
      toast({
        title: 'Logo atualizado com sucesso',
        description: 'Aplicando mudanças e recarregando a página...',
        variant: 'default',
      });
      
      // Salvar no localStorage com várias informações para maximizar a chance de atualização
      localStorage.removeItem('newLogoUrl'); // Limpar primeiro
      localStorage.removeItem('logoUpdatedAt');
      
      // Pequeno atraso para garantir a limpeza
      setTimeout(() => {
        localStorage.setItem('newLogoUrl', finalLogoUrl);
        localStorage.setItem('logoUpdatedAt', timestamp.toString());
        localStorage.setItem('logoRandomToken', randomPart1);
        localStorage.setItem('forceCacheRefresh', 'true');
        
        // Limpar também os caches de consulta TanStack
        window.sessionStorage.removeItem('tanstack-query-cache');
        
        // Abordagem mais suave para melhorar a experiência do usuário
        console.log("Aplicando mudanças sem redirecionamento radical...");
        
        // Usar setTimeout maior para garantir que a notificação seja lida
        setTimeout(() => {
          // Recarregar configurações para atualizar a visualização
          loadSettings();
          
          // Após um tempo, recarregar a página
          setTimeout(() => {
            console.log("Recarregando configurações...");
            window.location.reload();
          }, 1500);
        }, 250);
      }, 100);
      
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
                        {/* Forçar nova renderização a cada 2 segundos */}
                        <img 
                          src={`${settings.logoUrl}?v=${Date.now()}&r=${Math.random()}`}
                          alt="Logo Atual" 
                          key={`logo-preview-${Date.now()}_${Math.random()}`}
                          className="h-full max-w-full object-contain" 
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          style={{
                            transform: `translateZ(0)` // Hack CSS para forçar renderização que é mais compatível
                          }}
                          onError={(e) => {
                            console.error('Erro ao carregar logo:', e);
                            const target = e.target as HTMLImageElement;
                            target.src = `/images/logo.png?v=${Date.now()}`;
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
              <CardFooter className="flex flex-col md:flex-row gap-2">
                <Button 
                  onClick={handleLogoUpload}
                  disabled={uploadingLogo || refreshingLogo}
                  className="w-full md:w-auto"
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
                
                {/* Botão para forçar refresh extremo do logo atual */}
                {settings?.logoUrl && (
                  <Button 
                    onClick={handleForceLogoRefresh}
                    disabled={refreshingLogo || uploadingLogo}
                    variant="outline"
                    className="w-full md:w-auto"
                  >
                    {refreshingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Forçar Atualização do Logo
                      </>
                    )}
                  </Button>
                )}
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