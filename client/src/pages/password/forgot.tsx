import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import designAutoLogo from "@assets/LOGO DESIGNAUTO.png";

/**
 * Página de solicitação de recuperação de senha
 * URL: /password/forgot
 */
export default function ForgotPasswordPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [_, setLocation] = useLocation();
  const [emailSent, setEmailSent] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(180);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Limpa o timer quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Inicia a contagem regressiva de cooldown
  const startCooldown = () => {
    setIsCooldown(true);
    setCooldownTime(180);
    
    timerRef.current = setInterval(() => {
      setCooldownTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          setIsCooldown(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/password-reset/request', { email });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Falha ao enviar o e-mail de recuperação');
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      setEmailSent(true);
      startCooldown();
      toast({
        title: 'E-mail enviado',
        description: 'Um e-mail com instruções para redefinir sua senha foi enviado.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe seu e-mail',
        variant: 'destructive',
      });
      return;
    }
    mutate(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Professional layout matching login page */}
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img
            className="mx-auto h-16 w-auto mb-6"
            src={designAutoLogo}
            alt="DesignAuto"
          />
        </div>

        {/* Se o email foi enviado, mostrar tela de confirmação */}
        {emailSent ? (
          <Card className="w-full border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">E-mail enviado</CardTitle>
              <CardDescription className="text-gray-600">
                Enviamos um e-mail para <span className="font-medium text-blue-600">{email}</span> com instruções para redefinir sua senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center px-6">
              <Alert variant="default" className="bg-blue-50 border-blue-200 text-left">
                <AlertTitle className="font-medium text-blue-900">O que fazer agora?</AlertTitle>
                <AlertDescription className="text-sm mt-2 text-blue-800">
                  1. Verifique sua caixa de entrada e também a pasta de spam.<br />
                  2. Os e-mails podem levar até 3 minutos para chegar. Por favor, aguarde.<br />
                  3. Quando receber o e-mail, clique no link de redefinição da senha.<br />
                  4. Crie uma nova senha segura para sua conta.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
              <Button 
                variant="outline"
                onClick={() => {
                  if (!isCooldown) {
                    setEmailSent(false);
                  }
                }}
                disabled={isCooldown}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                {isCooldown 
                  ? `Aguarde ${Math.floor(cooldownTime / 60)}:${(cooldownTime % 60).toString().padStart(2, '0')}`
                  : 'Tentar novamente'
                }
              </Button>
              <div className="text-center text-sm">
                <Link href="/login" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center font-medium">
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Voltar para o login
                </Link>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="flex justify-center mb-4">
                <Mail className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Recuperar senha</CardTitle>
              <CardDescription className="text-gray-600">
                Informe seu e-mail para receber um link de recuperação
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 px-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Seu endereço de e-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Enviaremos um link para você redefinir a senha da sua conta.
                </p>
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
                      Enviando...
                    </>
                  ) : (
                    'Enviar instruções de recuperação'
                  )}
                </Button>
                <div className="text-center text-sm">
                  <Link href="/login" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center font-medium">
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Voltar para o login
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}