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
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import InputMask from "react-input-mask";
import designAutoLogo from "@assets/LOGO DESIGNAUTO.png";

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

const countries = [
  { code: "+55", flag: "🇧🇷", name: "Brasil", mask: "(99) 99999-9999" },
  { code: "+1", flag: "🇺🇸", name: "Estados Unidos", mask: "(999) 999-9999" },
  { code: "+54", flag: "🇦🇷", name: "Argentina", mask: "(999) 999-9999" },
  { code: "+56", flag: "🇨🇱", name: "Chile", mask: "(9) 9999-9999" },
  { code: "+57", flag: "🇨🇴", name: "Colômbia", mask: "(999) 999-9999" },
  { code: "+51", flag: "🇵🇪", name: "Peru", mask: "(999) 999-999" },
  { code: "+598", flag: "🇺🇾", name: "Uruguai", mask: "(99) 999-999" },
  { code: "+595", flag: "🇵🇾", name: "Paraguai", mask: "(999) 999-999" },
  { code: "+34", flag: "🇪🇸", name: "Espanha", mask: "(999) 999-999" },
  { code: "+351", flag: "🇵🇹", name: "Portugal", mask: "(999) 999-999" }
];

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
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Brasil como padrão
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
              <img 
                src={designAutoLogo} 
                alt="DesignAuto" 
                className="h-16 w-auto object-contain transform hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 whitespace-nowrap">Bem-Vindo Ao DesignAuto</h2>
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

                      <div className="text-center mt-4">
                        <Link 
                          href="/password/forgot" 
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                        >
                          Esqueci minha senha
                        </Link>
                      </div>
                      
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
                                <Select 
                                  value={selectedCountry.code} 
                                  onValueChange={(value) => {
                                    const country = countries.find(c => c.code === value) || countries[0];
                                    setSelectedCountry(country);
                                  }}
                                >
                                  <SelectTrigger className="w-20 h-12 border-r-0 rounded-r-none border-gray-300 focus:border-blue-500">
                                    <div className="flex items-center justify-center">
                                      <span className="text-lg">{selectedCountry.flag}</span>
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {countries.map((country) => (
                                      <SelectItem key={country.code} value={country.code}>
                                        <div className="flex items-center space-x-2">
                                          <span>{country.flag}</span>
                                          <span>{country.code}</span>
                                          <span className="text-sm text-gray-500">{country.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex-1 relative">
                                  <InputMask
                                    mask={selectedCountry.mask}
                                    value={field.value}
                                    onChange={field.onChange}
                                    maskChar={null}
                                  >
                                    {(inputProps: any) => (
                                      <Input
                                        {...inputProps}
                                        type="tel"
                                        placeholder={selectedCountry.mask.replace(/9/g, '9')}
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