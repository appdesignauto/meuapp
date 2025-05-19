/**
 * Página de configuração do Progressive Web App (PWA)
 * Permite que administradores personalizem as configurações do PWA
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { UserPermissionGuard } from '@/components/admin/UserPermissionGuard';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import HotmartCredentialTester from './HotmartCredentialTester';

// Definindo o schema para validação do formulário
const appConfigSchema = z.object({
  name: z.string().min(1, 'Nome do aplicativo é obrigatório'),
  short_name: z.string().min(1, 'Nome curto do aplicativo é obrigatório'),
  theme_color: z.string().min(1, 'Cor do tema é obrigatória'),
  background_color: z.string().min(1, 'Cor de fundo é obrigatória')
});

type AppConfigFormValues = z.infer<typeof appConfigSchema>;

interface AppConfig {
  id?: number;
  name: string;
  short_name: string;
  theme_color: string;
  background_color: string;
  icon_192: string;
  icon_512: string;
  updated_at?: string;
  updated_by?: number;
}

export default function AppConfigPage() {
  const { toast } = useToast();
  const [icon192Preview, setIcon192Preview] = useState<string | null>(null);
  const [icon512Preview, setIcon512Preview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');
  
  // Carregando configurações atuais
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['/api/app-config'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/app-config');
        const data = await res.json();
        return data as AppConfig;
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        throw error;
      }
    }
  });
  
  // Configurar o formulário
  const form = useForm<AppConfigFormValues>({
    resolver: zodResolver(appConfigSchema),
    defaultValues: {
      name: config?.name || 'Design Auto',
      short_name: config?.short_name || 'Design Auto',
      theme_color: config?.theme_color || '#FE9017',
      background_color: config?.background_color || '#ffffff'
    }
  });
  
  // Atualizar valores padrão quando os dados são carregados
  useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        short_name: config.short_name,
        theme_color: config.theme_color,
        background_color: config.background_color
      });
      
      // Carregar imagens para preview
      if (config.icon_192) {
        // Adiciona timestamp para evitar cache
        const iconUrl192 = `${config.icon_192}?t=${Date.now()}`;
        setIcon192Preview(iconUrl192);
        console.log('Carregando ícone 192x192:', iconUrl192);
      }
      
      if (config.icon_512) {
        // Adiciona timestamp para evitar cache
        const iconUrl512 = `${config.icon_512}?t=${Date.now()}`;
        setIcon512Preview(iconUrl512);
        console.log('Carregando ícone 512x512:', iconUrl512);
      }
    }
  }, [config, form]);
  
  // Mutação para salvar configurações gerais
  const saveGeneralMutation = useMutation({
    mutationFn: async (data: AppConfigFormValues) => {
      const res = await apiRequest('POST', '/api/app-config', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
      toast({
        title: "Sucesso!",
        description: "Configurações do PWA atualizadas com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro!",
        description: `Falha ao atualizar configurações: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para fazer upload do ícone 192x192
  const uploadIcon192Mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest('POST', '/api/app-config/icon-192', formData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
      
      // Adicionar o timestamp como parâmetro de query para evitar cache
      const iconPathWithTimestamp = `${data.iconPath}?t=${data.timestamp || Date.now()}`;
      setIcon192Preview(iconPathWithTimestamp);
      
      // Exibir no console o URL completo
      console.log('Novo ícone 192x192:', iconPathWithTimestamp);
      
      toast({
        title: "Sucesso!",
        description: "Ícone 192x192 atualizado com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro!",
        description: `Falha ao fazer upload do ícone 192x192: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para fazer upload do ícone 512x512
  const uploadIcon512Mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest('POST', '/api/app-config/icon-512', formData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
      
      // Adicionar o timestamp como parâmetro de query para evitar cache
      const iconPathWithTimestamp = `${data.iconPath}?t=${data.timestamp || Date.now()}`;
      setIcon512Preview(iconPathWithTimestamp);
      
      // Exibir no console o URL completo
      console.log('Novo ícone 512x512:', iconPathWithTimestamp);
      
      toast({
        title: "Sucesso!",
        description: "Ícone 512x512 atualizado com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro!",
        description: `Falha ao fazer upload do ícone 512x512: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handler para salvar configurações gerais
  const handleSaveGeneral = form.handleSubmit((data) => {
    saveGeneralMutation.mutate(data);
  });
  
  // Handler para fazer upload de ícones
  const handleIcon192Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho e tipo
    if (!file.type.includes('image/')) {
      toast({
        title: "Erro!",
        description: "O arquivo selecionado não é uma imagem válida.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('icon', file);
    formData.append('size', '192');
    uploadIcon192Mutation.mutate(formData);
  };
  
  const handleIcon512Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho e tipo
    if (!file.type.includes('image/')) {
      toast({
        title: "Erro!",
        description: "O arquivo selecionado não é uma imagem válida.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('icon', file);
    formData.append('size', '512');
    uploadIcon512Mutation.mutate(formData);
  };
  
  // JSX para o componente
  return (
    <UserPermissionGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Configurações do PWA</h2>
            <p className="text-muted-foreground">
              Personalize as configurações do Progressive Web App para a experiência mobile
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="icons">Ícones</TabsTrigger>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
          </TabsList>
          
          {/* Informações Gerais */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais do PWA</CardTitle>
                <CardDescription>
                  Configure as informações básicas exibidas quando os usuários instalarem o aplicativo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveGeneral} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Aplicativo</Label>
                        <Input 
                          id="name"
                          placeholder="Nome completo do aplicativo" 
                          {...form.register('name')}
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="short_name">Nome Curto</Label>
                        <Input 
                          id="short_name"
                          placeholder="Nome curto (para ícones)" 
                          {...form.register('short_name')}
                        />
                        {form.formState.errors.short_name && (
                          <p className="text-sm text-red-500">{form.formState.errors.short_name.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="theme_color">Cor do Tema</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="theme_color"
                            type="color"
                            className="w-12 h-10 p-1"
                            {...form.register('theme_color')}
                          />
                          <Input 
                            placeholder="Código de cor hex (#FE9017)" 
                            value={form.watch('theme_color')}
                            onChange={(e) => form.setValue('theme_color', e.target.value)}
                          />
                        </div>
                        {form.formState.errors.theme_color && (
                          <p className="text-sm text-red-500">{form.formState.errors.theme_color.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="background_color">Cor de Fundo</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="background_color"
                            type="color"
                            className="w-12 h-10 p-1"
                            {...form.register('background_color')}
                          />
                          <Input 
                            placeholder="Código de cor hex (#ffffff)" 
                            value={form.watch('background_color')}
                            onChange={(e) => form.setValue('background_color', e.target.value)}
                          />
                        </div>
                        {form.formState.errors.background_color && (
                          <p className="text-sm text-red-500">{form.formState.errors.background_color.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="mt-4"
                      disabled={saveGeneralMutation.isPending}
                    >
                      {saveGeneralMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : 'Salvar Configurações'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Ícones */}
          <TabsContent value="icons">
            <Card>
              <CardHeader>
                <CardTitle>Ícones do PWA</CardTitle>
                <CardDescription>
                  Faça upload dos ícones que serão exibidos na tela inicial e nos dispositivos dos usuários.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ícone 192x192 */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Ícone 192x192</h3>
                      <p className="text-sm text-gray-500">
                        Este ícone será utilizado em telas menores e como ícone padrão.
                      </p>
                    </div>
                    
                    {icon192Preview && (
                      <div className="flex justify-center mb-4">
                        <img 
                          src={icon192Preview} 
                          alt="Ícone 192x192" 
                          className="h-24 w-24 border rounded-md object-contain"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="icon-192">Selecionar imagem (192x192px)</Label>
                      <Input
                        id="icon-192"
                        type="file"
                        accept="image/*"
                        onChange={handleIcon192Upload}
                        disabled={uploadIcon192Mutation.isPending}
                      />
                      <p className="text-xs text-gray-500">
                        Recomendado: PNG ou WebP com fundo transparente.
                      </p>
                    </div>
                    
                    {uploadIcon192Mutation.isPending && (
                      <div className="flex items-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                        <span className="text-sm">Fazendo upload...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Ícone 512x512 */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Ícone 512x512</h3>
                      <p className="text-sm text-gray-500">
                        Este ícone será utilizado em telas maiores e para splash screens.
                      </p>
                    </div>
                    
                    {icon512Preview && (
                      <div className="flex justify-center mb-4">
                        <img 
                          src={icon512Preview} 
                          alt="Ícone 512x512" 
                          className="h-24 w-24 border rounded-md object-contain"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="icon-512">Selecionar imagem (512x512px)</Label>
                      <Input
                        id="icon-512"
                        type="file"
                        accept="image/*"
                        onChange={handleIcon512Upload}
                        disabled={uploadIcon512Mutation.isPending}
                      />
                      <p className="text-xs text-gray-500">
                        Recomendado: PNG ou WebP com fundo transparente.
                      </p>
                    </div>
                    
                    {uploadIcon512Mutation.isPending && (
                      <div className="flex items-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                        <span className="text-sm">Fazendo upload...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Visualização */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Visualização do PWA</CardTitle>
                <CardDescription>
                  Veja como o seu aplicativo aparecerá quando instalado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visualização do manifest.json */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Manifest.json</h3>
                    <div className="p-4 rounded-md bg-gray-100 dark:bg-gray-800 overflow-auto max-h-80">
                      <pre className="text-xs">
                        {JSON.stringify({
                          name: form.watch('name') || config?.name || 'Design Auto',
                          short_name: form.watch('short_name') || config?.short_name || 'Design Auto',
                          theme_color: form.watch('theme_color') || config?.theme_color || '#FE9017',
                          background_color: form.watch('background_color') || config?.background_color || '#ffffff',
                          display: "standalone",
                          scope: "/",
                          start_url: "/",
                          icons: [
                            {
                              src: config?.icon_192 || "/icons/icon-192x192.png",
                              sizes: "192x192",
                              type: "image/png"
                            },
                            {
                              src: config?.icon_512 || "/icons/icon-512x512.png",
                              sizes: "512x512",
                              type: "image/png"
                            }
                          ]
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Simulação de tela inicial */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Visualização na tela inicial</h3>
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border dark:border-gray-700 flex items-center justify-center" style={{ backgroundColor: form.watch('background_color') || config?.background_color || '#ffffff' }}>
                        {(icon192Preview || icon512Preview) ? (
                          <img 
                            src={icon192Preview || icon512Preview} 
                            alt="Ícone do app" 
                            className="max-w-full max-h-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-md" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-center">
                        {form.watch('short_name') || config?.short_name || 'Design Auto'}
                      </span>
                    </div>
                    
                    {/* Status da instalação */}
                    <Alert className="mt-6">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle>Instalação disponível</AlertTitle>
                      <AlertDescription>
                        O PWA está configurado e pronto para instalação pelos usuários através do botão "Instalar App" no site.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Integrações */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integração com Hotmart</CardTitle>
                <CardDescription>
                  Teste suas credenciais da API Hotmart para verificar se a conexão está funcionando corretamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Testador de Credenciais da API Hotmart</h3>
                    <p className="text-gray-500 mb-4">
                      Use esta ferramenta para verificar se suas credenciais da API Hotmart estão funcionando corretamente. 
                      Isso ajudará a identificar problemas de conexão ou autenticação.
                    </p>
                    <HotmartCredentialTester />
                  </div>
                  
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Se suas credenciais não estiverem funcionando, verifique no painel da Hotmart se elas estão ativas 
                      e se você tem as permissões corretas. Você pode precisar gerar novas credenciais caso as atuais tenham expirado.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserPermissionGuard>
  );
}