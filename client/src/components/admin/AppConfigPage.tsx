/**
 * Página de configuração do Progressive Web App (PWA)
 * Permite que administradores personalizem as configurações do PWA
 */

import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ImageIcon, Save, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPermissionGuard } from '@/components/admin/UserPermissionGuard';

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
  const [formData, setFormData] = useState<AppConfig>({
    name: 'DesignAuto',
    short_name: 'DesignAuto',
    theme_color: '#1e40af',
    background_color: '#ffffff',
    icon_192: '/icons/icon-192.png',
    icon_512: '/icons/icon-512.png',
  });
  
  const icon192InputRef = useRef<HTMLInputElement>(null);
  const icon512InputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  
  // Buscar configuração atual do PWA
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/app-config'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/app-config');
      const data = await res.json();
      if (data.success && data.config) {
        setFormData(data.config);
        return data.config;
      }
      return null;
    }
  });
  
  // Mutação para atualizar as configurações do PWA
  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<AppConfig>) => {
      const res = await apiRequest('POST', '/api/app-config', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Configurações atualizadas',
        description: 'As configurações do PWA foram atualizadas com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar configurações',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para fazer upload do ícone 192x192
  const uploadIcon192Mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/app-config/icon-192', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Ícone atualizado',
        description: 'O ícone 192x192 foi atualizado com sucesso',
      });
      
      // Atualizar o formData com o novo caminho do ícone
      setFormData(prev => ({
        ...prev,
        icon_192: data.iconPath + '?v=' + new Date().getTime() // Adicionar timestamp para evitar cache
      }));
      
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao fazer upload do ícone',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para fazer upload do ícone 512x512
  const uploadIcon512Mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/app-config/icon-512', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Ícone atualizado',
        description: 'O ícone 512x512 foi atualizado com sucesso',
      });
      
      // Atualizar o formData com o novo caminho do ícone
      setFormData(prev => ({
        ...prev,
        icon_512: data.iconPath + '?v=' + new Date().getTime() // Adicionar timestamp para evitar cache
      }));
      
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao fazer upload do ícone',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigMutation.mutate({
      name: formData.name,
      short_name: formData.short_name,
      theme_color: formData.theme_color,
      background_color: formData.background_color,
    });
  };
  
  const handleIconUpload = (size: '192' | '512') => {
    const inputRef = size === '192' ? icon192InputRef : icon512InputRef;
    
    if (inputRef.current && inputRef.current.files && inputRef.current.files[0]) {
      const formData = new FormData();
      formData.append('icon', inputRef.current.files[0]);
      formData.append('size', size);
      
      if (size === '192') {
        uploadIcon192Mutation.mutate(formData);
      } else {
        uploadIcon512Mutation.mutate(formData);
      }
    }
  };
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Ocorreu um erro ao carregar as configurações do PWA. Por favor, tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <UserPermissionGuard requiredRole="admin">
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Configurações do PWA</h1>
        <p className="text-muted-foreground mb-8">
          Configure as opções do Progressive Web App (PWA) para personalizar a experiência de instalação do aplicativo.
        </p>
        
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="icons">Ícones</TabsTrigger>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Defina as configurações básicas do seu PWA, como nome, cor de tema e cor de fundo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} id="general-form" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Aplicativo</Label>
                      <Input 
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="short_name">Nome Curto</Label>
                      <Input 
                        id="short_name"
                        name="short_name"
                        value={formData.short_name}
                        onChange={handleChange}
                        maxLength={12}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Nome curto usado na tela inicial (máximo 12 caracteres)
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme_color">Cor do Tema</Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            id="theme_color"
                            name="theme_color"
                            type="color"
                            value={formData.theme_color}
                            onChange={handleChange}
                            className="w-16 h-10 p-1"
                            required
                          />
                          <Input 
                            value={formData.theme_color}
                            onChange={handleChange}
                            name="theme_color"
                            className="flex-grow"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="background_color">Cor de Fundo</Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            id="background_color"
                            name="background_color"
                            type="color"
                            value={formData.background_color}
                            onChange={handleChange}
                            className="w-16 h-10 p-1"
                            required
                          />
                          <Input 
                            value={formData.background_color}
                            onChange={handleChange}
                            name="background_color"
                            className="flex-grow"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  form="general-form"
                  disabled={isLoading || updateConfigMutation.isPending}
                  className="gap-2"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="icons">
            <Card>
              <CardHeader>
                <CardTitle>Ícones do Aplicativo</CardTitle>
                <CardDescription>
                  Faça upload dos ícones que serão usados quando o aplicativo for instalado na tela inicial.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ícone 192x192 */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Ícone 192x192</h3>
                      </div>
                      <div className="aspect-square w-48 mx-auto mb-4 border rounded flex items-center justify-center overflow-hidden bg-gray-50">
                        {isLoading ? (
                          <Skeleton className="w-full h-full" />
                        ) : (
                          <img 
                            src={formData.icon_192 + '?v=' + new Date().getTime()} 
                            alt="Ícone 192x192" 
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              // Fallback para caso a imagem não seja encontrada
                              e.currentTarget.src = '/placeholder-icon.png';
                            }}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="icon-192">Selecionar Arquivo</Label>
                          <span className="text-xs text-muted-foreground">PNG, JPG ou WebP</span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="icon-192"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            ref={icon192InputRef}
                            disabled={uploadIcon192Mutation.isPending}
                            className="flex-grow"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIconUpload('192')}
                            disabled={uploadIcon192Mutation.isPending || !icon192InputRef.current?.files?.length}
                          >
                            {uploadIcon192Mutation.isPending ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ícone 512x512 */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Ícone 512x512</h3>
                      </div>
                      <div className="aspect-square w-48 mx-auto mb-4 border rounded flex items-center justify-center overflow-hidden bg-gray-50">
                        {isLoading ? (
                          <Skeleton className="w-full h-full" />
                        ) : (
                          <img 
                            src={formData.icon_512 + '?v=' + new Date().getTime()} 
                            alt="Ícone 512x512"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              // Fallback para caso a imagem não seja encontrada
                              e.currentTarget.src = '/placeholder-icon.png';
                            }}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="icon-512">Selecionar Arquivo</Label>
                          <span className="text-xs text-muted-foreground">PNG, JPG ou WebP</span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="icon-512"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            ref={icon512InputRef}
                            disabled={uploadIcon512Mutation.isPending}
                            className="flex-grow"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIconUpload('512')}
                            disabled={uploadIcon512Mutation.isPending || !icon512InputRef.current?.files?.length}
                          >
                            {uploadIcon512Mutation.isPending ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <ImageIcon className="h-4 w-4" />
                    <AlertTitle>Dica</AlertTitle>
                    <AlertDescription>
                      Para melhor resultado, use ícones quadrados, transparentes e com dimensões exatas de 192x192 e 512x512 pixels.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Visualização</CardTitle>
                <CardDescription>
                  Veja como o seu PWA vai aparecer quando for instalado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-40 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium mb-4">Tela Inicial</h3>
                          <div className="flex justify-center">
                            <div className="border rounded-lg p-2" style={{ backgroundColor: '#f2f2f2' }}>
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-16 h-16 rounded-lg overflow-hidden border shadow-sm" style={{ backgroundColor: formData.background_color }}>
                                  <img 
                                    src={formData.icon_192 + '?v=' + new Date().getTime()} 
                                    alt="App Icon"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder-icon.png';
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-center font-medium">
                                  {formData.short_name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium mb-4">Tela de Splash</h3>
                          <div className="flex justify-center">
                            <div 
                              className="border rounded-lg p-6 shadow-sm w-64 h-96 flex flex-col items-center justify-center"
                              style={{ backgroundColor: formData.background_color }}
                            >
                              <img 
                                src={formData.icon_512 + '?v=' + new Date().getTime()} 
                                alt="App Icon Large"
                                className="w-24 h-24 mb-4 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-icon.png';
                                }}
                              />
                              <span className="text-base font-medium" style={{ color: formData.theme_color }}>
                                {formData.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium mb-4">Manifest JSON</h3>
                        <pre className="bg-slate-100 p-4 rounded-lg overflow-auto text-xs">
                          {JSON.stringify({
                            name: formData.name,
                            short_name: formData.short_name,
                            start_url: '/',
                            display: 'standalone',
                            theme_color: formData.theme_color,
                            background_color: formData.background_color,
                            icons: [
                              {
                                src: formData.icon_192,
                                sizes: '192x192',
                                type: 'image/png',
                                purpose: 'any'
                              },
                              {
                                src: formData.icon_512,
                                sizes: '512x512',
                                type: 'image/png',
                                purpose: 'any'
                              }
                            ]
                          }, null, 2)}
                        </pre>
                      </div>
                      
                      <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open('/manifest.json', '_blank')}
                        >
                          Ver manifest.json atual
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserPermissionGuard>
  );
}