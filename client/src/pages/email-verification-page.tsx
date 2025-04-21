/**
 * PÁGINA DESATIVADA
 * 
 * Esta página foi completamente desativada, pois agora todos os emails são 
 * verificados automaticamente durante o processo de registro.
 * 
 * O componente redireciona automaticamente para o painel do usuário.
 */

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export default function EmailVerificationPage() {
  const { user, isLoading } = useAuth();
  
  // Exibe um loader enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redireciona baseado no status de autenticação
  if (user) {
    return <Redirect to="/painel/inicio" />;
  } else {
    return <Redirect to="/" />;
  }
}