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
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import InputMask from "react-input-mask";

const loginSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().default(false),
});

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>(() => {
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

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

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

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

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
      name: values.name,
      phone: values.phone || undefined
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header com logo e título */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo ao DesignAuto</h2>
              <p className="text-gray-600">Acesse sua conta ou crie uma nova</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium transition-all duration-200"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium transition-all duration-200"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-center text-gray-900">Entrar na sua conta</CardTitle>
                  <CardDescription className="text-center text-gray-600">Digite suas credenciais para acessar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input 
                                  type="email" 
                                  placeholder="seu@email.com" 
                                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                  {...field} 
                                />
                              </div>
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
                            <FormLabel className="text-gray-700 font-medium">Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input 
                                  type={showLoginPassword ? "text" : "password"} 
                                  placeholder="Sua senha" 
                                  className="pl-10 pr-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                                >
                                  {showLoginPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
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
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                      
                      {loginError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{loginError}</p>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-center text-gray-900">Criar nova conta</CardTitle>
                  <CardDescription className="text-center text-gray-600">Preencha os dados para se cadastrar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Nome completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input 
                                  placeholder="Seu nome completo" 
                                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                  {...field} 
                                />
                              </div>
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
                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input 
                                  type="email" 
                                  placeholder="seu@email.com" 
                                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                  {...field} 
                                />
                              </div>
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
                            <FormLabel className="text-gray-700 font-medium">Telefone (opcional)</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <div className="flex items-center bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg px-3">
                                  <span className="text-lg mr-1">🇧🇷</span>
                                  <span className="text-gray-600 text-sm font-medium">+55</span>
                                </div>
                                <div className="flex-1 relative">
                                  <InputMask
                                    mask="(99) 99999-9999"
                                    value={field.value}
                                    onChange={field.onChange}
                                    maskChar={null}
                                  >
                                    {(inputProps: any) => (
                                      <Input
                                        {...inputProps}
                                        type="tel"
                                        placeholder="(11) 99999-9999"
                                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-l-none rounded-r-lg border-l-0"
                                      />
                                    )}
                                  </InputMask>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input 
                                  type={showRegisterPassword ? "text" : "password"} 
                                  placeholder="Sua senha" 
                                  className="pl-10 pr-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                >
                                  {showRegisterPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Confirmar senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="Confirme sua senha" 
                                  className="pl-10 pr-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          "Criar conta"
                        )}
                      </Button>

                      {registerError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{registerError}</p>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;