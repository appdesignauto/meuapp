import { useState } from "react";
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
  badgeText?: string;
  cor?: string;
}

export default function PlanosPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const [faturamentoAnual, setFaturamentoAnual] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<"todos" | "populares">("todos");

  // Constantes de preços
  const precoMensal = 29.90;
  const precoAnual = 239.90;
  const precoAnualMensal = 19.99;
  const precoVitalicio = 997;
  const precoPersonalizado = 1997;

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
        { nome: "Modelos personalizados", incluido: false }
      ],
      maxDownloads: 5,
      limitado: true
    },
    {
      id: "mensal",
      nome: "Premium Mensal",
      slug: "premium-mensal",
      tipo: "mensal",
      preco: faturamentoAnual ? precoAnualMensal : precoMensal,
      precoOriginal: precoMensal,
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
        { nome: "Modelos personalizados", incluido: false },
        { nome: "Criação sob demanda", incluido: false }
      ],
      badgeText: faturamentoAnual ? "Economize 20%" : undefined
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
        "Economize 33% vs mensal"
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
        { nome: "Modelos personalizados", incluido: false },
        { nome: "Criação sob demanda", incluido: false }
      ],
      destaque: true,
      badgeText: "Mais popular"
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
        { nome: "Modelos personalizados", incluido: false },
        { nome: "Criação sob demanda", incluido: false }
      ],
      badgeText: "Melhor custo-benefício"
    },
    {
      id: "personalizado",
      nome: "Personalizado",
      slug: "personalizado",
      tipo: "personalizado",
      preco: precoPersonalizado,
      recursosPrincipais: [
        "Tudo do plano Vitalício",
        "Designs personalizados",
        "Banco de imagens exclusivo",
        "Suporte dedicado",
        "Criação sob demanda"
      ],
      recursos: [
        { nome: "Acesso vitalício", incluido: true },
        { nome: "Downloads ilimitados", incluido: true },
        { nome: "Acesso a todas categorias", incluido: true },
        { nome: "Sem marca d'água", incluido: true },
        { nome: "Novos designs semanais", incluido: true },
        { nome: "Modelos premium", incluido: true },
        { nome: "Suporte prioritário", incluido: true },
        { nome: "Modelos básicos", incluido: true },
        { nome: "Suporte via e-mail", incluido: true },
        { nome: "Modelos personalizados", incluido: true, destaque: true },
        { nome: "Criação sob demanda", incluido: true, destaque: true }
      ],
      badgeText: "Ultimate"
    }
  ];

  const planosVisiveis = tabAtiva === "todos" 
    ? planos 
    : planos.filter(plano => plano.destaque);

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
    <div className="bg-background">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 border-b">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Planos Design Auto
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Escolha o plano ideal para suas necessidades e comece a criar designs profissionais hoje mesmo.
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <span className={cn("text-sm", !faturamentoAnual && "font-medium text-foreground")}>Mensal</span>
              <Switch 
                checked={faturamentoAnual} 
                onCheckedChange={setFaturamentoAnual}
                className="data-[state=checked]:bg-primary"
              />
              <div className="flex items-center">
                <span className={cn("text-sm", faturamentoAnual && "font-medium text-foreground")}>Anual</span>
                {faturamentoAnual && (
                  <Badge variant="outline" className="ml-2 bg-primary/10 text-primary text-xs font-medium">
                    Economize 33%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex justify-center mb-10">
            <Tabs 
              defaultValue="todos" 
              value={tabAtiva} 
              onValueChange={(val) => setTabAtiva(val as "todos" | "populares")}
              className="w-full max-w-[400px]"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="todos">Todos os Planos</TabsTrigger>
                <TabsTrigger value="populares">Mais Populares</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {planosVisiveis.map((plano) => (
              <Card 
                key={plano.id}
                className={cn(
                  "flex flex-col h-full border-2",
                  plano.destaque 
                    ? "border-primary shadow-lg relative" 
                    : "border-border"
                )}
              >
                {plano.badgeText && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      {plano.badgeText}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold">{plano.nome}</CardTitle>
                  <div className="mt-1">
                    {plano.id === "free" ? (
                      <span className="text-3xl font-bold">Grátis</span>
                    ) : (
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">
                          R$ {plano.preco.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-muted-foreground ml-1 text-sm">
                          {plano.tipo === "mensal" 
                            ? "/mês" 
                            : plano.tipo === "anual" 
                              ? "/ano" 
                              : ""}
                        </span>
                      </div>
                    )}
                    
                    {plano.precoOriginal && (
                      <div className="flex items-center mt-1 text-muted-foreground">
                        <span className="text-sm line-through">
                          R$ {plano.precoOriginal.toFixed(2).replace('.', ',')}
                          {plano.tipo === "mensal" ? "/mês" : "/ano"}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardDescription className="mt-3">
                    {plano.tipo === "mensal" ? (
                      <span className="flex items-center text-sm">
                        <CreditCard className="h-4 w-4 mr-1 inline-block" /> 
                        Cobrança mensal
                      </span>
                    ) : plano.tipo === "anual" ? (
                      <span className="flex items-center text-sm">
                        <CreditCard className="h-4 w-4 mr-1 inline-block" /> 
                        Cobrança anual
                      </span>
                    ) : plano.tipo === "vitalicio" ? (
                      <span className="flex items-center text-sm">
                        <Key className="h-4 w-4 mr-1 inline-block" /> 
                        Pagamento único
                      </span>
                    ) : (
                      <span className="flex items-center text-sm">
                        <Star className="h-4 w-4 mr-1 inline-block" /> 
                        Personalizado
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium mb-2">Inclui:</div>
                      <ul className="space-y-2.5">
                        {plano.recursosPrincipais.map((recurso, idx) => (
                          <li key={idx} className="flex items-start">
                            <Check size={18} className="text-primary shrink-0 mr-2 mt-0.5" />
                            <span className="text-sm">{recurso}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="font-medium text-sm mb-3 text-muted-foreground">Recursos detalhados:</div>
                      <ul className="space-y-2.5">
                        {plano.recursos.filter(r => r.incluido).slice(0, 5).map((recurso, idx) => (
                          <li key={idx} className="flex items-start">
                            <Check size={16} className={cn("shrink-0 mr-2 mt-0.5", 
                              recurso.destaque ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className={cn("text-xs", 
                              recurso.destaque ? "text-foreground font-medium" : "text-muted-foreground"
                            )}>
                              {recurso.nome}
                            </span>
                          </li>
                        ))}
                        {plano.recursos.filter(r => !r.incluido).slice(0, 2).map((recurso, idx) => (
                          <li key={idx} className="flex items-start opacity-50">
                            <span className="h-4 w-4 shrink-0 mr-2 border border-border rounded-full"></span>
                            <span className="text-xs text-muted-foreground">{recurso.nome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className={cn(
                      "w-full", 
                      plano.destaque 
                        ? "bg-primary hover:bg-primary/90" 
                        : plano.id === "free" 
                          ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" 
                          : ""
                    )} 
                    onClick={() => handleSubscribe(plano)}
                  >
                    {plano.id === "free" ? "Começar Grátis" : "Assinar Agora"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparação de Recursos */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">
                Compare os Recursos
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground">
                Veja detalhadamente o que cada plano oferece para encontrar a melhor opção para você.
              </p>
            </div>
          </div>

          <div className="w-full overflow-auto pb-4">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Recursos</th>
                  {planos.map(plano => (
                    <th key={plano.id} className="p-4 text-center font-medium">
                      <div className="flex flex-col items-center">
                        <span>{plano.nome}</span>
                        {plano.id !== "free" && (
                          <span className="text-sm text-muted-foreground mt-1">
                            R$ {plano.preco.toFixed(2).replace('.', ',')}
                            {plano.tipo === "mensal" ? "/mês" : plano.tipo === "anual" ? "/ano" : ""}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="text-left p-4 font-medium">Downloads mensais</td>
                  {planos.map(plano => (
                    <td key={plano.id} className="p-4 text-center">
                      {plano.limitado ? (
                        <div className="flex items-center justify-center">
                          <span className="font-medium">{plano.maxDownloads}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Infinity size={20} className="text-primary" />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="text-left p-4 font-medium">Acesso às categorias</td>
                  {planos.map(plano => (
                    <td key={plano.id} className="p-4 text-center">
                      {plano.id === "free" ? (
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">Básicas</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium">Todas</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="text-left p-4 font-medium">Designs premium</td>
                  {planos.map(plano => (
                    <td key={plano.id} className="p-4 text-center">
                      {plano.id === "free" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Check size={18} className="mx-auto text-primary" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="text-left p-4 font-medium">Novos designs semanais</td>
                  {planos.map(plano => (
                    <td key={plano.id} className="p-4 text-center">
                      {plano.id === "free" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Check size={18} className="mx-auto text-primary" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="text-left p-4 font-medium">Prazo de acesso</td>
                  {planos.map(plano => (
                    <td key={plano.id} className="p-4 text-center">
                      {plano.id === "free" ? (
                        <span className="text-sm text-muted-foreground">Ilimitado</span>
                      ) : plano.tipo === "mensal" ? (
                        <span className="text-sm text-muted-foreground">Mensal</span>
                      ) : plano.tipo === "anual" ? (
                        <span className="text-sm text-muted-foreground">Anual</span>
                      ) : (
                        <span className="text-sm font-medium text-primary">Vitalício</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="text-left p-4 font-medium">Designs personalizados</td>
                  {planos.map(plano => (
                    <td key={plano.id} className="p-4 text-center">
                      {plano.id === "personalizado" ? (
                        <Check size={18} className="mx-auto text-primary" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="text-left p-4 font-medium">Suporte</td>
                  {planos.map(plano => (
                    <td key={plano.id} className="p-4 text-center">
                      {plano.id === "free" ? (
                        <span className="text-sm text-muted-foreground">E-mail</span>
                      ) : plano.id === "personalizado" ? (
                        <span className="text-sm font-medium text-primary">Dedicado</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Prioritário</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">
                Perguntas Frequentes
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground">
                Tudo o que você precisa saber sobre nossos planos e assinaturas.
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Como funciona o plano Free?</h3>
              <p className="text-muted-foreground">
                O plano Free permite o download de 5 modelos por mês. Você tem acesso às categorias básicas 
                e pode usar os designs sem marca d'água. Perfeito para quem está começando.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Posso mudar de plano depois?</h3>
              <p className="text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Se fizer upgrade,
                o valor será proporcional ao tempo restante de sua assinatura atual.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Como funciona o acesso vitalício?</h3>
              <p className="text-muted-foreground">
                Com o plano Vitalício, você paga apenas uma vez e tem acesso a todos os recursos premium para sempre, 
                incluindo novos designs adicionados semanalmente.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Como são os designs personalizados?</h3>
              <p className="text-muted-foreground">
                No plano Personalizado, nossa equipe cria designs exclusivos para sua empresa, seguindo sua identidade 
                visual e necessidades específicas. Você pode solicitar até 5 designs personalizados por mês.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Posso cancelar a qualquer momento?</h3>
              <p className="text-muted-foreground">
                Sim, você pode cancelar sua assinatura a qualquer momento. Se cancelar, continuará tendo acesso até 
                o final do período pago. Não fazemos reembolsos proporcionais para períodos não utilizados.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Quais formas de pagamento são aceitas?</h3>
              <p className="text-muted-foreground">
                Aceitamos cartões de crédito, débito, boleto bancário e Pix. Para planos anuais e vitalícios, 
                oferecemos também a opção de parcelamento em até 12x no cartão de crédito.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Pronto para transformar seus anúncios?
              </h2>
              <p className="mx-auto max-w-[700px] md:text-xl">
                Assine hoje e tenha acesso aos melhores designs automotivos para seu negócio.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="bg-background text-foreground hover:bg-background/90"
                size="lg"
                onClick={() => navigate('/auth?redirect=planos')}
              >
                Começar Grátis
              </Button>
              <Button 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                size="lg"
                onClick={() => window.location.href = "#planos"}
              >
                Ver Planos
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}