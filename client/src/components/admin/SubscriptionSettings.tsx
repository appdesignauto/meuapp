import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Save,
  RefreshCw,
  Webhook,
  Key,
  Globe,
  Clock,
  BadgeDollarSign,
  Bell,
  CreditCard,
  Copy,
  XCircle,
  Mail,
  Lock,
  Code,
  FileText,
  UserPlus,
  LayoutDashboard,
  KeyRound
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Esquema de validação com Zod
const subscriptionSettingsSchema = z.object({
  // Campos Hotmart
  webhookUrl: z.string().url({ message: 'A URL do webhook deve ser uma URL válida' }).optional().or(z.literal('')),
  webhookSecretKey: z.string().optional(),
  hotmartEnvironment: z.enum(['sandbox', 'production']),
  hotmartClientId: z.string().optional().or(z.literal('')),
  hotmartClientSecret: z.string().optional().or(z.literal('')),
  hotmartBasicPlanId: z.string().optional().or(z.literal('')),
  hotmartProPlanId: z.string().optional().or(z.literal('')),
  hotmartWebhookUrl: z.string().url({ message: 'A URL do webhook Hotmart deve ser uma URL válida' }).optional().or(z.literal('')),
  
  // Campos Doppus
  doppusClientId: z.string().optional().or(z.literal('')),
  doppusClientSecret: z.string().optional().or(z.literal('')),
  doppusSecretKey: z.string().optional().or(z.literal('')),
  doppusBasicPlanId: z.string().optional().or(z.literal('')),
  doppusProPlanId: z.string().optional().or(z.literal('')),
  doppusWebhookUrl: z.string().url({ message: 'A URL do webhook Doppus deve ser uma URL válida' }).optional().or(z.literal('')),
  
  // Campo doppusApiKey removido conforme solicitado
  
  // Configurações gerais
  graceHoursAfterExpiration: z.coerce.number().int().min(0).max(720),
  sendExpirationWarningDays: z.coerce.number().int().min(0).max(30),
  defaultSubscriptionDuration: z.coerce.number().int().min(1).max(36),
  autoDowngradeAfterExpiration: z.boolean(),
  sendExpirationWarningEmails: z.boolean(),
  autoMapProductCodes: z.boolean(),
  notificationEmailSubject: z.string().optional(),
  notificationEmailTemplate: z.string().optional(),
});

type SubscriptionSettingsForm = z.infer<typeof subscriptionSettingsSchema>;

