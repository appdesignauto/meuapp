import { User } from "@/types";

interface SubscriptionStatus {
  isPremium: boolean;
  isExpired: boolean;
  expirationDate: Date | null;
  planType: string | null;
  isLifetime: boolean;
  subscriptionOrigin: string | null;
}

export function useSubscription(user: User | null): SubscriptionStatus {
  if (!user) {
    return {
      isPremium: false,
      isExpired: false,
      expirationDate: null,
      planType: null,
      isLifetime: false,
      subscriptionOrigin: null
    };
  }

  // Verificação de acesso premium baseado no nível de acesso do usuário
  const isPremium = 
    user.role === "premium" || 
    user.role === "designer" || 
    user.role === "designer_adm" || 
    user.role === "admin" ||
    (user.nivelacesso && 
     user.nivelacesso !== "free" && 
     user.nivelacesso !== "usuario");

  // Verificar se tem acesso vitalício
  const isLifetime = user.acessovitalicio === true;

  // Obter a data de expiração e verificar se expirou
  const expirationDate = user.dataexpiracao ? new Date(user.dataexpiracao) : null;
  const isExpired = isPremium && 
                    !isLifetime && 
                    !!expirationDate && 
                    expirationDate < new Date();

  return {
    isPremium,
    isExpired,
    expirationDate,
    planType: user.tipoplano || null,
    isLifetime,
    subscriptionOrigin: user.origemassinatura || null
  };
}