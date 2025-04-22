import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Loader2, Mail, ArrowLeft, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function RequestResetForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [_, setLocation] = useLocation();
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [countdown, setCountdown] = useState(0);
  
  // Efeito para o contador regressivo
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/password-reset/request', { email });
      const data = await response.json();
      
      if (!response.ok) {
        // Verifica se é erro de cooldown (retorna 429)
        if (response.status === 429 && data.cooldown) {
          throw new Error(data.message, { cause: { cooldown: data.cooldown } });
        }
        throw new Error(data.message || 'Falha ao enviar o e-mail de recuperação');
      }
      
      return data;
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: 'E-mail enviado',
        description: 'Um e-mail com instruções para redefinir sua senha foi enviado.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      // Verifica se é um erro de cooldown
      if (error.cause?.cooldown) {
        // Define o tempo de cooldown e inicia a contagem regressiva
        setCooldown(error.cause.cooldown);
        setCountdown(error.cause.cooldown);
        
        // Formata o tempo para exibição
        const minutes = Math.floor(error.cause.cooldown / 60);
        const seconds = error.cause.cooldown % 60;
        const timeDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        toast({
          title: 'E-mail já enviado',
          description: `Um e-mail de redefinição já foi enviado e chegará em instantes. Para solicitar outro, aguarde ${timeDisplay} (prazo máximo de 3 minutos).`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verifica se está em cooldown
    if (countdown > 0) {
      // Formata o tempo para exibição
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      const timeDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      
      toast({
        title: 'E-mail já enviado',
        description: `Um e-mail de redefinição já foi enviado e chegará em instantes. Para solicitar outro, aguarde ${timeDisplay} (prazo máximo de 3 minutos).`,
        variant: 'destructive',
      });
      return;
    }
    
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
  
  // Formata o tempo de contagem regressiva para minutos e segundos
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Se o email foi enviado, mostrar tela de confirmação
  if (emailSent) {
    return (
      <Card className="w-full border border-primary/20">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">E-mail enviado</CardTitle>
          <CardDescription className="text-center">
            Enviamos um e-mail para <span className="font-medium text-primary">{email}</span> com instruções para redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Alert variant="default" className="bg-primary/10 border-primary/30">
            <AlertTitle className="font-medium">O que fazer agora?</AlertTitle>
            <AlertDescription className="text-sm mt-2">
              1. Verifique sua caixa de entrada e pasta de spam<br />
              2. Clique no link de redefinição no email<br />
              3. Crie uma nova senha segura
            </AlertDescription>
          </Alert>
          
          {countdown > 0 && (
            <div className="space-y-2 mt-4">
              <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
                <Clock className="h-4 w-4 mr-2" />
                <AlertTitle className="text-sm font-medium inline-flex items-center">
                  E-mail já enviado
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Um e-mail já foi enviado e chegará em instantes. Para solicitar outro, aguarde {formatCountdown(countdown)} (prazo máximo de 3 minutos). 
                </AlertDescription>
              </Alert>
              <div className="space-y-1">
                <Progress value={(countdown / cooldown) * 100} className="h-2" />
                <p className="text-[10px] text-muted-foreground text-right">
                  {formatCountdown(countdown)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            variant="outline"
            onClick={() => setEmailSent(false)}
            className="w-full"
            disabled={countdown > 0}
          >
            <Mail className="mr-2 h-4 w-4" />
            Tentar novamente
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

  return (
    <Card className="w-full border border-primary/20">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <Mail className="h-12 w-12 text-primary opacity-80" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Recuperar senha</CardTitle>
        <CardDescription className="text-center">
          Informe seu e-mail para receber um link de recuperação
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Seu endereço de e-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="h-10 px-3"
              autoComplete="email"
            />
          </div>
          {countdown > 0 ? (
            <div className="space-y-2">
              <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
                <Clock className="h-4 w-4 mr-2" />
                <AlertTitle className="text-sm font-medium inline-flex items-center">
                  E-mail já enviado
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Um e-mail já foi enviado e chegará em instantes. Para solicitar outro, aguarde {formatCountdown(countdown)} (prazo máximo de 3 minutos). 
                </AlertDescription>
              </Alert>
              <div className="space-y-1">
                <Progress value={(countdown / cooldown) * 100} className="h-2" />
                <p className="text-[10px] text-muted-foreground text-right">
                  {formatCountdown(countdown)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Enviaremos um link para você redefinir a senha da sua conta.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full transition-all" 
            disabled={isPending || countdown > 0}
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
            <Link href="/login" className="text-primary hover:underline inline-flex items-center">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Voltar para o login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}