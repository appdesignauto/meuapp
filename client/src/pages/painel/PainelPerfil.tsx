import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User as UserIcon, Eye, EyeOff, Save, Crown, Loader2, CalendarClock, Download, Heart, Upload, Camera, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Definição estendida do tipo User para incluir campos adicionais usados no perfil
interface ExtendedUser {
  id: number;
  username: string;
  email: string;
  name: string | null;
  profileimageurl: string | null;
  bio: string | null;
  nivelacesso: string | null;
  origemassinatura: string | null;
  tipoplano: string | null;
  dataassinatura: string | Date | null;
  dataexpiracao: string | Date | null;
  acessovitalicio: boolean;
  observacaoadmin: string | null;
  isactive: boolean;
  ultimologin: string | Date | null;
  criadoem: string | Date;
  atualizadoem: string | Date;
  role: string;
  website?: string;
  location?: string;
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema de validação para o formulário de perfil
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Endereço de email inválido.",
  }),
  username: z.string().min(3, {
    message: "O nome de usuário deve ter pelo menos 3 caracteres.",
  }),
  bio: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
});

// Schema de validação para o formulário de senha
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "A senha atual deve ter pelo menos 6 caracteres.",
  }),
  newPassword: z.string().min(6, {
    message: "A nova senha deve ter pelo menos 6 caracteres.",
  }),
  confirmPassword: z.string().min(6, {
    message: "A confirmação de senha deve ter pelo menos 6 caracteres.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "As senhas não coincidem.",
});

