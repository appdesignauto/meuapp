import { useAuth } from "@/hooks/use-auth";
import PainelLayout from "@/layouts/PainelLayout";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedPainelRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedPainelRoute({
  path,
  component: Component,
}: ProtectedPainelRouteProps) {
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

  return (
    <Route path={path}>
      <PainelLayout>
        <Component />
      </PainelLayout>
    </Route>
  );
}