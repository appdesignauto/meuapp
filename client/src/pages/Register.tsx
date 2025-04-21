/**
 * IMPORTANTE: Esta página NÃO está mais em uso.
 * O sistema foi migrado para usar a interface unificada em auth-page.tsx
 * Este arquivo é mantido apenas para referência e será removido em uma limpeza futura.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Car, Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  username: z.string().min(3, { message: 'Usuário deve ter pelo menos 3 caracteres' }),
  name: z.string().optional(),
  email: z.string().email({ message: 'Email inválido' }),
  phone: z.string().optional(),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      phone: '+55', // Código do Brasil como padrão
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await register(data.username, data.password, data.email, data.name, data.phone);
      
      // Mostrar mensagem de sucesso
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Enviamos um email de boas-vindas para você.',
        variant: 'success',
      });
      
      setLocation('/');
    } catch (error) {
      console.error('Registration failed:', error);
      
      toast({
        title: 'Erro ao criar conta',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-neutral-50 py-12">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-primary font-bold text-2xl">
            <Car className="mr-2" />
            <span>DesignAuto<span className="text-secondary-500">App</span></span>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Criar conta</CardTitle>
            <CardDescription className="text-center">
              Crie sua conta e acesse milhares de artes automotivas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Escolha um nome de usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Seu email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <div className="phone-input-container">
                          <Controller
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <PhoneInput
                                international
                                defaultCountry="BR"
                                placeholder="Seu telefone com DDD"
                                value={field.value}
                                onChange={field.onChange}
                                className="phone-input"
                              />
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Incluir código do país e DDD
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Crie uma senha segura" {...field} />
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
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirme sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Registrar'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
