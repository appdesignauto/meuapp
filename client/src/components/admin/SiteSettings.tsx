import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Upload, RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const SiteSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Buscar configurações atuais do site
  const { data: settings, isLoading, error } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
    queryFn: async () => {
      const res = await fetch('/api/site-settings');
      if (!res.ok) throw new Error('Falha ao carregar configurações do site');
      return res.json();
    },
  });

  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        body: data,
      });
      
      if (!res.ok) {
        throw new Error('Falha ao atualizar as configurações');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Configurações atualizadas',
        description: 'As configurações do site foram atualizadas com sucesso.',
        variant: 'default',
      });
      
      // Invalidar todas as queries que usam as configurações do site
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
      
      // Forçar a atualização da página após um pequeno delay para garantir que o cache seja atualizado
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      setLogoPreview(null);
      setUploadingLogo(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
      setUploadingLogo(false);
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (fileInputRef.current?.files?.length) {
      setUploadingLogo(true);
      
      const formData = new FormData();
      formData.append('logo', fileInputRef.current.files[0]);
      
      updateSettingsMutation.mutate(formData);
    } else {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione uma imagem para o logo.',
        variant: 'destructive',
      });
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
          Falha ao carregar as configurações do site. Por favor, tente novamente.
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
            {/* Logo Upload Card */}
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
                          alt="Logo Preview" 
                          className="h-full max-w-full object-contain" 
                        />
                      </div>
                    ) : settings?.logoUrl ? (
                      <div className="h-32 flex items-center justify-center">
                        <img 
                          src={settings.logoUrl + '?v=' + new Date().getTime()} 
                          alt="Current Logo" 
                          className="h-full max-w-full object-contain" 
                          onError={(e) => {
                            console.error('Erro ao carregar logo:', e);
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/logo.png";
                            target.onerror = null; // Evita loop infinito
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
                  disabled={uploadingLogo || updateSettingsMutation.isPending}
                >
                  {(uploadingLogo || updateSettingsMutation.isPending) ? (
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

export default SiteSettings;