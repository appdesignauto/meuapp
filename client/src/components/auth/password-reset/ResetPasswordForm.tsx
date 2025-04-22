import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Loader2, Key, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from "@/components/ui/progress";

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

export default function ResetPasswordForm() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenError, setTokenError] = useState(false);

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

  // Observar mudanças no campo de senha para atualizar força
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'password') {
        setPasswordStrength(calculatePasswordStrength(value.password || ''));
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Extrair o token da URL ao carregar o componente
  useEffect(() => {
    const extractToken = () => {
      try {
        // Extrai o token da URL
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get('token');
        
        if (tokenParam) {
          console.log("Token encontrado na URL:", tokenParam.substring(0, 10) + "...");
          setToken(tokenParam);
          return;
        }
        
        // Tentativa de extrair o token da URL caso esteja em outro formato
        const pathSegments = window.location.pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        if (lastSegment && lastSegment.length > 20) {
          console.log("Token extraído do caminho:", lastSegment.substring(0, 10) + "...");
          setToken(lastSegment);
          return;
        }
        
        // Nenhum token encontrado
        console.log("Nenhum token válido encontrado na URL");
        setTokenError(true);
        toast({
          title: 'Token não encontrado',
          description: 'Verifique se você usou o link completo do email de recuperação.',
          variant: 'destructive',
        });
      } catch (error) {
        console.error("Erro ao extrair token:", error);
        setTokenError(true);
        toast({
          title: 'Erro ao processar token',
          description: 'Ocorreu um erro ao processar o link de recuperação.',
          variant: 'destructive',
        });
      }
    };

    // Pequeno atraso para garantir que o DOM esteja completamente carregado
    const timerId = setTimeout(extractToken, 300);
    
    // Limpar o timeout se o componente for desmontado
    return () => clearTimeout(timerId);
  }, [toast]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { password: string, token: string }) => {
      const response = await apiRequest('POST', '/api/password-reset/reset', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao redefinir a senha');
      }
      return response.json();
    },
    onSuccess: () => {
      setResetSuccess(true);
      toast({
        title: 'Senha redefinida com sucesso',
        description: 'Agora você pode fazer login com sua nova senha.',
        variant: 'default',
      });
      
      // Redirecionar para tela de login após um delay
      setTimeout(() => {
        // Usar window.location.href para um redirecionamento mais confiável
        window.location.href = '/login';
      }, 3000);
    },
    onError: (error: Error) => {
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
        description: 'O link de recuperação parece ser inválido ou expirado.',
        variant: 'destructive',
      });
      return;
    }
    
    mutate({ 
      password: values.password,
      token
    });
  };

  function getStrengthText(strength: number) {
    if (strength < 30) return { text: "Fraca", color: "text-red-500" };
    if (strength < 70) return { text: "Média", color: "text-yellow-500" };
    return { text: "Forte", color: "text-green-500" };
  }

  function getStrengthColor(strength: number) {
    if (strength < 30) return "bg-red-500";
    if (strength < 70) return "bg-yellow-500";
    return "bg-green-500";
  }

  // Se houve erro com o token
  if (tokenError) {
    return (
      <Card className="w-full border border-red-200">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Link inválido</CardTitle>
          <CardDescription className="text-center">
            O link de redefinição de senha parece ser inválido ou expirado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Alert variant="destructive">
            <AlertTitle>O que pode ter acontecido:</AlertTitle>
            <AlertDescription className="text-sm pt-2">
              • O link que você recebeu já foi utilizado<br />
              • O link expirou após 24 horas<br />
              • A URL foi digitada incorretamente
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            variant="default"
            onClick={() => window.location.href = '/password/forgot'}
            className="w-full"
          >
            <Key className="mr-2 h-4 w-4" />
            Solicitar novo link
          </Button>
          <div className="text-center text-sm">
            <Link href="/login" className="text-primary hover:underline inline-flex items-center">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Voltar para o login
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Se a senha foi redefinida com sucesso
  if (resetSuccess) {
    return (
      <Card className="w-full border border-green-200">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Senha redefinida</CardTitle>
          <CardDescription className="text-center">
            Sua senha foi alterada com sucesso!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-700">Tudo certo!</AlertTitle>
            <AlertDescription className="text-sm text-green-600 pt-2">
              Você será redirecionado para a página de login em instantes para acessar sua conta com a nova senha.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            Ir para o login agora
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Card className="w-full border border-primary/20">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <Lock className="h-12 w-12 text-primary opacity-80" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Criar nova senha</CardTitle>
        <CardDescription className="text-center">
          Defina uma nova senha segura para sua conta
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua nova senha"
                        className="h-10 px-3 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 w-10 px-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 
                          <EyeOff className="h-4 w-4 text-muted-foreground" /> : 
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        }
                      </Button>
                    </div>
                  </FormControl>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span>Força da senha:</span>
                      <span className={getStrengthText(passwordStrength).color}>
                        {getStrengthText(passwordStrength).text}
                      </span>
                    </div>
                    <Progress value={passwordStrength} className={`h-1.5 ${getStrengthColor(passwordStrength)}`} 
                      style={{backgroundColor: "var(--primary-100)"}}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Confirme a nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Digite a senha novamente"
                        className="h-10 px-3 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 w-10 px-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? 
                          <EyeOff className="h-4 w-4 text-muted-foreground" /> : 
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        }
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert className="bg-muted/50 border-muted">
              <AlertDescription className="text-xs text-muted-foreground">
                Crie uma senha forte usando letras, números e símbolos. Nunca use a mesma senha em diferentes sites.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full transition-all" 
              disabled={isPending || !token}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Redefinir senha'
              )}
            </Button>
            <div className="text-center text-sm">
              <Link href="/login" className="text-primary hover:underline inline-flex items-center">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Voltar para o login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}