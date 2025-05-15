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
  Bell
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
  doppusApiKey: z.string().optional().or(z.literal('')),
  doppusSecretKey: z.string().optional().or(z.literal('')),
  doppusBasicPlanId: z.string().optional().or(z.literal('')),
  doppusProPlanId: z.string().optional().or(z.literal('')),
  doppusWebhookUrl: z.string().url({ message: 'A URL do webhook Doppus deve ser uma URL válida' }).optional().or(z.literal('')),
  
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
      doppusApiKey: '',
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
        doppusApiKey: settings.doppusApiKey || '',
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

  // Função para submeter o formulário
  const onSubmit = (data: SubscriptionSettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erro ao carregar configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Não foi possível carregar as configurações de assinaturas. {error?.message}</p>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/subscription-settings'] })}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Configurações de Webhook da Hotmart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook da Hotmart
            </CardTitle>
            <CardDescription>
              Configure a integração com a plataforma Hotmart para processar assinaturas automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Callback do Webhook</FormLabel>
                  <FormControl>
                    <Input placeholder="https://seu-site.com/api/webhooks/hotmart" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL que você deve cadastrar no painel da Hotmart para receber notificações
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookSecretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave de Segurança (Secret Key)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="password" placeholder="••••••••••••••••" {...field} />
                      <Button type="button" variant="outline" size="icon" onClick={() => {
                        const newKey = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
                        form.setValue('webhookSecretKey', newKey);
                      }}>
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
          </CardContent>
        </Card>

        {/* Comportamento de Assinaturas */}
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

        {/* Notificações */}
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
                      className="min-h-[150px]"
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