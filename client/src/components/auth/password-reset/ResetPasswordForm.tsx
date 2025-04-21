import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation, useNavigate } from 'wouter';

// Schema para validação
const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(100, 'A senha não pode ter mais de 100 caracteres'),
  confirmPassword: z.string()
    .min(1, 'Confirme a senha'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Extrair token da URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get('token');
    
    if (!tokenFromUrl) {
      setTokenStatus('invalid');
      setErrorMessage('Token não encontrado na URL. Por favor, tente novamente ou solicite um novo link de redefinição.');
      return;
    }
    
    setToken(tokenFromUrl);
    
    // Verificar validade do token
    const verifyToken = async () => {
      try {
        const response = await apiRequest('POST', '/api/password-reset/verify-token', { token: tokenFromUrl });
        const data = await response.json();
        
        if (response.ok && data.success) {
          setTokenStatus('valid');
        } else {
          setTokenStatus('invalid');
          setErrorMessage(data.message || 'Token inválido ou expirado. Por favor, solicite um novo link de redefinição.');
        }
      } catch (error) {
        setTokenStatus('invalid');
        setErrorMessage('Erro ao verificar o token. Por favor, tente novamente mais tarde.');
        console.error('Erro ao verificar token:', error);
      }
    };
    
    verifyToken();
  }, [location]);

  const resetMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormValues & { token: string }) => {
      const response = await apiRequest('POST', '/api/password-reset/reset', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao redefinir senha');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.');
      setErrorMessage(null);
      
      // Redirecionar para página de login após 3 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Ocorreu um erro ao redefinir sua senha.');
      setSuccessMessage(null);
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!token) {
      setErrorMessage('Token não encontrado. Por favor, tente novamente ou solicite um novo link de redefinição.');
      return;
    }
    
    resetMutation.mutate({ ...data, token });
  };

  if (tokenStatus === 'loading') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Verificando o seu link...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Link Inválido</CardTitle>
          <CardDescription>
            O link para redefinição de senha é inválido ou expirou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {errorMessage || 'Link inválido ou expirado. Por favor, solicite um novo link de redefinição.'}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => navigate('/auth/forgot-password')}
          >
            Solicitar novo link
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Redefinir Senha</CardTitle>
        <CardDescription>
          Crie uma nova senha para sua conta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              disabled={resetMutation.isPending || !!successMessage}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              disabled={resetMutation.isPending || !!successMessage}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={resetMutation.isPending || !!successMessage}
          >
            {resetMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redefinindo...
              </>
            ) : (
              "Redefinir Senha"
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/auth')}
          >
            Voltar para login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}