import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Download, Zap, Shield, Clock, ArrowRight, Play, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const PV = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Vendedor de Veículos",
      image: "/api/placeholder/60/60",
      rating: 5,
      text: "Desde que comecei a usar o DesignAuto, minhas vendas aumentaram 40%. As artes são profissionais e me ajudam a me destacar da concorrência."
    },
    {
      name: "Marina Oliveira",
      role: "Proprietária de Loja",
      image: "/api/placeholder/60/60",
      rating: 5,
      text: "Economizo horas de trabalho todo dia. Antes pagava caro para designers, agora tenho acesso ilimitado a designs incríveis."
    },
    {
      name: "João Santos",
      role: "Consultor Automotivo",
      image: "/api/placeholder/60/60",
      rating: 5,
      text: "A qualidade é impressionante! Meus clientes sempre elogiam minhas publicações. Recomendo para todos da área."
    }
  ];

  const features = [
    {
      icon: <Download className="h-6 w-6" />,
      title: "Downloads Ilimitados",
      description: "Baixe quantas artes quiser, sem limites ou restrições"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Atualização Constante",
      description: "Novos designs adicionados semanalmente para você"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Qualidade Garantida",
      description: "Designs profissionais criados por especialistas"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Economia de Tempo",
      description: "Tenha suas artes prontas em segundos, não em horas"
    }
  ];

  const plans = [
    {
      name: "Mensal",
      price: "27,90",
      period: "/mês",
      popular: false,
      features: [
        "Acesso a +500 designs",
        "Downloads ilimitados",
        "Formatos editáveis",
        "Suporte via WhatsApp",
        "Atualizações semanais"
      ]
    },
    {
      name: "Anual",
      price: "197,00",
      period: "/ano",
      popular: true,
      discount: "41% OFF",
      originalPrice: "334,80",
      features: [
        "Acesso a +500 designs",
        "Downloads ilimitados",
        "Formatos editáveis",
        "Suporte prioritário",
        "Atualizações semanais",
        "Designs exclusivos",
        "Garantia de 7 dias"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
                🚀 Mais de 10.000 vendedores confiam
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transforme Suas
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Vendas </span>
                com Designs Profissionais
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Acesse +500 designs automotivos prontos, edite em segundos e 
                conquiste mais clientes. Economize tempo e dinheiro enquanto 
                aumenta suas vendas.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4"
                  onClick={() => scrollToSection('plans')}
                >
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-gray-300 hover:bg-gray-50 px-8 py-4"
                  onClick={() => scrollToSection('demo')}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Ver Demonstração
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>+10.000 usuários</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>4.9/5 (1.200+ avaliações)</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                    <h3 className="font-bold text-lg mb-2">500+ Designs</h3>
                    <p className="text-blue-100 text-sm">Profissionais e exclusivos</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
                    <h3 className="font-bold text-lg mb-2">Downloads</h3>
                    <p className="text-green-100 text-sm">Ilimitados</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white">
                    <h3 className="font-bold text-lg mb-2">Formatos</h3>
                    <p className="text-orange-100 text-sm">Canva & PNG</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
                    <h3 className="font-bold text-lg mb-2">Suporte</h3>
                    <p className="text-purple-100 text-sm">24/7 WhatsApp</p>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  ✓ Acesso Imediato
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-8 -left-8 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-sm">Designs Únicos</div>
              </div>
              
              <div className="absolute -bottom-8 -right-8 bg-purple-500 text-white p-4 rounded-lg shadow-lg">
                <div className="text-2xl font-bold">24h</div>
                <div className="text-sm">Suporte</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Vendedores de Todo Brasil Confiam no DesignAuto
            </h2>
            <p className="text-gray-600">
              Veja o que nossos clientes estão dizendo sobre os resultados
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por Que Escolher o DesignAuto?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para criar materiais de marketing 
              profissionais e vender mais
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Veja Como é Fácil Usar
            </h2>
            <p className="text-xl text-gray-600">
              Em 3 passos simples, você tem seu design pronto para usar
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Escolha o Design",
                description: "Navegue por nossa biblioteca com +500 designs profissionais",
                visual: (
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-6 h-48 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-16 h-20 bg-white rounded shadow-sm border-2 border-blue-200"></div>
                      ))}
                    </div>
                  </div>
                )
              },
              {
                step: "2", 
                title: "Personalize",
                description: "Edite cores, textos e elementos em segundos no Canva",
                visual: (
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-6 h-48 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 shadow-lg w-full max-w-48">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-blue-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-8 bg-purple-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                step: "3",
                title: "Publique e Venda",
                description: "Download instantâneo e compartilhe em suas redes sociais",
                visual: (
                  <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-lg p-6 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-4 shadow-lg mb-4 inline-block">
                        <Download className="h-8 w-8 text-green-500 mx-auto" />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <div className="w-8 h-8 bg-blue-500 rounded"></div>
                        <div className="w-8 h-8 bg-pink-500 rounded"></div>
                        <div className="w-8 h-8 bg-green-500 rounded"></div>
                      </div>
                    </div>
                  </div>
                )
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-6">
                  {item.visual}
                  <div className="absolute -top-4 -left-4 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Escolha Seu Plano
            </h2>
            <p className="text-xl text-gray-600">
              Preços justos para vendedores que querem crescer
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className={`h-full ${plan.popular ? 'border-2 border-blue-500 shadow-xl' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      
                      {plan.discount && (
                        <div className="mb-2">
                          <Badge className="bg-green-100 text-green-800">
                            {plan.discount}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        {plan.originalPrice && (
                          <span className="text-lg text-gray-500 line-through mr-2">
                            R$ {plan.originalPrice}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-gray-900">
                          R$ {plan.price}
                        </span>
                        <span className="text-gray-600">{plan.period}</span>
                      </div>
                      
                      {plan.name === "Anual" && (
                        <p className="text-sm text-green-600 font-semibold">
                          Economia de R$ 137,80 no ano!
                        </p>
                      )}
                    </div>
                    
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full py-3 ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      asChild
                    >
                      <Link href="/register">
                        Assinar {plan.name}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              ✓ Garantia de 7 dias • ✓ Cancelamento fácil • ✓ Suporte 24h
            </p>
            <p className="text-sm text-gray-500">
              Todos os preços em Reais (BRL). Renovação automática.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto Para Transformar Suas Vendas?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Junte-se a mais de 10.000 vendedores que já aumentaram suas vendas com o DesignAuto
            </p>
            
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              asChild
            >
              <Link href="/register">
                Começar Agora - Apenas R$ 27,90/mês
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
            
            <p className="text-blue-100 mt-4 text-sm">
              Sem contrato de fidelidade • Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer Simples */}
      <footer className="py-8 bg-gray-900 text-white text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-gray-400">
            © 2025 DesignAuto - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PV;