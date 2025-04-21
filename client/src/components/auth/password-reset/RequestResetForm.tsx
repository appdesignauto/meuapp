import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function RequestResetForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [_, setLocation] = useLocation();

  const { mutate, isPending } = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/password-reset/request', { email });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao enviar o e-mail de recuperação');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'E-mail enviado',
        description: 'Um e-mail com instruções para redefinir sua senha foi enviado para o endereço informado.',
        variant: 'default',
      });
      setEmail('');
    },
    onError: (error: Error) => {
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
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu e-mail para receber um link de recuperação de senha
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar e-mail de recuperação'
            )}
          </Button>
          <div className="text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Voltar para o login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}