import { User, OrigemAssinatura, TipoPlano } from "@/types";

interface SubscriptionStatus {
  isPremium: boolean;
  isExpired: boolean;
  expirationDate: Date | null;
  planType: TipoPlano | null;
  isLifetime: boolean;
  subscriptionOrigin: OrigemAssinatura | null;
  daysLeft: number | null;
}

export function useSubscription(user: User | null): SubscriptionStatus {
  if (!user) {
    return {
      isPremium: false,
      isExpired: false,
      expirationDate: null,
      planType: null,
      isLifetime: false,
      subscriptionOrigin: null,
      daysLeft: null
    };
  }

  // Verificação de acesso premium baseado no nível de acesso e planos do usuário
  const isPremium: boolean = Boolean(
    user.tipoplano === 'mensal' || 
    user.tipoplano === 'anual' || 
    user.tipoplano === 'vitalicio' || 
    user.tipoplano === 'personalizado' || 
    user.acessovitalicio || 
    user.nivelacesso === 'admin' || 
    user.nivelacesso === 'designer_adm' ||
    user.nivelacesso === 'designer' ||
    user.nivelacesso === 'suporte'
  );

  // Verificar se tem acesso vitalício
  const isLifetime: boolean = user.acessovitalicio === true;

  // Obter a data de expiração e verificar se expirou
  const expirationDate = user.dataexpiracao ? new Date(user.dataexpiracao) : null;
  const isExpired: boolean = Boolean(
    isPremium && 
    !isLifetime && 
    expirationDate !== null && 
    expirationDate < new Date()
  );
  
  // Calcular dias restantes de assinatura
  let daysLeft: number | null = null;
  if (isPremium && !isLifetime && expirationDate) {
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    // Se não estiver expirado, calcular os dias restantes
    if (diffTime > 0) {
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      // Se estiver expirado, definir como 0
      daysLeft = 0;
    }
  }

  // Retornar os valores já tipados
  return {
    isPremium,
    isExpired,
    expirationDate,
    planType: user.tipoplano || null,
    isLifetime,
    subscriptionOrigin: user.origemassinatura || null,
    daysLeft
  };
}