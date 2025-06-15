import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Loader2, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/hooks/use-auth';
import designAutoLogo from "@assets/LOGO DESIGNAUTO.png";

// Definindo o esquema de validação para o formulário
const resetSchema = z.object({
  password: z.string()
    .min(8, { message: "A senha deve ter no mínimo 8 caracteres" })
    .max(100, { message: "A senha é muito longa" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenError, setTokenError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Se estiver carregando, mostra indicador de loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Se já estiver logado, redireciona para a home
  if (user) {
    setLocation("/");
    return null;
  }

  // Inicializando o formulário
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    },
  });

  // Calcular força da senha
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Comprimento mínimo
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Verificar complexidade
    if (/[A-Z]/.test(password)) strength += 20; // Maiúsculas
    if (/[a-z]/.test(password)) strength += 15; // Minúsculas
    if (/[0-9]/.test(password)) strength += 20; // Números
    if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Caracteres especiais
    
    return Math.min(100, strength);
  };

  // Obter token da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
    } else {
      setTokenError(true);
    }
  }, []);

  // Monitorar mudanças na senha para calcular força
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.password) {
        setPasswordStrength(calculatePasswordStrength(value.password));
      } else {
        setPasswordStrength(0);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const { mutate: resetPassword, isPending } = useMutation({
    mutationFn: async (values: ResetFormValues) => {
      const response = await apiRequest('POST', '/api/password-reset/confirm', {
        token,
        password: values.password
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Falha ao redefinir a senha');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setResetSuccess(true);
      toast({
        title: 'Senha redefinida com sucesso',
        description: 'Sua senha foi alterada. Você pode fazer login agora.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao redefinir senha',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: ResetFormValues) => {
    if (!token) {
      toast({
        title: 'Token inválido',
        description: 'O link de redefinição é inválido ou expirou.',
        variant: 'destructive',
      });
      return;
    }
    
    resetPassword(values);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Fraca';
    if (passwordStrength < 70) return 'Média';
    return 'Forte';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img
            className="mx-auto h-16 w-auto mb-6"
            src={designAutoLogo}
            alt="DesignAuto"
          />
        </div>

        {/* Erro de token */}
        {tokenError && (
          <Card className="w-full border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Link inválido</CardTitle>
              <CardDescription className="text-gray-600">
                O link de redefinição de senha é inválido ou expirou.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
              <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                <Link href="/password/forgot">Solicitar novo link</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Sucesso */}
        {resetSuccess && (
          <Card className="w-full border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Senha redefinida</CardTitle>
              <CardDescription className="text-gray-600">
                Sua senha foi alterada com sucesso. Você pode fazer login agora.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
              <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                <Link href="/auth">Fazer login</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Formulário de redefinição */}
        {!tokenError && !resetSuccess && (
          <Card className="w-full border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="flex justify-center mb-4">
                <Lock className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Criar nova senha</CardTitle>
              <CardDescription className="text-gray-600">
                Defina uma nova senha segura para sua conta
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4 px-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Nova senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Digite sua nova senha"
                              className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 w-12 px-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                        {field.value && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Força da senha:</span>
                              <span className={`font-medium ${passwordStrength < 40 ? 'text-red-600' : passwordStrength < 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {getPasswordStrengthText()}
                              </span>
                            </div>
                            <Progress value={passwordStrength} className="h-2" />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Confirme a nova senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Digite a senha novamente"
                              className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 w-12 px-0"
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

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Crie uma senha forte usando letras, números e símbolos.</p>
                    <p>Nunca use a mesma senha em diferentes sites.</p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200" 
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redefinindo...
                      </>
                    ) : (
                      'Redefinir senha'
                    )}
                  </Button>
                  <div className="text-center text-sm">
                    <Link href="/auth" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center font-medium">
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Voltar para o login
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}
      </div>
    </div>
  );
}