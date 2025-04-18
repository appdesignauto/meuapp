import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useState } from "react";
import { Crown, CreditCard, Calendar, CalendarClock, ClipboardPaste, Download, Heart, Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function PainelAssinatura() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("detalhes");
  
  // Usar o hook de assinatura
  const subscription = useSubscription(user);
  const {
    isPremium,
    isExpired,
    daysLeft,
    planType,
    isLifetime,
    subscriptionOrigin,
    subscriptionDate,
    expirationDate,
  } = subscription;

  // Buscar estatísticas do usuário
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/users/stats'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch('/api/users/stats');
      if (!res.ok) return { totalFavorites: 0, totalDownloads: 0, totalViews: 0 };
      return res.json();
    },
    enabled: !!user,
  });

  // Formatar data
  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Determinar o plano com base no tipo
  const getPlanName = () => {
    if (isLifetime) return "Vitalício";
    if (!isPremium) return "Gratuito";

    switch (planType?.toLowerCase()) {
      case "mensal":
        return "Mensal";
      case "anual":
        return "Anual";
      case "personalizado":
        return "Personalizado";
      default:
        return "Premium";
    }
  };

  // Determinar origem da assinatura em português
  const getOriginName = () => {
    if (!subscriptionOrigin) return "N/A";
    switch (subscriptionOrigin.toLowerCase()) {
      case "hotmart":
        return "Hotmart";
      case "manual":
        return "Registro Manual";
      default:
        return subscriptionOrigin;
    }
  };

  // Dias restantes formatados
  const getRemainingDays = () => {
    if (isLifetime) return "Acesso Vitalício";
    if (!isPremium) return "Não aplicável";
    if (isExpired) return "Expirado";
    if (daysLeft === null) return "N/A";
    
    return `${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} restante${daysLeft === 1 ? "" : "s"}`;
  };

  // Consumo de recursos
  const resourceUsage = [
    {
      name: "Downloads",
      icon: <Download className="h-4 w-4" />,
      used: userStats?.totalDownloads || 0,
      limit: isPremium ? "∞" : "10",
      percentage: isPremium ? 0 : Math.min(((userStats?.totalDownloads || 0) / 10) * 100, 100),
    },
    {
      name: "Favoritos",
      icon: <Heart className="h-4 w-4" />,
      used: userStats?.totalFavorites || 0,
      limit: isPremium ? "∞" : "20",
      percentage: isPremium ? 0 : Math.min(((userStats?.totalFavorites || 0) / 20) * 100, 100),
    },
  ];

  // Planos disponíveis
  const availablePlans = [
    {
      name: "Mensal",
      price: "R$ 29,90",
      interval: "mês",
      features: [
        "Acesso a todas as artes premium",
        "Downloads ilimitados",
        "Favoritos ilimitados",
        "Suporte prioritário",
      ],
      popular: false,
      buttonText: "Assinar",
      buttonVariant: "outline" as const,
    },
    {
      name: "Anual",
      price: "R$ 197,00",
      interval: "ano",
      features: [
        "Tudo do plano mensal",
        "2 meses grátis no valor anual",
        "Acesso antecipado a novas artes",
        "Desconto em artes personalizadas",
      ],
      popular: true,
      buttonText: "Assinar com 45% de desconto",
      buttonVariant: "default" as const,
    },
    {
      name: "Vitalício",
      price: "R$ 497,00",
      interval: "único",
      features: [
        "Acesso vitalício a todas as artes",
        "Acesso a todas as atualizações futuras",
        "Preferência em solicitações personalizadas",
        "Suporte VIP",
      ],
      popular: false,
      buttonText: "Assinar",
      buttonVariant: "outline" as const,
    },
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold flex items-center">
            <CreditCard className="h-6 w-6 mr-2" />
            Assinatura e Plano
          </h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e visualize detalhes do seu plano atual
          </p>
        </div>

        {/* Status da assinatura */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Status da Assinatura</CardTitle>
              {isPremium ? (
                <Badge variant="premium" className="flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5" />
                  <span>Premium {getPlanName()}</span>
                </Badge>
              ) : (
                <Badge variant="outline">Plano Gratuito</Badge>
              )}
            </div>
            <CardDescription>
              {isPremium
                ? "Você tem acesso a todos os recursos premium"
                : "Assine um plano premium para desbloquear todos os recursos"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="detalhes">Detalhes da Assinatura</TabsTrigger>
                <TabsTrigger value="recursos">Recursos e Limites</TabsTrigger>
                {!isPremium && <TabsTrigger value="planos">Planos Disponíveis</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="detalhes" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoadingStats ? (
                    <>
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </>
                  ) : (
                    <>
                      {/* Informações do Plano Atual */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            <div className="flex items-center">
                              <Crown className="h-4 w-4 mr-2" />
                              Plano Atual
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {getPlanName()}
                            {isPremium && !isLifetime && (
                              <span className="text-sm font-normal ml-2 text-muted-foreground">
                                ({planType})
                              </span>
                            )}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Status de Renovação */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              Status
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-medium">
                            {isLifetime ? (
                              "Acesso Vitalício"
                            ) : isPremium ? (
                              isExpired ? (
                                <span className="text-red-500">Expirado</span>
                              ) : (
                                <span className="text-green-500">Ativo</span>
                              )
                            ) : (
                              "Gratuito"
                            )}
                          </p>
                          {isPremium && !isLifetime && (
                            <p className="text-sm text-muted-foreground">
                              {getRemainingDays()}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Data de Início */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            <div className="flex items-center">
                              <CalendarClock className="h-4 w-4 mr-2" />
                              Data de Início
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-medium">
                            {formatDate(subscriptionDate)}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Data de Expiração */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            <div className="flex items-center">
                              <CalendarClock className="h-4 w-4 mr-2" />
                              {isLifetime ? "Acesso Até" : "Data de Expiração"}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-medium">
                            {isLifetime ? (
                              "Sem data de expiração"
                            ) : (
                              formatDate(expirationDate)
                            )}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Origem da Assinatura */}
                      {isPremium && (
                        <Card className="md:col-span-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                              <div className="flex items-center">
                                <ClipboardPaste className="h-4 w-4 mr-2" />
                                Origem da Assinatura
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-medium">{getOriginName()}</p>
                            <p className="text-sm text-muted-foreground">
                              {subscriptionOrigin === "hotmart"
                                ? "Gerenciada através da plataforma Hotmart"
                                : "Gerenciada pelos administradores do sistema"}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="recursos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Seu consumo atual</CardTitle>
                    <CardDescription>
                      {isPremium
                        ? "Com seu plano premium você não tem limites de uso"
                        : "Veja o quanto você já utilizou de seu plano gratuito"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isLoadingStats ? (
                      <>
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </>
                    ) : (
                      <>
                        {resourceUsage.map((resource) => (
                          <div key={resource.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {resource.icon}
                                <span className="ml-2 font-medium">{resource.name}</span>
                              </div>
                              <span className="text-sm">
                                {resource.used} / {resource.limit}
                              </span>
                            </div>
                            
                            {!isPremium && (
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${resource.percentage}%` }}
                                ></div>
                              </div>
                            )}
                            
                            {isPremium && (
                              <div className="flex items-center text-blue-600">
                                <span className="text-xs mr-1">Uso ilimitado com seu plano premium</span>
                                <Zap className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <div>
                      <p className="text-sm font-medium">Tipo de Acesso</p>
                      <p className="text-sm text-muted-foreground">
                        {isPremium ? "Premium" : "Limitado"}
                      </p>
                    </div>
                    {!isPremium && (
                      <Button onClick={() => setActiveTab("planos")} className="bg-blue-600 hover:bg-blue-700">
                        <Crown className="mr-2 h-4 w-4" />
                        Fazer Upgrade
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Comparação de Recursos</CardTitle>
                    <CardDescription>
                      Veja a diferença entre os planos gratuito e premium
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1"></div>
                      <div className="col-span-1 text-center font-medium">Gratuito</div>
                      <div className="col-span-1 text-center font-medium">Premium</div>
                      
                      <Separator className="col-span-3 my-2" />
                      
                      <div className="col-span-1">Downloads</div>
                      <div className="col-span-1 text-center">10 / mês</div>
                      <div className="col-span-1 text-center text-blue-600">Ilimitado</div>
                      
                      <Separator className="col-span-3 my-2" />
                      
                      <div className="col-span-1">Favoritos</div>
                      <div className="col-span-1 text-center">20</div>
                      <div className="col-span-1 text-center text-blue-600">Ilimitado</div>
                      
                      <Separator className="col-span-3 my-2" />
                      
                      <div className="col-span-1">Artes Premium</div>
                      <div className="col-span-1 text-center">❌</div>
                      <div className="col-span-1 text-center text-blue-600">✓</div>
                      
                      <Separator className="col-span-3 my-2" />
                      
                      <div className="col-span-1">Suporte Prioritário</div>
                      <div className="col-span-1 text-center">❌</div>
                      <div className="col-span-1 text-center text-blue-600">✓</div>
                    </div>
                  </CardContent>
                  {!isPremium && (
                    <CardFooter>
                      <Button 
                        onClick={() => setActiveTab("planos")} 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Fazer Upgrade para Premium
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="planos" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {availablePlans.map((plan) => (
                    <Card key={plan.name} className={`relative ${
                      plan.popular ? 'border-blue-500 shadow-lg' : ''
                    }`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-0 right-0 mx-auto text-center">
                          <Badge variant="premium" className="px-3 py-1">
                            <Crown className="h-3.5 w-3.5 mr-1" />
                            Mais Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-baseline mt-2">
                            <span className="text-3xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground ml-1">
                              /{plan.interval}
                            </span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center">
                              <svg
                                className="h-4 w-4 text-blue-500 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant={plan.buttonVariant}
                          className={`w-full ${
                            plan.buttonVariant === "default" ? "bg-blue-600 hover:bg-blue-700" : ""
                          }`}
                          onClick={() => window.location.href = "/pricing"}
                        >
                          {plan.buttonText}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Precisa de um plano personalizado?</CardTitle>
                    <CardDescription>
                      Temos soluções customizadas para empresas e profissionais com necessidades específicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Se você precisa de múltiplas licenças, tem requisitos especiais ou deseja um plano adaptado às suas necessidades, entre em contato com nossa equipe comercial.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Solicitar Proposta Personalizada
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Precisa de ajuda com sua assinatura? Entre em contato com o suporte.
            </p>
            <Button variant="outline" size="sm">
              Contatar Suporte
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}