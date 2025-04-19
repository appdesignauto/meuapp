import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

const loginSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email("Digite um email válido"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const SupabaseAuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isPasswordResetSent, setIsPasswordResetSent] = useState(false);
  
  const [, setLocation] = useLocation();
  const { 
    user, 
    loginWithEmailPassword, 
    registerWithEmailPassword, 
    resetPassword,
    isLoading,
    loginError,
    registerError,
    resetPasswordError,
    clearErrors
  } = useSupabaseAuth();
  
  const { toast } = useToast();

  // Form para login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form para registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Form para recuperação de senha
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Redirecionamento quando usuário estiver logado
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Limpar erros ao trocar de abas
  useEffect(() => {
    clearErrors();
  }, [activeTab, clearErrors]);

  // Se o usuário já estiver logado, não renderizamos o resto do componente
  if (user) {
    return null;
  }

  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await loginWithEmailPassword(values.email, values.password);
      // Após login bem-sucedido, o hook useEffect acima fará o redirecionamento
    } catch (error) {
      // Erro já tratado no hook useSupabaseAuth
      console.error("Erro durante login:", error);
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      // Extrair confirmPassword que não deve ser enviado para o servidor
      const { confirmPassword, ...registerData } = values;
      
      // Gerar username a partir do email
      const username = values.email.split('@')[0];
      
      // Registrar usuário
      await registerWithEmailPassword(values.email, values.password, {
        name: values.name,
        username,
        origemassinatura: "Auto Cadastro",
        nivelacesso: "usuario",
        role: "usuario"
      });
      
      // Após registro bem-sucedido, exibir toast e redirecionar para login
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar sua conta. Em seguida, faça login.",
        variant: "default",
      });
      
      // Redirecionar para a aba de login
      setActiveTab("login");
      
    } catch (error) {
      // Erro já tratado no hook useSupabaseAuth
      console.error("Erro durante registro:", error);
    }
  };
  
  const onResetPasswordSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await resetPassword(values.email);
      setIsPasswordResetSent(true);
      toast({
        title: "Email enviado",
        description: "Verifique seu email para redefinir sua senha.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error);
    }
  };
  
  const handleBackToLogin = () => {
    setShowResetPassword(false);
    setIsPasswordResetSent(false);
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <div className="flex items-center mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToLogin}
                  className="mr-2 p-0 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Recuperar senha</CardTitle>
              </div>
              <CardDescription>
                {isPasswordResetSent 
                  ? "Email enviado! Verifique sua caixa de entrada para redefinir sua senha."
                  : "Informe seu email para receber instruções de recuperação de senha."}
              </CardDescription>
            </CardHeader>
            
            {!isPasswordResetSent && (
              <>
                <CardContent>
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={resetPasswordForm.control}
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
                      
                      {resetPasswordError && (
                        <div className="text-sm text-red-500 mt-2">
                          {resetPasswordError}
                        </div>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Enviar email de recuperação"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </>
            )}
            
            <CardFooter className="flex flex-col items-center">
              <Button 
                variant="link" 
                className="p-0" 
                onClick={handleBackToLogin}
              >
                Voltar para o login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
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
                      
                      {loginError && (
                        <div className="text-sm text-red-500 mt-2">
                          {loginError === "Email não verificado." 
                            ? "Email não verificado. Por favor, verifique sua caixa de entrada para confirmar seu email."
                            : loginError}
                        </div>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                      
                      <div className="text-center pt-2">
                        <Button
                          variant="link"
                          className="p-0 text-sm"
                          onClick={() => setShowResetPassword(true)}
                        >
                          Esqueceu sua senha?
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center">
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
                      
                      {registerError && (
                        <div className="text-sm text-red-500 mt-2">
                          {registerError}
                        </div>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          "Criar conta"
                        )}
                      </Button>
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
                <h3 className="font-semibold text-lg">Designs Profissionais</h3>
                <p className="text-blue-100">
                  Acesse mais de 3.000 templates profissionais para o setor automotivo
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Totalmente Editáveis</h3>
                <p className="text-blue-100">
                  Personalize facilmente no Canva e outros editores online
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Economize Tempo</h3>
                <p className="text-blue-100">
                  Crie materiais de marketing em minutos, não em horas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseAuthPage;