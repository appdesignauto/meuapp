import ResetPasswordForm from '@/components/auth/password-reset/ResetPasswordForm';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import designAutoLogo from "@assets/LOGO DESIGNAUTO.png";

/**
 * Página de redefinição de senha com token
 * URL: /password/reset
 */
export default function ResetPasswordPage() {
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header com logo e título */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={designAutoLogo} 
                alt="DesignAuto" 
                className="h-16 w-auto object-contain transform hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 whitespace-nowrap">Redefinir Senha</h2>
              <p className="text-gray-600">Crie uma nova senha segura para sua conta</p>
            </div>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}