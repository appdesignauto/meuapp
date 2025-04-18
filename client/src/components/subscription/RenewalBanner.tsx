import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface RenewalBannerProps {
  showBanner: boolean;
  daysLeft?: number | null;
  customMessage?: string;
}

/**
 * Banner de renovação para assinaturas expiradas ou prestes a expirar
 */
export function RenewalBanner({ 
  showBanner, 
  daysLeft,
  customMessage 
}: RenewalBannerProps) {
  if (!showBanner) return null;
  
  // Mensagem padrão para assinaturas expiradas
  const defaultMessage = "Sua assinatura Premium expirou. Renove agora para continuar acessando todos os benefícios.";
  
  // Mensagem para assinaturas prestes a expirar
  const expiringMessage = daysLeft 
    ? `Sua assinatura Premium expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. Renove agora para não perder o acesso.`
    : defaultMessage;
  
  // Mensagem final a ser exibida
  const message = customMessage || expiringMessage;
  
  // Determinar a severidade com base nos dias restantes
  let bgColor = "bg-amber-50";
  let borderColor = "border-amber-200";
  let textColor = "text-amber-800";
  let iconColor = "text-amber-500";
  let buttonColor = "bg-amber-600 hover:bg-amber-700";
  
  // Caso seja realmente urgente (0 dias ou expirado)
  if (!daysLeft || daysLeft === 0) {
    bgColor = "bg-red-50";
    borderColor = "border-red-200";
    textColor = "text-red-800";
    iconColor = "text-red-500";
    buttonColor = "bg-red-600 hover:bg-red-700";
  }
  // Caso esteja próximo de expirar (menos de 7 dias)
  else if (daysLeft && daysLeft <= 7) {
    bgColor = "bg-amber-50";
    borderColor = "border-amber-200";
    textColor = "text-amber-800";
    iconColor = "text-amber-500";
    buttonColor = "bg-amber-600 hover:bg-amber-700";
  }
  // Caso seja um lembrete antecipado
  else {
    bgColor = "bg-blue-50";
    borderColor = "border-blue-200";
    textColor = "text-blue-800";
    iconColor = "text-blue-500";
    buttonColor = "bg-blue-600 hover:bg-blue-700";
  }

  return (
    <div className={`${bgColor} border-b ${borderColor} ${textColor} px-6 py-3 flex items-center justify-between`}>
      <div className="flex items-center">
        <AlertTriangle className={`h-5 w-5 mr-2 ${iconColor}`} />
        <span className="text-sm font-medium">{message}</span>
      </div>
      <Link href="/planos">
        <Button size="sm" className={`ml-4 ${buttonColor} text-white`}>
          Renovar
        </Button>
      </Link>
    </div>
  );
}