export default function SubscriptionSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTestingDoppusConnection, setIsTestingDoppusConnection] = useState(false);
  const [doppusConnectionStatus, setDoppusConnectionStatus] = useState<{ success: boolean; timestamp?: Date; message?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("geral");

  // Consulta para obter as configurações atuais
  const { data: settings, isLoading, error, isError } = useQuery({
    queryKey: ['/api/subscription-settings'],
    retry: 1,
  });

  // Formulário com validação
  const form = useForm<SubscriptionSettingsForm>({
    resolver: zodResolver(subscriptionSettingsSchema),
    defaultValues: {
      // Campos Hotmart
      webhookUrl: '',
      webhookSecretKey: '',
      hotmartEnvironment: 'sandbox',
      hotmartClientId: '',
      hotmartClientSecret: '',
      hotmartBasicPlanId: '',
      hotmartProPlanId: '',
      hotmartWebhookUrl: '',
      
      // Campos Doppus
      doppusClientId: '',
      doppusClientSecret: '',
      doppusSecretKey: '',
      doppusBasicPlanId: '',
      doppusProPlanId: '',
      doppusWebhookUrl: '',
      
      // Campos gerais
      graceHoursAfterExpiration: 48,
      sendExpirationWarningDays: 3,
      defaultSubscriptionDuration: 12,
      autoDowngradeAfterExpiration: true,
      sendExpirationWarningEmails: true,
      autoMapProductCodes: true,
      notificationEmailSubject: '',
      notificationEmailTemplate: '',
    },
  });

  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copiado!",
          description: message,
          variant: "default",
        });
      },
      (err) => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o texto para a área de transferência.",
          variant: "destructive",
        });
      }
    );
  };

  // Atualizar valores do formulário quando os dados são carregados
  useEffect(() => {
    if (settings) {
      form.reset({
        // Campos Hotmart
        webhookUrl: settings.webhookUrl || '',
        webhookSecretKey: settings.webhookSecretKey || '',
        hotmartEnvironment: settings.hotmartEnvironment || 'sandbox',
        hotmartClientId: settings.hotmartClientId || '',
        hotmartClientSecret: settings.hotmartClientSecret || '',
        hotmartBasicPlanId: settings.hotmartBasicPlanId || '',
        hotmartProPlanId: settings.hotmartProPlanId || '',
        hotmartWebhookUrl: settings.hotmartWebhookUrl || '',
        
        // Campos Doppus
        doppusClientId: settings.doppusClientId || '',
        doppusClientSecret: settings.doppusClientSecret || '',
        doppusSecretKey: settings.doppusSecretKey || '',
        doppusBasicPlanId: settings.doppusBasicPlanId || '',
        doppusProPlanId: settings.doppusProPlanId || '',
        doppusWebhookUrl: settings.doppusWebhookUrl || '',
        
        // Campos de configuração geral
        graceHoursAfterExpiration: settings.graceHoursAfterExpiration || 48,
        sendExpirationWarningDays: settings.sendExpirationWarningDays || 3,
        defaultSubscriptionDuration: settings.defaultSubscriptionDuration || 12,
        autoDowngradeAfterExpiration: settings.autoDowngradeAfterExpiration !== false,
        sendExpirationWarningEmails: settings.sendExpirationWarningEmails !== false,
        autoMapProductCodes: settings.autoMapProductCodes !== false,
        notificationEmailSubject: settings.notificationEmailSubject || '',
        notificationEmailTemplate: settings.notificationEmailTemplate || '',
      });
    }
  }, [settings, form]);

  // Mutation para atualizar as configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SubscriptionSettingsForm) => {
      setIsUpdating(true);
      try {
        const response = await apiRequest('PUT', '/api/subscription-settings', data);
        const result = await response.json();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-settings'] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de assinaturas foram atualizadas com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Ocorreu um erro ao salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para testar a conexão com a API da Doppus
  const testDoppusConnectionMutation = useMutation({
    mutationFn: async () => {
      setIsTestingDoppusConnection(true);
      try {
        const response = await apiRequest('GET', '/api/integrations/doppus/test-connection');
        const result = await response.json();
        return result;
      } finally {
        setIsTestingDoppusConnection(false);
      }
    },
    onSuccess: (data) => {
      setDoppusConnectionStatus({
        success: data.success,
        message: data.message,
        timestamp: new Date(),
      });
      
      toast({
        title: data.success ? "Conexão bem-sucedida" : "Falha na conexão",
        description: data.message || (data.success ? 
          "Conexão com a API da Doppus estabelecida com sucesso." : 
          "Não foi possível conectar à API da Doppus."),
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      setDoppusConnectionStatus({
        success: false,
        message: error.message || "Falha na conexão com a API da Doppus",
        timestamp: new Date(),
      });
      
      toast({
        title: "Erro ao testar conexão",
        description: error.message || "Ocorreu um erro ao testar a conexão com a API da Doppus.",
        variant: "destructive",
      });
    },
  });

  // Função para submeter o formulário
  const onSubmit = (data: SubscriptionSettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  // Mostrar estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  // Mostrar erro se houver problemas ao carregar
  if (isError && error) {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erro ao carregar configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error.message || "Não foi possível carregar as configurações de assinaturas."}</p>
          <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Construir URL completa para o webhook
  const siteUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
  const hotmartWebhookFullUrl = `${siteUrl}/api/webhooks/hotmart`;
  const doppusWebhookFullUrl = `${siteUrl}/api/webhooks/doppus`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs de navegação */}
        <Tabs defaultValue="geral" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="hotmart">Hotmart</TabsTrigger>
            <TabsTrigger value="doppus">Doppus</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          </TabsList>

          {/* Aba de configurações gerais */}
          <TabsContent value="geral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5" />
                  Comportamento de Assinaturas
                </CardTitle>
                <CardDescription>
                  Configure o comportamento padrão para assinaturas e renovações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="defaultSubscriptionDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Padrão de Assinatura (em meses)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Número padrão de meses para assinaturas criadas manualmente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="graceHoursAfterExpiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período de Carência após Expiração (em horas)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Horas adicionais de acesso após a expiração da assinatura
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="autoDowngradeAfterExpiration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel>Rebaixar Automaticamente</FormLabel>
                          <FormDescription>
                            Rebaixar usuários para nível "free" após expiração da assinatura
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoMapProductCodes"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel>Mapeamento Automático de Produtos</FormLabel>
                          <FormDescription>
                            Mapear automaticamente códigos de produtos para planos na plataforma
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de configuração da Hotmart */}
          <TabsContent value="hotmart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Integração com Hotmart
                </CardTitle>
                <CardDescription>
                  Configure a integração com a plataforma Hotmart para processar assinaturas automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border p-4 rounded-md bg-muted/30">
                    <h3 className="text-sm font-medium mb-2">URL do Webhook</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="bg-muted p-2 rounded text-xs flex-1 overflow-x-auto">
                        {hotmartWebhookFullUrl}
                      </code>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(hotmartWebhookFullUrl, "URL do webhook copiada!")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cadastre esta URL no painel da Hotmart para receber notificações de eventos
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="webhookSecretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave de Segurança do Webhook (HOTMART_SECRET)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input type="password" placeholder="••••••••••••••••" {...field} />
                            <Button type="button" variant="outline" size="icon" onClick={() => {
                              const newKey = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
                              form.setValue('webhookSecretKey', newKey);
                              form.trigger('webhookSecretKey');
                            }} title="Gerar nova chave">
                              <Key className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Chave para validar autenticidade das requisições da Hotmart
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hotmartEnvironment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ambiente da Hotmart</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o ambiente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                            <SelectItem value="production">Produção</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Ambiente da Hotmart para processar os webhooks
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Credenciais de Acesso</h3>
                  
                  <FormField
                    control={form.control}
                    name="hotmartClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID (HOTMART_CLIENT_ID)</FormLabel>
                        <FormControl>
                          <Input placeholder="Insira o Client ID da Hotmart" {...field} />
                        </FormControl>
                        <FormDescription>
                          ID do cliente para acessar a API da Hotmart
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hotmartClientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret (HOTMART_CLIENT_SECRET)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Chave secreta para acessar a API da Hotmart
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="rounded-md border p-4 bg-muted/30">
                    <h4 className="text-sm font-medium mb-2">Basic Token</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      O Basic Token é necessário para autenticação na API da Hotmart em ambiente de produção. 
                      Este token é gerado automaticamente a partir do Client ID e Client Secret.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const clientId = form.getValues('hotmartClientId');
                        const clientSecret = form.getValues('hotmartClientSecret');
                        
                        if (!clientId || !clientSecret) {
                          toast({
                            title: "Campos incompletos",
                            description: "Preencha o Client ID e Client Secret para gerar o Basic Token",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        // Gera o Basic Token (Base64 de clientId:clientSecret)
                        try {
                          const basicToken = btoa(`${clientId}:${clientSecret}`);
                          
                          // Copia para o clipboard
                          navigator.clipboard.writeText(basicToken).then(() => {
                            toast({
                              title: "Basic Token gerado",
                              description: "O Basic Token foi copiado para a área de transferência: " + basicToken.substring(0, 10) + "...",
                              variant: "default",
                            });
                          });
                        } catch (error) {
                          console.error("Erro ao gerar Basic Token:", error);
                          toast({
                            title: "Erro ao gerar Basic Token",
                            description: "Não foi possível gerar o token. Verifique os campos.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Gerar e Copiar Basic Token
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Mapeamento de Produtos</h3>
                  
                  <FormField
                    control={form.control}
                    name="hotmartBasicPlanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Plano Básico</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 1234567" {...field} />
                        </FormControl>
                        <FormDescription>
                          ID do produto básico na Hotmart
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hotmartProPlanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Plano Premium/Pro</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 7654321" {...field} />
                        </FormControl>
                        <FormDescription>
                          ID do produto premium/pro na Hotmart
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de configuração da Doppus */}
          <TabsContent value="doppus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Integração com Doppus
                </CardTitle>
                <CardDescription>
                  Configure a integração com a plataforma Doppus para processar assinaturas automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border p-4 rounded-md bg-muted/30">
                    <h3 className="text-sm font-medium mb-2">URL do Webhook</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="bg-muted p-2 rounded text-xs flex-1 overflow-x-auto">
                        {doppusWebhookFullUrl}
                      </code>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(doppusWebhookFullUrl, "URL do webhook Doppus copiada!")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cadastre esta URL no painel da Doppus para receber notificações de eventos
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="doppusWebhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Webhook registrada na Doppus</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.doppus.io/webhooks/..." {...field} />
                        </FormControl>
                        <FormDescription>
                          URL do webhook registrada no painel da Doppus
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Credenciais de Acesso</h3>
                  
                  <FormField
                    control={form.control}
                    name="doppusClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Insira o Client ID da Doppus" {...field} />
                        </FormControl>
                        <FormDescription>
                          Client ID fornecido pela Doppus (ex: 619f23648b96ee0ef30214921f3f9b01)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doppusClientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Client Secret fornecido pela Doppus
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doppusSecretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Chave secreta para validação de webhooks da Doppus
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testDoppusConnectionMutation.mutate()}
                      disabled={isTestingDoppusConnection}
                    >
                      {isTestingDoppusConnection ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">Testar Conexão</span>
                        </>
                      )}
                    </Button>
                    
                    {doppusConnectionStatus && (
                      <div className={`mt-2 text-sm flex items-center ${doppusConnectionStatus.success ? 'text-green-500' : 'text-red-500'}`}>
                        {doppusConnectionStatus.success ? (
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                        ) : (
                          <XCircle className="mr-1 h-4 w-4" />
                        )}
                        {doppusConnectionStatus.message}
                        {doppusConnectionStatus.timestamp && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {new Date(doppusConnectionStatus.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Mapeamento de Produtos</h3>
                  
                  <FormField
                    control={form.control}
                    name="doppusBasicPlanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Plano Básico</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: basic-monthly" {...field} />
                        </FormControl>
                        <FormDescription>
                          ID do produto básico na Doppus
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doppusProPlanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Plano Premium/Pro</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: premium-monthly" {...field} />
                        </FormControl>
                        <FormDescription>
                          ID do produto premium/pro na Doppus
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de configuração de notificações */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure as notificações para assinantes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sendExpirationWarningEmails"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                      <div className="space-y-0.5">
                        <FormLabel>Enviar E-mails de Aviso</FormLabel>
                        <FormDescription>
                          Enviar avisos por e-mail antes da expiração da assinatura
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sendExpirationWarningDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias de Antecedência para Aviso</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Quantos dias antes da expiração enviar o aviso
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationEmailSubject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto do E-mail de Aviso</FormLabel>
                      <FormControl>
                        <Input placeholder="Sua assinatura irá expirar em breve" {...field} />
                      </FormControl>
                      <FormDescription>
                        Assunto do e-mail enviado antes da expiração
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationEmailTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template do E-mail</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Olá {{nome}}, sua assinatura expira em {{dias_restantes}} dias..."
                          className="min-h-[250px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Template para e-mail de aviso de expiração. Variáveis disponíveis: {"{{nome}}"}, {"{{dias_restantes}}"}, {"{{data_expiracao}}"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isUpdating}
          >
            Restaurar Valores
          </Button>
          <Button
            type="submit"
            disabled={isUpdating || !form.formState.isDirty}
            className="gap-2"
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </Form>
  );
}