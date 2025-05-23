import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RequestResetForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [_, setLocation] = useLocation();
  const [emailSent, setEmailSent] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(180); // 3 minutos em segundos
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    setCooldownTime(180); // 3 minutos
    
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
      
      // Resposta de sucesso em formato JSON
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      setEmailSent(true);
      startCooldown(); // Inicia o cooldown após enviar o email com sucesso
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
              1. Verifique sua caixa de entrada e também a pasta de spam.<br />
              2. Os e-mails podem levar até 3 minutos para chegar. Por favor, aguarde.<br />
              3. Quando receber o e-mail, clique no link de redefinição da senha.<br />
              4. Crie uma nova senha segura para sua conta.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
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
          <p className="text-xs text-muted-foreground">
            Enviaremos um link para você redefinir a senha da sua conta.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full transition-all" 
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