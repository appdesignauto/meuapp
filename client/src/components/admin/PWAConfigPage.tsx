import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Upload } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Esquema de validação para o formulário
const pwaConfigSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  shortName: z.string().min(1, "Nome curto é obrigatório").max(12, "Nome curto deve ter no máximo 12 caracteres"),
  themeColor: z.string().min(1, "Cor do tema é obrigatória").regex(/^#([0-9A-F]{3}){1,2}$/i, "Formato de cor HEX inválido"),
  backgroundColor: z.string().min(1, "Cor de fundo é obrigatória").regex(/^#([0-9A-F]{3}){1,2}$/i, "Formato de cor HEX inválido"),
});

type PWAConfig = z.infer<typeof pwaConfigSchema> & {
  icon192?: string;
  icon512?: string;
};

export default function PWAConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [icon192Loading, setIcon192Loading] = useState(false);
  const [icon512Loading, setIcon512Loading] = useState(false);
  const [config, setConfig] = useState<PWAConfig | null>(null);

  // Inicializa o formulário
  const form = useForm<PWAConfig>({
    resolver: zodResolver(pwaConfigSchema),
    defaultValues: {
      name: "",
      shortName: "",
      themeColor: "",
      backgroundColor: "",
    },
  });

  // Busca as configurações do PWA
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await apiRequest("GET", "/api/app-config");
        const data = await response.json();
        setConfig(data);
        form.reset({
          name: data.name,
          shortName: data.shortName,
          themeColor: data.themeColor,
          backgroundColor: data.backgroundColor,
        });
      } catch (error) {
        console.error("Erro ao buscar configurações do PWA:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações do PWA.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [toast, form]);

  // Salva as configurações do PWA
  const onSubmit = async (data: PWAConfig) => {
    try {
      setLoading(true);
      const response = await apiRequest("PUT", "/api/app-config", data);
      const result = await response.json();
      setConfig(result);
      toast({
        title: "Sucesso",
        description: "Configurações do PWA atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar configurações do PWA:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações do PWA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload de ícone
  const handleIconUpload = async (size: "192" | "512", file: File) => {
    if (!file) return;

    if (size === "192") {
      setIcon192Loading(true);
    } else {
      setIcon512Loading(true);
    }

    try {
      const formData = new FormData();
      formData.append("icon", file);
      formData.append("size", size);

      const response = await fetch("/api/app-config/icon", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Erro ao fazer upload do ícone");
      }

      // Atualiza o estado com o novo caminho do ícone
      setConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [size === "192" ? "icon192" : "icon512"]: result.iconPath,
        };
      });

      toast({
        title: "Sucesso",
        description: `Ícone ${size}x${size} atualizado com sucesso.`,
      });
    } catch (error) {
      console.error(`Erro ao fazer upload do ícone ${size}:`, error);
      toast({
        title: "Erro",
        description: `Não foi possível fazer upload do ícone ${size}x${size}.`,
        variant: "destructive",
      });
    } finally {
      if (size === "192") {
        setIcon192Loading(false);
      } else {
        setIcon512Loading(false);
      }
    }
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações do PWA</h1>
        <p className="text-gray-500">
          Configure as opções do Progressive Web App (PWA) para melhorar a experiência móvel dos usuários.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do App</CardTitle>
            <CardDescription>
              Defina as informações básicas do aplicativo para dispositivos móveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Aplicativo</FormLabel>
                      <FormControl>
                        <Input placeholder="DesignAuto" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome completo exibido na tela inicial dos dispositivos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Curto</FormLabel>
                      <FormControl>
                        <Input placeholder="Design" {...field} />
                      </FormControl>
                      <FormDescription>
                        Versão curta do nome (máx. 12 caracteres)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="themeColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor do Tema</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="text" placeholder="#4F46E5" {...field} />
                        </FormControl>
                        <Input 
                          type="color" 
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-12 p-1"
                        />
                      </div>
                      <FormDescription>
                        Cor principal da barra de navegação do aplicativo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor de Fundo</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="text" placeholder="#FFFFFF" {...field} />
                        </FormControl>
                        <Input 
                          type="color" 
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-12 p-1"
                        />
                      </div>
                      <FormDescription>
                        Cor de fundo exibida durante o carregamento do aplicativo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Configurações"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Gerenciamento de ícones */}
        <Card>
          <CardHeader>
            <CardTitle>Ícones do Aplicativo</CardTitle>
            <CardDescription>
              Faça upload dos ícones que serão exibidos na tela inicial dos dispositivos móveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Ícone 192x192 */}
              <div className="space-y-4">
                <h3 className="font-medium">Ícone 192x192</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-24 h-24 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {config?.icon192 ? (
                      <img
                        src={`${config.icon192}?${new Date().getTime()}`}
                        alt="Ícone 192x192"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm text-center">
                        Sem ícone
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <FormItem>
                      <FormLabel>Upload do Ícone 192x192</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleIconUpload("192", e.target.files[0]);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Ícone usado em dispositivos de baixa e média resolução
                      </FormDescription>
                    </FormItem>
                  </div>
                </div>
                {icon192Loading && (
                  <div className="flex items-center text-primary text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando ícone...
                  </div>
                )}
              </div>

              {/* Ícone 512x512 */}
              <div className="space-y-4">
                <h3 className="font-medium">Ícone 512x512</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-24 h-24 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {config?.icon512 ? (
                      <img
                        src={`${config.icon512}?${new Date().getTime()}`}
                        alt="Ícone 512x512"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm text-center">
                        Sem ícone
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <FormItem>
                      <FormLabel>Upload do Ícone 512x512</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleIconUpload("512", e.target.files[0]);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Ícone usado em dispositivos de alta resolução
                      </FormDescription>
                    </FormItem>
                  </div>
                </div>
                {icon512Loading && (
                  <div className="flex items-center text-primary text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando ícone...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de como testar o PWA */}
      <Card>
        <CardHeader>
          <CardTitle>Como Testar o PWA</CardTitle>
          <CardDescription>
            Instruções para testar o Progressive Web App em dispositivos móveis e desktop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Dispositivos Android</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Abra o site no Google Chrome</li>
                <li>Toque no menu (três pontos no canto superior direito)</li>
                <li>Selecione "Adicionar à tela inicial" ou "Instalar app"</li>
                <li>Confirme a instalação</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Dispositivos iOS</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Abra o site no Safari</li>
                <li>Toque no botão de compartilhamento (ícone de seta para cima)</li>
                <li>Selecione "Adicionar à Tela de Início"</li>
                <li>Dê um nome ao app e toque em "Adicionar"</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Desktop Chrome</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Abra o site no Google Chrome</li>
                <li>Clique no ícone de instalação na barra de endereços (ícone +)</li>
                <li>Clique em "Instalar"</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}