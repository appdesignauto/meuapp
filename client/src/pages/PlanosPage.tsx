import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight, Star, CreditCard, Infinity, Clock, Award, Key, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";

// Tipos de planos
type PlanoTipo = "mensal" | "anual" | "vitalicio" | "personalizado";

// Interface para os recursos do plano
interface RecursoPlano {
  nome: string;
  incluido: boolean;
  destaque?: boolean;
}

// Interface para os planos
interface Plano {
  id: string;
  nome: string;
  slug: string;
  tipo: PlanoTipo;
  preco: number;
  precoOriginal?: number;
  recursosPrincipais: string[];
  recursos: RecursoPlano[];
  destaque?: boolean;
  maxDownloads?: number;
  limitado?: boolean;
  badgeText?: string | null;
  cor?: string;
  especial?: boolean;
}

export default function PlanosPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const [tabAtiva, setTabAtiva] = useState<"todos" | "populares">("todos");

  // Constantes de preços
  const precoMensal = 47;
  const precoAnual = 197;
  const precoVitalicio = 997;

  // Lista de planos
  const planos: Plano[] = [
    {
      id: "free",
      nome: "Free",
      slug: "free",
      tipo: "mensal",
      preco: 0,
      recursosPrincipais: [
        "5 downloads por mês",
        "Acesso à galeria básica",
        "Sem marca d'água",
        "Suporte via e-mail"
      ],
      recursos: [
        { nome: "5 downloads por mês", incluido: true },
        { nome: "Modelos básicos", incluido: true },
        { nome: "Sem marca d'água", incluido: true },
        { nome: "Suporte via e-mail", incluido: true },
        { nome: "Acesso a todas categorias", incluido: false },
        { nome: "Downloads ilimitados", incluido: false },
        { nome: "Modelos premium", incluido: false },
        { nome: "Novos designs semanais", incluido: false },
        { nome: "Suporte prioritário", incluido: false },
        { nome: "Acesso vitalício", incluido: false }
      ],
      maxDownloads: 5,
      limitado: true
    },
    {
      id: "mensal",
      nome: "Premium Mensal",
      slug: "premium-mensal",
      tipo: "mensal",
      preco: precoMensal,
      recursosPrincipais: [
        "Downloads ilimitados",
        "Acesso a todas categorias",
        "Novos designs semanais",
        "Suporte prioritário"
      ],
      recursos: [
        { nome: "Downloads ilimitados", incluido: true, destaque: true },
        { nome: "Acesso a todas categorias", incluido: true },
        { nome: "Sem marca d'água", incluido: true },
        { nome: "Novos designs semanais", incluido: true },
        { nome: "Modelos premium", incluido: true },
        { nome: "Suporte prioritário", incluido: true },
        { nome: "Modelos básicos", incluido: true },
        { nome: "Suporte via e-mail", incluido: true },
        { nome: "Acesso vitalício", incluido: false },
        { nome: "Todas atualizações futuras", incluido: false }
      ],
      cor: "bg-gradient-to-br from-blue-500 to-purple-500"
    },
    {
      id: "anual",
      nome: "Premium Anual",
      slug: "premium-anual",
      tipo: "anual",
      preco: precoAnual,
      precoOriginal: precoMensal * 12,
      recursosPrincipais: [
        "Downloads ilimitados",
        "Acesso a todas categorias",
        "Novos designs semanais",
        "Suporte prioritário",
        "Economize vs mensal"
      ],
      recursos: [
        { nome: "Downloads ilimitados", incluido: true, destaque: true },
        { nome: "Acesso a todas categorias", incluido: true },
        { nome: "Sem marca d'água", incluido: true },
        { nome: "Novos designs semanais", incluido: true },
        { nome: "Modelos premium", incluido: true },
        { nome: "Suporte prioritário", incluido: true },
        { nome: "Modelos básicos", incluido: true },
        { nome: "Suporte via e-mail", incluido: true },
        { nome: "Acesso vitalício", incluido: false },
        { nome: "Todas atualizações futuras", incluido: false }
      ],
      destaque: true,
      badgeText: "MELHOR OFERTA",
      cor: "bg-gradient-to-br from-amber-500 to-orange-600",
      especial: true
    },
    {
      id: "vitalicio",
      nome: "Vitalício",
      slug: "vitalicio",
      tipo: "vitalicio",
      preco: precoVitalicio,
      recursosPrincipais: [
        "Acesso vitalício",
        "Downloads ilimitados para sempre",
        "Acesso a todas categorias",
        "Todas atualizações futuras",
        "Suporte premium"
      ],
      recursos: [
        { nome: "Acesso vitalício", incluido: true, destaque: true },
        { nome: "Downloads ilimitados", incluido: true, destaque: true },
        { nome: "Acesso a todas categorias", incluido: true },
        { nome: "Sem marca d'água", incluido: true },
        { nome: "Novos designs semanais", incluido: true },
        { nome: "Modelos premium", incluido: true },
        { nome: "Suporte prioritário", incluido: true },
        { nome: "Modelos básicos", incluido: true },
        { nome: "Suporte via e-mail", incluido: true },
        { nome: "Todas atualizações futuras", incluido: true, destaque: true }
      ],
      badgeText: null,
      cor: "bg-gradient-to-br from-emerald-500 to-green-600"
    }
  ];

  // Filtros de planos baseados na aba ativa
  const planosVisiveis = useMemo(() => {
    if (tabAtiva === "populares") {
      // Na aba "Mais Populares", mostrar apenas planos mensal e anual centralizados
      return planos.filter(plano => 
        plano.nome.toLowerCase().includes('mensal') || 
        plano.nome.toLowerCase().includes('anual')
      );
    }
    return planos;
  }, [planos, tabAtiva]);

  const handleSubscribe = (plano: Plano) => {
    if (!user) {
      navigate('/auth?redirect=planos');
      return;
    }
    
    // Aqui implementaremos a lógica de assinatura quando for desenvolvida
    console.log(`Assinar plano: ${plano.nome} (${plano.tipo})`);
    
    // Navigate to hotmart or payment page
    window.open(`https://designauto.pay.hotmart.com/`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section Compacto e Moderno */}
      <section className="w-full pt-8 pb-12 md:pt-16 md:pb-16">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            {/* Badge de Destaque */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Planos especiais para impulsionar seu negócio
            </div>
            
            {/* Título Principal */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Escolha Seu Plano Ideal
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Desbloqueie todo o potencial criativo com nossos templates profissionais. 
                Comece grátis ou escolha um plano premium para acesso ilimitado.
              </p>
            </div>

            {/* Stats em destaque */}
            <div className="flex flex-wrap justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1000+</div>
                <div className="text-sm text-gray-500">Templates Premium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">50+</div>
                <div className="text-sm text-gray-500">Novos por Semana</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-gray-500">Suporte Premium</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos - Design Moderno e Compacto */}
      <section className="w-full py-8 md:py-12">
        <div className="container px-4 md:px-6 max-w-7xl mx-auto">
          {/* Seletor de Planos Simplificado e Funcional */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 rounded-2xl p-1 shadow-lg max-w-md w-full mx-4">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setTabAtiva("todos")}
                  className={`px-4 sm:px-6 lg:px-8 py-3 rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                    tabAtiva === "todos" 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  Todos os Planos
                </button>
                <button
                  onClick={() => setTabAtiva("populares")}
                  className={`px-4 sm:px-6 lg:px-8 py-3 rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                    tabAtiva === "populares" 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  Mais Populares
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Planos Responsivo e Moderno */}
          <div className={cn(
            "grid gap-6 max-w-7xl mx-auto px-4",
            tabAtiva === "populares" 
              ? "grid-cols-1 sm:grid-cols-2 max-w-4xl justify-center" 
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          )}>
            {planosVisiveis.map((plano) => (
              <Card 
                key={plano.id}
                className={cn(
                  "relative transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col",
                  plano.destaque 
                    ? "border-2 border-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50" 
                    : "border border-gray-200 hover:border-blue-300 bg-white"
                )}
              >
                {/* Badge de Destaque Melhorado com melhor posicionamento */}
                {plano.badgeText && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                      {plano.badgeText}
                    </div>
                  </div>
                )}
                
                {/* Header do Cartão Modernizado */}
                <CardHeader className="pb-4 pt-8 px-6">
                  <div className="text-center space-y-4">
                    {/* Ícone do Plano */}
                    <div className={cn(
                      "w-12 h-12 rounded-full mx-auto flex items-center justify-center",
                      plano.id === "free" ? "bg-gray-100" :
                      plano.id === "mensal" ? "bg-blue-100" :
                      plano.id === "anual" ? "bg-purple-100" :
                      "bg-green-100"
                    )}>
                      {plano.id === "free" && <Star className="h-6 w-6 text-gray-600" />}
                      {plano.id === "mensal" && <CreditCard className="h-6 w-6 text-blue-600" />}
                      {plano.id === "anual" && <Award className="h-6 w-6 text-purple-600" />}
                      {plano.id === "vitalicio" && <Infinity className="h-6 w-6 text-green-600" />}
                    </div>
                    
                    {/* Nome do Plano */}
                    <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">{plano.nome}</CardTitle>
                    
                    {/* Preço em Destaque */}
                    <div className="space-y-2">
                      {plano.id === "free" ? (
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">Grátis</div>
                      ) : (
                        <div>
                          <div className="flex items-baseline justify-center">
                            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                              R$ {plano.preco.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-gray-500 ml-1 text-xs sm:text-sm">
                              {plano.tipo === "mensal" ? "/mês" : 
                               plano.tipo === "anual" ? "/ano" : ""}
                            </span>
                          </div>
                          
                          {plano.precoOriginal && (
                            <div className="flex flex-col items-center justify-center space-y-2 mt-2">
                              <span className="text-sm text-gray-400 line-through">
                                R$ {plano.precoOriginal.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                Economize {Math.round((1 - plano.preco / plano.precoOriginal) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Descrição do Tipo de Cobrança */}
                      <p className="text-xs sm:text-sm text-gray-500">
                        {plano.tipo === "mensal" ? "Cobrança mensal" :
                         plano.tipo === "anual" ? "Cobrança anual" :
                         plano.tipo === "vitalicio" ? "Pagamento único" : "Personalizado"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Conteúdo Simplificado e Moderno */}
                <CardContent className="flex-grow px-6 py-4">
                  <div className="space-y-4">
                    {/* Lista Principal de Recursos */}
                    <ul className="space-y-3">
                      {plano.recursosPrincipais.slice(0, 4).map((recurso, idx) => (
                        <li key={idx} className="flex items-center">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700">{recurso}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Recursos Não Incluídos (apenas para plano gratuito) */}
                    {plano.id === "free" && (
                      <div className="pt-3 border-t border-gray-100">
                        <ul className="space-y-2">
                          {["Downloads ilimitados", "Modelos premium"].map((recurso, idx) => (
                            <li key={idx} className="flex items-center opacity-40">
                              <div className="w-5 h-5 rounded-full border-2 border-gray-400 mr-3 flex-shrink-0"></div>
                              <span className="text-sm text-gray-500">{recurso}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                {/* Footer com Botão Modernizado */}
                <CardFooter className="px-6 pb-6">
                  <Button 
                    className="w-full h-12 text-base font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: plano.id === "free" ? "#f3f4f6" : "#2563eb",
                      color: plano.id === "free" ? "#111827" : "#ffffff",
                      border: plano.id === "free" ? "1px solid #d1d5db" : "none"
                    }}
                    onClick={() => handleSubscribe(plano)}
                  >
                    {plano.id === "free" ? "Começar Grátis" : "Escolher Plano"}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Garantia e Benefícios */}
      <section className="w-full py-12 bg-white">
        <div className="container px-4 md:px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Garantia de Satisfação */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Garantia de 7 dias</h3>
              <p className="text-sm text-gray-600">
                Não ficou satisfeito? Devolvemos 100% do seu dinheiro em até 7 dias.
              </p>
            </div>

            {/* Suporte Dedicado */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Suporte Premium</h3>
              <p className="text-sm text-gray-600">
                Nossa equipe está pronta para ajudar você a aproveitar ao máximo a plataforma.
              </p>
            </div>

            {/* Atualizações Constantes */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sempre Atualizado</h3>
              <p className="text-sm text-gray-600">
                Novos templates e recursos adicionados semanalmente, sem custo extra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section Simplificada */}
      <section className="w-full py-12 bg-gray-50">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dúvidas Frequentes</h2>
            <p className="text-gray-600">Respostas rápidas para suas principais questões</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Como funciona o plano gratuito?</h3>
              <p className="text-gray-600 text-sm">
                5 downloads mensais com acesso às categorias básicas. Ideal para começar!
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-gray-600 text-sm">
                Sim, sem multas ou taxas. Você mantém o acesso até o final do período pago.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">O que é o plano vitalício?</h3>
              <p className="text-gray-600 text-sm">
                Pagamento único com acesso permanente a todos os recursos premium.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quais formas de pagamento?</h3>
              <p className="text-gray-600 text-sm">
                Cartão, Pix, boleto. Planos anuais podem ser parcelados em até 12x.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final Modernizado */}
      <section className="w-full py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center">
          <div className="space-y-6 text-white">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para Transformar Seus Designs?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Junte-se a milhares de profissionais que já estão criando designs incríveis com nossa plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                onClick={() => handleSubscribe(planos.find(p => p.id === "free")!)}
              >
                Começar Grátis Agora
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold"
                style={{
                  color: "#ffffff",
                  borderColor: "#ffffff"
                }}
                onClick={() => handleSubscribe(planos.find(p => p.destaque)!)}
              >
                Ver Planos Premium
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}