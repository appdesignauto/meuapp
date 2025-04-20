import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { EmailVerificationPage as VerificationForm } from "@/components/auth/EmailVerification";
import { Loader2 } from "lucide-react";

export default function EmailVerificationRoute() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Se o usuário não estiver logado, redirecione para a página de login
    if (!isLoading && !user) {
      setLocation("/login");
      return;
    }

    // Se o usuário estiver logado e seu email já estiver verificado, redirecione para a página inicial
    if (!isLoading && user && user.emailconfirmed === true) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  // Se tiver usuário logado mas com email não confirmado, mostre a página de verificação
  if (user && user.emailconfirmed === false) {
    return <VerificationForm />;
  }

  // Durante o redirecionamento
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Redirecionando...</span>
    </div>
  );
}