import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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

  // Inicializando o formulário
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    },
  });

  // Extrair o token da URL ao carregar o componente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: 'Token inválido',
        description: 'O link de recuperação parece ser inválido ou expirado.',
        variant: 'destructive',
      });
    }
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
      toast({
        title: 'Senha redefinida com sucesso',
        description: 'Agora você pode fazer login com sua nova senha.',
        variant: 'default',
      });
      
      // Redirecionar para tela de login após um breve delay
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
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

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
        <CardDescription>
          Crie uma nova senha para sua conta
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
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Nova senha"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirme a nova senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirme a senha"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
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
              <Link href="/login" className="text-primary hover:underline">
                Voltar para o login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}