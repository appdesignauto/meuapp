import { User, OrigemAssinatura, TipoPlano } from "@/types";

interface SubscriptionStatus {
  isPremium: boolean;
  isExpired: boolean;
  expirationDate: Date | null;
  planType: TipoPlano | null;
  isLifetime: boolean;
  subscriptionOrigin: OrigemAssinatura | null;
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
  const isPremiumRole = 
    user.role === "premium" || 
    user.role === "designer" || 
    user.role === "designer_adm" || 
    user.role === "admin";
    
  const isPremiumAccess = 
    user.nivelacesso && 
    user.nivelacesso !== "free" && 
    user.nivelacesso !== "usuario";

  const isPremium = isPremiumRole || isPremiumAccess;

  // Verificar se tem acesso vitalício
  const isLifetime = user.acessovitalicio === true;

  // Obter a data de expiração e verificar se expirou
  const expirationDate = user.dataexpiracao ? new Date(user.dataexpiracao) : null;
  const isExpired = isPremium && 
                    !isLifetime && 
                    expirationDate !== null && 
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