export default function PainelPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Buscar estatísticas do usuário
  const { data: userStats } = useQuery({
    queryKey: ['/api/users/stats'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch('/api/users/stats');
      if (!res.ok) return { 
        totalFavorites: 0, 
        totalDownloads: 0, 
        totalViews: 0, 
        lastLogin: null 
      };
      return res.json();
    },
    enabled: !!user, // Só executa se o usuário estiver logado
  });

  // Verificar se o usuário é premium
  const isPremium = user && 
    (user.role === "premium" || 
     user.role === "designer" || 
     user.role === "designer_adm" || 
     user.role === "admin" ||
     (user.nivelacesso && 
      user.nivelacesso !== "free" && 
      user.nivelacesso !== "usuario"));

  // Formulário de perfil
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      bio: "",
      website: "",
      location: "",
    },
  });

  // Formulário de senha
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Atualizar valores do formulário quando os dados do usuário estiverem disponíveis
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
      });
    }
  }, [user, profileForm]);

  // Mutação para atualizar o perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar a senha
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a senha. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handler para submissão do formulário de perfil
  function onProfileSubmit(data: z.infer<typeof profileFormSchema>) {
    updateProfileMutation.mutate(data);
  }

  // Handler para submissão do formulário de senha
  function onPasswordSubmit(data: z.infer<typeof passwordFormSchema>) {
    updatePasswordMutation.mutate(data);
  }
  
  // Mutação para upload de imagem de perfil
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // Verificar o tipo e tamanho do arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo enviado não é uma imagem válida');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB em bytes
        throw new Error('A imagem deve ter no máximo 5MB');
      }
      
      // Criar FormData para envio
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('Enviando imagem:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);
      
      try {
        console.log('Iniciando upload de imagem...');
        const response = await fetch('/api/users/profile-image', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        console.log('Resposta recebida:', response.status, response.statusText);
        
        let errorData = {};
        try {
          // Tenta extrair os dados JSON mesmo em caso de erro
          errorData = await response.json();
          console.log('Dados da resposta:', errorData);
        } catch (jsonError) {
          console.error('Não foi possível extrair JSON da resposta:', jsonError);
        }
        
        if (!response.ok) {
          console.error('Erro no upload:', response.status, errorData);
          throw new Error(
            errorData.message || 
            errorData.details || 
            `Falha ao fazer upload da imagem (${response.status}: ${response.statusText})`
          );
        }
        
        return errorData;
      } catch (err) {
        console.error('Erro na requisição de upload:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      // Invalidar query do usuário para atualizar a imagem do perfil
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Imagem atualizada',
        description: 'Sua imagem de perfil foi atualizada com sucesso',
      });
      setUploading(false);
      
      // Limpar campo de arquivo para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a imagem. Tente novamente.',
        variant: 'destructive',
      });
      setUploading(false);
      
      // Limpar campo de arquivo para permitir tentar novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });
  
  // Handler para o clique no botão de upload
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handler para quando o arquivo é selecionado
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      uploadImageMutation.mutate(file);
    }
  };

  // Formatação de data para exibição
  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return "N/A";
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Determina as iniciais do nome do usuário para o Avatar
  const getInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="account">Segurança</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>
        
        {/* Aba de Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais aqui. Elas serão visíveis para outros usuários.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar 
                    className="h-24 w-24 relative group cursor-pointer" 
                    onClick={handleImageUploadClick}
                  >
                    <AvatarImage
                      src={user?.profileimageurl || ""}
                      alt={user?.name || "Usuário"}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                    <div 
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center rounded-full transition-opacity ${
                        uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <Camera className="h-8 w-8 text-white" />
                      )}
                    </div>
                  </Avatar>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button 
                    onClick={handleImageUploadClick}
                    disabled={uploading}
                    variant="outline"
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Alterar foto de perfil
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex-1">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome de Usuário</FormLabel>
                              <FormControl>
                                <Input placeholder="seu_usuario" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="email@exemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biografia</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Uma breve descrição sobre você"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Máximo de 200 caracteres.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site</FormLabel>
                              <FormControl>
                                <Input placeholder="https://seusite.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Localização</FormLabel>
                              <FormControl>
                                <Input placeholder="Cidade, Estado" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar Perfil
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Segurança */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>
                Altere sua senha e gerencie a segurança da sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showCurrentPassword ? "text" : "password"} 
                              placeholder="••••••••"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showNewPassword ? "text" : "password"} 
                              placeholder="••••••••"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Mínimo de 8 caracteres com letras, números e símbolos.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="••••••••"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      disabled={updatePasswordMutation.isPending || !passwordForm.formState.isDirty}
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Alterar Senha
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Detalhes */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Conta</CardTitle>
              <CardDescription>
                Visualize informações detalhadas sobre sua conta e status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Informações Pessoais */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Informações Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Nome de Usuário</p>
                      <p>{user?.username || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{user?.email || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                      <p>{user?.name || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Data de Registro</p>
                      <p>{formatDate(user?.criadoem)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Estatísticas da Conta */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Estatísticas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Downloads</p>
                            <p className="text-2xl font-bold">{userStats?.totalDownloads || 0}</p>
                          </div>
                          <Download className="h-8 w-8 text-blue-500 opacity-80" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Favoritos</p>
                            <p className="text-2xl font-bold">{userStats?.totalFavorites || 0}</p>
                          </div>
                          <Heart className="h-8 w-8 text-red-500 opacity-80" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Visualizações</p>
                            <p className="text-2xl font-bold">{userStats?.totalViews || 0}</p>
                          </div>
                          <Eye className="h-8 w-8 text-green-500 opacity-80" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Último acesso */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      <span>Último acesso: {userStats?.lastLogin ? formatDate(userStats.lastLogin) : "Primeiro acesso"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Atividade da Conta */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Atividade da Conta</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Último Login</p>
                      <p>{userStats?.lastLogin ? formatDate(userStats.lastLogin) : (user?.ultimologin ? formatDate(user.ultimologin) : "N/A")}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-muted-foreground">Status da Conta</p>
                      <div>
                        <Badge className={user?.isactive ? "bg-green-500" : "bg-red-500"}>
                          {user?.isactive ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-muted-foreground">Tipo de Usuário</p>
                      <div>
                        <Badge variant="outline" className="capitalize">
                          {user?.role || "Usuário"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Assinatura */}
      </Tabs>
    </div>
  );
}