import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const loginSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().default(false),
});

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthPage = () => {
  // Obter o parâmetro tab da URL, se existir
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Verificar se estamos no navegador (client-side)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || "login";
    }
    return "login";
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  // Form para login - IMPORTANTE: todos os hooks precisam ser chamados em todas as renderizações
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Form para registro - IMPORTANTE: todos os hooks precisam ser chamados em todas as renderizações
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Redirecionamento com useEffect para evitar erros de hooks
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Se o usuário já estiver logado, não renderizamos o resto do componente
  // IMPORTANTE: este retorno ocorre APÓS chamar todos os hooks
  if (user) {
    return null;
  }

  const onLoginSubmit = async (values: LoginFormValues) => {
    setLoginError(null);
    
    loginMutation.mutate({
      username: values.email,
      password: values.password,
      rememberMe: values.rememberMe
    }, {
      onSuccess: () => {
        console.log("Login bem-sucedido, redirecionando...");
        setLocation("/");
      },
      onError: (error: any) => {
        console.error("Erro de login:", error);
        setLoginError(error.message || "Erro ao fazer login");
      }
    });
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = values;
    setRegisterError(null);
    
    registerMutation.mutate({
      username: values.email.split('@')[0],
      email: values.email,
      password: values.password,
      name: values.name
    }, {
      onSuccess: () => {
        console.log("Registro bem-sucedido, redirecionando...");
        setLocation("/");
      },
      onError: (error: any) => {
        console.error("Erro de registro:", error);
        setRegisterError(error.message || "Erro ao fazer registro");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Acesse sua conta para gerenciar suas artes e coleções
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showLoginPassword ? "text" : "password"} 
                                  placeholder="******" 
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {showLoginPassword ? "Esconder senha" : "Mostrar senha"}
                                </span>
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="cursor-pointer">
                                Lembrar-me
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                      
                      {/* Exibir mensagem de erro */}
                      {loginError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{loginError}</p>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center space-y-2">
                  <div className="text-sm text-gray-500">
                    <Link href="/password/forgot">
                      <Button 
                        variant="link" 
                        className="p-0"
                      >
                        Esqueceu sua senha?
                      </Button>
                    </Link>
                  </div>
                  <div className="text-sm text-gray-500">
                    Não tem uma conta?{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("register")}
                    >
                      Cadastre-se
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Cadastro</CardTitle>
                  <CardDescription>
                    Crie sua conta para acessar todas as funcionalidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">

                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu Nome" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <div className="phone-input-container">
                                <PhoneInput
                                  international
                                  defaultCountry="BR"
                                  placeholder="(99) 99999-9999"
                                  value={field.value}
                                  onChange={field.onChange}
                                  className="phone-input"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              Seu número de telefone com DDD
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showRegisterPassword ? "text" : "password"} 
                                  placeholder="******" 
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {showRegisterPassword ? "Esconder senha" : "Mostrar senha"}
                                </span>
                              </Button>
                            </div>
                            <FormDescription className="text-xs">
                              A senha deve ter pelo menos 6 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar senha</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="******" 
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                                </span>
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      

                      

                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          "Criar conta"
                        )}
                      </Button>

                      {/* Exibir mensagem de erro */}
                      {registerError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{registerError}</p>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center">
                  <div className="text-sm text-gray-500">
                    Já tem uma conta?{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("login")}
                    >
                      Faça login
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 bg-blue-600 p-8 lg:p-12 text-white hidden lg:flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">DesignAuto</h1>
          <p className="text-xl mb-8">
            Acesse milhares de designs exclusivos para o seu negócio automotivo
          </p>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-blue-500 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Mais de 300 artes</h3>
                <p className="text-blue-100">Acesse designs exclusivos criados por profissionais</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Totalmente editáveis</h3>
                <p className="text-blue-100">Personalize facilmente com o Canva ou Google Drive</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Economia de tempo</h3>
                <p className="text-blue-100">Crie campanhas em minutos, não em horas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;