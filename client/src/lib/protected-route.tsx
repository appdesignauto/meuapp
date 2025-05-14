import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  roles = [],
  requireEmailVerification = false, // Alterado para false por padrão
}: {
  path: string;
  component: () => React.JSX.Element | null;
  roles?: string[];
  requireEmailVerification?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Verificação de email desativada - comentado para não usar mais
  // A verificação de email agora é opcional e desativada por padrão
  /*
  if (requireEmailVerification && user.emailconfirmed === false) {
    return (
      <Route path={path}>
        <Redirect to="/email-verification" />
      </Route>
    );
  }
  */

  // Verificação de papel/role específica - verifica tanto role quanto nivelacesso
  if (roles.length > 0 && !(roles.includes(user.role) || (user.nivelacesso && roles.includes(user.nivelacesso)))) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}