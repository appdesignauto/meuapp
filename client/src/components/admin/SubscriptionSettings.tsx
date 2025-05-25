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
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle, XCircle, Clock, Copy, Check, AlertCircle } from 'lucide-react';

// Schema de validação para as configurações
const formSchema = z.object({
  // Campos gerais
  siteName: z.string().min(1, 'Nome do site é obrigatório'),
  webhookSecret: z.string().optional().or(z.literal('')),
  
  // Integrações removidas - reservado para futuras integrações
});

export default function SubscriptionSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados de cópia para clipboard
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Estados para testes de conexão - removidos da Doppus
  
  // Query para carregar configurações atuais
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/subscription-settings'],
    queryFn: () => apiRequest('GET', '/api/admin/subscription-settings'),
  });

  // Query para obter configurações do site
  const { data: siteSettings } = useQuery({
    queryKey: ['/api/site-settings'],
    queryFn: () => apiRequest('GET', '/api/site-settings'),
  });

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Configuração do formulário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Campos gerais
      siteName: '',
      webhookSecret: '',
    },
  });

  // Atualizar valores do formulário quando os dados chegarem
  useEffect(() => {
    if (settings) {
      form.reset({
        // Campos gerais
        siteName: settings.siteName || '',
        webhookSecret: settings.webhookSecret || '',
      });
    }
  }, [settings, form]);

  // Mutation para salvar as configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('PUT', '/api/admin/subscription-settings', values);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  // Funções auxiliares
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [text]: true }));
      toast({
        title: "Copiado!",
        description: successMessage,
      });
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [text]: false }));
      }, 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateSettingsMutation.mutate(values);
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações de Assinaturas</h3>
        <p className="text-sm text-muted-foreground">
          Configure as integrações e webhooks para gerenciar assinaturas automaticamente.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
            </TabsList>

            {/* Aba de configurações gerais */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Configurações Gerais
                  </CardTitle>
                  <CardDescription>
                    Configure as informações básicas do sistema de assinaturas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Site</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do seu site" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nome que aparecerá nas notificações de webhook
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave Secreta dos Webhooks</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Chave secreta para validação de webhooks" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Chave usada para validar a autenticidade dos webhooks recebidos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}