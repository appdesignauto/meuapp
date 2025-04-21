/**
 * PÁGINA DESATIVADA
 * 
 * Esta página foi completamente desativada, pois agora todos os emails são 
 * verificados automaticamente durante o processo de registro.
 * 
 * O componente redireciona automaticamente para o painel do usuário.
 */

import { useEffect } from "react";
import { useNavigate } from "wouter";

export default function EmailVerificationPage() {
  const [, navigate] = useNavigate();
  
  useEffect(() => {
    // Redirecionar automaticamente para o painel do usuário
    navigate("/painel/inicio");
  }, [navigate]);
  
  // Este componente não renderiza nada visível,
  // pois o redirecionamento acontece automaticamente
  return null;
}