import RequestResetForm from '@/components/auth/password-reset/RequestResetForm';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ForgotPasswordPage() {
  const { user, isLoading } = useAuth();

  // Se estiver carregando, mostra indicador de loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Se já estiver logado, redireciona para a home
  const [_, setLocation] = useLocation();
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md p-4">
        <RequestResetForm />
      </div>
    </AuthLayout>
  );
}